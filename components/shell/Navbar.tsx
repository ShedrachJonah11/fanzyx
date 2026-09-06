"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/explore", label: "Explore" },
  { href: "/explore?tab=creators", label: "Creators" },
  { href: "/#how-it-works", label: "How it works" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4">
        <nav className="glass rounded-full flex items-center justify-between h-14 pl-5 pr-2">
          <div className="flex items-center gap-8">
            <Logo size="md" />
            <ul className="hidden md:flex items-center gap-1">
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={cn(
                        "px-3 py-2 text-sm text-white/70 hover:text-white rounded-full transition-colors",
                        active && "text-white"
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle className="!size-9" />
            <Button href="/login" variant="ghost" size="sm">
              Log in
            </Button>
            <Button href="/signup" size="sm">
              Join FanzyX
            </Button>
          </div>
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle className="!size-9" />
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center size-10 rounded-full text-white/80 hover:text-white hover:bg-white/[0.08]"
              aria-label="Open menu"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {open ? (
          <div className="md:hidden mt-2 glass rounded-2xl p-3 flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-xl text-sm text-white/80 hover:bg-white/[0.06]"
              >
                {l.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-white/[0.06]">
              <Button href="/login" variant="secondary" size="sm">
                Log in
              </Button>
              <Button href="/signup" size="sm">
                Join FanzyX
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
