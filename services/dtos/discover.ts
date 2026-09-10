/* Responses for the three discovery surfaces:
 * - creator dashboard right rail (Most Engaged + Top Users)
 * - fan feed pill row (Featured Creators)
 * - fan feed right-rail grid (Explore Creators)
 */

export interface TopSubscriberOut {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  verified: boolean;
  totalSpentKobo: number;
  /** plan_months of their currently active sub, else 0 */
  activeSubMonths: number;
  /** most recent subscription created_at */
  joinedAt: string | null;
  lastActiveAt: string | null;
}

export interface TopSubscribersOut {
  items: TopSubscriberOut[];
}

/**
 * Public "recent supporters" strip rendered on the creator profile page.
 * Deliberately hides money — social proof only. Ranked by lifetime spend
 * (subs + tips) on that specific creator.
 */
export interface TopSupporterOut {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  verified: boolean;
  rank: number;
}

export interface TopSupportersOut {
  items: TopSupporterOut[];
}

export interface FeaturedCreatorOut {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  followerCount: number;
  photoCount: number;
  videoCount: number;
  totalLikes: number;
}

export interface FeaturedCreatorsOut {
  items: FeaturedCreatorOut[];
}

export interface ExploreCreatorOut {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  subscriberCount: number;
  followerCount: number;
  monthlyPriceKobo: number | null;
  /** null when caller is anonymous */
  isFollowing: boolean | null;
  isSubscribed: boolean | null;
  /** Optional — backend may not have added these yet. Rendered only when present. */
  photoCount?: number;
  videoCount?: number;
}

export interface ExploreCreatorsOut {
  items: ExploreCreatorOut[];
  nextCursor: string | null;
}
