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
const auth_service_1 = __importDefault(require("../service/auth.service"));
const user_model_1 = require("../models/user.model");
const multer_1 = __importDefault(require("multer"));
class AuthController {
    clerkLogin(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token, userInfo } = request.body;
                if (!token || !userInfo) {
                    return response.status(400).json({
                        success: false,
                        message: "Authentication token and user information are required",
                    });
                }
                const result = yield auth_service_1.default.clerkLogin(token, userInfo);
                return response.status(200).json({
                    success: true,
                    user: result.user,
                    needsAgeSelection: result.needsAgeSelection,
                });
            }
            catch (error) {
                return next(error);
            }
        });
    }
    oauthLogin(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { provider, token, userInfo } = request.body;
                if (!provider || !token || !userInfo) {
                    return response.status(400).json({
                        success: false,
                        message: "Provider, token, and user information are required",
                    });
                }
                const result = yield auth_service_1.default.oauthLogin(provider, token, userInfo);
                return response.status(200).json({
                    success: true,
                    message: "Login successful",
                    token: result.token,
                    user: result.user,
                    isNewUser: result.isNewUser,
                });
            }
            catch (error) {
                return next(error);
            }
        });
    }
    registerUser(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, firstName, lastName, desiredRole } = request.body;
                if (!email || !password || !firstName) {
                    return response.status(400).json({
                        success: false,
                        message: "Email, password, and first name are required fields",
                    });
                }
                const user = yield auth_service_1.default.registerUser(email, password, firstName, lastName, desiredRole);
                return response.status(201).json({
                    success: true,
                    message: "User registered successfully. Please verify your email.",
                    user,
                });
            }
            catch (error) {
                if (error instanceof Error &&
                    error.message === "Email address is already registered") {
                    return response.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                return next(error);
            }
        });
    }
    registerUserWithAvatar(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, firstName, lastName, desiredRole } = request.body;
                const avatarFile = request.file;
                if (!email || !password || !firstName) {
                    return response.status(400).json({
                        success: false,
                        message: "Email, password, and first name are required fields",
                    });
                }
                if (!avatarFile) {
                    return response.status(400).json({
                        success: false,
                        message: "Avatar image is required",
                    });
                }
                const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
                if (!validImageMimeTypes.includes(avatarFile.mimetype)) {
                    return response.status(400).json({
                        success: false,
                        message: `Invalid image type: ${avatarFile.mimetype}`,
                    });
                }
                const user = yield auth_service_1.default.registerUser(email, password, firstName, lastName, desiredRole, avatarFile.buffer, avatarFile.mimetype);
                return response.status(201).json({
                    success: true,
                    message: "User registered successfully. Please verify your email.",
                    user,
                });
            }
            catch (error) {
                if (error instanceof Error &&
                    error.message === "Email address is already registered") {
                    return response.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                return next(error);
            }
        });
    }
    loginUser(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = request.body;
                if (!email || !password) {
                    return response.status(400).json({
                        success: false,
                        message: "Email and password are required",
                    });
                }
                const result = yield auth_service_1.default.loginUser(email, password);
                return response.status(200).json({
                    success: true,
                    message: "Login successful",
                    token: result.token,
                    user: result.user,
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.message === "Invalid email or password") {
                        return response.status(400).json({
                            success: false,
                            message: error.message,
                        });
                    }
                    if (error.message === "Please verify your email before logging in") {
                        return response.status(403).json({
                            success: false,
                            message: error.message,
                        });
                    }
                }
                return next(error);
            }
        });
    }
    verifyEmail(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, code } = request.body;
                if (!email || !code) {
                    return response.status(400).json({
                        success: false,
                        message: "Email and verification code are required",
                    });
                }
                const user = yield auth_service_1.default.verifyEmail(email, code);
                return response.status(200).json({
                    success: true,
                    message: "Email verified successfully",
                    user: {
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        isEmailVerified: user.isEmailVerified,
                        role: user.role,
                    },
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.message === "Invalid email or code") {
                        return response.status(400).json({
                            success: false,
                            message: error.message,
                        });
                    }
                    if (error.message === "Verification code expired") {
                        return response.status(400).json({
                            success: false,
                            message: error.message,
                        });
                    }
                }
                return next(error);
            }
        });
    }
    resetPassword(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, token, newPassword } = request.body;
                if (!email || !token || !newPassword) {
                    return response.status(400).json({
                        success: false,
                        message: "Email, token, and new password are required",
                    });
                }
                yield auth_service_1.default.resetPassword(email, token, newPassword);
                return response.status(200).json({
                    success: true,
                    message: "Password reset successfully",
                });
            }
            catch (error) {
                if (error instanceof Error &&
                    error.message === "Invalid or expired reset token") {
                    return response.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                return next(error);
            }
        });
    }
    resendVerificationEmail(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = request.body;
                if (!email) {
                    return response.status(400).json({
                        success: false,
                        message: "Email is required",
                    });
                }
                yield auth_service_1.default.resendVerificationEmail(email);
                return response.status(200).json({
                    success: true,
                    message: "Verification email resent successfully",
                });
            }
            catch (error) {
                if (error instanceof Error) {
                    if (error.message === "User not found") {
                        return response.status(404).json({
                            success: false,
                            message: error.message,
                        });
                    }
                    if (error.message === "Email already verified") {
                        return response.status(400).json({
                            success: false,
                            message: error.message,
                        });
                    }
                }
                return next(error);
            }
        });
    }
    completeUserProfile(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = request.userId;
                if (!userId) {
                    return response.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                }
                // Destructure all possible profile fields
                const { age, isKid, section, role, location, avatarUpload, interests, hasConsentedToPrivacyPolicy, parentalControlEnabled, parentEmail, } = request.body;
                // Build update object based on what's provided
                const updateFields = {};
                if (age !== undefined)
                    updateFields.age = age;
                if (isKid !== undefined)
                    updateFields.isKid = isKid;
                if (section !== undefined)
                    updateFields.section = section;
                if (role !== undefined)
                    updateFields.role = role;
                if (location !== undefined)
                    updateFields.location = location;
                if (avatarUpload !== undefined)
                    updateFields.avatarUpload = avatarUpload;
                if (interests !== undefined)
                    updateFields.interests = interests;
                if (hasConsentedToPrivacyPolicy !== undefined) {
                    updateFields.hasConsentedToPrivacyPolicy = hasConsentedToPrivacyPolicy;
                }
                if (parentalControlEnabled !== undefined) {
                    updateFields.parentalControlEnabled = parentalControlEnabled;
                }
                if (parentEmail !== undefined)
                    updateFields.parentEmail = parentEmail;
                // Fetch current user
                const userBeforeUpdate = yield user_model_1.User.findById(userId);
                if (!userBeforeUpdate) {
                    return response.status(404).json({
                        success: false,
                        message: "User not found",
                    });
                }
                // Helper function to check field existence
                const isSet = (field) => userBeforeUpdate[field] !== undefined ||
                    updateFields[field] !== undefined;
                const isProfileComplete = isSet("age") &&
                    isSet("isKid") &&
                    (userBeforeUpdate.section || updateFields.section) &&
                    (userBeforeUpdate.role || updateFields.role) &&
                    isSet("hasConsentedToPrivacyPolicy");
                if (isProfileComplete) {
                    updateFields.isProfileComplete = true;
                }
                // Update user
                const updatedUser = yield user_model_1.User.findByIdAndUpdate(userId, updateFields, {
                    new: true,
                });
                return response.status(200).json({
                    success: true,
                    message: "Profile updated successfully",
                    user: updatedUser,
                });
            }
            catch (error) {
                return next(error);
            }
        });
    }
    getCurrentUser(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = request.userId;
                if (!userId) {
                    return response.status(401).json({
                        success: false,
                        message: "Unauthorized: User ID missing",
                    });
                }
                const user = yield auth_service_1.default.getCurrentUser(userId);
                return response.status(200).json({
                    success: true,
                    user,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message === "User not found") {
                    return response.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                return next(error);
            }
        });
    }
    getUserSession(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = request.userId;
                if (!userId) {
                    return response.status(401).json({
                        success: false,
                        message: "Unauthorized: User ID missing",
                    });
                }
                const session = yield auth_service_1.default.getUserSession(userId);
                return response.status(200).json({
                    success: true,
                    session,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message === "User not found") {
                    return response.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                return next(error);
            }
        });
    }
    updateUserAvatar(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = request.userId;
                const avatarFile = request.file;
                if (!userId) {
                    return response.status(401).json({
                        success: false,
                        message: "Unauthorized: User ID missing",
                    });
                }
                if (!avatarFile) {
                    return response.status(400).json({
                        success: false,
                        message: "Avatar image is required",
                    });
                }
                const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
                if (!validImageMimeTypes.includes(avatarFile.mimetype)) {
                    return response.status(400).json({
                        success: false,
                        message: `Invalid image type: ${avatarFile.mimetype}`,
                    });
                }
                const updateResult = yield auth_service_1.default.updateUserAvatar(userId, avatarFile.buffer, avatarFile.mimetype);
                return response.status(200).json({
                    success: true,
                    message: "Avatar updated successfully",
                    data: updateResult,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message === "User not found") {
                    return response.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                if (error instanceof Error &&
                    error.message.startsWith("Invalid image type")) {
                    return response.status(400).json({
                        success: false,
                        message: error.message,
                    });
                }
                if (error instanceof multer_1.default.MulterError &&
                    error.code === "LIMIT_UNEXPECTED_FILE") {
                    return response.status(400).json({
                        success: false,
                        message: `Unexpected field in file upload. Expected field name: 'avatar'`,
                    });
                }
                if (error instanceof multer_1.default.MulterError &&
                    error.code === "LIMIT_FILE_SIZE") {
                    return response.status(400).json({
                        success: false,
                        message: "File size exceeds the 5MB limit",
                    });
                }
                return next(error);
            }
        });
    }
    initiatePasswordReset(request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = request.body;
                if (!email) {
                    return response.status(400).json({
                        success: false,
                        message: "Email is required",
                    });
                }
                const resetToken = yield auth_service_1.default.initiatePasswordReset(email);
                return response.status(200).json({
                    success: true,
                    message: "Password reset initiated",
                    resetToken,
                });
            }
            catch (error) {
                if (error instanceof Error && error.message === "User not found") {
                    return response.status(404).json({
                        success: false,
                        message: error.message,
                    });
                }
                return next(error);
            }
        });
    }
}
exports.default = new AuthController();
