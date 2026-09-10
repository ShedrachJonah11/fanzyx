import type { CreatorMini, MediaOut } from "./posts";

export type StoryVisibility = "free" | "subscribers";

export interface StoryOut {
  id: string;
  creator: CreatorMini;
  caption: string | null;
  visibility: StoryVisibility;
  viewCount: number;
  /** per-viewer; false for owner + anon */
  viewed: boolean;
  /** true when subscribers-only + caller not entitled */
  locked: boolean;
  /** null when locked */
  media: MediaOut | null;
  createdAt: string;
  /** ~24h after createdAt */
  expiresAt: string;
}

export interface StoryFeedGroupOut {
  creator: CreatorMini;
  /** chronological playback order */
  stories: StoryOut[];
  hasUnviewed: boolean;
}

export interface StoryFeedOut {
  items: StoryFeedGroupOut[];
}

export interface StoryViewerOut {
  user: CreatorMini;
  viewedAt: string;
}

export interface StoryViewersOut {
  items: StoryViewerOut[];
}

export interface StoryCreateIn {
  mediaId: string;
  caption?: string;
  visibility?: StoryVisibility;
}
