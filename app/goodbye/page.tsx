import Link from "next/link";
import { Heart } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Goodbye · FanzyX",
};

export default function GoodbyePage() {
  return (
    <div className="min-h-screen bg-app flex flex-col">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center">
          <Logo size="md" />
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-lg w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center gap-6">
        <div className="size-16 rounded-full bg-gradient-brand flex items-center justify-center shadow-[0_15px_50px_-10px_rgba(105,41,252,0.7)]">
          <Heart className="size-6 text-white" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Your account has been deleted.
          </h1>
          <p className="text-white/60 mt-3 leading-relaxed">
            Thanks for spending time with FanzyX. Your data has been soft-deleted and
            all your sessions have been revoked. If this was a mistake, contact
            support within 30 days to restore your account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button href="/" size="lg">
            Back to home
          </Button>
          <Button href="/signup" size="lg" variant="secondary">
            Create a new account
          </Button>
        </div>

        <p className="text-xs text-white/40 mt-4">
          Need help?{" "}
          <Link href="/help" className="text-white/60 hover:text-white underline underline-offset-4">
            Contact support
          </Link>
        </p>
      </main>
    </div>
  );
}
