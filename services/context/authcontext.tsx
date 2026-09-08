"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  setOnAuthExpired,
  setOnOnboardingRequired,
  tokenStore,
} from "../apiClient";
import { auth as authApi } from "../modules/auth";
import { users as usersApi } from "../modules/users";
import type {
  CreatorFlowResponse,
  GoogleAuthDto,
  GoogleCallbackDto,
  LoginDto,
  MeOut,
  SignupCreatorPasswordDto,
  SignupCreatorStartDto,
  SignupCreatorVerifyDto,
  SignupFanDto,
  UpdateMeIn,
} from "../dtos";

export interface AuthContextValue {
  user: MeOut | null;
  loading: boolean;
  error: ApiError | null;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<MeOut>;
  loginWithGoogle: (dto: GoogleAuthDto) => Promise<MeOut>;
  loginWithGoogleCallback: (dto: GoogleCallbackDto) => Promise<MeOut>;
  signupFan: (dto: SignupFanDto) => Promise<MeOut>;
  signupCreatorStart: (
    dto: SignupCreatorStartDto
  ) => Promise<CreatorFlowResponse>;
  signupCreatorVerify: (
    dto: SignupCreatorVerifyDto
  ) => Promise<CreatorFlowResponse>;
  signupCreatorPassword: (dto: SignupCreatorPasswordDto) => Promise<MeOut>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateMe: (patch: UpdateMeIn) => Promise<MeOut>;
  confirmAge: () => Promise<MeOut>;
  deleteMe: () => Promise<void>;
  setUser: (user: MeOut | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const router = useRouter();

  useEffect(() => {
    setOnAuthExpired((nextPath) => {
      setUser(null);
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    });
    setOnOnboardingRequired((code) => {
      if (typeof window !== "undefined") {
        // Deferred import to avoid pulling sonner into the module graph here.
        import("sonner").then(({ toast }) => {
          toast.info(
            code === "age_required"
              ? "Confirm you're 18+ to continue."
              : "Finish setting up your creator space to continue."
          );
        });
      }
      if (!window.location.pathname.startsWith("/onboarding")) {
        router.push("/onboarding/creator");
      }
    });
  }, [router]);

  const load = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      setError(null);
    } catch (e) {
      if (e instanceof ApiError) setError(e);
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const login = useCallback(async (dto: LoginDto) => {
    const res = await authApi.login(dto);
    setUser(res.user);
    return res.user;
  }, []);

  const loginWithGoogle = useCallback(async (dto: GoogleAuthDto) => {
    const res = await authApi.google(dto);
    setUser(res.user);
    return res.user;
  }, []);

  const loginWithGoogleCallback = useCallback(async (dto: GoogleCallbackDto) => {
    const res = await authApi.googleCallback(dto);
    setUser(res.user);
    return res.user;
  }, []);

  const signupFan = useCallback(async (dto: SignupFanDto) => {
    const res = await authApi.signupFan(dto);
    setUser(res.user);
    return res.user;
  }, []);

  const signupCreatorStart = useCallback((dto: SignupCreatorStartDto) => {
    return authApi.signupCreatorStart(dto);
  }, []);

  const signupCreatorVerify = useCallback((dto: SignupCreatorVerifyDto) => {
    return authApi.signupCreatorVerify(dto);
  }, []);

  const signupCreatorPassword = useCallback(
    async (dto: SignupCreatorPasswordDto) => {
      const res = await authApi.signupCreatorPassword(dto);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const updateMe = useCallback(async (patch: UpdateMeIn) => {
    const me = await usersApi.update(patch);
    setUser(me);
    return me;
  }, []);

  const confirmAge = useCallback(async () => {
    const me = await usersApi.confirmAge();
    setUser(me);
    return me;
  }, []);

  const deleteMe = useCallback(async () => {
    await usersApi.deleteMe();
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: user !== null,
      login,
      loginWithGoogle,
      loginWithGoogleCallback,
      signupFan,
      signupCreatorStart,
      signupCreatorVerify,
      signupCreatorPassword,
      logout,
      refresh: load,
      updateMe,
      confirmAge,
      deleteMe,
      setUser,
    }),
    [
      user,
      loading,
      error,
      login,
      loginWithGoogle,
      loginWithGoogleCallback,
      signupFan,
      signupCreatorStart,
      signupCreatorVerify,
      signupCreatorPassword,
      logout,
      load,
      updateMe,
      confirmAge,
      deleteMe,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function useCurrentUser(): MeOut | null {
  return useAuth().user;
}

export function useIsAuthenticated(): boolean {
  return useAuth().isAuthenticated;
}

export function useIsCreator(): boolean {
  const user = useCurrentUser();
  return user?.role === "creator";
}
