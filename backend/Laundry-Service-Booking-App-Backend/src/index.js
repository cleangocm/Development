import "dotenv/config";
import mongoose from "mongoose";
import {
  MONGO_URL,
  PORT,
  NODE_ENV,
  safeEnvironmentSummary,
  validateBackendEnvironment,
} from "./config/config.js";
import app from "./app.js";

try {
  validateBackendEnvironment();
  console.log("CLEANGO backend environment:", safeEnvironmentSummary());

  mongoose.connect(MONGO_URL).then(() => {
    console.log(`Connected to MongoDB for ${NODE_ENV}`);
    app.listen(PORT, () => {
      console.log(`Laundry Service Booking Server is running on port ${PORT}`);
    });
  }).catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
    process.exitCode = 1;
  });
} catch (error) {
  console.error("Backend environment validation failed:", error.message);
  process.exitCode = 1;
}
