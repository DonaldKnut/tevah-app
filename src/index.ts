// src/index.ts

import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";
import app from "./app";

// Load environment variables
dotenv.config({ path: "/Users/user/Desktop/tevah-app/.env" }); // Use relative path in prod

// Validate required environment variables
const requiredEnvVars = [
  "MONGODB_URI",
  "PORT",
  "GOOGLE_CLIENT_ID",
  "JWT_SECRET",
  "RESEND_API_KEY",
];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`❌ Missing environment variables: ${missingVars.join(", ")}`);
  process.exit(1);
}

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("✅ MongoDB connected successfully");

    server.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
