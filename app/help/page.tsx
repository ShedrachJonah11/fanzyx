import Link from "next/link";
import {
  BookOpen,
  CreditCard,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  Search,
  Shield,
  User,
} from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Card, CardBody } from "@/components/ui/Card";

const categories = [
  { icon: User, title: "Account", body: "Signing up, profile, and login help." },
  { icon: CreditCard, title: "Billing", body: "Subscriptions, payments, and refunds." },
  { icon: BookOpen, title: "Creators", body: "Publishing, earnings, and payouts." },
  { icon: Shield, title: "Safety", body: "Reporting, blocking, and privacy." },
  { icon: MessageSquare, title: "Community", body: "Guidelines and moderation." },
  { icon: LifeBuoy, title: "Contact us", body: "Talk to the FanzyX team." },
];

const faqs = [
  {
    q: "How do I subscribe to a creator?",
    a: "Open a creator's profile and tap Subscribe. You'll be charged monthly and can cancel anytime from Settings → Subscription.",
  },
  {
    q: "When do creators get paid?",
    a: "Payouts run on a monthly cycle. Balances become available 6 days after each cycle closes.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to Subscriptions → pick a creator → Manage → Cancel. You'll keep access until the end of the billing cycle.",
  },
  {
    q: "What is a pay-per-view post?",
    a: "A one-time paid unlock for a specific piece of content. You keep access to that post forever.",
  },
];

export default function HelpPage() {
  return (
    <DashboardShell
      variant="fan"
      title="Help Center"
      subtitle="Find answers, guides, and support."
    >
      <div className="surface-card p-5 sm:p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
          <input
            placeholder="Search for a topic, e.g. 'refund'"
            className="w-full h-12 rounded-[14px] bg-white/[0.04] hairline text-sm text-white placeholder:text-white/40 pl-11 pr-4 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-colors"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.title}
              href="#"
              className="surface-card p-5 flex items-start gap-4 hover:border-white/15 transition-colors"
            >
              <span className="inline-flex items-center justify-center size-10 rounded-[12px] bg-gradient-brand-soft border border-white/10 text-white/85 shrink-0">
                <Icon className="size-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-white">{c.title}</div>
                <div className="text-xs text-white/60 mt-0.5">{c.body}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="size-4 text-white/70" />
          <h2 className="text-lg font-semibold text-white">Frequently asked</h2>
        </div>
        <Card>
          <CardBody className="p-0">
            <ul>
              {faqs.map((f, i) => (
                <li
                  key={i}
                  className="px-5 py-4 border-t border-white/[0.05] first:border-t-0"
                >
                  <div className="text-sm font-medium text-white">{f.q}</div>
                  <div className="text-sm text-white/65 mt-1 leading-relaxed">{f.a}</div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>
    </DashboardShell>
  );
}
