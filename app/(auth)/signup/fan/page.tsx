"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, AtSign, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

export default function FanSignupPage() {
  const [age18, setAge18] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/signup"
        className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white -mb-1 w-max"
      >
        <ArrowLeft className="size-3.5" /> Change signup type
      </Link>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-semibold text-white tracking-tight">
          Create your fan account
        </h1>
        <p className="text-sm text-white/55">
          Join FanzyX to follow creators and access exclusive content.
        </p>
      </div>

      <button className="btn-google h-11 rounded-[12px] text-sm font-medium transition-colors flex items-center justify-center gap-3">
        <GoogleG />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/40">
        <div className="flex-1 divider" /> or <div className="flex-1 divider" />
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!age18) return;
        }}
      >
        <Input label="Username" placeholder="alexokafor" leftIcon={<AtSign />} />
        <Input type="email" label="Email" placeholder="you@fanzyx.app" leftIcon={<Mail />} />
        <Input
          type="password"
          label="Password"
          placeholder="Create a password"
          leftIcon={<Lock />}
          autoComplete="new-password"
        />

        <LegalBlock
          age18={age18}
          setAge18={setAge18}
          emailOptIn={emailOptIn}
          setEmailOptIn={setEmailOptIn}
          variant="fan"
        />

        <Button size="lg" className="w-full" href={age18 ? "/feed" : undefined} disabled={!age18}>
          Create fan account
        </Button>
      </form>

      <p className="text-sm text-white/55 text-center">
        Have an account?{" "}
        <Link href="/login" className="text-white hover:underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function LegalBlock({
  age18,
  setAge18,
  emailOptIn,
  setEmailOptIn,
  variant,
}: {
  age18: boolean;
  setAge18: (v: boolean) => void;
  emailOptIn: boolean;
  setEmailOptIn: (v: boolean) => void;
  variant: "fan" | "creator";
}) {
  return (
    <div className="flex flex-col gap-3 mt-1">
      <p className="text-[11px] text-white/55 leading-relaxed">
        By signing up you agree to our{" "}
        <Link href="#" className="text-white/85 hover:text-white underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-white/85 hover:text-white underline underline-offset-2">
          Privacy Policy
        </Link>
        , and confirm that you are at least 18 years old.
      </p>

      <div className="rounded-[12px] hairline bg-white/[0.02] p-3">
        <Checkbox
          checked={age18}
          onChange={setAge18}
          label={
            <>
              I confirm that I am at least 18 years old and legally permitted to{" "}
              {variant === "creator" ? "access and upload content" : "access content"} on
              FanzyX. I acknowledge that I have read, understood, and agree to abide by all
              platform rules, community guidelines, and content policies. I understand that
              failure to follow these rules may result in account suspension or termination.
            </>
          }
        />
      </div>

      <Checkbox
        checked={emailOptIn}
        onChange={setEmailOptIn}
        label={
          <>Subscribe to our emails for news, offers, and inspiration—delivered directly to you.</>
        }
      />
    </div>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.2l7.9 6.1C12.5 13 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.1-.5-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.6z" />
      <path fill="#FBBC05" d="M10.6 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.6 2.4 10.8l8.2-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.6-5.9c-2.1 1.4-4.9 2-8.4 2-6.3 0-11.5-3.5-13.4-8.4l-8.2 6.1C6.7 42.6 14.7 48 24 48z" />
    </svg>
  );
}
