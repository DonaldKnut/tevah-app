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
exports.getLiveStreams = exports.endMuxLiveStream = exports.startMuxLiveStream = exports.recordMediaInteraction = exports.bookmarkMedia = exports.deleteMedia = exports.getMediaByIdentifier = exports.searchMedia = exports.getAllMedia = exports.uploadMedia = exports.getAnalyticsDashboard = void 0;
const fileUpload_service_1 = __importDefault(require("../service/fileUpload.service"));
const media_service_1 = require("../service/media.service");
const bookmark_model_1 = require("../models/bookmark.model");
const mongoose_1 = require("mongoose");
const mux_node_1 = __importDefault(require("@mux/mux-node"));
const media_model_1 = require("../models/media.model");
const multer_1 = __importDefault(require("multer"));
const mux = new mux_node_1.default({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
});
const getAnalyticsDashboard = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userIdentifier = request.userId;
        const userRole = request.userRole;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        let analyticsData;
        if (userRole === "admin") {
            const mediaCountByContentType = yield media_service_1.mediaService.getMediaCountByContentType();
            const totalInteractionCounts = yield media_service_1.mediaService.getTotalInteractionCounts();
            const totalBookmarks = yield bookmark_model_1.Bookmark.countDocuments();
            const recentMedia = yield media_service_1.mediaService.getRecentMedia(10);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const uploadsLastThirtyDays = yield media_service_1.mediaService.getMediaCountSinceDate(thirtyDaysAgo);
            const interactionsLastThirtyDays = yield media_service_1.mediaService.getInteractionCountSinceDate(thirtyDaysAgo);
            analyticsData = {
                isAdmin: true,
                mediaCountByContentType,
                totalInteractionCounts,
                totalBookmarks,
                recentMedia,
                uploadsLastThirtyDays,
                interactionsLastThirtyDays,
            };
        }
        else {
            const userMediaCountByContentType = yield media_service_1.mediaService.getUserMediaCountByContentType(userIdentifier);
            const userInteractionCounts = yield media_service_1.mediaService.getUserInteractionCounts(userIdentifier);
            const userBookmarks = yield media_service_1.mediaService.getUserBookmarkCount(userIdentifier);
            const userRecentMedia = yield media_service_1.mediaService.getUserRecentMedia(userIdentifier, 5);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const userUploadsLastThirtyDays = yield media_service_1.mediaService.getUserMediaCountSinceDate(userIdentifier, thirtyDaysAgo);
            const userInteractionsLastThirtyDays = yield media_service_1.mediaService.getUserInteractionCountSinceDate(userIdentifier, thirtyDaysAgo);
            analyticsData = {
                isAdmin: false,
                userMediaCountByContentType,
                userInteractionCounts,
                userBookmarks,
                userRecentMedia,
                userUploadsLastThirtyDays,
                userInteractionsLastThirtyDays,
            };
        }
        response.status(200).json({
            success: true,
            message: "Analytics data retrieved successfully",
            data: analyticsData,
        });
    }
    catch (error) {
        console.error("Analytics error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to fetch analytics",
        });
    }
});
exports.getAnalyticsDashboard = getAnalyticsDashboard;
const uploadMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, contentType, category, topics, duration } = request.body;
        const file = request.file;
        console.log("Request File:", {
            fileExists: !!file,
            bufferExists: !!(file === null || file === void 0 ? void 0 : file.buffer),
            mimetype: file === null || file === void 0 ? void 0 : file.mimetype,
            originalname: file === null || file === void 0 ? void 0 : file.originalname,
            size: file === null || file === void 0 ? void 0 : file.size,
        }); // Debug log
        if (!["music", "videos", "books"].includes(contentType)) {
            response.status(400).json({
                success: false,
                message: "Invalid content type. Must be music, videos, or books",
            });
            return;
        }
        if (!file || !file.buffer) {
            response.status(400).json({
                success: false,
                message: "No file uploaded",
            });
            return;
        }
        if (!request.userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const allowedMimeTypes = {
            music: ["audio/mpeg", "audio/mp3", "audio/wav"],
            videos: ["video/mp4", "video/mpeg"],
            books: ["application/pdf"],
        };
        if (!allowedMimeTypes[contentType].includes(file.mimetype)) {
            response.status(400).json({
                success: false,
                message: `Invalid file type for ${contentType}: ${file.mimetype}`,
            });
            return;
        }
        const media = yield media_service_1.mediaService.uploadMedia({
            title,
            description,
            contentType,
            category,
            file: file.buffer, // Pass the file buffer
            fileMimeType: file.mimetype, // Pass the MIME type
            uploadedBy: new mongoose_1.Types.ObjectId(request.userId),
            topics: topics ? JSON.parse(topics) : [],
            duration,
        });
        response.status(201).json({
            success: true,
            message: "Media uploaded successfully",
            media,
        });
    }
    catch (error) {
        console.error("Upload media error:", error);
        if (error instanceof multer_1.default.MulterError &&
            error.code === "LIMIT_UNEXPECTED_FILE") {
            response.status(400).json({
                success: false,
                message: `Unexpected field in file upload. Expected field name: 'file'`,
            });
            return;
        }
        response.status(500).json({
            success: false,
            message: `Failed to upload media: ${error.message}`,
        });
    }
});
exports.uploadMedia = uploadMedia;
const getAllMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = request.query;
        const mediaList = yield media_service_1.mediaService.getAllMedia(filters);
        response.status(200).json({
            success: true,
            media: mediaList.media,
            pagination: mediaList.pagination,
        });
    }
    catch (error) {
        console.error("Fetch media error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to retrieve media",
        });
    }
});
exports.getAllMedia = getAllMedia;
const searchMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, contentType, category, topics, sort, page, limit, creator, duration, startDate, endDate, } = request.query;
        if (page && isNaN(parseInt(page))) {
            response.status(400).json({
                success: false,
                message: "Invalid page number",
            });
            return;
        }
        if (limit && isNaN(parseInt(limit))) {
            response.status(400).json({
                success: false,
                message: "Invalid limit",
            });
            return;
        }
        const filters = {};
        if (search)
            filters.search = search;
        if (contentType)
            filters.contentType = contentType;
        if (category)
            filters.category = category;
        if (topics)
            filters.topics = topics;
        if (sort)
            filters.sort = sort;
        if (page)
            filters.page = page;
        if (limit)
            filters.limit = limit;
        if (creator)
            filters.creator = creator;
        if (duration)
            filters.duration = duration;
        if (startDate)
            filters.startDate = startDate;
        if (endDate)
            filters.endDate = endDate;
        const result = yield media_service_1.mediaService.getAllMedia(filters);
        response.status(200).json({
            success: true,
            message: "Media search completed",
            media: result.media,
            pagination: result.pagination,
        });
    }
    catch (error) {
        console.error("Search media error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to search media",
        });
    }
});
exports.searchMedia = searchMedia;
const getMediaByIdentifier = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const media = yield media_service_1.mediaService.getMediaByIdentifier(id);
        const interactionCounts = yield media_service_1.mediaService.getInteractionCounts(id);
        response.status(200).json({
            success: true,
            media: Object.assign(Object.assign({}, media.toObject()), interactionCounts),
        });
    }
    catch (error) {
        console.error("Get media by identifier error:", error);
        response.status(error.message === "Media not found" ? 404 : 400).json({
            success: false,
            message: error.message || "Failed to fetch media item",
        });
    }
});
exports.getMediaByIdentifier = getMediaByIdentifier;
const deleteMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.params;
        const userIdentifier = request.userId;
        const userRole = request.userRole;
        if (!userIdentifier || !userRole) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const media = yield media_service_1.mediaService.getMediaByIdentifier(id);
        if (media.fileUrl && media.contentType !== "live") {
            const publicId = (_a = media.fileUrl.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                const resourceType = media.contentType === "videos" || media.contentType === "music"
                    ? "video"
                    : "image";
                yield fileUpload_service_1.default.deleteMedia(publicId, resourceType);
            }
        }
        yield media_service_1.mediaService.deleteMedia(id, userIdentifier, userRole);
        response.status(200).json({
            success: true,
            message: "Media deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete media error:", error);
        response.status(error.message === "Media not found" ? 404 : 400).json({
            success: false,
            message: error.message || "Failed to delete media",
        });
    }
});
exports.deleteMedia = deleteMedia;
const bookmarkMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const mediaExists = yield media_service_1.mediaService.getMediaByIdentifier(id);
        if (!mediaExists) {
            response.status(404).json({
                success: false,
                message: "Media not found",
            });
            return;
        }
        const existingBookmark = yield bookmark_model_1.Bookmark.findOne({
            user: new mongoose_1.Types.ObjectId(userIdentifier),
            media: new mongoose_1.Types.ObjectId(id),
        });
        if (existingBookmark) {
            response.status(400).json({
                success: false,
                message: "Media already bookmarked",
            });
            return;
        }
        const bookmark = yield bookmark_model_1.Bookmark.create({
            user: new mongoose_1.Types.ObjectId(userIdentifier),
            media: new mongoose_1.Types.ObjectId(id),
        });
        response.status(200).json({
            success: true,
            message: `Bookmarked media ${id}`,
            bookmark,
        });
    }
    catch (error) {
        console.error("Bookmark media error:", error);
        if (error.code === 11000) {
            response.status(400).json({
                success: false,
                message: "Media already bookmarked",
            });
            return;
        }
        response.status(500).json({
            success: false,
            message: "Failed to bookmark media",
        });
    }
});
exports.bookmarkMedia = bookmarkMedia;
const recordMediaInteraction = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const { interactionType } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        if (!["view", "listen", "read", "download"].includes(interactionType)) {
            response.status(400).json({
                success: false,
                message: "Invalid interaction type",
            });
            return;
        }
        const interaction = yield media_service_1.mediaService.recordInteraction({
            userIdentifier,
            mediaIdentifier: id,
            interactionType,
        });
        response.status(201).json({
            success: true,
            message: `Recorded ${interactionType} for media ${id}`,
            interaction,
        });
    }
    catch (error) {
        console.error("Record media interaction error:", error);
        if (error.message.includes("Invalid") ||
            error.message.includes("already") ||
            error.message.includes("Media not found")) {
            response.status(error.message === "Media not found" ? 404 : 400).json({
                success: false,
                message: error.message,
            });
            return;
        }
        response.status(500).json({
            success: false,
            message: "Failed to record interaction",
        });
    }
});
exports.recordMediaInteraction = recordMediaInteraction;
const startMuxLiveStream = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { title, description, category, topics } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const stream = yield mux.video.liveStreams.create({
            playback_policies: ["public"],
            new_asset_settings: { playback_policies: ["public"] },
        });
        const rtmpUrl = `rtmp://live.mux.com/app/${stream.stream_key}`;
        const newStream = yield media_service_1.mediaService.uploadMedia({
            title,
            description,
            contentType: "live",
            category,
            topics: topics ? JSON.parse(topics) : [],
            isLive: true,
            liveStreamStatus: "live",
            streamKey: stream.stream_key,
            rtmpUrl,
            playbackUrl: `https://stream.mux.com/${(_b = (_a = stream.playback_ids) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id}.m3u8`,
            uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier),
        });
        response.status(201).json({
            success: true,
            message: "Live stream started successfully",
            stream: {
                streamKey: stream.stream_key,
                rtmpUrl,
                playbackUrl: `https://stream.mux.com/${(_d = (_c = stream.playback_ids) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.id}.m3u8`,
            },
        });
    }
    catch (error) {
        console.error("Mux live stream creation error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to start live stream",
        });
    }
});
exports.startMuxLiveStream = startMuxLiveStream;
const endMuxLiveStream = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const stream = yield media_model_1.Media.findById(id);
        if (!stream || !stream.isLive) {
            response.status(404).json({
                success: false,
                message: "Live stream not found",
            });
            return;
        }
        if (stream.uploadedBy.toString() !== userIdentifier &&
            request.userRole !== "admin") {
            response.status(403).json({
                success: false,
                message: "Unauthorized to end this live stream",
            });
            return;
        }
        yield mux.video.liveStreams.delete(stream.streamKey);
        stream.liveStreamStatus = "ended";
        stream.actualEnd = new Date();
        yield stream.save();
        response.status(200).json({
            success: true,
            message: "Live stream ended successfully",
        });
    }
    catch (error) {
        console.error("End live stream error:", error);
        response
            .status(error.message === "Live stream not found" ? 404 : 500)
            .json({
            success: false,
            message: error.message || "Failed to end live stream",
        });
    }
});
exports.endMuxLiveStream = endMuxLiveStream;
const getLiveStreams = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const streams = yield media_model_1.Media.find({
            isLive: true,
            liveStreamStatus: "live",
        })
            .sort({ createdAt: -1 })
            .populate("uploadedBy", "username");
        response.status(200).json({
            success: true,
            streams,
        });
    }
    catch (error) {
        console.error("Get live streams error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to retrieve live streams",
        });
    }
});
exports.getLiveStreams = getLiveStreams;
