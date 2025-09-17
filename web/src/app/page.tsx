"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Analysis = {
  industry: string;
  category: string;
  confidence: string;
  activities: string[];
  path: string;
  timelineBand: string;
  focusAreas: string[];
  evidence: string[];
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Analysis | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [sent, setSent] = useState(false);
  const [showLead, setShowLead] = useState(false);

  const stage: "idle" | "loading" | "done" = useMemo(() => {
    if (loading) return "loading";
    if (data) return "done";
    return "idle";
  }, [loading, data]);

  async function analyze() {
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  async function sendLead() {
    const payload = { email, role, timeframe, analysis: data, source: location.href };
    const res = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) setSent(true);
  }

  return (
    <main className="relative min-h-dvh bg-muted/10">
      {/* Demo background area: drop a screenshot behind if desired */}
      <div className="pointer-events-none select-none absolute inset-0 bg-gradient-to-b from-background to-muted -z-10" />

      {/* Floating pop-up container */}
      <div
        className={
          `fixed bottom-6 transition-all duration-500 z-50 ` +
          (stage === "done" ? "right-6 left-auto translate-x-0" : "left-1/2 -translate-x-1/2")
        }
      >
        <Card className="w-[380px] shadow-xl border-border">
          {stage !== "done" && (
            <>
              <CardHeader>
                <CardTitle className="text-base">Input your company URL to find out if we can help you.</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="flex gap-2">
                  <Input placeholder="https://yourcompany.com" value={url} onChange={(e) => setUrl(e.target.value)} />
                  <Button onClick={analyze} disabled={loading || !/^https?:\/\//i.test(url)}>
                    Analyze
                  </Button>
                </div>
                {stage === "loading" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-muted-foreground/50 border-t-transparent animate-spin" />
                    Thinking… checking your site and mapping to Thistle’s services
                  </div>
                )}
              </CardContent>
            </>
          )}

          {stage === "done" && data && (
            <CardContent className="grid gap-3 p-4">
              <div className="text-sm text-muted-foreground">We scanned your site and found:</div>
              <div className="text-sm">
                Looks like <em>{data.category.replace("_", " ")}</em> in <em>{data.industry}</em>.
                <div>Confidence: <em>{data.confidence}</em></div>
              </div>
              <div className="text-xs text-muted-foreground">Focus areas:</div>
              <div className="flex flex-wrap gap-1">
                {data.focusAreas.map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">{f}</span>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button asChild>
                  <a href="https://www.thistleinitiatives.co.uk/contact" target="_blank" rel="noreferrer">Book a call</a>
                </Button>
                <Button variant="secondary" onClick={() => setShowLead((v) => !v)}>
                  Get an email from us
                </Button>
              </div>

              {showLead && !sent && (
                <div className="mt-2 grid gap-2">
                  <Input placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
                    <Input placeholder="Timeframe (e.g., 0–3 months)" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} />
                  </div>
                  <Button onClick={sendLead} disabled={!email}>Send plan</Button>
                  <div className="text-[11px] text-muted-foreground">One email. No spam. Delete your data anytime.</div>
                </div>
              )}

              {sent && <div className="text-sm text-green-700">Sent! Check your inbox.</div>}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Optional: keep a simple page header for local testing */}
      <div className="p-8 text-center text-sm text-muted-foreground">Local demo — press Analyze to see the panel slide to the right.</div>
    </main>
  );
}
