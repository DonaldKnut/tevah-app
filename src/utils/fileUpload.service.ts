import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class FileUploadService {
  async uploadImage(imageBuffer: Buffer, folderPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folderPath },
        (error, uploadResult?: UploadApiResponse) => {
          if (error) {
            return reject(new Error(`Image upload failed: ${error.message}`));
          }
          if (!uploadResult) {
            return reject(
              new Error("Image upload failed: No response from Cloudinary")
            );
          }
          resolve(uploadResult.secure_url);
        }
      );

      const bufferReadableStream = new Readable();
      bufferReadableStream.push(imageBuffer);
      bufferReadableStream.push(null); // Signals end of stream
      bufferReadableStream.pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      const deletionResult = await cloudinary.uploader.destroy(publicId);
      if (deletionResult.result !== "ok") {
        throw new Error(`Image deletion failed: ${deletionResult.result}`);
      }
    } catch (error) {
      console.error("Image deletion error:", error);
      throw new Error("Failed to delete image from Cloudinary");
    }
  }
}

export default new FileUploadService();
