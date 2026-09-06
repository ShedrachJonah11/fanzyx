import { ArrowRight, DollarSign, Heart, Sparkles, TrendingUp, Users } from "lucide-react";
import { Navbar } from "@/components/shell/Navbar";
import { Footer } from "@/components/shell/Footer";
import { Button } from "@/components/ui/Button";
import { creators } from "@/lib/mock-data";
import { formatCompact } from "@/lib/utils";

export default function LandingPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden hero-glow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 relative z-10">
          <div className="grid gap-14 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 flex flex-col gap-6">
              <span className="inline-flex items-center gap-2 self-start rounded-full bg-white/[0.05] hairline px-3 py-1.5 text-xs text-white/70">
                <Sparkles className="size-3.5 text-[#FD23A7]" />
                New — creator earnings up to 90%
              </span>
              <h1 className="text-[42px] sm:text-6xl lg:text-[64px] font-semibold tracking-tight text-white leading-[1.05]">
                Your favorite <br />
                creators,{" "}
                <span className="text-gradient-brand">closer than ever.</span>
              </h1>
              <p className="text-[17px] sm:text-lg text-white/65 max-w-xl leading-relaxed">
                Discover creators you love, subscribe to exclusive content, and support
                the people you follow. A premium creator platform, built for connection.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Button href="/signup" size="lg" rightIcon={<ArrowRight />}>
                  Join FanzyX
                </Button>
                <Button href="/onboarding/creator" size="lg" variant="secondary">
                  Start creating
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {creators.slice(0, 4).map((c) => (
                      <span
                        key={c.id}
                        className="size-7 rounded-full ring-2 ring-[#07070A]"
                        style={{ backgroundImage: c.avatarGradient }}
                      />
                    ))}
                  </div>
                  <span>Trusted by 2,000+ creators</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Feature bullets */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex flex-col items-center text-center gap-3 mb-12">
          <span className="text-xs uppercase tracking-widest text-white/45">How it works</span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Everything you need to grow.
          </h2>
          <p className="text-white/60 max-w-xl">
            Powerful tools for creators, a premium experience for fans. All in one place.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Users className="size-5" />}
            title="Build your audience"
            body="A beautiful profile with tools built for growth. Verified badges, categories, and discovery."
          />
          <FeatureCard
            icon={<Heart className="size-5" />}
            title="Publish exclusive content"
            body="Free, subscriber-only, or pay-per-view. Choose the visibility that fits every post."
          />
          <FeatureCard
            icon={<DollarSign className="size-5" />}
            title="Get paid, monthly"
            body="Predictable recurring subscriptions, tips, and PPV. Withdraw to your bank anytime."
          />
        </div>
      </section>

      {/* Creator CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="relative overflow-hidden surface-elev rounded-[28px] p-8 sm:p-14">
          <div
            className="absolute -top-1/2 -right-1/4 size-[600px] rounded-full opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(105,41,252,0.4), transparent 60%)",
            }}
          />
          <div className="relative grid gap-6 lg:grid-cols-2 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-white/45">
                For creators
              </span>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mt-2">
                Turn your fans into <br /> recurring income.
              </h2>
              <p className="text-white/65 mt-4 max-w-md">
                Launch your creator space in minutes. Set your price, publish exclusive
                content, and get paid monthly.
              </p>
            </div>
            <div className="flex flex-col gap-4 lg:items-end">
              <div className="flex items-center gap-6">
                <MiniStat icon={<TrendingUp className="size-4" />} label="Avg. MRR growth" value="+18%/mo" />
                <MiniStat icon={<Users className="size-4" />} label="Active fans" value={formatCompact(184000)} />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button href="/onboarding/creator" size="lg" rightIcon={<ArrowRight />}>
                  Start creating
                </Button>
                <Button href="/explore" size="lg" variant="secondary">
                  Explore creators
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="surface-card p-6 flex flex-col gap-4">
      <span className="inline-flex items-center justify-center size-11 rounded-[12px] bg-gradient-brand-soft border border-white/10 text-white">
        {icon}
      </span>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{body}</p>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center justify-center size-9 rounded-full bg-white/[0.06] hairline text-white/70">
        {icon}
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase text-white/45 tracking-wider">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}

function HeroPreview() {
  const preview = creators.slice(0, 3);
  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gradient-brand-soft blur-3xl opacity-70" />
      <div className="relative surface-elev rounded-[24px] p-4 sm:p-5 glow-brand">
        {/* faux top bar */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
            <span className="size-2.5 rounded-full bg-white/15" />
          </div>
          <span className="text-[10px] text-white/40 font-mono">fanzyx.app / explore</span>
          <span className="opacity-0">.</span>
        </div>

        <div className="grid gap-3 grid-cols-2">
          {preview.map((c, i) => (
            <div
              key={c.id}
              className={`surface-card overflow-hidden ${i === 0 ? "col-span-2" : ""}`}
            >
              <div
                className={`relative w-full ${i === 0 ? "h-32" : "h-20"}`}
                style={{ backgroundImage: c.coverGradient }}
              />
              <div className="p-3 flex items-center gap-3">
                <span
                  className="size-9 rounded-full ring-2 ring-[#0E0E14] shrink-0"
                  style={{ backgroundImage: c.avatarGradient }}
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-white truncate">{c.name}</span>
                  <span className="text-[11px] text-white/50 truncate">@{c.username}</span>
                </div>
                <span className="text-[11px] text-white bg-gradient-brand rounded-full px-2 py-1 shrink-0 font-medium">
                  Subscribe
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
