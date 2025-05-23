import mongoose, { Schema, Document } from "mongoose";

export type AuthProvider = "clerk" | "email";
export type UserRole =
  | "learner"
  | "parent"
  | "educator"
  | "moderator"
  | "admin";
export type UserSection = "kids" | "adults";

export interface IUser {
  firstName?: string; // Replaced fullName
  lastName?: string; // Replaced fullName
  email: string;
  provider: AuthProvider;
  clerkId?: string;
  avatar?: string;
  password?: string;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  age: number;
  isKid: boolean;
  section: UserSection;
  role: UserRole;
  location?: string;

  isProfileComplete: boolean;
  hasConsentedToPrivacyPolicy: boolean;
  isEmailVerified: boolean;

  subscriptionTier?: "free" | "premium";
  parentalControlEnabled?: boolean;
  parentEmail?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    firstName: String, // Replaced fullName
    lastName: String, // Replaced fullName
    email: { type: String, required: true, unique: true },
    provider: { type: String, enum: ["clerk", "email"], required: true },
    clerkId: String,
    avatar: String,
    password: String,
    verificationCode: String,
    verificationCodeExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    age: { type: Number, default: 0 },
    isKid: { type: Boolean, default: false },
    section: { type: String, enum: ["kids", "adults"], default: "adults" },
    role: {
      type: String,
      enum: ["learner", "parent", "educator", "moderator", "admin"],
      default: "learner",
    },
    location: String,

    isProfileComplete: { type: Boolean, default: false },
    hasConsentedToPrivacyPolicy: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },

    subscriptionTier: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    parentalControlEnabled: { type: Boolean, default: false },
    parentEmail: String,
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
