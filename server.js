const express = require("express");
const dns = require("dns");
const mongoose = require("mongoose");
const cron = require("node-cron");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// Serve the uploads folder so the browser can view the PDFs
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Ensure uploads directory exists
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// 1. Connect to MongoDB Cloud (PASTE YOUR CONNECTION STRING HERE)
const mongoURI =
  "mongodb+srv://yinetfleet:Fleet777@fleetcluster.xszfbwn.mongodb.net/?appName=FleetCluster";

// Use public DNS resolvers to avoid local DNS paths that can refuse Atlas SRV lookups.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

mongoose
  .connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("Successfully connected to MongoDB Cloud!"))
  .catch((error) => console.log("Error connecting to MongoDB:", error));

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// 2. SCHEMAS & MODELS
const vehicleSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    vin: { type: String, required: true },
    status: { type: String, default: "Active" },
    // New field to store document records
    documents: [
      {
        title: String,
        fileUrl: String,
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

// 3. ROUTES
app.post("/api/vehicles", async (req, res) => {
  try {
    const newVehicle = new Vehicle(req.body);
    const savedVehicle = await newVehicle.save();
    res
      .status(201)
      .json({ message: "Vehicle added successfully!", data: savedVehicle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- NEW DOCUMENT UPLOAD ROUTE ---
app.post(
  "/api/vehicles/:vehicleId/documents",
  upload.single("document"),
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.vehicleId);
      if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

      const newDoc = {
        title: req.body.title,
        fileUrl: `/uploads/${req.file.filename}`,
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

// Task Routes
app.post("/api/tasks", async (req, res) => {
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

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/tasks/:taskId", async (req, res) => {
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
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Fleet Manager API is running on http://localhost:${PORT}`);
});
