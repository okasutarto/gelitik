// Post Types
import type { Platform } from "./platform";

export type PostType = "image" | "video" | "reel" | "carousel" | "text";
export type PostStatus = "draft" | "scheduled" | "published";

export interface Post {
  id: string;
  title: string;
  date: Date;
  platform: Platform;
  type: PostType;
  status: PostStatus;
  thumbnail?: string;
}
