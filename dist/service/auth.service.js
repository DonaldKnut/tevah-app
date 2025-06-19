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
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const mailer_1 = require("../utils/mailer");
const clerk_1 = require("../utils/clerk");
const fileUpload_service_1 = __importDefault(require("../utils/fileUpload.service"));
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
class AuthService {
    setVerificationFlags(role) {
        const verificationFlags = {
            isVerifiedCreator: false,
            isVerifiedVendor: false,
            isVerifiedChurch: false,
        };
        switch (role) {
            case "content_creator":
                verificationFlags.isVerifiedCreator = false;
                break;
            case "vendor":
                verificationFlags.isVerifiedVendor = false;
                break;
            case "church_admin":
                verificationFlags.isVerifiedChurch = false;
                break;
        }
        return verificationFlags;
    }
    oauthLogin(provider, token, userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const decoded = yield (0, clerk_1.verifyClerkToken)(token);
            const email = decoded.email;
            if (!email) {
                throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} email not found in Clerk token`);
            }
            let user = yield user_model_1.User.findOne({ email });
            const isNewUser = !user;
            if (!user) {
                user = yield user_model_1.User.create({
                    email,
                    firstName: userInfo.firstName || "User",
                    lastName: userInfo.lastName || "",
                    avatar: userInfo.avatar || "",
                    provider: provider.toLowerCase(),
                    clerkId: decoded.sub,
                    isEmailVerified: true,
                    isProfileComplete: false,
                    age: 0,
                    isKid: false,
                    section: "adults",
                    role: "learner",
                    hasConsentedToPrivacyPolicy: false,
                });
                yield (0, mailer_1.sendWelcomeEmail)(user.email, user.firstName || "User");
            }
            const jwtToken = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, {
                expiresIn: "7d",
            });
            return {
                token: jwtToken,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    isProfileComplete: user.isProfileComplete,
                },
                isNewUser,
            };
        });
    }
    clerkLogin(token, userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            const decoded = yield (0, clerk_1.verifyClerkToken)(token);
            const email = decoded.email;
            let user = yield user_model_1.User.findOne({ email });
            const isNewUser = !user;
            if (!user) {
                user = yield user_model_1.User.create({
                    email,
                    firstName: userInfo.firstName || "User",
                    lastName: userInfo.lastName || "",
                    avatar: userInfo.avatar || "",
                    provider: "clerk",
                    clerkId: decoded.sub,
                    isEmailVerified: true,
                    isProfileComplete: false,
                    age: 0,
                    isKid: false,
                    section: "adults",
                    role: "learner",
                    hasConsentedToPrivacyPolicy: false,
                });
                yield (0, mailer_1.sendWelcomeEmail)(user.email, user.firstName || "User");
            }
            return {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    isNewUser,
                },
                needsAgeSelection: !user.age,
            };
        });
    }
    registerUser(email, password, firstName, lastName, desiredRole, avatarBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield user_model_1.User.findOne({ email });
            if (existingUser) {
                throw new Error("Email address is already registered");
            }
            const allowedRoles = [
                "learner",
                "parent",
                "educator",
                "content_creator",
                "vendor",
                "church_admin",
            ];
            const role = desiredRole && allowedRoles.includes(desiredRole)
                ? desiredRole
                : "learner";
            const verificationCode = crypto_1.default
                .randomBytes(3)
                .toString("hex")
                .toUpperCase();
            const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            const verificationFlags = this.setVerificationFlags(role);
            let avatarUrl;
            if (avatarBuffer) {
                avatarUrl = yield fileUpload_service_1.default.uploadImage(avatarBuffer, "user-avatars");
            }
            const newUser = yield user_model_1.User.create(Object.assign({ email,
                firstName,
                lastName, avatar: avatarUrl, provider: "email", password: hashedPassword, verificationCode,
                verificationCodeExpires, isEmailVerified: false, isProfileComplete: false, age: 0, isKid: false, section: "adults", role, hasConsentedToPrivacyPolicy: false }, verificationFlags));
            yield (0, mailer_1.sendVerificationEmail)(newUser.email, newUser.firstName, verificationCode);
            return {
                id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                avatar: newUser.avatar,
                role: newUser.role,
            };
        });
    }
    loginUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email, provider: "email" });
            if (!user || !(yield bcrypt_1.default.compare(password, user.password || ""))) {
                throw new Error("Invalid email or password");
            }
            if (!user.isEmailVerified) {
                throw new Error("Please verify your email before logging in");
            }
            const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, {
                expiresIn: "7d",
            });
            return {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatar: user.avatar,
                    role: user.role,
                    isProfileComplete: user.isProfileComplete,
                },
            };
        });
    }
    verifyEmail(email, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email, verificationCode: code });
            if (!user) {
                throw new Error("Invalid email or code");
            }
            if (user.verificationCodeExpires &&
                user.verificationCodeExpires < new Date()) {
                throw new Error("Verification code expired");
            }
            user.isEmailVerified = true;
            user.verificationCode = undefined;
            user.verificationCodeExpires = undefined;
            yield user.save();
            yield (0, mailer_1.sendWelcomeEmail)(user.email, user.firstName || "User");
            return user;
        });
    }
    resetPassword(email, token, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({
                email,
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() },
            });
            if (!user) {
                throw new Error("Invalid or expired reset token");
            }
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            yield user.save();
            return user;
        });
    }
    resendVerificationEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email, provider: "email" });
            if (!user) {
                throw new Error("User not found");
            }
            if (user.isEmailVerified) {
                throw new Error("Email already verified");
            }
            const verificationCode = crypto_1.default
                .randomBytes(3)
                .toString("hex")
                .toUpperCase();
            const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
            user.verificationCode = verificationCode;
            user.verificationCodeExpires = verificationCodeExpires;
            yield user.save();
            yield (0, mailer_1.sendVerificationEmail)(user.email, user.firstName || "User", verificationCode);
            return user;
        });
    }
    completeUserProfile(userId, age, location, hasConsentedToPrivacyPolicy, desiredRole, interests, section) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = yield user_model_1.User.findById(userId);
            if (!currentUser) {
                throw new Error("User not found");
            }
            let userSection = section;
            if (!userSection) {
                userSection = age < 13 ? "kids" : "adults";
            }
            let role = currentUser.role;
            if (currentUser.role === "learner" && desiredRole) {
                const allowedRoles = [
                    "learner",
                    "parent",
                    "educator",
                    "content_creator",
                    "vendor",
                    "church_admin",
                ];
                if (allowedRoles.includes(desiredRole)) {
                    role = desiredRole;
                }
            }
            const verificationFlags = role !== currentUser.role ? this.setVerificationFlags(role) : {};
            const updateData = Object.assign({ age,
                location, section: userSection, isKid: userSection === "kids", role,
                hasConsentedToPrivacyPolicy, isProfileComplete: true }, verificationFlags);
            if (interests && Array.isArray(interests)) {
                updateData.interests = interests;
            }
            const user = yield user_model_1.User.findByIdAndUpdate(userId, updateData, {
                new: true,
            });
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        });
    }
    getCurrentUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId).select("email firstName lastName avatar isProfileComplete role section interests");
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        });
    }
    getUserSession(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId).select("_id email firstName lastName isProfileComplete role");
            if (!user) {
                throw new Error("User not found");
            }
            return {
                userId: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isProfileComplete: user.isProfileComplete,
                role: user.role,
            };
        });
    }
    updateUserAvatar(userId, avatarBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            if (user.avatar) {
                try {
                    const publicId = (_a = user.avatar.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
                    if (publicId) {
                        yield fileUpload_service_1.default.deleteImage(`user-avatars/${publicId}`);
                    }
                }
                catch (error) {
                    console.error("Error deleting old avatar:", error);
                }
            }
            const avatarUrl = yield fileUpload_service_1.default.uploadImage(avatarBuffer, "user-avatars");
            user.avatar = avatarUrl;
            yield user.save();
            return {
                avatarUrl: user.avatar,
                userId: user._id,
            };
        });
    }
    initiatePasswordReset(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email });
            if (!user) {
                throw new Error("User not found");
            }
            const resetToken = crypto_1.default.randomBytes(20).toString("hex");
            const resetTokenExpires = new Date(Date.now() + 3600000);
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = resetTokenExpires;
            yield user.save();
            return resetToken;
        });
    }
}
exports.default = new AuthService();
