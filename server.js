// 1. Bring in the tools we installed
const express = require("express");
const dns = require("dns");
const mongoose = require("mongoose");

// 2. Initialize our app
const app = express();

// This tells our app to understand data sent in JSON format
app.use(express.json());

// 3. Connect to MongoDB Cloud
// PASTE YOUR CONNECTION STRING BETWEEN THE QUOTES BELOW
const mongoURI =
  "mongodb+srv://yinetfleet:Fleet777@fleetcluster.xszfbwn.mongodb.net/?appName=FleetCluster";

// Use public DNS resolvers so Node can resolve MongoDB Atlas SRV records
// when the default local DNS path refuses the lookup.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

mongoose
  .connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log("Successfully connected to MongoDB Cloud!");
  })
  .catch((error) => {
    console.log("Error connecting to MongoDB:", error);
  });

// --- 1. SCHEMAS (The Blueprints) ---
const vehicleSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    vin: { type: String, required: true },
    status: { type: String, default: "Active" }, // Automatically sets new vehicles to Active
  },
  { timestamps: true },
); // Automatically adds createdAt dates

const taskSchema = new mongoose.Schema(
  {
    vehicleId: { type: String, required: true }, // Links the task to a specific vehicle
    description: { type: String, required: true },
    status: { type: String, default: "Pending" }, // Mechanics will update this to "Completed"
  },
  { timestamps: true },
);

// --- 2. MODELS (The Compilers) ---
const Vehicle = mongoose.model("Vehicle", vehicleSchema);
const Task = mongoose.model("Task", taskSchema);

// --- 3. ROUTES ---

// Admin: Add a new vehicle
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

// Admin: Create a maintenance task
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

// Admin/Mechanic: View all vehicles
app.get("/api/vehicles", async (req, res) => {
  try {
    const vehicles = await Vehicle.find(); // Fetches everything in the Vehicles collection
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mechanic: View all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Turn the server on so it listens for requests
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Fleet Manager API is running on http://localhost:${PORT}`);
});
