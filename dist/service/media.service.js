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
exports.mediaService = exports.MediaService = void 0;
const media_model_1 = require("../models/media.model");
const mediaInteraction_model_1 = require("../models/mediaInteraction.model");
const bookmark_model_1 = require("../models/bookmark.model");
const mongoose_1 = require("mongoose");
class MediaService {
    /**
     * Upload media (audio, video, or e-book)
     */
    uploadMedia(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const media = new media_model_1.Media({
                title: data.title,
                description: data.description,
                type: data.type,
                genre: data.genre,
                uploadedBy: typeof data.uploadedBy === "string"
                    ? new mongoose_1.Types.ObjectId(data.uploadedBy)
                    : data.uploadedBy,
                fileUrl: data.fileUrl,
                fileMimeType: data.fileMimeType,
                tags: data.tags || [],
            });
            yield media.save();
            return media;
        });
    }
    /**
     * Get all media with optional filters and pagination
     */
    getAllMedia() {
        return __awaiter(this, arguments, void 0, function* (filters = {}) {
            const query = {};
            if (filters.search) {
                query.title = { $regex: filters.search, $options: "i" };
            }
            if (filters.type) {
                query.type = {
                    $in: Array.isArray(filters.type) ? filters.type : [filters.type],
                };
            }
            if (filters.genre) {
                query.genre = { $regex: filters.genre, $options: "i" };
            }
            if (filters.tags) {
                const tagsArray = Array.isArray(filters.tags)
                    ? filters.tags
                    : filters.tags.split(",");
                query.tags = {
                    $in: tagsArray.map((tag) => new RegExp(tag, "i")),
                };
            }
            const sort = filters.sort || "-createdAt";
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const skip = (page - 1) * limit;
            const mediaList = yield media_model_1.Media.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
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
    /**
     * Get media by ID
     */
    getMediaById(mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(mediaId)) {
                throw new Error("Invalid media ID");
            }
            const media = yield media_model_1.Media.findById(mediaId);
            if (!media) {
                throw new Error("Media not found");
            }
            return media;
        });
    }
    /**
     * Delete media by ID (admin or creator only)
     */
    deleteMedia(mediaId, userId, userRole) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(mediaId)) {
                throw new Error("Invalid media ID");
            }
            const media = yield media_model_1.Media.findById(mediaId);
            if (!media) {
                throw new Error("Media not found");
            }
            if (media.uploadedBy.toString() !== userId && userRole !== "admin") {
                throw new Error("Unauthorized to delete this media");
            }
            yield media_model_1.Media.findByIdAndDelete(mediaId);
            return true;
        });
    }
    /**
     * Record a media interaction (view, listen, read, download)
     */
    recordInteraction(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(data.userId) ||
                !mongoose_1.Types.ObjectId.isValid(data.mediaId)) {
                throw new Error("Invalid user or media ID");
            }
            const media = yield media_model_1.Media.findById(data.mediaId);
            if (!media) {
                throw new Error("Media not found");
            }
            if ((media.type === "video" && data.interactionType !== "view") ||
                (media.type === "audio" && data.interactionType !== "listen") ||
                (media.type === "ebook" &&
                    !["read", "download"].includes(data.interactionType))) {
                throw new Error(`Invalid interaction type for ${media.type} media`);
            }
            const session = yield media_model_1.Media.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    const existingInteraction = yield mediaInteraction_model_1.MediaInteraction.findOne({
                        user: new mongoose_1.Types.ObjectId(data.userId),
                        media: new mongoose_1.Types.ObjectId(data.mediaId),
                        interactionType: data.interactionType,
                    }).session(session);
                    if (existingInteraction) {
                        throw new Error(`User has already ${data.interactionType} this media`);
                    }
                    const interaction = yield mediaInteraction_model_1.MediaInteraction.create([
                        {
                            user: new mongoose_1.Types.ObjectId(data.userId),
                            media: new mongoose_1.Types.ObjectId(data.mediaId),
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
                    yield media_model_1.Media.findByIdAndUpdate(data.mediaId, { $inc: updateField }, { session });
                    return interaction[0];
                }));
                const interaction = yield mediaInteraction_model_1.MediaInteraction.findOne({
                    user: new mongoose_1.Types.ObjectId(data.userId),
                    media: new mongoose_1.Types.ObjectId(data.mediaId),
                    interactionType: data.interactionType,
                });
                return interaction;
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Get interaction counts for a media item
     */
    getInteractionCounts(mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(mediaId)) {
                throw new Error("Invalid media ID");
            }
            const media = yield media_model_1.Media.findById(mediaId).select("type viewCount listenCount readCount downloadCount");
            if (!media) {
                throw new Error("Media not found");
            }
            const result = {};
            if (media.type === "video")
                result.viewCount = media.viewCount;
            if (media.type === "audio")
                result.listenCount = media.listenCount;
            if (media.type === "ebook") {
                result.readCount = media.readCount;
                result.downloadCount = media.downloadCount;
            }
            return result;
        });
    }
    /**
     * Get media count by type (admin)
     */
    getMediaCountByType() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield media_model_1.Media.aggregate([
                {
                    $group: {
                        _id: "$type",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        type: "$_id",
                        count: 1,
                        _id: 0,
                    },
                },
            ]);
            const counts = {
                audio: 0,
                video: 0,
                ebook: 0,
            };
            result.forEach((item) => {
                counts[item.type] = item.count;
            });
            return counts;
        });
    }
    /**
     * Get total interaction counts (admin)
     */
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
    /**
     * Get recent media (admin)
     */
    getRecentMedia(limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield media_model_1.Media.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .select("title type genre createdAt")
                .lean();
        });
    }
    /**
     * Get media count since date (admin)
     */
    getMediaCountByDate(since) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield media_model_1.Media.countDocuments({
                createdAt: { $gte: since },
            });
        });
    }
    /**
     * Get interaction count since date (admin)
     */
    getInteractionCountByDate(since) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield mediaInteraction_model_1.MediaInteraction.countDocuments({
                createdAt: { $gte: since },
            });
        });
    }
    /**
     * Get user media count by type
     */
    getUserMediaCountByType(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID");
            }
            const result = yield media_model_1.Media.aggregate([
                {
                    $match: { uploadedBy: new mongoose_1.Types.ObjectId(userId) },
                },
                {
                    $group: {
                        _id: "$type",
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        type: "$_id",
                        count: 1,
                        _id: 0,
                    },
                },
            ]);
            const counts = {
                audio: 0,
                video: 0,
                ebook: 0,
            };
            result.forEach((item) => {
                counts[item.type] = item.count;
            });
            return counts;
        });
    }
    /**
     * Get user interaction counts
     */
    getUserInteractionCounts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID");
            }
            const result = yield mediaInteraction_model_1.MediaInteraction.aggregate([
                {
                    $match: { user: new mongoose_1.Types.ObjectId(userId) },
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
    /**
     * Get user bookmark count
     */
    getUserBookmarkCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID");
            }
            return yield bookmark_model_1.Bookmark.countDocuments({
                user: new mongoose_1.Types.ObjectId(userId),
            });
        });
    }
    /**
     * Get user recent media
     */
    getUserRecentMedia(userId, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID");
            }
            return yield media_model_1.Media.find({
                uploadedBy: new mongoose_1.Types.ObjectId(userId),
            })
                .sort({ createdAt: -1 })
                .limit(limit)
                .select("title type genre createdAt")
                .lean();
        });
    }
    /**
     * Get user media count since date
     */
    getUserMediaCountByDate(userId, since) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID");
            }
            return yield media_model_1.Media.countDocuments({
                uploadedBy: new mongoose_1.Types.ObjectId(userId),
                createdAt: { $gte: since },
            });
        });
    }
    /**
     * Get user interaction count since date
     */
    getUserInteractionCountByDate(userId, since) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID");
            }
            return yield mediaInteraction_model_1.MediaInteraction.countDocuments({
                user: new mongoose_1.Types.ObjectId(userId),
                createdAt: { $gte: since },
            });
        });
    }
}
exports.MediaService = MediaService;
exports.mediaService = new MediaService();
