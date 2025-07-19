"use strict";
// src/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
// Load environment variables
dotenv_1.default.config({ path: "/Users/user/Desktop/tevah-app/.env" }); // Use relative path in prod
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
const server = http_1.default.createServer(app_1.default);
// Connect to MongoDB and start server
mongoose_1.default
    .connect(process.env.MONGODB_URI)
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
