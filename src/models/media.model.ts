import mongoose, { Schema, Document } from "mongoose";

// Define media content types
export type MediaContentType =
  | "music"
  | "videos"
  | "ebook"
  | "podcast"
  | "devotional"
  | "sermon"
  | "live";

// Define live stream status
export type LiveStreamStatus = "scheduled" | "live" | "ended" | "archived";

// Define the Media interface for TypeScript
export interface IMedia extends Document {
  title: string;
  description?: string;
  contentType: MediaContentType;
  category?: string;
  fileUrl: string;
  fileMimeType?: string;
  topics?: string[];
  uploadedBy: mongoose.Types.ObjectId;
  viewCount: number;
  listenCount: number;
  readCount: number;
  downloadCount: number;
  isLive?: boolean;
  liveStreamStatus?: LiveStreamStatus;
  streamKey?: string;
  playbackUrl?: string;
  rtmpUrl?: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  concurrentViewers?: number;
  duration?: number; // Duration in seconds
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose schema
const mediaSchema = new Schema<IMedia>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    contentType: {
      type: String,
      enum: ["music", "videos", "books", "live"],
      required: true,
    },
    category: {
      type: String,
      trim: true,
      enum: [
        "worship",
        "inspiration",
        "youth",
        "teachings",
        "marriage",
        "counselling",
        "", // Allow empty category
      ],
    },
    fileUrl: {
      type: String,
      required: function () {
        return this.contentType !== "live";
      },
    },
    fileMimeType: {
      type: String,
    },
    topics: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          const allowedTopics = [
            "faith",
            "healing",
            "grace",
            "prayer",
            "maturity",
            "spiritual growth",
          ];
          return tags.every((tag) => allowedTopics.includes(tag.toLowerCase()));
        },
        message: (props) => `Invalid topics: ${props.value}`,
      },
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    listenCount: {
      type: Number,
      default: 0,
    },
    readCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    liveStreamStatus: {
      type: String,
      enum: ["scheduled", "live", "ended", "archived"],
    },
    streamKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    playbackUrl: {
      type: String,
    },
    rtmpUrl: {
      type: String,
    },
    scheduledStart: {
      type: Date,
    },
    scheduledEnd: {
      type: Date,
    },
    actualStart: {
      type: Date,
    },
    actualEnd: {
      type: Date,
    },
    concurrentViewers: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
mediaSchema.index({ isLive: 1, liveStreamStatus: 1 });
mediaSchema.index({
  title: "text",
  topics: 1,
  category: 1,
  contentType: 1,
  uploadedBy: 1,
  createdAt: 1,
});

export const Media =
  mongoose.models.Media || mongoose.model<IMedia>("Media", mediaSchema);
