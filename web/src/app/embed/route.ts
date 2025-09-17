import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export function GET(_req: NextRequest) {
  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Overlay</title>
      <style>
        html,body{margin:0;padding:0;background:#0f1630;color:#e8eeff;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
      </style>
    </head>
    <body>
      <script src="/overlay.js" defer></script>
    </body>
  </html>`;

  const res = new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });

  // Ensure no frame blocking headers
  res.headers.delete("x-frame-options");
  // Allow embedding from Thistle (adjust list as needed)
  res.headers.set(
    "content-security-policy",
    "frame-ancestors 'self' https://www.thistleinitiatives.co.uk https://thistleinitiatives.co.uk"
  );

  return res;
}


