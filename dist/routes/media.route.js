"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const media_controller_1 = require("../controllers/media.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
// Configure Multer for in-memory file uploads
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
/**
 * @route   POST /api/media/upload
 * @desc    Upload new media (music, video, or book)
 * @access  Protected (Authenticated users only)
 */
router.post("/upload", auth_middleware_1.verifyToken, upload.single("file"), media_controller_1.uploadMedia);
/**
 * @route   GET /api/media
 * @desc    Get all media with optional filters
 * @access  Protected (Authenticated users only)
 */
router.get("/", auth_middleware_1.verifyToken, media_controller_1.getAllMedia);
/**
 * @route   GET /api/media/search
 * @desc    Search media by title, type, category, topics, etc.
 * @access  Protected
 */
router.get("/search", auth_middleware_1.verifyToken, media_controller_1.searchMedia);
/**
 * @route   GET /api/media/analytics
 * @desc    Get analytics dashboard data (admin vs. creator views)
 * @access  Protected
 */
router.get("/analytics", auth_middleware_1.verifyToken, media_controller_1.getAnalyticsDashboard);
/**
 * @route   GET /api/media/:id
 * @desc    Get a single media item by its identifier
 * @access  Protected
 */
router.get("/:id", auth_middleware_1.verifyToken, media_controller_1.getMediaByIdentifier);
/**
 * @route   DELETE /api/media/:id
 * @desc    Delete a media item (admin or creator only)
 * @access  Protected & Role Restricted
 */
router.delete("/:id", auth_middleware_1.verifyToken, role_middleware_1.requireAdminOrCreator, media_controller_1.deleteMedia);
/**
 * @route   POST /api/media/:id/bookmark
 * @desc    Bookmark a media item
 * @access  Protected
 */
router.post("/:id/bookmark", auth_middleware_1.verifyToken, media_controller_1.bookmarkMedia);
/**
 * @route   POST /api/media/:id/interact
 * @desc    Record interaction (view, listen, read, download)
 * @access  Protected
 */
router.post("/:id/interact", auth_middleware_1.verifyToken, media_controller_1.recordMediaInteraction);
/**
 * @route   POST /api/media/live/start
 * @desc    Start a new Mux live stream
 * @access  Protected
 */
router.post("/live/start", auth_middleware_1.verifyToken, media_controller_1.startMuxLiveStream);
/**
 * @route   POST /api/media/live/:id/end
 * @desc    End a live stream by its ID
 * @access  Protected
 */
router.post("/live/:id/end", auth_middleware_1.verifyToken, media_controller_1.endMuxLiveStream);
/**
 * @route   GET /api/media/live
 * @desc    Get all active/live streams
 * @access  Protected
 */
router.get("/live", auth_middleware_1.verifyToken, media_controller_1.getLiveStreams);
exports.default = router;
