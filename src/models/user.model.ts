import mongoose, { Schema, Document } from "mongoose";
import { VALID_INTERESTS } from "../constants/interests";

// Auth providers
export type AuthProvider = "clerk" | "email";

// User roles
export type UserRole =
  | "learner"
  | "parent"
  | "educator"
  | "moderator"
  | "admin"
  | "content_creator"
  | "vendor"
  | "church_admin";

// User sections
export type UserSection = "kids" | "adults";

// Interests
export type InterestType = (typeof VALID_INTERESTS)[number];

// TS Interface
export interface IUser {
  firstName?: string;
  lastName?: string;
  email: string;
  provider: AuthProvider;
  clerkId?: string;
  avatar?: string;
  password: string;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  age?: number;
  isKid?: boolean;
  section?: UserSection;
  role?: UserRole;
  location?: string;

  interests?: InterestType[];

  isProfileComplete?: boolean;
  hasConsentedToPrivacyPolicy?: boolean;
  isEmailVerified: boolean;

  subscriptionTier?: "free" | "premium";
  parentalControlEnabled?: boolean;
  parentEmail?: string;

  isVerifiedCreator?: boolean;
  isVerifiedVendor?: boolean;
  isVerifiedChurch?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose Document extension
export interface IUserDocument extends IUser, Document {}

// Schema definition
const userSchema = new Schema<IUserDocument>(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    provider: { type: String, enum: ["clerk", "email"], required: true },
    clerkId: { type: String },
    avatar: { type: String },
    password: { type: String },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    age: { type: Number }, // no default
    isKid: { type: Boolean }, // no default
    section: { type: String, enum: ["kids", "adults"] }, // no default
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
      enum: VALID_INTERESTS,
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
  },
  { timestamps: true }
);

// Export model
export const User =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
