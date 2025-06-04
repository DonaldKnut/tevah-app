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
                const user = yield auth_service_1.default.registerUser(email, password, firstName, lastName, desiredRole, avatarFile.buffer);
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
                        message: "Unauthorized: User ID missing",
                    });
                }
                const { age, location, hasConsentedToPrivacyPolicy, desiredRole } = request.body;
                if (!age || !hasConsentedToPrivacyPolicy) {
                    return response.status(400).json({
                        success: false,
                        message: "Age and privacy policy consent are required",
                    });
                }
                const user = yield auth_service_1.default.completeUserProfile(userId, age, location, hasConsentedToPrivacyPolicy, desiredRole);
                return response.status(200).json({
                    success: true,
                    user: {
                        id: user._id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        isProfileComplete: user.isProfileComplete,
                    },
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
                const updateResult = yield auth_service_1.default.updateUserAvatar(userId, avatarFile.buffer);
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
