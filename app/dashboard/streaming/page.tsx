import { Radio, Video } from "lucide-react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";

export default function StreamingPage() {
  return (
    <DashboardShell
      title="Streamings"
      subtitle="Go live for your subscribers or schedule a session."
      action={
        <Button leftIcon={<Radio />}>Go live</Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        <StatCard label="Total streams" value="24" delta="+3 this month" />
        <StatCard label="Avg. viewers" value="412" delta="+18%" />
        <StatCard label="Watch time" value="128h" delta="+22h" />
        <StatCard label="Tips earned" value="₦86,500" delta="+₦12k" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <span className="text-xs text-white/55">Camera off</span>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="aspect-video rounded-[14px] bg-white/[0.04] hairline flex flex-col items-center justify-center gap-3">
              <span className="inline-flex items-center justify-center size-14 rounded-full bg-gradient-brand-soft border border-white/10">
                <Video className="size-6 text-white/70" />
              </span>
              <span className="text-sm text-white/70">Your stream preview will appear here.</span>
              <Button variant="secondary" size="sm">Test camera</Button>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scheduled streams</CardTitle>
          </CardHeader>
          <CardBody className="pt-0 flex flex-col gap-3">
            {[
              { title: "Sunday listening party", when: "Sun · 8:00 PM" },
              { title: "Q&A with subscribers", when: "Wed · 6:00 PM" },
              { title: "New EP breakdown", when: "Fri · 9:00 PM" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 border-t border-white/[0.05] first:border-t-0 first:pt-0">
                <div>
                  <div className="text-sm text-white font-medium">{s.title}</div>
                  <div className="text-xs text-white/50 mt-0.5">{s.when}</div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" className="w-full mt-1">
              Schedule new
            </Button>
          </CardBody>
        </Card>
      </div>
    </DashboardShell>
  );
}
