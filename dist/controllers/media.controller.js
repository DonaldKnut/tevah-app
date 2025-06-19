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
exports.recordMediaInteraction = exports.bookmarkMedia = exports.deleteMedia = exports.getMediaById = exports.searchMedia = exports.getAllMedia = exports.uploadMedia = exports.getAnalyticsDashboard = void 0;
const fileUpload_service_1 = __importDefault(require("../utils/fileUpload.service"));
const media_service_1 = require("../service/media.service");
const bookmark_model_1 = require("../models/bookmark.model");
const mongoose_1 = require("mongoose");
/**
 * Analytics dashboard for users and admins
 */
const getAnalyticsDashboard = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const userRole = request.userRole;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        let analyticsData;
        if (userRole === "admin") {
            // Admin analytics: Aggregated data
            const mediaByType = yield media_service_1.mediaService.getMediaCountByType();
            const interactionCounts = yield media_service_1.mediaService.getTotalInteractionCounts();
            const totalBookmarks = yield bookmark_model_1.Bookmark.countDocuments();
            const recentMedia = yield media_service_1.mediaService.getRecentMedia(10);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const uploadsLast30Days = yield media_service_1.mediaService.getMediaCountByDate(thirtyDaysAgo);
            const interactionsLast30Days = yield media_service_1.mediaService.getInteractionCountByDate(thirtyDaysAgo);
            analyticsData = {
                isAdmin: true,
                mediaByType,
                interactionCounts,
                totalBookmarks,
                recentMedia,
                uploadsLast30Days,
                interactionsLast30Days,
            };
        }
        else {
            // User analytics: Personal data
            const userMediaByType = yield media_service_1.mediaService.getUserMediaCountByType(userId);
            const userInteractionCounts = yield media_service_1.mediaService.getUserInteractionCounts(userId);
            const userBookmarks = yield media_service_1.mediaService.getUserBookmarkCount(userId);
            const userRecentMedia = yield media_service_1.mediaService.getUserRecentMedia(userId, 5);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const userUploadsLast30Days = yield media_service_1.mediaService.getUserMediaCountByDate(userId, thirtyDaysAgo);
            const userInteractionsLast30Days = yield media_service_1.mediaService.getUserInteractionCountByDate(userId, thirtyDaysAgo);
            analyticsData = {
                isAdmin: false,
                userMediaByType,
                userInteractionCounts,
                userBookmarks,
                userRecentMedia,
                userUploadsLast30Days,
                userInteractionsLast30Days,
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
/**
 * Upload new media
 */
const uploadMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, type, genre, tags } = request.body;
        const file = request.file;
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
        const cloudUrl = yield fileUpload_service_1.default.uploadImage(file.buffer, `media/${type}`);
        const media = yield media_service_1.mediaService.uploadMedia({
            title,
            description,
            type,
            genre,
            fileUrl: cloudUrl,
            fileMimeType: file.mimetype,
            uploadedBy: new mongoose_1.Types.ObjectId(request.userId),
            tags: tags ? JSON.parse(tags) : [],
        });
        response.status(201).json({
            success: true,
            message: "Media uploaded successfully",
            media,
        });
    }
    catch (error) {
        console.error("Upload media error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to upload media",
        });
    }
});
exports.uploadMedia = uploadMedia;
/**
 * Get all media with optional filters
 */
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
/**
 * Search media items by title, type, genre, or tags
 */
const searchMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, type, genre, tags, sort, page, limit } = request.query;
        // Validate query parameters
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
        // Build filters object
        const filters = {};
        if (search)
            filters.search = search;
        if (type)
            filters.type = type;
        if (genre)
            filters.genre = genre;
        if (tags)
            filters.tags = tags;
        if (sort)
            filters.sort = sort;
        if (page)
            filters.page = page;
        if (limit)
            filters.limit = limit;
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
/**
 * Get a single media item by ID with interaction counts
 */
const getMediaById = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        const media = yield media_service_1.mediaService.getMediaById(id);
        const interactionCounts = yield media_service_1.mediaService.getInteractionCounts(id);
        response.status(200).json({
            success: true,
            media: Object.assign(Object.assign({}, media.toObject()), interactionCounts),
        });
    }
    catch (error) {
        console.error("Get media by ID error:", error);
        response.status(error.message === "Media not found" ? 404 : 400).json({
            success: false,
            message: error.message || "Failed to fetch media item",
        });
    }
});
exports.getMediaById = getMediaById;
/**
 * Delete a media item
 */
const deleteMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const userId = request.userId;
        const userRole = request.userRole;
        if (!userId || !userRole) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        yield media_service_1.mediaService.deleteMedia(id, userId, userRole);
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
/**
 * Bookmark media
 */
const bookmarkMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        const mediaExists = yield media_service_1.mediaService.getMediaById(id);
        if (!mediaExists) {
            response.status(404).json({
                success: false,
                message: "Media not found",
            });
            return;
        }
        const existingBookmark = yield bookmark_model_1.Bookmark.findOne({
            user: new mongoose_1.Types.ObjectId(userId),
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
            user: new mongoose_1.Types.ObjectId(userId),
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
/**
 * Record a media interaction
 */
const recordMediaInteraction = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const { interactionType } = request.body;
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media ID",
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
            userId,
            mediaId: id,
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
