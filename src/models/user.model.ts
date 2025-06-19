import mongoose, { Schema, Document } from "mongoose";
import { VALID_INTERESTS } from "../constants/interests";

// Define authentication providers
export type AuthProvider = "clerk" | "email";

// Define user roles
export type UserRole =
  | "learner"
  | "parent"
  | "educator"
  | "moderator"
  | "admin"
  | "content_creator"
  | "vendor"
  | "church_admin";

// Define user sections
export type UserSection = "kids" | "adults";

// Define interests based on the predefined constant list
export type InterestType = (typeof VALID_INTERESTS)[number];

// TypeScript interface representing a User object
export interface IUser {
  firstName?: string;
  lastName?: string;
  email: string;
  provider: AuthProvider;
  clerkId?: string;
  avatar?: string;
  avatarUpload?: string;
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

// Extend Mongoose's Document with the IUser interface
export interface IUserDocument extends IUser, Document {}

// Define the Mongoose schema for the User model
const userSchema = new Schema<IUserDocument>(
  {
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

// Export the Mongoose model
export const User =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
