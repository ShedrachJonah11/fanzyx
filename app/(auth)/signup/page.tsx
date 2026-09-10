import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function SignupChoicePage({
  searchParams,
}: PageProps<"/signup">) {
  const params = await searchParams;
  const rawEmail = params?.email;
  const email = typeof rawEmail === "string" ? rawEmail : undefined;
  const rawRef = params?.ref;
  const ref = typeof rawRef === "string" ? rawRef : undefined;
  const qs = new URLSearchParams();
  if (email) qs.set("email", email);
  if (ref) qs.set("ref", ref);
  const q = qs.toString() ? `?${qs.toString()}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Join FanzyX
        </h1>
        <p className="text-sm text-white/55">
          Pick how you want to use FanzyX. You can always add the other role later.
        </p>
      </div>


      <div className="flex flex-col gap-3">
        <ChoiceCard
          href={`/signup/fan${q}`}
          eyebrow="I'm here to discover"
          title="Join as a fan"
          body="Follow your favourite creators and unlock subscriber-only content."
          icon={<Compass className="size-5" />}
        />
        <ChoiceCard
          href={`/signup/creator${q}`}
          eyebrow="I want to publish & earn"
          title="Join as a creator"
          body="Build an audience, publish exclusive posts, and get paid monthly."
          icon={<Sparkles className="size-5" />}
          highlight
        />
      </div>

      <p className="text-sm text-white/55 text-center">
        Have an account?{" "}
        <Link href="/login" className="text-white hover:underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}

function ChoiceCard({
  href,
  eyebrow,
  title,
  body,
  icon,
  highlight = false,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-start gap-4 rounded-[16px] p-5 transition-all border",
        highlight
          ? "bg-gradient-brand-soft border-white/15 hover:border-white/25 shadow-[0_10px_40px_-16px_rgba(105,41,252,0.45)]"
          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05] hover:border-white/15"
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center size-11 rounded-[12px] shrink-0",
          highlight
            ? "bg-gradient-brand text-white shadow-[0_8px_24px_-8px_rgba(105,41,252,0.6)]"
            : "bg-white/[0.06] hairline text-white/80"
        )}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="text-[11px] uppercase tracking-wider text-white/55">
          {eyebrow}
        </span>
        <div className="mt-0.5 text-[15px] font-semibold text-white">{title}</div>
        <p className="text-xs text-white/60 mt-1 leading-relaxed">{body}</p>
      </div>
      <ArrowRight className="size-4 text-white/50 mt-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
