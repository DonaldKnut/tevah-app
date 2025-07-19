"use strict";
// src/app.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const media_route_1 = __importDefault(require("./routes/media.route"));
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const devotionals_routes_1 = __importDefault(require("./routes/devotionals.routes"));
const logs_routes_1 = __importDefault(require("./routes/logs.routes"));
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check Route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});
// Routes
app.use("/api/user", user_route_1.default);
app.use("/api/auth", auth_route_1.default);
app.use("/api", location_routes_1.default);
app.use("/api/media", media_route_1.default);
app.use("/api/notifications", notifications_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api", devotionals_routes_1.default);
app.use("/api", logs_routes_1.default);
exports.default = app;
