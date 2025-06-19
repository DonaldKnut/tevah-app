"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const media_controller_1 = require("../controllers/media.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const multer_1 = __importDefault(require("multer"));
// Configure Multer with in-memory storage
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
router.post("/upload", auth_middleware_1.verifyToken, upload.single("file"), media_controller_1.uploadMedia);
router.get("/", auth_middleware_1.verifyToken, media_controller_1.getAllMedia);
router.get("/:id", auth_middleware_1.verifyToken, media_controller_1.getMediaById);
router.delete("/:id", auth_middleware_1.verifyToken, role_middleware_1.requireAdminOrCreator, media_controller_1.deleteMedia);
router.post("/:id/bookmark", auth_middleware_1.verifyToken, media_controller_1.bookmarkMedia);
router.post("/:id/interact", auth_middleware_1.verifyToken, media_controller_1.recordMediaInteraction);
exports.default = router;
