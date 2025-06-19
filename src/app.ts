import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import http from "http";

import userRoutes from "./routes/user.route";
import authRoutes from "./routes/auth.route";
import locationRoutes from "./routes/location.routes";
import mediaRoutes from "./routes/media.route";
import notificationsRoutes from "./routes/notifications.routes";
import adminRoutes from "./routes/admin.routes";
import devotionalsRoutes from "./routes/devotionals.routes";
import logsRoutes from "./routes/logs.routes";

// Load environment variables
dotenv.config({ path: "/Users/user/Desktop/tevah-app/.env" }); // Explicit path for clarity

// Debug environment variables
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY! ? "Set" : "Not set");

// Validate required environment variables
const requiredEnvVars = [
  "MONGODB_URI",
  "PORT",
  "GOOGLE_CLIENT_ID",
  "JWT_SECRET",
  "RESEND_API_KEY", // Added
];
const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}`
  );
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Routes
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", locationRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", devotionalsRoutes);
app.use("/api", logsRoutes);

server.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
