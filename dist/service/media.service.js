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
exports.mediaService = exports.MediaService = void 0;
const media_model_1 = require("../models/media.model");
const mediaInteraction_model_1 = require("../models/mediaInteraction.model");
const bookmark_model_1 = require("../models/bookmark.model");
const user_model_1 = require("../models/user.model");
const mongoose_1 = require("mongoose");
const fileUpload_service_1 = __importDefault(require("./fileUpload.service"));
class MediaService {
    uploadMedia(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const validMimeTypes = {
                videos: ["video/mp4", "video/webm", "video/ogg", "video/mpeg"],
                music: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp3"],
                books: ["application/pdf", "application/epub+zip"],
                live: [],
            };
            if (data.file && data.fileMimeType) {
                if (!validMimeTypes[data.contentType].includes(data.fileMimeType)) {
                    throw new Error(`Invalid MIME type ${data.fileMimeType} for content type ${data.contentType}`);
                }
            }
            let fileUrl;
            if (data.contentType !== "live" && data.file && data.fileMimeType) {
                try {
                    const uploadResult = yield fileUpload_service_1.default.uploadMedia(data.file, `media/${data.contentType}`, data.fileMimeType);
                    fileUrl = uploadResult.secure_url;
                    if (!fileUrl) {
                        throw new Error("Cloudinary upload did not return a valid URL");
                    }
                }
                catch (error) {
                    console.error(`Error uploading ${data.contentType}:`, error);
                    throw new Error(`Failed to upload ${data.contentType}`);
                }
            }
            else if (data.contentType !== "live") {
                throw new Error("File is required for non-live content types");
            }
            const media = new media_model_1.Media({
                title: data.title,
                description: data.description,
                contentType: data.contentType,
                category: data.category,
                fileUrl,
                fileMimeType: data.fileMimeType,
                topics: data.topics || [],
                uploadedBy: typeof data.uploadedBy === "string"
                    ? new mongoose_1.Types.ObjectId(data.uploadedBy)
                    : data.uploadedBy,
                duration: data.duration,
                isLive: data.isLive,
                liveStreamStatus: data.liveStreamStatus,
                streamKey: data.streamKey,
                rtmpUrl: data.rtmpUrl,
                playbackUrl: data.playbackUrl,
            });
            yield media.save();
            return media;
        });
    }
    getAllMedia() {
        return __awaiter(this, arguments, void 0, function* (filters = {}) {
            const query = {};
            if (filters.search) {
                query.title = { $regex: filters.search, $options: "i" };
            }
            if (filters.contentType && filters.contentType !== "devotionals") {
                const contentTypeMap = {
                    videos: ["videos"],
                    sermons: ["videos", "live"],
                    music: ["music"],
                    podcasts: ["music"],
                    books: ["books"],
                };
                query.contentType = { $in: contentTypeMap[filters.contentType] || [] };
                if (filters.contentType === "sermons")
                    query.category = "sermon";
                if (filters.contentType === "podcasts")
                    query.category = "podcast";
            }
            if (filters.category) {
                query.category = { $regex: filters.category, $options: "i" };
            }
            if (filters.topics) {
                const topicsArray = Array.isArray(filters.topics)
                    ? filters.topics
                    : filters.topics.split(",");
                query.topics = {
                    $in: topicsArray.map((topic) => new RegExp(topic, "i")),
                };
            }
            if (filters.creator) {
                const user = yield user_model_1.User.findOne({ username: filters.creator });
                if (user) {
                    query.uploadedBy = user._id;
                }
                else {
                    query.uploadedBy = null;
                }
            }
            // Fix TypeScript error by explicitly typing durationRanges
            const durationRanges = {
                short: { $lte: 5 * 60 },
                medium: { $gte: 5 * 60, $lte: 15 * 60 },
                long: { $gt: 15 * 60 },
            };
            if (filters.duration) {
                const durationKey = filters.duration;
                if (durationRanges[durationKey]) {
                    query.duration = durationRanges[durationKey];
                }
                else {
                    query.duration = {};
                }
            }
            if (filters.startDate || filters.endDate) {
                query.createdAt = {};
                if (filters.startDate) {
                    query.createdAt.$gte = new Date(filters.startDate);
                }
                if (filters.endDate) {
                    query.createdAt.$lte = new Date(filters.endDate);
                }
            }
            let sort = filters.sort || "-createdAt";
            if (filters.sort === "trending") {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                query.createdAt = { $gte: sevenDaysAgo };
                sort = "-viewCount -listenCount -readCount";
            }
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const skip = (page - 1) * limit;
            const mediaList = yield media_model_1.Media.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("uploadedBy", "username")
                .lean();
            const total = yield media_model_1.Media.countDocuments(query);
            return {
                media: mediaList,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    getMediaByIdentifier(mediaIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(mediaIdentifier)) {
                throw new Error("Invalid media identifier");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            return media;
        });
    }
    deleteMedia(mediaIdentifier, userIdentifier, userRole) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!mongoose_1.Types.ObjectId.isValid(mediaIdentifier)) {
                throw new Error("Invalid media identifier");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            if (media.uploadedBy.toString() !== userIdentifier &&
                userRole !== "admin") {
                throw new Error("Unauthorized to delete this media");
            }
            // Delete media file from storage if it exists
            if (media.fileUrl) {
                try {
                    const publicId = (_a = media.fileUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
                    if (publicId) {
                        yield fileUpload_service_1.default.deleteMedia(`media-${media.contentType}/${publicId}`, media.contentType);
                    }
                }
                catch (error) {
                    console.error("Error deleting media file:", error);
                }
            }
            yield media_model_1.Media.findByIdAndDelete(mediaIdentifier);
            return true;
        });
    }
    recordInteraction(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(data.userIdentifier) ||
                !mongoose_1.Types.ObjectId.isValid(data.mediaIdentifier)) {
                throw new Error("Invalid user or media identifier");
            }
            const media = yield media_model_1.Media.findById(data.mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            if ((media.contentType === "videos" && data.interactionType !== "view") ||
                (media.contentType === "music" && data.interactionType !== "listen") ||
                (media.contentType === "books" &&
                    !["read", "download"].includes(data.interactionType))) {
                throw new Error(`Invalid interaction type ${data.interactionType} for ${media.contentType} media`);
            }
            const session = yield media_model_1.Media.startSession();
            try {
                const interaction = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    const existingInteraction = yield mediaInteraction_model_1.MediaInteraction.findOne({
                        user: new mongoose_1.Types.ObjectId(data.userIdentifier),
                        media: new mongoose_1.Types.ObjectId(data.mediaIdentifier),
                        interactionType: data.interactionType,
                    }).session(session);
                    if (existingInteraction) {
                        throw new Error(`User has already ${data.interactionType} this media`);
                    }
                    const interaction = yield mediaInteraction_model_1.MediaInteraction.create([
                        {
                            user: new mongoose_1.Types.ObjectId(data.userIdentifier),
                            media: new mongoose_1.Types.ObjectId(data.mediaIdentifier),
                            interactionType: data.interactionType,
                        },
                    ], { session });
                    const updateField = {};
                    if (data.interactionType === "view")
                        updateField.viewCount = 1;
                    if (data.interactionType === "listen")
                        updateField.listenCount = 1;
                    if (data.interactionType === "read")
                        updateField.readCount = 1;
                    if (data.interactionType === "download")
                        updateField.downloadCount = 1;
                    yield media_model_1.Media.findByIdAndUpdate(data.mediaIdentifier, { $inc: updateField }, { session });
                    return interaction[0];
                }));
                return interaction;
            }
            finally {
                session.endSession();
            }
        });
    }
    getInteractionCounts(mediaIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(mediaIdentifier)) {
                throw new Error("Invalid media identifier");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier).select("contentType viewCount listenCount readCount downloadCount");
            if (!media) {
                throw new Error("Media not found");
            }
            const result = {};
            if (media.contentType === "videos")
                result.viewCount = media.viewCount;
            if (media.contentType === "music")
                result.listenCount = media.listenCount;
            if (media.contentType === "books") {
                result.readCount = media.readCount;
                result.downloadCount = media.downloadCount;
            }
            return result;
        });
    }
    getMediaCountByContentType() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield media_model_1.Media.aggregate([
                {
                    $group: {
                        _id: "$contentType",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        contentType: "$_id",
                        count: 1,
                        _id: 0,
                    },
                },
            ]);
            const counts = {
                music: 0,
                videos: 0,
                books: 0,
                live: 0,
            };
            result.forEach((item) => {
                counts[item.contentType] = item.count;
            });
            return counts;
        });
    }
    getTotalInteractionCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const result = yield media_model_1.Media.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: "$viewCount" },
                        totalListens: { $sum: "$listenCount" },
                        totalReads: { $sum: "$readCount" },
                        totalDownloads: { $sum: "$downloadCount" },
                    },
                },
            ]);
            return {
                totalViews: ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.totalViews) || 0,
                totalListens: ((_b = result[0]) === null || _b === void 0 ? void 0 : _b.totalListens) || 0,
                totalReads: ((_c = result[0]) === null || _c === void 0 ? void 0 : _c.totalReads) || 0,
                totalDownloads: ((_d = result[0]) === null || _d === void 0 ? void 0 : _d.totalDownloads) || 0,
            };
        });
    }
    getRecentMedia(limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield media_model_1.Media.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .select("title contentType category createdAt")
                .lean();
        });
    }
    getMediaCountSinceDate(since) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield media_model_1.Media.countDocuments({
                createdAt: { $gte: since },
            });
        });
    }
    getInteractionCountSinceDate(since) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield mediaInteraction_model_1.MediaInteraction.countDocuments({
                createdAt: { $gte: since },
            });
        });
    }
    getUserMediaCountByContentType(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            const result = yield media_model_1.Media.aggregate([
                {
                    $match: { uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier) },
                },
                {
                    $group: {
                        _id: "$contentType",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        contentType: "$_id",
                        count: 1,
                        _id: 0,
                    },
                },
            ]);
            const counts = {
                music: 0,
                videos: 0,
                books: 0,
                live: 0,
            };
            result.forEach((item) => {
                counts[item.contentType] = item.count;
            });
            return counts;
        });
    }
    getUserInteractionCounts(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            const result = yield mediaInteraction_model_1.MediaInteraction.aggregate([
                {
                    $match: { user: new mongoose_1.Types.ObjectId(userIdentifier) },
                },
                {
                    $group: {
                        _id: "$interactionType",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        interactionType: "$_id",
                        count: 1,
                        _id: 0,
                    },
                },
            ]);
            const counts = {
                totalViews: 0,
                totalListens: 0,
                totalReads: 0,
                totalDownloads: 0,
            };
            result.forEach((item) => {
                if (item.interactionType === "view")
                    counts.totalViews = item.count;
                if (item.interactionType === "listen")
                    counts.totalListens = item.count;
                if (item.interactionType === "read")
                    counts.totalReads = item.count;
                if (item.interactionType === "download")
                    counts.totalDownloads = item.count;
            });
            return counts;
        });
    }
    getUserBookmarkCount(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            return yield bookmark_model_1.Bookmark.countDocuments({
                user: new mongoose_1.Types.ObjectId(userIdentifier),
            });
        });
    }
    getUserRecentMedia(userIdentifier, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            return yield media_model_1.Media.find({
                uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier),
            })
                .sort({ createdAt: -1 })
                .limit(limit)
                .select("title contentType category createdAt")
                .lean();
        });
    }
    getUserMediaCountSinceDate(userIdentifier, since) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            return yield media_model_1.Media.countDocuments({
                uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier),
                createdAt: { $gte: since },
            });
        });
    }
    getUserInteractionCountSinceDate(userIdentifier, since) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            return yield mediaInteraction_model_1.MediaInteraction.countDocuments({
                user: new mongoose_1.Types.ObjectId(userIdentifier),
                createdAt: { $gte: since },
            });
        });
    }
}
exports.MediaService = MediaService;
exports.mediaService = new MediaService();
