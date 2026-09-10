import { apiClient } from "../apiClient";
import type { CommentOut, Ok, Page } from "../dtos";

export const comments = {
  list: (
    postId: string,
    params?: { cursor?: string; limit?: number }
  ) =>
    apiClient.get<Page<CommentOut>>(`/v1/posts/${postId}/comments`, {
      query: params,
    }),

  add: (postId: string, body: string, parentId?: string) =>
    apiClient.post<CommentOut>(`/v1/posts/${postId}/comments`, {
      body,
      parentId,
    }),

  delete: (commentId: string) =>
    apiClient.delete<Ok>(`/v1/comments/${commentId}`),
};
