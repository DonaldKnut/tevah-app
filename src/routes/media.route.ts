import { Router, Request, Response } from "express";
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
  getMediaStats,
  recordUserAction,
  addToViewedMedia,
  getViewedMedia,
} from "../controllers/media.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { requireAdminOrCreator } from "../middleware/role.middleware";

// Define interface for the request body of /favorite and /share routes
interface UserActionRequestBody {
  actionType: "favorite" | "share";
}

// Configure Multer for in-memory file uploads
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

/**
 * @route   POST /api/media/upload
 * @desc    Upload a new media item (music, video, or book)
 * @access  Protected (Authenticated users only)
 * @body    { title: string, contentType: "music" | "videos" | "books", description?: string, category?: string, topics?: string[], duration?: number, file: File }
 * @returns { success: boolean, message: string, media: object }
 */
router.post("/upload", verifyToken, upload.single("file"), uploadMedia);

/**
 * @route   GET /api/media
 * @desc    Retrieve all media items with optional filters (e.g., contentType, category)
 * @access  Protected (Authenticated users only)
 * @query   { search?: string, contentType?: string, category?: string, topics?: string, sort?: string, page?: string, limit?: string, creator?: string, duration?: "short" | "medium" | "long", startDate?: string, endDate?: string }
 * @returns { success: boolean, media: object[], pagination: { page: number, limit: number, total: number, pages: number } }
 */
router.get("/", verifyToken, getAllMedia);

/**
 * @route   GET /api/media/search
 * @desc    Search media items by title, type, category, topics, etc.
 * @access  Protected (Authenticated users only)
 * @query   { search?: string, contentType?: string, category?: string, topics?: string, sort?: string, page?: string, limit?: string, creator?: string, duration?: "short" | "medium" | "long", startDate?: string, endDate?: string }
 * @returns { success: boolean, message: string, media: object[], pagination: { page: number, limit: number, total: number, pages: number } }
 */
router.get("/search", verifyToken, searchMedia);

/**
 * @route   GET /api/media/analytics
 * @desc    Retrieve analytics dashboard data (admin or creator-specific views)
 * @access  Protected (Authenticated users only)
 * @returns { success: boolean, message: string, data: { isAdmin: boolean, mediaCountByContentType: object, totalInteractionCounts: object, totalBookmarks: number, recentMedia: object[], uploadsLastThirtyDays: number, interactionsLastThirtyDays: number } }
 */
router.get("/analytics", verifyToken, getAnalyticsDashboard);

/**
 * @route   GET /api/media/:id
 * @desc    Retrieve a single media item by its identifier
 * @access  Protected (Authenticated users only)
 * @param   { id: string } - MongoDB ObjectId of the media item
 * @returns { success: boolean, media: object }
 */
router.get("/:id", verifyToken, getMediaByIdentifier);

/**
 * @route   GET /api/media/:id/stats
 * @desc    Retrieve interaction statistics for a media item (views, listens, reads, downloads, favorites, shares)
 * @access  Protected (Authenticated users only)
 * @param   { id: string } - MongoDB ObjectId of the media item
 * @returns { success: boolean, message: string, stats: { viewCount?: number, listenCount?: number, readCount?: number, downloadCount?: number, favoriteCount?: number, shareCount?: number } }
 */
router.get("/:id/stats", verifyToken, getMediaStats);

/**
 * @route   DELETE /api/media/:id
 * @desc    Delete a media item (restricted to admins or the creator)
 * @access  Protected & Role Restricted (Admin or Content Creator)
 * @param   { id: string } - MongoDB ObjectId of the media item
 * @returns { success: boolean, message: string }
 */
router.delete("/:id", verifyToken, requireAdminOrCreator, deleteMedia);

/**
 * @route   POST /api/media/:id/bookmark
 * @desc    Bookmark (save) a media item for the authenticated user
 * @access  Protected (Authenticated users only)
 * @param   { id: string } - MongoDB ObjectId of the media item
 * @returns { success: boolean, message: string, bookmark: object }
 */
router.post("/:id/bookmark", verifyToken, bookmarkMedia);

/**
 * @route   POST /api/media/:id/save
 * @desc    Save a media item (maps to bookmark functionality)
 * @access  Protected (Authenticated users only)
 * @param   { id: string } - MongoDB ObjectId of the media item
 * @returns { success: boolean, message: string, bookmark: object }
 */
router.post("/:id/save", verifyToken, bookmarkMedia);

/**
 * @route   POST /api/media/:id/interact
 * @desc    Record an interaction with a media item (view, listen, read, download)
 * @access  Protected (Authenticated users only)
 * @param   { id: string } - MongoDB ObjectId of the media item
 * @body    { interactionType: "view" | "listen" | "read" | "download" }
 * @returns { success: boolean, message: string, interaction: object }
 */
router.post("/:id/interact", verifyToken, recordMediaInteraction);

/**
 * @route   POST /api/media/:id/favorite
 * @desc    Record a favorite action for a media item
 * @access  Protected (Authenticated users only)
 * @param   { id: string } - MongoDB ObjectId of the media item
 * @body    { actionType: "favorite" }
 * @returns { success: boolean, message: string, action: object }
 */
router.post(
  "/:id/favorite",
  verifyToken,
  (req: Request<{ id: string }, any, UserActionRequestBody>, res: Response) => {
    req.body.actionType = "favorite";
    return recordUserAction(req, res);
  }
);

/**
 * @route   POST /api/media/:id/share
 * @desc    Record a share action for a media item
 * @access  Protected (Authenticated users only)
 * @param   { id: string } - MongoDB ObjectId of the media item
 * @body    { actionType: "share" }
 * @returns { success: boolean, message: string, action: object }
 */
router.post(
  "/:id/share",
  verifyToken,
  (req: Request<{ id: string }, any, UserActionRequestBody>, res: Response) => {
    req.body.actionType = "share";
    return recordUserAction(req, res);
  }
);

/**
 * @route   POST /api/viewed
 * @desc    Add a media item to the authenticated user's previously viewed list (capped at 50 items)
 * @access  Protected (Authenticated users only)
 * @body    { mediaId: string } - MongoDB ObjectId of the media item
 * @returns { success: boolean, message: string, viewedMedia: object[] }
 */
router.post("/viewed", verifyToken, addToViewedMedia);

/**
 * @route   GET /api/viewed
 * @desc    Retrieve the authenticated user's last 50 viewed media items
 * @access  Protected (Authenticated users only)
 * @returns { success: boolean, message: string, viewedMedia: object[] }
 */
router.get("/viewed", verifyToken, getViewedMedia);

/**
 * @route   POST /api/media/live/start
 * @desc    Start a new Mux live stream
 * @access  Protected (Authenticated users only)
 * @body    { title: string, description?: string, category?: string, topics?: string[] }
 * @returns { success: boolean, message: string, stream: { streamKey: string, rtmpUrl: string, playbackUrl: string } }
 */
router.post("/live/start", verifyToken, startMuxLiveStream);

/**
 * @route   POST /api/media/live/:id/end
 * @desc    End a live stream by its ID
 * @access  Protected (Authenticated users only)
 * @param   { id: string } - MongoDB ObjectId of the live stream
 * @returns { success: boolean, message: string }
 */
router.post("/live/:id/end", verifyToken, endMuxLiveStream);

/**
 * @route   GET /api/media/live
 * @desc    Retrieve all active live streams
 * @access  Protected (Authenticated users only)
 * @returns { success: boolean, streams: object[] }
 */
router.get("/live", verifyToken, getLiveStreams);

export default router;
