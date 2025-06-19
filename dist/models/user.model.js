"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const interests_1 = require("../constants/interests");
// Define the Mongoose schema for the User model
const userSchema = new mongoose_1.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    provider: { type: String, enum: ["clerk", "email"], required: true },
    clerkId: { type: String },
    avatar: { type: String }, // optional legacy avatar field
    avatarUpload: { type: String }, // used in current profile update flow
    password: { type: String },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    age: { type: Number },
    isKid: { type: Boolean },
    section: { type: String, enum: ["kids", "adults"] },
    role: {
        type: String,
        enum: [
            "learner",
            "parent",
            "educator",
            "moderator",
            "admin",
            "content_creator",
            "vendor",
            "church_admin",
        ],
    },
    location: { type: String },
    interests: {
        type: [String],
        enum: interests_1.VALID_INTERESTS,
        default: [],
    },
    isProfileComplete: { type: Boolean },
    hasConsentedToPrivacyPolicy: { type: Boolean },
    isEmailVerified: { type: Boolean, default: false },
    subscriptionTier: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
    },
    parentalControlEnabled: { type: Boolean, default: false },
    parentEmail: { type: String },
    isVerifiedCreator: { type: Boolean, default: false },
    isVerifiedVendor: { type: Boolean, default: false },
    isVerifiedChurch: { type: Boolean, default: false },
}, { timestamps: true });
// Export the Mongoose model
exports.User = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
