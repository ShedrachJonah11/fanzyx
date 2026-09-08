import { apiClient, tokenStore } from "../apiClient";
import type {
  AuthResponse,
  AuthUser,
  BankAccount,
  Comment,
  Conversation,
  CreatePostDto,
  CreatorProfile,
  ID,
  LoginDto,
  Message,
  Notification,
  Paginated,
  Payout,
  Post,
  SendMessageDto,
  SendTipDto,
  SetPasswordDto,
  SignupCreatorDto,
  SignupFanDto,
  Subscription,
  Tip,
  TopupInitDto,
  TopupInitResponse,
  UploadInitDto,
  UploadInitResponse,
  VerifyOtpDto,
  Wallet,
  WalletTransaction,
} from "../dtos";

export const auth = {
  signupFan: (dto: SignupFanDto) =>
    apiClient.post<AuthResponse>("/v1/auth/signup/fan", dto, { auth: false }),
  signupCreator: (dto: SignupCreatorDto) =>
    apiClient.post<{ pendingId: ID }>("/v1/auth/signup/creator", dto, {
      auth: false,
    }),
  verifyOtp: (dto: VerifyOtpDto) =>
    apiClient.post<{ verified: true }>("/v1/auth/verify-otp", dto, {
      auth: false,
    }),
  resendOtp: (email: string) =>
    apiClient.post<{ sent: true }>(
      "/v1/auth/resend-otp",
      { email },
      { auth: false }
    ),
  setPassword: (dto: SetPasswordDto) =>
    apiClient.post<AuthResponse>("/v1/auth/set-password", dto, { auth: false }),
  login: async (dto: LoginDto) => {
    const res = await apiClient.post<AuthResponse>("/v1/auth/login", dto, {
      auth: false,
    });
    tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
    return res;
  },
  logout: async () => {
    try {
      await apiClient.post("/v1/auth/logout");
    } finally {
      tokenStore.clear();
    }
  },
  me: () => apiClient.get<AuthUser>("/v1/auth/me"),
  refresh: () =>
    apiClient.post<AuthResponse>(
      "/v1/auth/refresh",
      { refreshToken: tokenStore.getRefresh() },
      { auth: false }
    ),
};

export const users = {
  updateMe: (patch: Partial<AuthUser>) =>
    apiClient.patch<AuthUser>("/v1/me", patch),
  exportData: () => apiClient.get<{ url: string }>("/v1/me/export"),
  deleteMe: () => apiClient.delete<{ ok: true }>("/v1/me"),
};

export const creators = {
  list: (params?: { cursor?: string; sort?: string; q?: string }) =>
    apiClient.get<Paginated<CreatorProfile>>("/v1/creators", { query: params }),
  featured: () => apiClient.get<CreatorProfile[]>("/v1/creators/featured"),
  byUsername: (username: string) =>
    apiClient.get<CreatorProfile>(`/v1/creators/${username}`),
  follow: (creatorId: ID) =>
    apiClient.post<{ following: boolean }>(`/v1/creators/${creatorId}/follow`),
  unfollow: (creatorId: ID) =>
    apiClient.delete<{ following: boolean }>(`/v1/creators/${creatorId}/follow`),
  updateProfile: (patch: Partial<CreatorProfile>) =>
    apiClient.patch<CreatorProfile>("/v1/me/creator", patch),
};

export const posts = {
  feed: (tab: "following" | "for-you", cursor?: string) =>
    apiClient.get<Paginated<Post>>("/v1/feed", { query: { tab, cursor } }),
  byId: (id: ID) => apiClient.get<Post>(`/v1/posts/${id}`),
  byCreator: (username: string, cursor?: string) =>
    apiClient.get<Paginated<Post>>(`/v1/creators/${username}/posts`, {
      query: { cursor },
    }),
  create: (dto: CreatePostDto) => apiClient.post<Post>("/v1/posts", dto),
  update: (id: ID, patch: Partial<CreatePostDto>) =>
    apiClient.patch<Post>(`/v1/posts/${id}`, patch),
  delete: (id: ID) => apiClient.delete<{ ok: true }>(`/v1/posts/${id}`),
  like: (id: ID) => apiClient.post<{ liked: boolean }>(`/v1/posts/${id}/like`),
  unlike: (id: ID) =>
    apiClient.delete<{ liked: boolean }>(`/v1/posts/${id}/like`),
  bookmark: (id: ID) =>
    apiClient.post<{ bookmarked: boolean }>(`/v1/posts/${id}/bookmark`),
  unbookmark: (id: ID) =>
    apiClient.delete<{ bookmarked: boolean }>(`/v1/posts/${id}/bookmark`),
  unlock: (id: ID, idempotencyKey: string) =>
    apiClient.post<Post>(`/v1/posts/${id}/unlock`, undefined, {
      idempotencyKey,
    }),
  comments: (id: ID, cursor?: string) =>
    apiClient.get<Paginated<Comment>>(`/v1/posts/${id}/comments`, {
      query: { cursor },
    }),
  comment: (id: ID, text: string) =>
    apiClient.post<Comment>(`/v1/posts/${id}/comments`, { text }),
};

export const subscriptions = {
  list: () => apiClient.get<Subscription[]>("/v1/subscriptions"),
  subscribe: (creatorId: ID, bundleId: ID | null, idempotencyKey: string) =>
    apiClient.post<Subscription>(
      "/v1/subscriptions",
      { creatorId, bundleId },
      { idempotencyKey }
    ),
  cancel: (id: ID) =>
    apiClient.delete<Subscription>(`/v1/subscriptions/${id}`),
};

export const wallet = {
  me: () => apiClient.get<Wallet>("/v1/wallet"),
  transactions: (cursor?: string) =>
    apiClient.get<Paginated<WalletTransaction>>("/v1/wallet/transactions", {
      query: { cursor },
    }),
  topupInit: (dto: TopupInitDto, idempotencyKey: string) =>
    apiClient.post<TopupInitResponse>("/v1/wallet/topup", dto, {
      idempotencyKey,
    }),
  topupVerify: (reference: string) =>
    apiClient.post<WalletTransaction>("/v1/wallet/topup/verify", { reference }),
};

export const tips = {
  send: (dto: SendTipDto, idempotencyKey: string) =>
    apiClient.post<Tip>("/v1/tips", dto, { idempotencyKey }),
};

export const payouts = {
  banks: () =>
    apiClient.get<{ code: string; name: string }[]>("/v1/payouts/banks"),
  resolveAccount: (bankCode: string, accountNumber: string) =>
    apiClient.get<BankAccount>("/v1/payouts/resolve", {
      query: { bankCode, accountNumber },
    }),
  saveAccount: (dto: BankAccount) =>
    apiClient.put<BankAccount>("/v1/payouts/account", dto),
  request: (amountKobo: number, idempotencyKey: string) =>
    apiClient.post<Payout>(
      "/v1/payouts",
      { amountKobo },
      { idempotencyKey }
    ),
  list: (cursor?: string) =>
    apiClient.get<Paginated<Payout>>("/v1/payouts", { query: { cursor } }),
};

export const messages = {
  conversations: () => apiClient.get<Conversation[]>("/v1/conversations"),
  thread: (conversationId: ID, cursor?: string) =>
    apiClient.get<Paginated<Message>>(
      `/v1/conversations/${conversationId}/messages`,
      { query: { cursor } }
    ),
  send: (dto: SendMessageDto) => apiClient.post<Message>("/v1/messages", dto),
  markRead: (conversationId: ID) =>
    apiClient.post<{ ok: true }>(
      `/v1/conversations/${conversationId}/read`
    ),
};

export const notifications = {
  list: (cursor?: string) =>
    apiClient.get<Paginated<Notification>>("/v1/notifications", {
      query: { cursor },
    }),
  markAllRead: () =>
    apiClient.post<{ ok: true }>("/v1/notifications/read-all"),
};

export const uploads = {
  init: (dto: UploadInitDto) =>
    apiClient.post<UploadInitResponse>("/v1/uploads", dto),
  complete: (mediaId: ID) =>
    apiClient.post<{ ok: true }>(`/v1/uploads/${mediaId}/complete`),
};

export const services = {
  auth,
  users,
  creators,
  posts,
  subscriptions,
  wallet,
  tips,
  payouts,
  messages,
  notifications,
  uploads,
};
