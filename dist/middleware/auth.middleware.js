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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const clerk_1 = require("../utils/clerk");
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = yield (0, clerk_1.verifyClerkToken)(token);
        // Set userId on request object (from Clerk JWT 'sub')
        req.userId = decoded.sub;
        next(); // ✅ continue to route
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token",
            detail: error.message,
        });
    }
});
exports.verifyToken = verifyToken;
