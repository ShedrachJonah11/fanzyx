"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  Check,
  DollarSign,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { categories, currentCreator } from "@/lib/mock-data";
import { cn, formatNaira } from "@/lib/utils";

const steps = [
  { id: 1, title: "Profile", icon: UserRound },
  { id: 2, title: "About you", icon: Sparkles },
  { id: 3, title: "Subscription", icon: DollarSign },
  { id: 4, title: "Payouts", icon: Building2 },
  { id: 5, title: "Finish", icon: Check },
];

export default function CreatorOnboardingPage() {
  const [step, setStep] = useState(1);
  const [price, setPrice] = useState(5000);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState<string>("Music");

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="min-h-screen bg-[#07070A] flex flex-col">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <Link href="/dashboard" className="text-xs text-white/55 hover:text-white">
            Skip for now
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-8">
        {/* Stepper */}
        <ol className="flex items-center gap-2 sm:gap-4 mb-8 overflow-x-auto">
          {steps.map((s, i) => {
            const active = s.id === step;
            const done = s.id < step;
            return (
              <li key={s.id} className="flex items-center gap-2 sm:gap-4 shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-8 rounded-full inline-flex items-center justify-center text-xs font-medium transition-colors",
                      active && "bg-gradient-brand text-white",
                      done && "bg-white/10 text-white",
                      !active && !done && "bg-white/[0.04] text-white/50 hairline"
                    )}
                  >
                    {done ? <Check className="size-4" /> : s.id}
                  </span>
                  <span
                    className={cn(
                      "text-xs sm:text-sm whitespace-nowrap",
                      active ? "text-white font-medium" : "text-white/55"
                    )}
                  >
                    {s.title}
                  </span>
                </div>
                {i < steps.length - 1 ? (
                  <span className="w-6 sm:w-10 h-px bg-white/[0.08]" />
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="surface-card p-6 sm:p-8">
          {step === 1 ? (
            <div className="flex flex-col gap-6">
              <Header title="Set up your profile" body="Add a profile image and cover to make your space feel personal." />
              <div className="flex items-center gap-5 flex-wrap">
                <div className="relative">
                  <Avatar name={displayName || "You"} gradient={currentCreator.avatarGradient} size={88} />
                  <button className="absolute -bottom-1 -right-1 size-8 rounded-full bg-white text-black inline-flex items-center justify-center shadow-lg">
                    <Camera className="size-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <div
                    className="h-24 rounded-[16px] hairline relative overflow-hidden"
                    style={{ backgroundImage: currentCreator.coverGradient }}
                  >
                    <button className="absolute right-3 bottom-3 h-9 px-3.5 rounded-full bg-white/90 text-black text-xs font-medium inline-flex items-center gap-1.5">
                      <Camera className="size-3.5" /> Change cover
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Display name" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <Input label="Username" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex flex-col gap-6">
              <Header title="Tell fans about you" body="A short bio helps fans discover and understand what you make." />
              <Textarea label="Bio" placeholder="What kind of content do you create?" value={bio} onChange={(e) => setBio(e.target.value)} />
              <div>
                <label className="text-xs font-medium text-white/70 mb-2 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "h-9 px-4 rounded-full text-[13px] font-medium border transition-colors",
                        c === category
                          ? "bg-white text-black border-white"
                          : "bg-white/[0.04] text-white/75 border-white/10 hover:bg-white/[0.08]"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col gap-6">
              <Header title="Set your subscription price" body="You can change this anytime from your dashboard." />
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-white/70 mb-1.5 block">Monthly price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55">₦</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value) || 0)}
                      className="w-full h-12 rounded-[12px] bg-white/[0.04] hairline text-[15px] text-white pl-8 pr-4 outline-none focus:border-white/25"
                    />
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {[2500, 3500, 5000, 7500, 10000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setPrice(v)}
                        className={cn(
                          "h-8 px-3 rounded-full text-xs border",
                          v === price
                            ? "bg-white text-black border-white"
                            : "bg-white/[0.04] text-white/75 border-white/10 hover:bg-white/[0.08]"
                        )}
                      >
                        {formatNaira(v)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="surface-elev rounded-[16px] p-5 flex flex-col gap-2">
                  <span className="text-xs uppercase text-white/45 tracking-wider">Preview</span>
                  <p className="text-[15px] text-white/85 leading-relaxed">
                    Fans will pay <span className="text-gradient-brand font-semibold">
                      {formatNaira(price)}/month
                    </span> to access your exclusive content.
                  </p>
                  <ul className="mt-2 flex flex-col gap-2 text-sm text-white/75">
                    <li>· Subscriber-only posts</li>
                    <li>· Direct messages</li>
                    <li>· Early access</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="flex flex-col gap-6">
              <Header title="Where should we send your money?" body="Add a bank account for monthly payouts. You can update this later." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Bank" placeholder="Bank name" />
                <Input label="Account number" placeholder="0123456789" />
                <Input label="Account holder" placeholder="Full name as on account" className="sm:col-span-2" />
              </div>
              <div className="rounded-[12px] p-4 bg-white/[0.03] hairline text-xs text-white/60">
                Your payout details are encrypted and never shared with fans.
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <div className="size-16 rounded-full bg-gradient-brand flex items-center justify-center shadow-[0_15px_50px_-10px_rgba(105,41,252,0.7)]">
                <Check className="size-6 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white">You're all set</h2>
              <p className="text-white/60 max-w-md">
                Your creator space is ready. Publish your first post and start growing your audience.
              </p>
              <div className="flex gap-2 mt-2">
                <Button href="/dashboard" size="lg">Go to dashboard</Button>
                <Button href="/dashboard/posts/new" size="lg" variant="secondary">
                  Publish a post
                </Button>
              </div>
            </div>
          ) : null}

          {step !== 5 ? (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.05]">
              <Button variant="ghost" onClick={prev} disabled={step === 1} leftIcon={<ArrowLeft />}>
                Back
              </Button>
              <Button onClick={next} rightIcon={<ArrowRight />}>
                Continue
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Header({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{title}</h2>
      <p className="text-sm text-white/55 mt-1">{body}</p>
    </div>
  );
}
