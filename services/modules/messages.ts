import { apiClient } from "../apiClient";
import type {
  ConversationFilter,
  ConversationOut,
  MessageOut,
  Ok,
  Page,
  PresenceMap,
  SendMessageIn,
  StartConversationIn,
} from "../dtos";

const PRESENCE_BATCH = 100;

export const messages = {
  /* ── Conversations ─────────────────────────────── */

  /** Idempotent — returns the existing conv if already created with this user. */
  startConversation: (dto: StartConversationIn) =>
    apiClient.post<ConversationOut>("/v1/conversations", dto),

  listConversations: (params?: {
    filter?: ConversationFilter;
    cursor?: string;
    limit?: number;
  }) =>
    apiClient.get<Page<ConversationOut>>("/v1/conversations", {
      query: params,
    }),

  listMessages: (
    convId: string,
    params?: { cursor?: string; limit?: number }
  ) =>
    apiClient.get<Page<MessageOut>>(`/v1/conversations/${convId}/messages`, {
      query: params,
    }),

  send: (convId: string, dto: SendMessageIn) =>
    apiClient.post<MessageOut>(
      `/v1/conversations/${convId}/messages`,
      dto
    ),

  markRead: (convId: string) =>
    apiClient.post<Ok>(`/v1/conversations/${convId}/read`),

  pin: (convId: string) =>
    apiClient.post<Ok>(`/v1/conversations/${convId}/pin`),

  unpin: (convId: string) =>
    apiClient.delete<Ok>(`/v1/conversations/${convId}/pin`),

  mute: (convId: string) =>
    apiClient.post<Ok>(`/v1/conversations/${convId}/mute`),

  unmute: (convId: string) =>
    apiClient.delete<Ok>(`/v1/conversations/${convId}/mute`),

  deleteMessage: (messageId: string) =>
    apiClient.delete<Ok>(`/v1/messages/${messageId}`),

  deleteConversation: (convId: string) =>
    apiClient.delete<Ok>(`/v1/conversations/${convId}`),

  /** PPV — pays the price and returns the full unlocked message. */
  unlock: (messageId: string, idempotencyKey: string) =>
    apiClient.post<MessageOut>(`/v1/messages/${messageId}/unlock`, undefined, {
      idempotencyKey,
    }),
};

export const presence = {
  /**
   * Fetch presence for up to N user ids. Backend caps at 100 per call — this
   * helper chunks larger lists and merges the results client-side.
   */
  get: async (userIds: string[]): Promise<PresenceMap> => {
    if (userIds.length === 0) return {};
    const chunks: string[][] = [];
    for (let i = 0; i < userIds.length; i += PRESENCE_BATCH) {
      chunks.push(userIds.slice(i, i + PRESENCE_BATCH));
    }
    const results = await Promise.all(
      chunks.map((chunk) =>
        apiClient.get<PresenceMap>("/v1/presence", {
          query: { userIds: chunk.join(",") },
        })
      )
    );
    return results.reduce<PresenceMap>((acc, r) => Object.assign(acc, r), {});
  },
};
