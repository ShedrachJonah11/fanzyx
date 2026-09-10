import { apiClient } from "../apiClient";
import type {
  TwoFactorDisableDto,
  TwoFactorEnableDto,
  TwoFactorEnableOut,
  TwoFactorSetupOut,
} from "../dtos";

export const twoFactor = {
  setup: () => apiClient.post<TwoFactorSetupOut>("/v1/me/2fa/setup"),
  enable: (dto: TwoFactorEnableDto) =>
    apiClient.post<TwoFactorEnableOut>("/v1/me/2fa/enable", dto),
  disable: (dto: TwoFactorDisableDto) =>
    apiClient.post<{ ok: true }>("/v1/me/2fa/disable", dto),
};
