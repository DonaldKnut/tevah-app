import { Request, Response } from "express";
import fileUploadService from "../utils/fileUpload.service";
import { mediaService } from "../service/media.service";
import { Bookmark } from "../models/bookmark.model";
import { Types } from "mongoose";
import Mux from "@mux/mux-node";
import { Media } from "../models/media.model";
import { v2 as cloudinary } from "cloudinary";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

interface UploadMediaRequestBody {
  title: string;
  description?: string;
  contentType: "music" | "videos" | "books";
  category?: string;
  topics?: string;
  duration?: number;
}

interface InteractionRequestBody {
  interactionType: "view" | "listen" | "read" | "download";
}

interface SearchQueryParameters {
  search?: string;
  contentType?: string;
  category?: string;
  topics?: string;
  sort?: string;
  page?: string;
  limit?: string;
  creator?: string;
  duration?: "short" | "medium" | "long";
  startDate?: string;
  endDate?: string;
}

export const getAnalyticsDashboard = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userIdentifier = request.userId;
    const userRole = request.userRole;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    let analyticsData: any;

    if (userRole === "admin") {
      const mediaCountByContentType =
        await mediaService.getMediaCountByContentType();
      const totalInteractionCounts =
        await mediaService.getTotalInteractionCounts();
      const totalBookmarks = await Bookmark.countDocuments();
      const recentMedia = await mediaService.getRecentMedia(10);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const uploadsLastThirtyDays =
        await mediaService.getMediaCountSinceDate(thirtyDaysAgo);
      const interactionsLastThirtyDays =
        await mediaService.getInteractionCountSinceDate(thirtyDaysAgo);

      analyticsData = {
        isAdmin: true,
        mediaCountByContentType,
        totalInteractionCounts,
        totalBookmarks,
        recentMedia,
        uploadsLastThirtyDays,
        interactionsLastThirtyDays,
      };
    } else {
      const userMediaCountByContentType =
        await mediaService.getUserMediaCountByContentType(userIdentifier);
      const userInteractionCounts =
        await mediaService.getUserInteractionCounts(userIdentifier);
      const userBookmarks =
        await mediaService.getUserBookmarkCount(userIdentifier);
      const userRecentMedia = await mediaService.getUserRecentMedia(
        userIdentifier,
        5
      );
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const userUploadsLastThirtyDays =
        await mediaService.getUserMediaCountSinceDate(
          userIdentifier,
          thirtyDaysAgo
        );
      const userInteractionsLastThirtyDays =
        await mediaService.getUserInteractionCountSinceDate(
          userIdentifier,
          thirtyDaysAgo
        );

      analyticsData = {
        isAdmin: false,
        userMediaCountByContentType,
        userInteractionCounts,
        userBookmarks,
        userRecentMedia,
        userUploadsLastThirtyDays,
        userInteractionsLastThirtyDays,
      };
    }

    response.status(200).json({
      success: true,
      message: "Analytics data retrieved successfully",
      data: analyticsData,
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

export const uploadMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { title, description, contentType, category, topics, duration } =
      request.body as UploadMediaRequestBody;
    const file = request.file;

    if (!file || !file.buffer) {
      response.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }

    if (!request.userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const allowedMimeTypes = {
      music: ["audio/mpeg", "audio/mp3", "audio/wav"],
      videos: ["video/mp4", "video/mpeg"],
      books: ["application/pdf"],
    };
    if (!allowedMimeTypes[contentType].includes(file.mimetype)) {
      response.status(400).json({
        success: false,
        message: `Invalid file type for ${contentType}`,
      });
      return;
    }

    const cloudinaryResult = await fileUploadService.uploadMedia(
      file.buffer,
      `media/${contentType}`,
      file.mimetype
    );

    let finalDuration = duration;
    if ((contentType === "videos" || contentType === "music") && !duration) {
      if (cloudinaryResult.public_id) {
        const resource = await cloudinary.api.resource(
          cloudinaryResult.public_id,
          {
            resource_type: contentType === "videos" ? "video" : "audio",
          }
        );
        finalDuration = resource.duration;
      }
    }

    const media = await mediaService.uploadMedia({
      title,
      description,
      contentType,
      category,
      fileUrl: cloudinaryResult.secure_url,
      fileMimeType: file.mimetype,
      uploadedBy: new Types.ObjectId(request.userId),
      topics: topics ? JSON.parse(topics) : [],
      duration: finalDuration,
    });

    response.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      media,
    });
  } catch (error: any) {
    console.error("Upload media error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to upload media",
    });
  }
};

export const getAllMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const filters = request.query;
    const mediaList = await mediaService.getAllMedia(filters);

    response.status(200).json({
      success: true,
      media: mediaList.media,
      pagination: mediaList.pagination,
    });
  } catch (error: any) {
    console.error("Fetch media error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to retrieve media",
    });
  }
};

export const searchMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      search,
      contentType,
      category,
      topics,
      sort,
      page,
      limit,
      creator,
      duration,
      startDate,
      endDate,
    } = request.query as SearchQueryParameters;

    if (page && isNaN(parseInt(page))) {
      response.status(400).json({
        success: false,
        message: "Invalid page number",
      });
      return;
    }
    if (limit && isNaN(parseInt(limit))) {
      response.status(400).json({
        success: false,
        message: "Invalid limit",
      });
      return;
    }

    const filters: any = {};
    if (search) filters.search = search;
    if (contentType) filters.contentType = contentType;
    if (category) filters.category = category;
    if (topics) filters.topics = topics;
    if (sort) filters.sort = sort;
    if (page) filters.page = page;
    if (limit) filters.limit = limit;
    if (creator) filters.creator = creator;
    if (duration) filters.duration = duration;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await mediaService.getAllMedia(filters);

    response.status(200).json({
      success: true,
      message: "Media search completed",
      media: result.media,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("Search media error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to search media",
    });
  }
};

export const getMediaByIdentifier = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const media = await mediaService.getMediaByIdentifier(id);
    const interactionCounts = await mediaService.getInteractionCounts(id);

    response.status(200).json({
      success: true,
      media: {
        ...media.toObject(),
        ...interactionCounts,
      },
    });
  } catch (error: any) {
    console.error("Get media by identifier error:", error);
    response.status(error.message === "Media not found" ? 404 : 400).json({
      success: false,
      message: error.message || "Failed to fetch media item",
    });
  }
};

export const deleteMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userIdentifier = request.userId;
    const userRole = request.userRole;

    if (!userIdentifier || !userRole) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const media = await mediaService.getMediaByIdentifier(id);
    if (media.fileUrl && media.contentType !== "live") {
      const publicId = media.fileUrl.split("/").pop()?.split(".")[0];
      if (publicId) {
        const resourceType =
          media.contentType === "videos" || media.contentType === "music"
            ? "video"
            : "image";
        await fileUploadService.deleteMedia(publicId, resourceType);
      }
    }

    await mediaService.deleteMedia(id, userIdentifier, userRole);

    response.status(200).json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete media error:", error);
    response.status(error.message === "Media not found" ? 404 : 400).json({
      success: false,
      message: error.message || "Failed to delete media",
    });
  }
};

export const bookmarkMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const mediaExists = await mediaService.getMediaByIdentifier(id);
    if (!mediaExists) {
      response.status(404).json({
        success: false,
        message: "Media not found",
      });
      return;
    }

    const existingBookmark = await Bookmark.findOne({
      user: new Types.ObjectId(userIdentifier),
      media: new Types.ObjectId(id),
    });

    if (existingBookmark) {
      response.status(400).json({
        success: false,
        message: "Media already bookmarked",
      });
      return;
    }

    const bookmark = await Bookmark.create({
      user: new Types.ObjectId(userIdentifier),
      media: new Types.ObjectId(id),
    });

    response.status(200).json({
      success: true,
      message: `Bookmarked media ${id}`,
      bookmark,
    });
  } catch (error: any) {
    console.error("Bookmark media error:", error);
    if (error.code === 11000) {
      response.status(400).json({
        success: false,
        message: "Media already bookmarked",
      });
      return;
    }
    response.status(500).json({
      success: false,
      message: "Failed to bookmark media",
    });
  }
};

export const recordMediaInteraction = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const { interactionType } = request.body as InteractionRequestBody;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    if (!["view", "listen", "read", "download"].includes(interactionType)) {
      response.status(400).json({
        success: false,
        message: "Invalid interaction type",
      });
      return;
    }

    const interaction = await mediaService.recordInteraction({
      userIdentifier,
      mediaIdentifier: id,
      interactionType,
    });

    response.status(201).json({
      success: true,
      message: `Recorded ${interactionType} for media ${id}`,
      interaction,
    });
  } catch (error: any) {
    console.error("Record media interaction error:", error);
    if (
      error.message.includes("Invalid") ||
      error.message.includes("already") ||
      error.message.includes("Media not found")
    ) {
      response.status(error.message === "Media not found" ? 404 : 400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    response.status(500).json({
      success: false,
      message: "Failed to record interaction",
    });
  }
};

export const startMuxLiveStream = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { title, description, category, topics } = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const stream = await mux.video.liveStreams.create({
      playback_policies: ["public"],
      new_asset_settings: { playback_policies: ["public"] },
    });

    const rtmpUrl = `rtmp://live.mux.com/app/${stream.stream_key}`;

    const newStream = await mediaService.uploadMedia({
      title,
      description,
      contentType: "live",
      category,
      topics: topics ? JSON.parse(topics) : [],
      isLive: true,
      liveStreamStatus: "live",
      streamKey: stream.stream_key,
      rtmpUrl,
      playbackUrl: `https://stream.mux.com/${stream.playback_ids?.[0]?.id}.m3u8`,
      uploadedBy: new Types.ObjectId(userIdentifier),
    });

    response.status(201).json({
      success: true,
      message: "Live stream started successfully",
      stream: {
        streamKey: stream.stream_key,
        rtmpUrl,
        playbackUrl: `https://stream.mux.com/${stream.playback_ids?.[0]?.id}.m3u8`,
      },
    });
  } catch (error: any) {
    console.error("Mux live stream creation error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to start live stream",
    });
  }
};

export const endMuxLiveStream = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const stream = await Media.findById(id);

    if (!stream || !stream.isLive) {
      response.status(404).json({
        success: false,
        message: "Live stream not found",
      });
      return;
    }

    if (
      stream.uploadedBy.toString() !== userIdentifier &&
      request.userRole !== "admin"
    ) {
      response.status(403).json({
        success: false,
        message: "Unauthorized to end this live stream",
      });
      return;
    }

    await mux.video.liveStreams.delete(stream.streamKey!);

    stream.liveStreamStatus = "ended";
    stream.actualEnd = new Date();
    await stream.save();

    response.status(200).json({
      success: true,
      message: "Live stream ended successfully",
    });
  } catch (error: any) {
    console.error("End live stream error:", error);
    response
      .status(error.message === "Live stream not found" ? 404 : 500)
      .json({
        success: false,
        message: error.message || "Failed to end live stream",
      });
  }
};

export const getLiveStreams = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const streams = await Media.find({
      isLive: true,
      liveStreamStatus: "live",
    })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "username");

    response.status(200).json({
      success: true,
      streams,
    });
  } catch (error: any) {
    console.error("Get live streams error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to retrieve live streams",
    });
  }
};
