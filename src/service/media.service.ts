import { Media } from "../models/media.model";
import { MediaInteraction } from "../models/mediaInteraction.model";
import { Bookmark } from "../models/bookmark.model";
import { User } from "../models/user.model";
import { UserViewedMedia } from "../models/userViewedMedia.model"; // New import
import { MediaUserAction } from "../models/mediaUserAction.model"; // New import
import { Types, ClientSession } from "mongoose";
import fileUploadService from "./fileUpload.service";

interface MediaInput {
  title: string;
  description?: string;
  contentType: "music" | "videos" | "books" | "live";
  category?: string;
  uploadedBy: Types.ObjectId | string;
  file?: Buffer;
  fileMimeType?: string;
  topics?: string[];
  duration?: number;
  isLive?: boolean;
  liveStreamStatus?: "scheduled" | "live" | "ended" | "archived";
  streamKey?: string;
  rtmpUrl?: string;
  playbackUrl?: string;
}

interface MediaInteractionInput {
  userIdentifier: string;
  mediaIdentifier: string;
  interactionType: "view" | "listen" | "read" | "download";
}

interface MediaUserActionInput {
  userIdentifier: string;
  mediaIdentifier: string;
  actionType: "favorite" | "share";
}

interface PopulatedMedia {
  _id: Types.ObjectId;
  title: string;
  contentType: "music" | "videos" | "books";
  category?: string;
  createdAt: Date;
}

// Interface for the UserViewedMedia document after .lean()
interface LeanUserViewedMedia {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  viewedMedia: { media: PopulatedMedia; viewedAt: Date }[];
  __v: number;
}

type DurationRangeKey = "short" | "medium" | "long";

export class MediaService {
  async uploadMedia(data: MediaInput) {
    const validMimeTypes: { [key in MediaInput["contentType"]]: string[] } = {
      videos: ["video/mp4", "video/webm", "video/ogg"],
      music: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
      books: ["application/pdf", "application/epub+zip"],
      live: [],
    };

    if (data.contentType !== "live" && data.file && data.fileMimeType) {
      if (!validMimeTypes[data.contentType].includes(data.fileMimeType)) {
        throw new Error(
          `Invalid MIME type ${data.fileMimeType} for content type ${data.contentType}`
        );
      }
    } else if (data.contentType !== "live" && !data.file) {
      throw new Error("File is required for non-live content types");
    }

    let fileUrl: string | undefined;
    if (data.contentType !== "live" && data.file && data.fileMimeType) {
      try {
        const uploadResult = await fileUploadService.uploadMedia(
          data.file,
          `media/${data.contentType}`,
          data.fileMimeType
        );
        fileUrl = uploadResult.secure_url;
        if (!fileUrl) {
          throw new Error("Cloudinary upload did not return a valid URL");
        }
      } catch (error) {
        console.error(`Error uploading ${data.contentType}:`, error);
        throw new Error(`Failed to upload ${data.contentType}`);
      }
    }

    const media = new Media({
      title: data.title,
      description: data.description,
      contentType: data.contentType,
      category: data.category,
      fileUrl,
      fileMimeType: data.fileMimeType,
      topics: data.topics || [],
      uploadedBy:
        typeof data.uploadedBy === "string"
          ? new Types.ObjectId(data.uploadedBy)
          : data.uploadedBy,
      duration: data.duration,
      isLive: data.isLive,
      liveStreamStatus: data.liveStreamStatus,
      streamKey: data.streamKey,
      rtmpUrl: data.rtmpUrl,
      playbackUrl: data.playbackUrl,
      viewCount: 0,
      listenCount: 0,
      readCount: 0,
      downloadCount: 0,
      favoriteCount: 0, // Initialize new field
      shareCount: 0, // Initialize new field
    });

    await media.save();
    return media;
  }

  async getAllMedia(filters: any = {}) {
    const query: any = {};

    if (filters.search) {
      query.title = { $regex: filters.search, $options: "i" };
    }

    if (filters.contentType && filters.contentType !== "devotionals") {
      const contentTypeMap: { [key: string]: string[] } = {
        videos: ["videos"],
        sermons: ["videos", "live"],
        music: ["music"],
        podcasts: ["music"],
        books: ["books"],
      };
      query.contentType = { $in: contentTypeMap[filters.contentType] || [] };
      if (filters.contentType === "sermons") query.category = "sermon";
      if (filters.contentType === "podcasts") query.category = "podcast";
    }

    if (filters.category) {
      query.category = { $regex: filters.category, $options: "i" };
    }

    if (filters.topics) {
      const topicsArray = Array.isArray(filters.topics)
        ? filters.topics
        : filters.topics.split(",");
      query.topics = {
        $in: topicsArray.map((topic: string) => new RegExp(topic, "i")),
      };
    }

    if (filters.creator) {
      const user = await User.findOne({ username: filters.creator });
      if (user) {
        query.uploadedBy = user._id;
      } else {
        query.uploadedBy = null;
      }
    }

    const durationRanges: Record<
      DurationRangeKey,
      { $lte?: number; $gte?: number; $gt?: number }
    > = {
      short: { $lte: 5 * 60 },
      medium: { $gte: 5 * 60, $lte: 15 * 60 },
      long: { $gt: 15 * 60 },
    };

    if (filters.duration) {
      const durationKey = filters.duration as DurationRangeKey;
      if (durationRanges[durationKey]) {
        query.duration = durationRanges[durationKey];
      } else {
        query.duration = {};
      }
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    let sort = filters.sort || "-createdAt";
    if (filters.sort === "trending") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query.createdAt = { $gte: sevenDaysAgo };
      sort = "-viewCount -listenCount -readCount";
    }

    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const mediaList = await Media.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("uploadedBy", "username")
      .lean();

    const total = await Media.countDocuments(query);

    return {
      media: mediaList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getMediaByIdentifier(mediaIdentifier: string) {
    if (!Types.ObjectId.isValid(mediaIdentifier)) {
      throw new Error("Invalid media identifier");
    }

    const media = await Media.findById(mediaIdentifier);
    if (!media) {
      throw new Error("Media not found");
    }

    return media;
  }

  async deleteMedia(
    mediaIdentifier: string,
    userIdentifier: string,
    userRole: string
  ) {
    if (!Types.ObjectId.isValid(mediaIdentifier)) {
      throw new Error("Invalid media identifier");
    }

    const media = await Media.findById(mediaIdentifier);
    if (!media) {
      throw new Error("Media not found");
    }

    if (
      media.uploadedBy.toString() !== userIdentifier &&
      userRole !== "admin"
    ) {
      throw new Error("Unauthorized to delete this media");
    }

    if (media.fileUrl) {
      try {
        const publicId = media.fileUrl.split("/").pop()?.split(".")[0];
        if (publicId) {
          await fileUploadService.deleteMedia(
            `media/${media.contentType}/${publicId}`,
            media.contentType === "videos" || media.contentType === "music"
              ? "video"
              : "image"
          );
        }
      } catch (error) {
        console.error("Error deleting media file:", error);
      }
    }

    await Media.findByIdAndDelete(mediaIdentifier);
    return true;
  }

  async recordInteraction(data: MediaInteractionInput) {
    if (
      !Types.ObjectId.isValid(data.userIdentifier) ||
      !Types.ObjectId.isValid(data.mediaIdentifier)
    ) {
      throw new Error("Invalid user or media identifier");
    }

    const media = await Media.findById(data.mediaIdentifier);
    if (!media) {
      throw new Error("Media not found");
    }

    if (
      (media.contentType === "videos" && data.interactionType !== "view") ||
      (media.contentType === "music" && data.interactionType !== "listen") ||
      (media.contentType === "books" &&
        !["read", "download"].includes(data.interactionType))
    ) {
      throw new Error(
        `Invalid interaction type ${data.interactionType} for ${media.contentType} media`
      );
    }

    const session: ClientSession = await Media.startSession();
    try {
      const interaction = await session.withTransaction(async () => {
        const existingInteraction = await MediaInteraction.findOne({
          user: new Types.ObjectId(data.userIdentifier),
          media: new Types.ObjectId(data.mediaIdentifier),
          interactionType: data.interactionType,
        }).session(session);

        if (existingInteraction) {
          throw new Error(
            `User has already ${data.interactionType} this media`
          );
        }

        const interaction = await MediaInteraction.create(
          [
            {
              user: new Types.ObjectId(data.userIdentifier),
              media: new Types.ObjectId(data.mediaIdentifier),
              interactionType: data.interactionType,
            },
          ],
          { session }
        );

        const updateField: { [key: string]: number } = {};
        if (data.interactionType === "view") updateField.viewCount = 1;
        if (data.interactionType === "listen") updateField.listenCount = 1;
        if (data.interactionType === "read") updateField.readCount = 1;
        if (data.interactionType === "download") updateField.downloadCount = 1;

        await Media.findByIdAndUpdate(
          data.mediaIdentifier,
          { $inc: updateField },
          { session }
        );

        return interaction[0];
      });

      return interaction;
    } finally {
      session.endSession();
    }
  }

  async getInteractionCounts(mediaIdentifier: string) {
    if (!Types.ObjectId.isValid(mediaIdentifier)) {
      throw new Error("Invalid media identifier");
    }

    const media = await Media.findById(mediaIdentifier).select(
      "contentType viewCount listenCount readCount downloadCount favoriteCount shareCount"
    );
    if (!media) {
      throw new Error("Media not found");
    }

    const result: {
      viewCount?: number;
      listenCount?: number;
      readCount?: number;
      downloadCount?: number;
      favoriteCount?: number;
      shareCount?: number;
    } = {};

    if (media.contentType === "videos") result.viewCount = media.viewCount;
    if (media.contentType === "music") result.listenCount = media.listenCount;
    if (media.contentType === "books") {
      result.readCount = media.readCount;
      result.downloadCount = media.downloadCount;
    }
    result.favoriteCount = media.favoriteCount;
    result.shareCount = media.shareCount;

    return result;
  }

  async recordUserAction(data: MediaUserActionInput) {
    if (
      !Types.ObjectId.isValid(data.userIdentifier) ||
      !Types.ObjectId.isValid(data.mediaIdentifier)
    ) {
      throw new Error("Invalid user or media identifier");
    }

    const media = await Media.findById(data.mediaIdentifier);
    if (!media) {
      throw new Error("Media not found");
    }

    const session: ClientSession = await Media.startSession();
    try {
      const action = await session.withTransaction(async () => {
        const existingAction = await MediaUserAction.findOne({
          user: new Types.ObjectId(data.userIdentifier),
          media: new Types.ObjectId(data.mediaIdentifier),
          actionType: data.actionType,
        }).session(session);

        if (existingAction) {
          throw new Error(`User has already ${data.actionType}d this media`);
        }

        const action = await MediaUserAction.create(
          [
            {
              user: new Types.ObjectId(data.userIdentifier),
              media: new Types.ObjectId(data.mediaIdentifier),
              actionType: data.actionType,
            },
          ],
          { session }
        );

        const updateField: { [key: string]: number } = {};
        if (data.actionType === "favorite") updateField.favoriteCount = 1;
        if (data.actionType === "share") updateField.shareCount = 1;

        await Media.findByIdAndUpdate(
          data.mediaIdentifier,
          { $inc: updateField },
          { session }
        );

        return action[0];
      });

      return action;
    } finally {
      session.endSession();
    }
  }

  async addToViewedMedia(userIdentifier: string, mediaIdentifier: string) {
    if (
      !Types.ObjectId.isValid(userIdentifier) ||
      !Types.ObjectId.isValid(mediaIdentifier)
    ) {
      throw new Error("Invalid user or media identifier");
    }

    const media = await Media.findById(mediaIdentifier);
    if (!media) {
      throw new Error("Media not found");
    }

    const session: ClientSession = await UserViewedMedia.startSession();
    try {
      const result = await session.withTransaction(async () => {
        const update = await UserViewedMedia.findOneAndUpdate(
          { user: new Types.ObjectId(userIdentifier) },
          {
            $push: {
              viewedMedia: {
                $each: [
                  {
                    media: new Types.ObjectId(mediaIdentifier),
                    viewedAt: new Date(),
                  },
                ],
                $slice: -50, // Keep only the last 50 items
              },
            },
          },
          {
            upsert: true,
            new: true,
            session,
          }
        );

        return update;
      });

      return result;
    } finally {
      session.endSession();
    }
  }

  async getViewedMedia(
    userIdentifier: string
  ): Promise<{ media: Partial<PopulatedMedia>; viewedAt: Date }[]> {
    if (!Types.ObjectId.isValid(userIdentifier)) {
      throw new Error("Invalid user identifier");
    }

    const viewedMedia = await UserViewedMedia.findOne({
      user: new Types.ObjectId(userIdentifier),
    })
      .populate<{ viewedMedia: { media: PopulatedMedia; viewedAt: Date }[] }>({
        path: "viewedMedia.media",
        select: "title contentType category createdAt",
      })
      .lean<LeanUserViewedMedia>();

    return viewedMedia ? viewedMedia.viewedMedia : [];
  }

  async getMediaCountByContentType() {
    const result = await Media.aggregate([
      {
        $group: {
          _id: "$contentType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          contentType: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const counts: {
      music: number;
      videos: number;
      books: number;
      live: number;
    } = {
      music: 0,
      videos: 0,
      books: 0,
      live: 0,
    };

    result.forEach((item) => {
      counts[item.contentType as keyof typeof counts] = item.count;
    });

    return counts;
  }

  async getTotalInteractionCounts() {
    const result = await Media.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$viewCount" },
          totalListens: { $sum: "$listenCount" },
          totalReads: { $sum: "$readCount" },
          totalDownloads: { $sum: "$downloadCount" },
          totalFavorites: { $sum: "$favoriteCount" }, // New
          totalShares: { $sum: "$shareCount" }, // New
        },
      },
    ]);

    return {
      totalViews: result[0]?.totalViews || 0,
      totalListens: result[0]?.totalListens || 0,
      totalReads: result[0]?.totalReads || 0,
      totalDownloads: result[0]?.totalDownloads || 0,
      totalFavorites: result[0]?.totalFavorites || 0,
      totalShares: result[0]?.totalShares || 0,
    };
  }

  async getRecentMedia(limit: number) {
    return await Media.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title contentType category createdAt")
      .lean();
  }

  async getMediaCountSinceDate(since: Date) {
    return await Media.countDocuments({
      createdAt: { $gte: since },
    });
  }

  async getInteractionCountSinceDate(since: Date) {
    return await MediaInteraction.countDocuments({
      createdAt: { $gte: since },
    });
  }

  async getUserMediaCountByContentType(userIdentifier: string) {
    if (!Types.ObjectId.isValid(userIdentifier)) {
      throw new Error("Invalid user identifier");
    }

    const result = await Media.aggregate([
      {
        $match: { uploadedBy: new Types.ObjectId(userIdentifier) },
      },
      {
        $group: {
          _id: "$contentType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          contentType: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const counts: {
      music: number;
      videos: number;
      books: number;
      live: number;
    } = {
      music: 0,
      videos: 0,
      books: 0,
      live: 0,
    };

    result.forEach((item) => {
      counts[item.contentType as keyof typeof counts] = item.count;
    });

    return counts;
  }

  async getUserInteractionCounts(userIdentifier: string) {
    if (!Types.ObjectId.isValid(userIdentifier)) {
      throw new Error("Invalid user identifier");
    }

    const result = await MediaInteraction.aggregate([
      {
        $match: { user: new Types.ObjectId(userIdentifier) },
      },
      {
        $group: {
          _id: "$interactionType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          interactionType: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    const counts: {
      totalViews: number;
      totalListens: number;
      totalReads: number;
      totalDownloads: number;
    } = {
      totalViews: 0,
      totalListens: 0,
      totalReads: 0,
      totalDownloads: 0,
    };

    result.forEach((item) => {
      if (item.interactionType === "view") counts.totalViews = item.count;
      if (item.interactionType === "listen") counts.totalListens = item.count;
      if (item.interactionType === "read") counts.totalReads = item.count;
      if (item.interactionType === "download")
        counts.totalDownloads = item.count;
    });

    return counts;
  }

  async getUserBookmarkCount(userIdentifier: string) {
    if (!Types.ObjectId.isValid(userIdentifier)) {
      throw new Error("Invalid user identifier");
    }

    return await Bookmark.countDocuments({
      user: new Types.ObjectId(userIdentifier),
    });
  }

  async getUserRecentMedia(userIdentifier: string, limit: number) {
    if (!Types.ObjectId.isValid(userIdentifier)) {
      throw new Error("Invalid user identifier");
    }

    return await Media.find({
      uploadedBy: new Types.ObjectId(userIdentifier),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title contentType category createdAt")
      .lean();
  }

  async getUserMediaCountSinceDate(userIdentifier: string, since: Date) {
    if (!Types.ObjectId.isValid(userIdentifier)) {
      throw new Error("Invalid user identifier");
    }

    return await Media.countDocuments({
      uploadedBy: new Types.ObjectId(userIdentifier),
      createdAt: { $gte: since },
    });
  }

  async getUserInteractionCountSinceDate(userIdentifier: string, since: Date) {
    if (!Types.ObjectId.isValid(userIdentifier)) {
      throw new Error("Invalid user identifier");
    }

    return await MediaInteraction.countDocuments({
      user: new Types.ObjectId(userIdentifier),
      createdAt: { $gte: since },
    });
  }
}

export const mediaService = new MediaService();
