import { apiClient } from "../apiClient";
import type { BlacklistCountries, Country } from "../dtos";

export const geo = {
  countries: () =>
    apiClient.get<Country[]>("/v1/geo/countries", { auth: false }),
};

export const creatorBlacklist = {
  get: () =>
    apiClient.get<BlacklistCountries>("/v1/users/creators/blacklist/countries"),
  set: (codes: string[]) =>
    apiClient.put<BlacklistCountries>(
      "/v1/users/creators/blacklist/countries",
      { codes }
    ),
};
