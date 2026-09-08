import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "You must be 18+ · FanzyX",
};

export default function GoodbyeUnder18Page() {
  return (
    <div className="min-h-screen bg-app flex flex-col">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center">
          <Logo size="md" />
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-lg w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col items-center text-center gap-6">
        <div className="size-16 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center">
          <ShieldAlert className="size-6 text-amber-300" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            You must be 18 or older to use FanzyX.
          </h1>
          <p className="text-white/60 mt-3 leading-relaxed">
            We&apos;ve signed you out. If you&apos;re 18 or older, you can come back and
            confirm your age at any time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button href="/" size="lg">
            Back to home
          </Button>
          <Button href="/login" size="lg" variant="secondary">
            Log back in
          </Button>
        </div>

        <p className="text-xs text-white/40 mt-4">
          Need help?{" "}
          <Link
            href="/help"
            className="text-white/60 hover:text-white underline underline-offset-4"
          >
            Contact support
          </Link>
        </p>
      </main>
    </div>
  );
}
