// Video-related utility functions

/**
 * Calculate engagement rate from video metrics
 */
export function calculateEngagementRate(video: {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}): number {
  const views = video.views || 0;
  const likes = video.likes || 0;
  const comments = video.comments || 0;
  const shares = video.shares || 0;
  const totalEngagement = likes + comments + shares;

  if (views === 0) {
    return 0;
  }

  return (totalEngagement / views) * 100;
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number = 30): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Format duration in seconds to mm:ss format
 */
export function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format a timestamp to a human-readable "time ago" string
 */
export function formatTimeAgo(createTime: string | number | undefined): string {
  if (!createTime) return "Unknown";

  const now = new Date();
  const created = new Date(createTime);
  const diffMs = now.getTime() - created.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffDays > 7) return `${Math.floor(diffDays)}d ago`;
  if (diffDays >= 1) return `${Math.floor(diffDays)}d ago`;
  if (diffHours >= 1) return `${Math.floor(diffHours)}h ago`;
  return "Just now";
}

/**
 * Format a timestamp to a date string
 */
export function formatDate(timestamp: string | number): string {
  if (!timestamp) return "Unknown";

  const timestampNum = typeof timestamp === "string" ? parseInt(timestamp, 10) : timestamp;
  const date = new Date(timestampNum * 1000);

  if (isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Get platform badge configuration
 */
export function getPlatformBadge(platform: string): { bg: string; text: string; dot: string } {
  const configs: Record<string, { bg: string; text: string; dot: string }> = {
    all: {
      bg: "bg-neo-accent dark:bg-[#FFCC00] border-2 border-black dark:border-electric shadow-brutal-sm",
      text: "text-black",
      dot: "bg-black",
    },
    instagram: {
      bg: "bg-pink-400 dark:bg-[#FF0099] border-2 border-black dark:border-electric shadow-brutal-sm",
      text: "text-black",
      dot: "bg-black",
    },
    tiktok: {
      bg: "bg-cyan-400 dark:bg-[#00F0FF] border-2 border-black dark:border-electric shadow-brutal-sm",
      text: "text-black",
      dot: "bg-black",
    },
    linkedin: {
      bg: "bg-blue-400 dark:bg-[#6B2CF5] border-2 border-black dark:border-electric shadow-brutal-sm",
      text: "text-black",
      dot: "bg-black",
    },
  };
  return configs[platform] || configs.all;
}
