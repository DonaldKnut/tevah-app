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
// Configure Cloudinary
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
class FileUploadService {
    uploadImage(imageBuffer, folderPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: folderPath }, (error, uploadResult) => {
                    if (error) {
                        return reject(new Error(`Image upload failed: ${error.message}`));
                    }
                    if (!uploadResult) {
                        return reject(new Error("Image upload failed: No response from Cloudinary"));
                    }
                    resolve(uploadResult.secure_url);
                });
                const bufferReadableStream = new stream_1.Readable();
                bufferReadableStream.push(imageBuffer);
                bufferReadableStream.push(null); // Signals end of stream
                bufferReadableStream.pipe(uploadStream);
            });
        });
    }
    deleteImage(publicId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deletionResult = yield cloudinary_1.v2.uploader.destroy(publicId);
                if (deletionResult.result !== "ok") {
                    throw new Error(`Image deletion failed: ${deletionResult.result}`);
                }
            }
            catch (error) {
                console.error("Image deletion error:", error);
                throw new Error("Failed to delete image from Cloudinary");
            }
        });
    }
}
exports.default = new FileUploadService();
