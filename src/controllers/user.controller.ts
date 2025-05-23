import { Request, Response } from "express";
import { User } from "../models/user.model";

export const completeUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    const {
      age,
      isKid,
      section,
      role,
      location,
      hasConsentedToPrivacyPolicy,
      parentalControlEnabled,
      parentEmail,
    } = req.body;

    if (
      age === undefined ||
      isKid === undefined ||
      !section ||
      !role ||
      hasConsentedToPrivacyPolicy === undefined
    ) {
      res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        age,
        isKid,
        section,
        role,
        location,
        parentEmail,
        parentalControlEnabled,
        hasConsentedToPrivacyPolicy,
        isProfileComplete: true,
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      user,
    });
  } catch (error: any) {
    console.error("Complete profile error:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Server error", detail: error.message });
  }
};
