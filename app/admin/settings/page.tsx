"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { admin } from "@/services/modules/admin";
import { ApiError } from "@/services/apiClient";
import type {
  PlatformSettingsOut,
  PlatformSettingsPatch,
} from "@/services/dtos";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

/**
 * Basis points ↔ percent conversions. 1% = 100 bp; 10% = 1000 bp.
 */
const bpToPct = (bp: number) => bp / 100;
const pctToBp = (pct: number) => Math.round(pct * 100);
const koboToNaira = (k: number) => Math.round(k / 100);
const nairaToKobo = (n: number) => Math.round(n * 100);

type FormState = {
  feeSubscriptionPct: string;
  feeTipPct: string;
  feePpvPct: string;
  minTopupNaira: string;
  minPayoutNaira: string;
  minTipNaira: string;
};

function toForm(s: PlatformSettingsOut): FormState {
  return {
    feeSubscriptionPct: String(bpToPct(s.feeBpSubscription)),
    feeTipPct: String(bpToPct(s.feeBpTip)),
    feePpvPct: String(bpToPct(s.feeBpPpv)),
    minTopupNaira: String(koboToNaira(s.minTopupKobo)),
    minPayoutNaira: String(koboToNaira(s.minPayoutKobo)),
    minTipNaira: String(koboToNaira(s.minTipKobo)),
  };
}

function toPatch(f: FormState, base: PlatformSettingsOut): PlatformSettingsPatch {
  const patch: PlatformSettingsPatch = {};
  const map: [keyof FormState, keyof PlatformSettingsOut, (v: number) => number][] =
    [
      ["feeSubscriptionPct", "feeBpSubscription", pctToBp],
      ["feeTipPct", "feeBpTip", pctToBp],
      ["feePpvPct", "feeBpPpv", pctToBp],
      ["minTopupNaira", "minTopupKobo", nairaToKobo],
      ["minPayoutNaira", "minPayoutKobo", nairaToKobo],
      ["minTipNaira", "minTipKobo", nairaToKobo],
    ];
  for (const [formKey, serverKey, convert] of map) {
    const nextRaw = Number(f[formKey]);
    if (!Number.isFinite(nextRaw) || nextRaw < 0) continue;
    const nextVal = convert(nextRaw);
    if (nextVal !== base[serverKey]) {
      (patch as Record<string, number>)[serverKey as string] = nextVal;
    }
  }
  return patch;
}

export default function AdminPlatformSettingsPage() {
  const [server, setServer] = useState<PlatformSettingsOut | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await admin.platformSettings();
        if (cancelled) return;
        setServer(s);
        setForm(toForm(s));
      } catch (e) {
        if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = server && form ? toPatch(form, server) : {};
  const dirty = Object.keys(patch).length > 0;

  const save = async () => {
    if (!dirty || saving || !server) return;
    setSaving(true);
    try {
      const s = await admin.updatePlatformSettings(patch);
      setServer(s);
      setForm(toForm(s));
      toast.success("Settings updated");
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.detail ?? "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div>
        <h1 className="text-[22px] font-bold text-white">Platform settings</h1>
        <p className="text-sm text-white/60 mt-1">
          Fees and minimums applied across the platform.
        </p>
      </div>

      {loading || !form || !server ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-11 rounded-[12px]" />
          <Skeleton className="h-11 rounded-[12px]" />
          <Skeleton className="h-11 rounded-[12px]" />
        </div>
      ) : (
        <>
          <section className="rounded-[14px] hairline bg-white/[0.03] p-5 flex flex-col gap-4">
            <h2 className="text-[14px] font-semibold text-white">Fees</h2>
            <PctField
              label="Subscription fee"
              value={form.feeSubscriptionPct}
              onChange={(v) =>
                setForm({ ...form, feeSubscriptionPct: v })
              }
            />
            <PctField
              label="Tip fee"
              value={form.feeTipPct}
              onChange={(v) => setForm({ ...form, feeTipPct: v })}
            />
            <PctField
              label="PPV fee"
              value={form.feePpvPct}
              onChange={(v) => setForm({ ...form, feePpvPct: v })}
            />
          </section>

          <section className="rounded-[14px] hairline bg-white/[0.03] p-5 flex flex-col gap-4">
            <h2 className="text-[14px] font-semibold text-white">Minimums</h2>
            <NairaField
              label="Minimum top-up"
              value={form.minTopupNaira}
              onChange={(v) => setForm({ ...form, minTopupNaira: v })}
            />
            <NairaField
              label="Minimum payout"
              value={form.minPayoutNaira}
              onChange={(v) => setForm({ ...form, minPayoutNaira: v })}
            />
            <NairaField
              label="Minimum tip"
              value={form.minTipNaira}
              onChange={(v) => setForm({ ...form, minTipNaira: v })}
            />
          </section>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/50">
              Last updated{" "}
              {new Date(server.updatedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {server.updatedByUserId ? ` · by ${server.updatedByUserId}` : ""}
            </span>
            <Button onClick={save} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function PctField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="text-[13px] text-white/75 w-40">{label}</span>
      <div className="relative flex-1 max-w-[160px]">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-3 pr-8 outline-none focus:border-white/25 focus:bg-white/[0.06] tabular-nums"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-[13px]">
          %
        </span>
      </div>
    </label>
  );
}

function NairaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="text-[13px] text-white/75 w-40">{label}</span>
      <div className="relative flex-1 max-w-[220px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-[13px]">
          ₦
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step="50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white pl-7 pr-3 outline-none focus:border-white/25 focus:bg-white/[0.06] tabular-nums"
        />
      </div>
    </label>
  );
}
