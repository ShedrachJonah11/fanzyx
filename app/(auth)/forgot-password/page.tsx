import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-white/55">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <Input
          type="email"
          label="Email"
          placeholder="you@fanzyx.app"
          leftIcon={<Mail />}
        />
        <Button size="lg" className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="text-sm text-white/55 text-center">
        Remember your password?{" "}
        <Link href="/login" className="text-white hover:underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
