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
exports.completeUserProfile = void 0;
const user_model_1 = require("../models/user.model");
const completeUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { age, isKid, section, role, location, hasConsentedToPrivacyPolicy, parentalControlEnabled, parentEmail, } = req.body;
        if (age === undefined ||
            isKid === undefined ||
            !section ||
            !role ||
            hasConsentedToPrivacyPolicy === undefined) {
            res
                .status(400)
                .json({ success: false, message: "Missing required fields" });
            return;
        }
        const user = yield user_model_1.User.findByIdAndUpdate(userId, {
            age,
            isKid,
            section,
            role,
            location,
            parentEmail,
            parentalControlEnabled,
            hasConsentedToPrivacyPolicy,
            isProfileComplete: true,
        }, { new: true });
        if (!user) {
            res.status(404).json({ success: false, message: "User not found" });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Profile completed successfully",
            user,
        });
    }
    catch (error) {
        console.error("Complete profile error:", error.message);
        res
            .status(500)
            .json({ success: false, message: "Server error", detail: error.message });
    }
});
exports.completeUserProfile = completeUserProfile;
