"use client";

import { useState } from "react";
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
    <main className="p-8 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">Analyze your company URL</h1>
      <div className="flex gap-2">
        <Input placeholder="https://yourcompany.com" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Button onClick={analyze} disabled={loading || !/^https?:\/\//i.test(url)}>
          {loading ? "Analyzing…" : "Analyze"}
        </Button>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Your profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                Looks like <em>{data.category.replace("_", " ")}</em> in <em>{data.industry}</em>.
                <div>Confidence: <em>{data.confidence}</em></div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {data.activities.map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">{a}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What we’d do next</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {data.path}
                <div className="mt-2">Timeline: <em>{data.timelineBand}</em></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Likely focus areas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm">
                {data.focusAreas.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {data.evidence?.length ? (
                <div className="mt-3 text-xs text-muted-foreground">Evidence: {data.evidence.join(", ")}</div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      {data && !sent && (
        <div className="border rounded-lg p-4 grid gap-3">
          <div className="font-medium">Email me this plan + checklist</div>
          <div className="grid md:grid-cols-3 gap-2">
            <Input placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
            <Input placeholder="Timeframe (e.g., 0–3 months)" value={timeframe} onChange={(e) => setTimeframe(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={sendLead} disabled={!email}>Send</Button>
          </div>
          <div className="text-xs text-muted-foreground">One email. No spam. Delete your data anytime.</div>
        </div>
      )}

      {sent && <div className="text-sm text-green-700">Sent! Check your inbox.</div>}
    </main>
  );
}
