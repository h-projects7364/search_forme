import { NextResponse, type NextRequest } from "next/server";

// Allow embedding this app inside specific external sites (e.g., Thistle)
// by removing X-Frame-Options and setting a CSP frame-ancestors policy.
export function middleware(_req: NextRequest) {
  const res = NextResponse.next();

  // Remove legacy blocking header if present
  res.headers.delete("x-frame-options");

  // Allow only these ancestors to frame this app. Add more allowed hosts as needed.
  const allowedAncestors = [
    "'self'",
    "https://www.thistleinitiatives.co.uk",
    "https://thistleinitiatives.co.uk",
  ];

  // Preserve any existing CSP by appending/merging frame-ancestors where possible
  const existingCsp = res.headers.get("content-security-policy");
  if (existingCsp && /frame-ancestors/i.test(existingCsp)) {
    // Replace any existing frame-ancestors directive
    const updated = existingCsp
      .replace(/frame-ancestors[^;]*;?/i, "")
      .trim();
    const finalCsp = `${updated}${updated.endsWith(";") || updated === "" ? "" : ";"} frame-ancestors ${allowedAncestors.join(" ")}`.trim();
    res.headers.set("content-security-policy", finalCsp);
  } else {
    const fa = `frame-ancestors ${allowedAncestors.join(" ")}`;
    res.headers.set(
      "content-security-policy",
      existingCsp ? `${existingCsp}; ${fa}` : fa
    );
  }

  return res;
}

// Run for all routes
export const config = {
  matcher: ["/:path*"],
};


