import { apiClient } from "../apiClient";
import type { IdentityOut, IdentitySubmitIn, Ok } from "../dtos";

export const identity = {
  get: () => apiClient.get<IdentityOut>("/v1/me/identity"),

  submit: (dto: IdentitySubmitIn) =>
    apiClient.post<IdentityOut>("/v1/me/identity", dto),

  withdraw: () => apiClient.post<Ok>("/v1/me/identity/withdraw"),
};
