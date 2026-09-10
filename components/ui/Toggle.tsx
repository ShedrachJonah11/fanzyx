"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type BaseProps = {
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  id?: string;
};

type ControlledProps = BaseProps & {
  on: boolean;
  onChange: (next: boolean) => void;
  defaultOn?: never;
};

type UncontrolledProps = BaseProps & {
  defaultOn?: boolean;
  on?: never;
  onChange?: (next: boolean) => void;
};

export type ToggleProps = ControlledProps | UncontrolledProps;

/**
 * Sizes are lifted from the original NightModeSwitch design.
 * - md (default): 22×40 track, 18px knob — the "perfect" pill.
 * - sm: proportionally scaled — 20×36 track, 16px knob.
 */
const SIZE = {
  sm: {
    track: "h-5 w-9",
    knob: "size-4",
    knobOn: "translate-x-[18px]",
    knobOff: "translate-x-0.5",
  },
  md: {
    track: "h-[22px] w-10",
    knob: "size-[18px]",
    knobOn: "translate-x-[20px]",
    knobOff: "translate-x-0.5",
  },
} as const;

/**
 * Pill-style toggle switch matching the FanzyX brand.
 * - Controlled: pass `on` + `onChange`.
 * - Uncontrolled: pass `defaultOn`; `onChange` fires on user change.
 * - Row layout: pass `label` (and optional `description`) to render a labelled row.
 * - Bare switch: omit `label` and place it inline with your own label.
 */
export function Toggle(props: ToggleProps) {
  const {
    label,
    description,
    disabled,
    size = "md",
    className,
    id,
  } = props;

  const controlled = "on" in props && props.on !== undefined;
  const [internal, setInternal] = useState<boolean>(
    "defaultOn" in props ? !!props.defaultOn : false
  );
  const on = controlled ? (props.on as boolean) : internal;

  const handleToggle = () => {
    if (disabled) return;
    const next = !on;
    if (!controlled) setInternal(next);
    props.onChange?.(next);
  };

  const s = SIZE[size];
  const switchEl = (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={typeof label === "string" ? label : undefined}
      id={id}
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors shrink-0 outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--brand-violet)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        s.track,
        on ? "bg-gradient-brand" : "bg-white/[0.12]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "absolute rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out",
          s.knob,
          on ? s.knobOn : s.knobOff
        )}
      />
    </button>
  );

  if (!label) return <span className={className}>{switchEl}</span>;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2.5",
        className
      )}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-white/85">{label}</span>
        {description ? (
          <span className="text-xs text-white/50 mt-0.5">{description}</span>
        ) : null}
      </div>
      {switchEl}
    </div>
  );
}
