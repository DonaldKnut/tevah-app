import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface for media interactions
export interface IMediaInteraction extends Document {
  user: mongoose.Types.ObjectId; // User who interacted
  media: mongoose.Types.ObjectId; // Media item interacted with
  interactionType: "view" | "listen" | "read" | "download"; // Type of interaction
  createdAt: Date;
}

// Mongoose schema
const mediaInteractionSchema = new Schema<IMediaInteraction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    media: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      required: true,
    },
    interactionType: {
      type: String,
      enum: ["view", "listen", "read", "download"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent duplicate interactions per user per media per interaction type
mediaInteractionSchema.index(
  { user: 1, media: 1, interactionType: 1 },
  { unique: true }
);

// Export model
export const MediaInteraction =
  mongoose.models.MediaInteraction ||
  mongoose.model<IMediaInteraction>("MediaInteraction", mediaInteractionSchema);
