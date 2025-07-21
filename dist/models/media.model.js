"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Media = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define the Mongoose schema
const mediaSchema = new mongoose_1.Schema({
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
            validator: function (tags) {
                const allowedTopics = [
                    "faith",
                    "healing",
                    "grace",
                    "prayer",
                    "maturity",
                    "spiritual growth",
                    "worship",
                    "inspiration",
                ];
                return tags.every((tag) => allowedTopics.includes(tag.toLowerCase()));
            },
            message: (props) => `Invalid topics: ${props.value}`,
        },
    },
    uploadedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    favoriteCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
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
}, {
    timestamps: true,
});
// Indexes for faster queries
mediaSchema.index({ isLive: 1, liveStreamStatus: 1 });
mediaSchema.index({
    title: "text",
    category: 1,
    contentType: 1,
    uploadedBy: 1,
    createdAt: 1,
});
exports.Media = mongoose_1.default.models.Media || mongoose_1.default.model("Media", mediaSchema);
