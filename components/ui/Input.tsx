import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  hint?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leftIcon, rightIcon, label, hint, id, ...props },
  ref
) {
  const inputId = id ?? React.useId();
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-white/70">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 [&>svg]:size-4">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full h-11 rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40",
            "outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors",
            leftIcon ? "pl-10" : "pl-4",
            rightIcon ? "pr-10" : "pr-4",
            className
          )}
          {...props}
        />
        {rightIcon ? (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 [&>svg]:size-4">
            {rightIcon}
          </span>
        ) : null}
      </div>
      {hint ? <span className="text-[11px] text-white/45">{hint}</span> : null}
    </div>
  );
});

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, id, ...props },
  ref
) {
  const inputId = id ?? React.useId();
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-white/70">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-[12px] bg-white/[0.04] hairline text-[14px] text-white placeholder:text-white/40 p-4",
          "outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors resize-y min-h-[120px]",
          className
        )}
        {...props}
      />
    </div>
  );
});
