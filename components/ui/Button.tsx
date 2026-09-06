import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-brand text-white shadow-[0_10px_30px_-12px_rgba(105,41,252,0.55)] hover:opacity-95 active:opacity-90",
  secondary:
    "bg-white/[0.06] text-white hairline hover:bg-white/[0.1]",
  ghost:
    "text-white/80 hover:text-white hover:bg-white/[0.06]",
  outline:
    "border border-white/15 text-white hover:bg-white/[0.06]",
  danger:
    "bg-red-500/90 text-white hover:bg-red-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[10px]",
  md: "h-11 px-5 text-sm rounded-[12px]",
  lg: "h-12 px-6 text-[15px] rounded-[14px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type LinkButtonProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & {
    href: string;
  };

export function Button(props: ButtonProps | LinkButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    leftIcon,
    rightIcon,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  const content = (
    <>
      {leftIcon ? <span className="shrink-0 [&>svg]:size-4">{leftIcon}</span> : null}
      <span>{children}</span>
      {rightIcon ? <span className="shrink-0 [&>svg]:size-4">{rightIcon}</span> : null}
    </>
  );

  if ("href" in props && props.href) {
    const { href, ...anchorRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}
