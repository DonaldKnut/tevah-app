import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class FileUploadService {
  async uploadMedia(
    fileBuffer: Buffer,
    folderPath: string,
    mimetype: string
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const isVideoOrAudio =
        mimetype.startsWith("video") || mimetype.startsWith("audio");

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: isVideoOrAudio ? "video" : "auto", // ✅ audio treated as video
        },
        (error, uploadResult?: UploadApiResponse) => {
          if (error) {
            return reject(
              new Error(
                `${
                  isVideoOrAudio ? "Video/Audio" : "File"
                } upload failed: ${error.message}`
              )
            );
          }
          if (!uploadResult) {
            return reject(
              new Error("Upload failed: No response from Cloudinary")
            );
          }
          resolve(uploadResult);
        }
      );

      const stream = new Readable();
      stream.push(fileBuffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  async deleteMedia(
    publicId: string,
    resourceType: "image" | "video" = "video"
  ): Promise<void> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      if (result.result !== "ok") {
        throw new Error(`Media deletion failed: ${result.result}`);
      }
    } catch (error) {
      console.error("Cloudinary deletion error:", error);
      throw new Error("Failed to delete media from Cloudinary");
    }
  }
}

export default new FileUploadService();
