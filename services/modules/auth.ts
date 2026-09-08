import { apiClient, tokenStore } from "../apiClient";
import type {
  AuthOut,
  CreatorFlowResponse,
  EmailVerifyRequestOut,
  ForgotPasswordDto,
  GoogleAuthDto,
  GoogleCallbackDto,
  LoginDto,
  MeOut,
  ResendOtpDto,
  ResetPasswordDto,
  SignupCreatorPasswordDto,
  SignupCreatorStartDto,
  SignupCreatorVerifyDto,
  SignupFanDto,
  TokenPair,
  VerifyEmailDto,
} from "../dtos";

function saveAuthOut(res: AuthOut): AuthOut {
  tokenStore.set(res.tokens.accessToken, res.tokens.refreshToken);
  return res;
}

export const auth = {
  signupFan: async (dto: SignupFanDto) => {
    const res = await apiClient.post<AuthOut>("/v1/auth/signup/fan", dto, {
      auth: false,
    });
    return saveAuthOut(res);
  },

  signupCreatorStart: (dto: SignupCreatorStartDto) =>
    apiClient.post<CreatorFlowResponse>(
      "/v1/auth/signup/creator/start",
      dto,
      { auth: false }
    ),

  signupCreatorVerify: (dto: SignupCreatorVerifyDto) =>
    apiClient.post<CreatorFlowResponse>(
      "/v1/auth/signup/creator/verify",
      dto,
      { auth: false }
    ),

  signupCreatorPassword: async (dto: SignupCreatorPasswordDto) => {
    const res = await apiClient.post<AuthOut>(
      "/v1/auth/signup/creator/password",
      dto,
      { auth: false }
    );
    return saveAuthOut(res);
  },

  signupCreatorIdentity: (form: FormData) =>
    apiClient.post<{ ok: true }>("/v1/auth/signup/creator/identity", form, {
      isForm: true,
    }),

  login: async (dto: LoginDto) => {
    const res = await apiClient.post<AuthOut>("/v1/auth/login", dto, {
      auth: false,
    });
    return saveAuthOut(res);
  },

  google: async (dto: GoogleAuthDto) => {
    const res = await apiClient.post<AuthOut>("/v1/auth/google", dto, {
      auth: false,
    });
    return saveAuthOut(res);
  },

  googleCallback: async (dto: GoogleCallbackDto) => {
    const res = await apiClient.post<AuthOut>(
      "/v1/auth/google/callback",
      dto,
      { auth: false }
    );
    return saveAuthOut(res);
  },

  refresh: () =>
    apiClient.post<TokenPair>(
      "/v1/auth/refresh",
      { refreshToken: tokenStore.getRefresh() },
      { auth: false }
    ),

  logout: async () => {
    try {
      const refreshToken = tokenStore.getRefresh();
      if (refreshToken) {
        await apiClient.post("/v1/auth/logout", { refreshToken });
      }
    } finally {
      tokenStore.clear();
    }
  },

  forgotPassword: (dto: ForgotPasswordDto) =>
    apiClient.post<void>("/v1/auth/forgot-password", dto, { auth: false }),

  resetPassword: (dto: ResetPasswordDto) =>
    apiClient.post<{ ok: true }>("/v1/auth/reset-password", dto, {
      auth: false,
    }),

  verifyEmail: (dto: VerifyEmailDto) =>
    apiClient.post<{ ok: true }>("/v1/auth/verify-email", dto, { auth: false }),

  resendOtp: (dto: ResendOtpDto) =>
    apiClient.post<void>("/v1/auth/resend-otp", dto, { auth: false }),

  me: () => apiClient.get<MeOut>("/v1/me"),
};

export const emailVerify = {
  request: () =>
    apiClient.post<EmailVerifyRequestOut>("/v1/me/email/verify/request"),
  /** Public endpoint — do NOT send Bearer. Token from the email link IS the auth. */
  confirmByToken: (token: string) =>
    apiClient.post<{ ok: true }>(
      "/v1/auth/verify-email",
      { token },
      { auth: false }
    ),
};
