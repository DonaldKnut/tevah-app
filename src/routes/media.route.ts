import { Router } from "express";
import {
  uploadMedia,
  getAllMedia,
  getMediaByIdentifier,
  deleteMedia,
  bookmarkMedia,
  recordMediaInteraction,
  searchMedia,
  getAnalyticsDashboard,
} from "../controllers/media.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { requireAdminOrCreator } from "../middleware/role.middleware";
import multer from "multer";

// Configure Multer with in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
// Upload new media
router.post("/upload", verifyToken, upload.single("file"), uploadMedia);

// Get all media with optional filters
router.get("/", verifyToken, getAllMedia);

// Search media by title, type, genre, or tags
router.get("/search", verifyToken, searchMedia);

router.get("/analytics", verifyToken, getAnalyticsDashboard);

// Get a single media item by ID
router.get("/:id", verifyToken, getMediaByIdentifier);

// Delete a media item (admin or creator only)
router.delete("/:id", verifyToken, requireAdminOrCreator, deleteMedia);

// Bookmark a media item
router.post("/:id/bookmark", verifyToken, bookmarkMedia);

// Record a media interaction (view, listen, read, download)
router.post("/:id/interact", verifyToken, recordMediaInteraction);

export default router;
