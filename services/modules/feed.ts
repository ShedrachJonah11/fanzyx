import { apiClient } from "../apiClient";
import type { Page, PostOut } from "../dtos";

export type FeedExploreSort = "newest" | "likes" | "subs";

export const feed = {
  following: (params?: { cursor?: string; limit?: number }) =>
    apiClient.get<Page<PostOut>>("/v1/feed/following", { query: params }),

  explore: (params?: {
    sort?: FeedExploreSort;
    cursor?: string;
    limit?: number;
  }) => apiClient.get<Page<PostOut>>("/v1/feed/explore", { query: params }),

  forYou: (params?: { cursor?: string; limit?: number }) =>
    apiClient.get<Page<PostOut>>("/v1/feed/for-you", { query: params }),
};
