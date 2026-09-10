import { apiClient } from "../apiClient";
import type { TopSubscribersOut } from "../dtos";

export type TopSubscribersSort = "spend" | "subs" | "newest";

export const dashboard = {
  /**
   * Creator-only. Powers the "Most Engaged Subscribers" hero + "Top Users" grid
   * in the dashboard right rail. Default `limit: 7` returns one hero + six tiles.
   */
  topSubscribers: (params?: {
    sort?: TopSubscribersSort;
    limit?: number;
  }) =>
    apiClient.get<TopSubscribersOut>(
      "/v1/users/creators/subscribers/top",
      { query: params }
    ),
};
