"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
// Load environment variables
dotenv_1.default.config({ path: "/Users/user/Desktop/tevah-app/.env" }); // Explicit path for clarity
// Debug environment variables
console.log("RESEND_API_KEY:", process.env.RESEND_API_KEY ? "Set" : "Not set");
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
    console.error(`❌ Missing required environment variables: ${missingVars.join(", ")}`);
    process.exit(1);
}
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = process.env.PORT || 4000;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// MongoDB Connection
mongoose_1.default
    .connect(process.env.MONGODB_URI)
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
        database: mongoose_1.default.connection.readyState === 1 ? "connected" : "disconnected",
    });
});
app.use("/api/user", user_route_1.default);
app.use("/api/auth", auth_route_1.default);
app.use("/api", location_routes_1.default);
server.listen(PORT, () => {
    console.log(`✅ Server running at: http://localhost:${PORT}`);
});
