import { apiClient } from "../apiClient";
import type {
  ExploreCreatorsOut,
  FeaturedCreatorsOut,
} from "../dtos";

export type DiscoverExploreSort = "subs" | "newest" | "likes";

/**
 * Both endpoints are "auth optional" — we still send the Bearer token when we
 * have one so authed callers get `isFollowing` / `isSubscribed` populated. The
 * backend just tolerates its absence for anonymous callers.
 */
export const discover = {
  featured: (limit = 8) =>
    apiClient.get<FeaturedCreatorsOut>("/v1/discover/featured", {
      query: { limit },
    }),

  explore: (params?: {
    sort?: DiscoverExploreSort;
    cursor?: string;
    limit?: number;
  }) =>
    apiClient.get<ExploreCreatorsOut>("/v1/discover/explore", {
      query: params,
    }),
};
