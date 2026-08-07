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

// 4. Turn the server on so it listens for requests
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Fleet Manager API is running on http://localhost:${PORT}`);
});
