import type { CreatorMini } from "./posts";

export type ReferralStatus = "pending" | "signed_up" | "converted";

export interface ReferralOut {
  id: string;
  invitee: CreatorMini | null;
  status: ReferralStatus;
  joinedAt: string | null;
  convertedAt: string | null;
  rewardKobo: number;
}

export interface ReferralSummaryOut {
  invitesSent: number;
  signedUp: number;
  converted: number;
  earnedKobo: number;
  rewardPerConversionKobo: number;
  shareUrl: string;
  referralCode: string;
}
