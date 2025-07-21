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
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
class FileUploadService {
    uploadMedia(fileBuffer, folderPath, mimetype) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const isVideoOrAudio = mimetype.startsWith("video") || mimetype.startsWith("audio");
                const isPdf = mimetype === "application/pdf";
                console.log("Uploading to Cloudinary:", {
                    folderPath,
                    mimetype,
                    resource_type: isVideoOrAudio ? "video" : isPdf ? "raw" : "auto",
                });
                const publicId = `${folderPath}/${Date.now()}`; // Unique public ID
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    folder: folderPath,
                    resource_type: isVideoOrAudio ? "video" : isPdf ? "raw" : "auto",
                    public_id: publicId,
                    access_control: [{ access_type: "anonymous" }],
                }, (error, uploadResult) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        return reject(new Error(`${isVideoOrAudio ? "Video/Audio" : "File"} upload failed: ${error.message}`));
                    }
                    if (!uploadResult) {
                        console.error("Cloudinary upload failed: No response received");
                        return reject(new Error("Upload failed: No response from Cloudinary"));
                    }
                    // Generate signed URL
                    const signedUrl = cloudinary_1.v2.url(uploadResult.public_id, {
                        secure: true,
                        resource_type: isVideoOrAudio ? "video" : isPdf ? "raw" : "image",
                        sign_url: true,
                        version: uploadResult.version,
                    });
                    console.log("Cloudinary upload success:", {
                        secure_url: uploadResult.secure_url,
                        public_id: uploadResult.public_id,
                        signed_url: signedUrl,
                    });
                    uploadResult.secure_url = signedUrl; // Replace with signed URL
                    resolve(uploadResult);
                });
                const stream = new stream_1.Readable();
                stream.push(fileBuffer);
                stream.push(null);
                stream.pipe(uploadStream);
            });
        });
    }
    deleteMedia(publicId_1) {
        return __awaiter(this, arguments, void 0, function* (publicId, resourceType = "raw") {
            try {
                console.log("Deleting from Cloudinary:", { publicId, resourceType });
                const result = yield cloudinary_1.v2.uploader.destroy(publicId, {
                    resource_type: resourceType,
                });
                if (result.result !== "ok") {
                    console.error("Cloudinary deletion failed:", result);
                    throw new Error(`Media deletion failed: ${result.result}`);
                }
                console.log("Cloudinary deletion success:", result);
            }
            catch (error) {
                console.error("Cloudinary deletion error:", error);
                throw new Error("Failed to delete media from Cloudinary");
            }
        });
    }
}
exports.default = new FileUploadService();
