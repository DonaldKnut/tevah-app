import { Router } from "express";
import multer from "multer";
import {
  uploadMedia,
  getAllMedia,
  getMediaByIdentifier,
  deleteMedia,
  bookmarkMedia,
  recordMediaInteraction,
  searchMedia,
  getAnalyticsDashboard,
  startMuxLiveStream,
  endMuxLiveStream,
  getLiveStreams,
} from "../controllers/media.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { requireAdminOrCreator } from "../middleware/role.middleware";

// Configure Multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

/**
 * @route   POST /api/media/upload
 * @desc    Upload new media (music, video, or book)
 * @access  Protected (Authenticated users only)
 */
router.post("/upload", verifyToken, upload.single("file"), uploadMedia);

/**
 * @route   GET /api/media
 * @desc    Get all media with optional filters
 * @access  Protected (Authenticated users only)
 */
router.get("/", verifyToken, getAllMedia);

/**
 * @route   GET /api/media/search
 * @desc    Search media by title, type, category, topics, etc.
 * @access  Protected
 */
router.get("/search", verifyToken, searchMedia);

/**
 * @route   GET /api/media/analytics
 * @desc    Get analytics dashboard data (admin vs. creator views)
 * @access  Protected
 */
router.get("/analytics", verifyToken, getAnalyticsDashboard);

/**
 * @route   GET /api/media/:id
 * @desc    Get a single media item by its identifier
 * @access  Protected
 */
router.get("/:id", verifyToken, getMediaByIdentifier);

/**
 * @route   DELETE /api/media/:id
 * @desc    Delete a media item (admin or creator only)
 * @access  Protected & Role Restricted
 */
router.delete("/:id", verifyToken, requireAdminOrCreator, deleteMedia);

/**
 * @route   POST /api/media/:id/bookmark
 * @desc    Bookmark a media item
 * @access  Protected
 */
router.post("/:id/bookmark", verifyToken, bookmarkMedia);

/**
 * @route   POST /api/media/:id/interact
 * @desc    Record interaction (view, listen, read, download)
 * @access  Protected
 */
router.post("/:id/interact", verifyToken, recordMediaInteraction);

/**
 * @route   POST /api/media/live/start
 * @desc    Start a new Mux live stream
 * @access  Protected
 */
router.post("/live/start", verifyToken, startMuxLiveStream);

/**
 * @route   POST /api/media/live/:id/end
 * @desc    End a live stream by its ID
 * @access  Protected
 */
router.post("/live/:id/end", verifyToken, endMuxLiveStream);

/**
 * @route   GET /api/media/live
 * @desc    Get all active/live streams
 * @access  Protected
 */
router.get("/live", verifyToken, getLiveStreams);

export default router;
