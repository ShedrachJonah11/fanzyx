import { apiClient } from "../apiClient";
import type {
  Page,
  ReferralOut,
  ReferralSummaryOut,
} from "../dtos";

export const referrals = {
  summary: () =>
    apiClient.get<ReferralSummaryOut>("/v1/referrals/summary"),

  list: (params?: { cursor?: string; limit?: number }) =>
    apiClient.get<Page<ReferralOut>>("/v1/referrals", { query: params }),
};
