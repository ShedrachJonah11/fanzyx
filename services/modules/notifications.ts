import { apiClient } from "../apiClient";
import type { NotificationOut, Ok, Page } from "../dtos";

export const notifications = {
  list: (params?: { read?: boolean; cursor?: string; limit?: number }) =>
    apiClient.get<Page<NotificationOut>>("/v1/notifications", {
      query: params,
    }),

  markRead: (id: string) =>
    apiClient.post<Ok>(`/v1/notifications/${id}/read`),

  markAllRead: () => apiClient.post<Ok>("/v1/notifications/read-all"),
};
