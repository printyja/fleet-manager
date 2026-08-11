const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const cron = require("node-cron");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(express.json());

const isVercelRuntime = Boolean(process.env.VERCEL);
const isProduction = process.env.NODE_ENV === "production" || isVercelRuntime;
const primaryMongoURI = process.env.MONGO_URI;
const fallbackMongoURI =
  process.env.MONGO_URI_DIRECT || process.env.MONGO_URI_FALLBACK;
const mongoConnectionCandidates = [primaryMongoURI, fallbackMongoURI].filter(
  Boolean,
);
const sessionSecret = process.env.SESSION_SECRET || "fleet-manager-dev-secret";
const uploadDirectory = isVercelRuntime
  ? path.join("/tmp", "uploads")
  : path.join(__dirname, "uploads");

if (isProduction) {
  app.set("trust proxy", 1);
}

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8,
  },
};

app.use(session(sessionOptions));

const parseCookies = (cookieHeader = "") =>
  cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) return acc;
      const key = part.slice(0, separatorIndex);
      const value = part.slice(separatorIndex + 1);
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});

const signRole = (role) => {
  const signature = crypto
    .createHmac("sha256", sessionSecret)
    .update(role)
    .digest("hex");

  return `${role}.${signature}`;
};

const verifyRoleToken = (token) => {
  const [role, signature] = String(token || "").split(".");
  if (!role || !signature) return null;
  if (role !== "admin" && role !== "mechanic") return null;

  const expectedSignature = crypto
    .createHmac("sha256", sessionSecret)
    .update(role)
    .digest("hex");

  if (signature !== expectedSignature) return null;
  return role;
};

app.use((req, res, next) => {
  if (!req.session?.role) {
    const cookies = parseCookies(req.headers.cookie || "");
    const cookieRole = verifyRoleToken(cookies.fm_role);
    if (cookieRole) {
      req.session.role = cookieRole;
    }
  }

  next();
});

app.use(express.static("public"));

app.use("/uploads", express.static(uploadDirectory));

if (!fs.existsSync(uploadDirectory)) {
  try {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  } catch (error) {
    console.warn("Could not initialize uploads directory:", error.message);
  }
}

let dbConnectionPromise = null;
let activeMongoURI = null;

const ensureDatabaseConnection = async () => {
  if (mongoConnectionCandidates.length === 0) {
    throw new Error("Database is not configured on this deployment.");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (mongoose.connection.readyState === 2 && dbConnectionPromise) {
    await dbConnectionPromise;
    return;
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = (async () => {
      let lastError = null;

      for (const candidateURI of mongoConnectionCandidates) {
        try {
          const connection = await mongoose.connect(candidateURI, {
            serverSelectionTimeoutMS: 8000,
            maxPoolSize: 10,
          });

          activeMongoURI = candidateURI;
          if (candidateURI === primaryMongoURI) {
            console.log("Successfully connected to MongoDB Cloud!");
          } else {
            console.log(
              "Connected to MongoDB using fallback direct connection string.",
            );
          }

          return connection;
        } catch (error) {
          lastError = error;
          if (mongoose.connection.readyState !== 0) {
            try {
              await mongoose.disconnect();
            } catch {
              // Ignore disconnect errors between retries.
            }
          }
        }
      }

      throw lastError || new Error("Unable to connect to MongoDB.");
    })().catch((error) => {
      dbConnectionPromise = null;
      activeMongoURI = null;
      throw error;
    });
  }

  await dbConnectionPromise;
};

if (mongoConnectionCandidates.length === 0) {
  console.warn(
    "Missing MONGO_URI and MONGO_URI_DIRECT/MONGO_URI_FALLBACK in environment variables; continuing without a database connection.",
  );
} else {
  ensureDatabaseConnection().catch((error) => {
    console.log("Error connecting to MongoDB:", error.message);
  });
}

const requireDatabase = async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    res.status(503).json({
      error: "Database temporarily unavailable. Please try again.",
      detail: error.message,
    });
  }
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    const currentRole = req.session?.role;

    if (!currentRole) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    if (!allowedRoles.includes(currentRole)) {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not have access to this action." });
    }

    next();
  };

app.post("/api/auth/login", (req, res) => {
  const { role, password } = req.body || {};

  if (role === "mechanic") {
    req.session.role = "mechanic";
    res.cookie("fm_role", signRole("mechanic"), {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 8,
    });
    return res.status(200).json({ role: "mechanic" });
  }

  if (role === "admin") {
    const submittedPassword = String(password ?? "").trim();
    const configuredPassword = String(ADMIN_PASSWORD ?? "").trim();

    // In production, fail closed if ADMIN_PASSWORD is not configured.
    if (!configuredPassword) {
      return res
        .status(500)
        .json({ error: "Admin login is not configured on this deployment." });
    }

    if (submittedPassword !== configuredPassword) {
      return res.status(401).json({ error: "Incorrect admin password." });
    }

    req.session.role = "admin";
    res.cookie("fm_role", signRole("admin"), {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      maxAge: 1000 * 60 * 60 * 8,
    });
    return res.status(200).json({ role: "admin" });
  }

  return res.status(400).json({ error: "Invalid role selected." });
});

app.get("/api/auth/session", (req, res) => {
  const role = req.session?.role;
  if (!role) {
    return res.status(401).json({ error: "No active session." });
  }

  return res.status(200).json({ role });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.clearCookie("fm_role");
    res.status(200).json({ message: "Logged out" });
  });
});

// 2. SCHEMAS & MODELS
const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, default: "" },
    year: { type: Number, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    vin: { type: String, required: true },
    status: { type: String, default: "Active" },
    complianceNotes: { type: String, default: "" },
    documents: [
      {
        title: String,
        documentType: {
          type: String,
          enum: ["registration", "dot_inspection", "other"],
          default: "other",
        },
        fileUrl: String,
        expirationDate: Date,
        notes: String,
        uploadDate: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const taskSchema = new mongoose.Schema(
  {
    vehicleId: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, default: "Pending" },
  },
  { timestamps: true },
);

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
const Task = mongoose.model("Task", taskSchema);

// --- AUTOMATED PM SYSTEM ---
if (process.env.NODE_ENV !== "test") {
  cron.schedule("0 0 * * *", async () => {
    try {
      const activeVehicles = await Vehicle.find({ status: "Active" });
      for (let vehicle of activeVehicles) {
        const newTask = new Task({
          vehicleId: vehicle._id,
          description: "Automated PM: Standard 30-Day Fleet Inspection",
          status: "Pending",
        });
        await newTask.save();
      }
    } catch (error) {
      console.error("Error in automated PM system:", error);
    }
  });
}

// 3. VEHICLE ROUTES
app.post(
  "/api/vehicles",
  requireRole("admin"),
  requireDatabase,
  async (req, res) => {
    try {
      const normalizedVehicleNumber =
        req.body.vehicleNumber ?? req.body.vehicleId ?? req.body.vehicleID;

      const newVehicle = new Vehicle({
        ...req.body,
        vehicleNumber: normalizedVehicleNumber,
      });
      const savedVehicle = await newVehicle.save();
      res
        .status(201)
        .json({ message: "Vehicle added successfully!", data: savedVehicle });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

app.get(
  "/api/vehicles",
  requireRole("admin", "mechanic"),
  requireDatabase,
  async (req, res) => {
    try {
      const vehicles = await Vehicle.find();
      res.status(200).json(vehicles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.get(
  "/api/vehicles/:id",
  requireRole("admin", "mechanic"),
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }
      res.status(200).json(vehicle);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

app.patch(
  "/api/vehicles/:id",
  requireRole("admin"),
  requireDatabase,
  async (req, res) => {
    try {
      const body = req.body || {};
      const hasOwn = (field) => Object.hasOwn(body, field);
      const updates = {};

      const hasVehicleNumber =
        hasOwn("vehicleNumber") || hasOwn("vehicleId") || hasOwn("vehicleID");

      if (hasVehicleNumber) {
        const normalizedVehicleNumber =
          body.vehicleNumber ?? body.vehicleId ?? body.vehicleID;
        updates.vehicleNumber = String(normalizedVehicleNumber ?? "").trim();
      }

      if (hasOwn("year")) {
        const parsedYear = Number(body.year);
        if (!Number.isFinite(parsedYear) || parsedYear <= 0) {
          return res
            .status(400)
            .json({ error: "Year must be a valid number." });
        }
        updates.year = parsedYear;
      }

      if (hasOwn("make")) {
        updates.make = String(body.make ?? "").trim();
      }

      if (hasOwn("model")) {
        updates.model = String(body.model ?? "").trim();
      }

      if (hasOwn("vin")) {
        updates.vin = String(body.vin ?? "").trim();
      }

      if (hasOwn("status")) {
        updates.status = body.status;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No update fields provided." });
      }

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true },
      );

      if (!updatedVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      res
        .status(200)
        .json({ message: "Vehicle updated", data: updatedVehicle });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.delete("/api/vehicles/:id", requireRole("admin"), async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Vehicle deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/vehicles/:vehicleId/documents",
  requireRole("admin"),
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Document file is required" });
      }

      const newDoc = {
        title: req.body.title || "Uploaded Document",
        documentType: "other",
        fileUrl: `/uploads/${req.file.filename}`,
        expirationDate: req.body.expirationDate || null,
        notes: req.body.notes?.trim() || "",
      };

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        req.params.vehicleId,
        { $push: { documents: newDoc } },
        { new: true, runValidators: false },
      );

      if (!updatedVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      res.status(200).json({
        message: "Document uploaded successfully",
        data: updatedVehicle,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.post(
  "/api/vehicles/:vehicleId/compliance-documents",
  requireRole("admin"),
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Document file is required" });
      }

      const documentType = req.body.documentType;
      const allowedTypes = ["registration", "dot_inspection"];
      if (!allowedTypes.includes(documentType)) {
        return res.status(400).json({
          error: "Invalid document type. Use registration or dot_inspection.",
        });
      }

      const titleMap = {
        registration: "Copy of Registration",
        dot_inspection: "Annual DOT Inspection",
      };

      const newDoc = {
        title: titleMap[documentType],
        documentType,
        fileUrl: `/uploads/${req.file.filename}`,
        expirationDate: req.body.expirationDate || null,
        notes: req.body.notes?.trim() || "",
      };

      const vehicle = await Vehicle.findById(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      vehicle.documents = vehicle.documents.filter(
        (doc) =>
          doc.documentType !== documentType || doc.documentType === "other",
      );
      vehicle.documents.push(newDoc);
      const updatedVehicle = await vehicle.save({ validateBeforeSave: false });

      if (!updatedVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      res.status(200).json({
        message: "Compliance document uploaded successfully",
        data: updatedVehicle,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.get(
  "/api/vehicles/:vehicleId/compliance-documents",
  requireRole("admin", "mechanic"),
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      const complianceDocuments = vehicle.documents
        .filter(
          (doc) =>
            doc.documentType === "registration" ||
            doc.documentType === "dot_inspection",
        )
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

      res.status(200).json(complianceDocuments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

app.delete(
  "/api/vehicles/:vehicleId/compliance-documents/:documentId",
  requireRole("admin"),
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        req.params.vehicleId,
        {
          $pull: {
            documents: {
              _id: new mongoose.Types.ObjectId(req.params.documentId),
            },
          },
        },
        { new: true, runValidators: false },
      );

      if (!updatedVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      return res.status(200).json({
        message: "Compliance document deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
);

app.get(
  "/api/vehicles/:vehicleId/compliance-notes",
  requireRole("admin", "mechanic"),
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      return res.status(200).json({ notes: vehicle.complianceNotes || "" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },
);

app.patch(
  "/api/vehicles/:vehicleId/compliance-notes",
  requireRole("admin"),
  async (req, res) => {
    try {
      const notes = typeof req.body?.notes === "string" ? req.body.notes : "";

      const updatedVehicle = await Vehicle.findByIdAndUpdate(
        req.params.vehicleId,
        { complianceNotes: notes.trim() },
        { new: true },
      );

      if (!updatedVehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

      return res.status(200).json({ notes: updatedVehicle.complianceNotes });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
);

// 4. TASK ROUTES
app.post("/api/tasks", requireRole("admin"), async (req, res) => {
  try {
    const newTask = new Task(req.body);
    const savedTask = await newTask.save();
    res
      .status(201)
      .json({ message: "Task assigned successfully!", data: savedTask });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/tasks", requireRole("admin", "mechanic"), async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch(
  "/api/tasks/:taskId",
  requireRole("admin", "mechanic"),
  async (req, res) => {
    try {
      const updatedTask = await Task.findByIdAndUpdate(
        req.params.taskId,
        { status: req.body.status },
        { new: true },
      );
      res.status(200).json({ data: updatedTask });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
);

app.get(
  "/api/vehicles/:vehicleId/tasks",
  requireRole("admin", "mechanic"),
  async (req, res) => {
    try {
      const history = await Task.find({ vehicleId: req.params.vehicleId }).sort(
        {
          createdAt: -1,
        },
      );
      res.status(200).json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Fleet Manager API is running on http://localhost:${PORT}`);
  });
}
