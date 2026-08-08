const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const cron = require("node-cron");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const dns = require("dns");
require("dotenv").config();

const app = express();
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "fleet-manager-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

app.use(express.static("public"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// 1. Connect to MongoDB Cloud
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("Missing MONGO_URI in environment variables.");
  process.exit(1);
}
// Use public resolvers to avoid local DNS paths that refuse Atlas SRV lookups.
dns.setServers(["1.1.1.1", "8.8.8.8"]);
mongoose
  .connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("Successfully connected to MongoDB Cloud!"))
  .catch((error) => console.log("Error connecting to MongoDB:", error));
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "FleetAdmin2026";

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
    return res.status(200).json({ role: "mechanic" });
  }

  if (role === "admin") {
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Incorrect admin password." });
    }

    req.session.role = "admin";
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
    res.status(200).json({ message: "Logged out" });
  });
});

// 2. SCHEMAS & MODELS
const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: { type: String, required: true }, // NEW FIELD
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

// 3. VEHICLE ROUTES
app.post("/api/vehicles", requireRole("admin"), async (req, res) => {
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
});

app.get("/api/vehicles", requireRole("admin", "mechanic"), async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

app.patch("/api/vehicles/:id", requireRole("admin"), async (req, res) => {
  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true },
    );
    res.status(200).json({ message: "Vehicle updated", data: updatedVehicle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
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
      const vehicle = await Vehicle.findById(req.params.vehicleId);
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

      const newDoc = {
        title: req.body.title,
        documentType: "other",
        fileUrl: `/uploads/${req.file.filename}`,
        expirationDate: req.body.expirationDate || null,
        notes: req.body.notes?.trim() || "",
      };

      vehicle.documents.push(newDoc);
      const updatedVehicle = await vehicle.save();

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
      const vehicle = await Vehicle.findById(req.params.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Vehicle not found" });
      }

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

      vehicle.documents.push(newDoc);
      const updatedVehicle = await vehicle.save();

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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Fleet Manager API is running on http://localhost:${PORT}`);
});
