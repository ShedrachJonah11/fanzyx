import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">Welcome back</h1>
        <p className="text-sm text-white/55">Log in to continue to FanzyX.</p>
      </div>

      <button className="btn-google h-11 rounded-[12px] text-sm font-medium transition-colors flex items-center justify-center gap-3">
        <GoogleG />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
        <div className="flex-1 divider" /> or <div className="flex-1 divider" />
      </div>

      <form className="flex flex-col gap-4">
        <Input
          type="email"
          label="Email"
          placeholder="you@fanzyx.app"
          leftIcon={<Mail />}
          autoComplete="email"
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          leftIcon={<Lock />}
          autoComplete="current-password"
        />
        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 text-white/60">
            <input type="checkbox" className="accent-[#6929FC]" /> Remember me
          </label>
          <Link href="/forgot-password" className="text-white/70 hover:text-white">
            Forgot password?
          </Link>
        </div>
        <Button size="lg" className="w-full">
          Log in
        </Button>
      </form>

      <p className="text-sm text-white/55 text-center">
        New here?{" "}
        <Link href="/signup" className="text-white hover:underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.2l7.9 6.1C12.5 13 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.1-.5-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z" />
      <path fill="#FBBC05" d="M10.6 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.6 2.4 10.8l8.2-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.5-3.5-13.4-8.4l-8.2 6.1C6.7 42.6 14.7 48 24 48z" />
    </svg>
  );
}
