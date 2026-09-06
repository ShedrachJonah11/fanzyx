"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageTransition } from "@/components/PageTransition";
import { creators } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidePanel = pathname === "/signup" || pathname === "/login";

  return (
    <div
      className={cn(
        "min-h-screen bg-app",
        showSidePanel ? "grid lg:grid-cols-2" : "flex flex-col"
      )}
    >
      <div className="flex flex-col p-6 sm:p-10 relative flex-1">
        <div className="mb-8 flex items-center justify-between">
          <Logo size="md" />
          <ThemeToggle />
        </div>
        <div className="flex-1 flex flex-col justify-center items-center overflow-hidden">
          <div className="w-full max-w-sm">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
        <div className="text-center text-xs text-white/40 mt-8">
          © {new Date().getFullYear()} FanzyX ·{" "}
          <Link href="/" className="hover:text-white/70">
            Home
          </Link>
        </div>
      </div>

      {showSidePanel ? <SidePanel /> : null}
    </div>
  );
}

function SidePanel() {
  return (
    <aside className="hidden lg:flex relative overflow-hidden border-l border-white/[0.06]">
      {/* Ambient gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 50% at 20% 15%, rgba(105,41,252,0.45), transparent 70%), radial-gradient(55% 45% at 85% 20%, rgba(253,35,167,0.32), transparent 70%), radial-gradient(70% 55% at 50% 100%, rgba(67,64,250,0.28), transparent 70%), linear-gradient(180deg, #0B0B14, #07070A)",
        }}
      />

      {/* Faint dot texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative flex-1 flex flex-col justify-between p-10 xl:p-14">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 self-start rounded-full glass px-3 py-1.5 text-[11px] text-white/80 uppercase tracking-widest">
          <Sparkles className="size-3.5 text-[#FD23A7]" />
          Premium creator platform
        </div>

        {/* Headline block */}
        <div className="max-w-xl flex flex-col gap-6">
          <h2 className="text-4xl xl:text-[52px] leading-[1.05] font-semibold tracking-tight text-white">
            Back the{" "}
            <span className="text-gradient-brand">creators</span>
            <br />
            you love the most.
          </h2>
          <p className="text-[15px] xl:text-base text-white/70 leading-relaxed max-w-lg">
            Sign up to subscribe to your favourite creators, unlock exclusive posts, and be
            part of a community built on real support.
          </p>
        </div>

        {/* Social proof */}
        <div className="flex items-center gap-4 text-white/60">
          <div className="flex -space-x-2">
            {creators.slice(0, 5).map((c) => (
              <span
                key={c.id}
                className="size-8 rounded-full ring-2 ring-[#07070A]"
                style={{ backgroundImage: c.avatarGradient }}
              />
            ))}
          </div>
          <span className="text-xs">
            <span className="text-white font-medium">2,000+ creators</span> earning on FanzyX.
          </span>
        </div>
      </div>
    </aside>
  );
}
