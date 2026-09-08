import { apiClient } from "../apiClient";
import type {
  Bank,
  CreatorPlan,
  OnboardingCompleteOut,
  ResolveAccountOut,
  SavePayoutAccountIn,
  SavePayoutAccountOut,
  SubscriptionPricingOut,
  UpdateSubscriptionIn,
} from "../dtos";

export const creatorPayout = {
  banks: () => apiClient.get<Bank[]>("/v1/users/creators/payout/banks"),

  resolve: (bankCode: string, accountNumber: string) =>
    apiClient.get<ResolveAccountOut>("/v1/users/creators/payout/resolve", {
      query: { bankCode, accountNumber },
    }),

  saveAccount: (dto: SavePayoutAccountIn) =>
    apiClient.put<SavePayoutAccountOut>(
      "/v1/users/creators/payout/account",
      dto
    ),
};

export const creatorOnboarding = {
  complete: () =>
    apiClient.post<OnboardingCompleteOut>(
      "/v1/users/creators/onboarding/complete"
    ),
};

export const creatorSubscription = {
  get: () =>
    apiClient.get<SubscriptionPricingOut>("/v1/users/creators/subscription"),
  update: (dto: UpdateSubscriptionIn) =>
    apiClient.patch<SubscriptionPricingOut>(
      "/v1/users/creators/subscription",
      dto
    ),
};

/** Public — no auth required. Used by the fan-side subscribe modal. */
export const creatorPlans = {
  byUsername: (username: string) =>
    apiClient.get<CreatorPlan[]>(`/v1/creators/${username}/plans`),
};
