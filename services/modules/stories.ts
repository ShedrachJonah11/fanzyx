import { apiClient } from "../apiClient";
import type {
  Ok,
  StoryCreateIn,
  StoryFeedOut,
  StoryOut,
  StoryViewersOut,
} from "../dtos";

export const stories = {
  /** Creator only. Creates a new 24h story from a previously uploaded media. */
  create: (dto: StoryCreateIn) =>
    apiClient.post<StoryOut>("/v1/stories", dto),

  /** Owner only. Marks deleted + force-expires. */
  delete: (id: string) => apiClient.delete<Ok>(`/v1/stories/${id}`),

  /** Grouped tray for the fan feed — creators the viewer follows/subscribes. */
  feed: () => apiClient.get<StoryFeedOut>("/v1/stories/feed"),

  /** All active stories from a single creator. Public. */
  byUser: (username: string) =>
    apiClient.get<StoryOut[]>(`/v1/stories/user/${username}`),

  /**
   * Single story. Bumps the view count on the first read by an authed
   * non-owner. Idempotent — repeated reads from the same user don't bump.
   */
  get: (id: string) => apiClient.get<StoryOut>(`/v1/stories/${id}`),

  /** Owner only. Viewer list for a specific story. */
  viewers: (id: string) =>
    apiClient.get<StoryViewersOut>(`/v1/stories/${id}/viewers`),
};
