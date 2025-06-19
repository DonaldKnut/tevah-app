"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Middleware to verify JWT token and attach userId to request
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    // Check for Bearer token format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res
            .status(401)
            .json({ success: false, message: "Unauthorized: No token provided" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        // Decode and verify token using your secret key
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Attach userId to request object
        req.userId = decodedToken.userId;
        // Proceed to the next middleware or controller
        next();
    }
    catch (error) {
        // Token is invalid or expired
        res.status(401).json({
            success: false,
            message: "Invalid token",
            detail: error.message,
        });
    }
});
exports.verifyToken = verifyToken;
