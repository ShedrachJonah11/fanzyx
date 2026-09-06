import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Explore", href: "/explore" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Creators",
    links: [
      { label: "Start creating", href: "/signup" },
      { label: "Creator dashboard", href: "/dashboard" },
      { label: "Payouts", href: "/dashboard/earnings" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Guidelines", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Logo size="md" />
            <p className="text-sm text-white/60 max-w-xs">
              A premium creator platform. Your fans. Your content. Your space.
            </p>
          </div>
          {columns.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <span className="text-xs uppercase tracking-wider text-white/45 font-medium">
                {c.title}
              </span>
              <ul className="flex flex-col gap-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/75 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-white/45">
            © {new Date().getFullYear()} FanzyX. All rights reserved.
          </span>
          <span className="text-xs text-white/45">Made for creators.</span>
        </div>
      </div>
    </footer>
  );
}
