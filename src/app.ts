// src/app.ts

import express from "express";
import userRoutes from "./routes/user.route";
import authRoutes from "./routes/auth.route";
import locationRoutes from "./routes/location.routes";
import mediaRoutes from "./routes/media.route";
import notificationsRoutes from "./routes/notifications.routes";
import adminRoutes from "./routes/admin.routes";
import devotionalsRoutes from "./routes/devotionals.routes";
import logsRoutes from "./routes/logs.routes";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", locationRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", devotionalsRoutes);
app.use("/api", logsRoutes);

export default app;
