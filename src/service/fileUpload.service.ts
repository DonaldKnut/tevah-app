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
      const isPdf = mimetype === "application/pdf";

      console.log("Uploading to Cloudinary:", {
        folderPath,
        mimetype,
        resource_type: isVideoOrAudio ? "video" : isPdf ? "raw" : "auto",
      });

      const publicId = `${folderPath}/${Date.now()}`; // Unique public ID
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderPath,
          resource_type: isVideoOrAudio ? "video" : isPdf ? "raw" : "auto",
          public_id: publicId,
          access_control: [{ access_type: "anonymous" }],
        },
        (error, uploadResult?: UploadApiResponse) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(
              new Error(
                `${
                  isVideoOrAudio ? "Video/Audio" : "File"
                } upload failed: ${error.message}`
              )
            );
          }
          if (!uploadResult) {
            console.error("Cloudinary upload failed: No response received");
            return reject(
              new Error("Upload failed: No response from Cloudinary")
            );
          }

          // Generate signed URL
          const signedUrl = cloudinary.url(uploadResult.public_id, {
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
        }
      );

      const stream = new Readable();
      stream.push(fileBuffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }
}
export default new FileUploadService();
