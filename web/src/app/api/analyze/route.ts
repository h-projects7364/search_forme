import { NextRequest, NextResponse } from "next/server";

type Analysis = {
  industry: string;
  category: "payment_services" | "investments" | "credit" | "general_insurance" | "digital_assets" | "mortgages" | string;
  confidence: "high" | "medium" | "low";
  activities: string[];
  path: string;
  timelineBand: string;
  focusAreas: string[];
  evidence: string[];
};

const CANNED: Record<string, Analysis> = {
  "openpayd.com": {
    industry: "FinTech",
    category: "payment_services",
    confidence: "high",
    activities: ["EMI", "Issuing", "IBAN", "SEPA"],
    path: "FCA Authorisation as EMI",
    timelineBand: "16–24 weeks",
    focusAreas: ["Safeguarding", "Transaction monitoring", "SM&CR"],
    evidence: ["‘IBAN accounts’", "‘SEPA transfers’", "‘payments platform’"],
  },
  "revolut.com": {
    industry: "FinTech",
    category: "payment_services",
    confidence: "high",
    activities: ["Issuing", "Cards", "Accounts"],
    path: "FCA Authorisation / VOP (as applicable)",
    timelineBand: "16–24 weeks",
    focusAreas: ["Safeguarding", "Financial promotions", "Consumer Duty"],
    evidence: ["‘cards’", "‘accounts’"],
  },
  "vertofx.com": {
    industry: "FinTech",
    category: "payment_services",
    confidence: "high",
    activities: ["FX", "Business accounts", "Payments"],
    path: "FCA Authorisation as EMI / API",
    timelineBand: "16–24 weeks",
    focusAreas: ["Safeguarding", "Transaction monitoring", "AML/KYC"],
    evidence: ["‘business accounts’", "‘FX’"],
  },
};

function extractDomain(inputUrl: string): string | null {
  try {
    const u = new URL(inputUrl);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }
    const domain = extractDomain(url);
    if (!domain) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    const known = CANNED[domain];
    if (known) {
      return NextResponse.json(known, { status: 200 });
    }

    // Generic low-confidence fallback
    const fallback: Analysis = {
      industry: "FinServ",
      category: "payment_services",
      confidence: "low",
      activities: [],
      path: "Select a path: EMI / API / MiFID / Credit / GI / Mortgages",
      timelineBand: "8–24 weeks",
      focusAreas: ["Confirm sector", "Define permissions", "Establish AML/FC framework"],
      evidence: ["Meta/title only (no crawl yet)"]
    };
    return NextResponse.json(fallback, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Analyze failed" }, { status: 500 });
  }
}


