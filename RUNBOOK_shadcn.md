### 1) Create a new project from this template
- Copy the repo (or fork/clone) and install:
```bash
npm i
```
- Verify versions in `package.json` (Next 15, React 19, Tailwind v4, ESLint 9) match:
```json
"next": "15.x", "react": "19.x", "tailwindcss": "^4", "eslint": "^9"
```

### 2) Initialize shadcn/ui
```bash
npx shadcn@latest init --yes
```
- This will add required packages and set up the component generator.
- Then add components as needed (example):
```bash
npx shadcn@latest add button input card dialog
```
- These will be copied into `src/components/ui/*` and (usually) `src/lib/utils.ts`.

### 3) Ensure Tailwind v4 is wired for shadcn tokens
- Confirm `src/app/globals.css` begins with:
```css
@import "tailwindcss";
/* animations if you use components that require them */
@plugin "tailwindcss-animate";
```
- Add (or merge) a token set that shadcn components expect:
```css
:root {
  --background: #ffffff;
  --foreground: #0f172a;

  --card: #ffffff;
  --card-foreground: #0f172a;

  --popover: #ffffff;
  --popover-foreground: #0f172a;

  --primary: #0f172a;
  --primary-foreground: #f8fafc;

  --secondary: #f1f5f9;
  --secondary-foreground: #0f172a;

  --muted: #f1f5f9;
  --muted-foreground: #64748b;

  --accent: #f1f5f9;
  --accent-foreground: #0f172a;

  --destructive: #ef4444;
  --destructive-foreground: #f8fafc;

  --border: #e2e8f0;
  --input: #e2e8f0;
  --ring: #0f172a;

  --radius: 0.5rem;
}

/* Optional: dark theme via class strategy (preferred by shadcn) */
.dark {
  --background: #0a0a0a;
  --foreground: #e5e7eb;

  --card: #0a0a0a;
  --card-foreground: #e5e7eb;

  --popover: #0a0a0a;
  --popover-foreground: #e5e7eb;

  --primary: #e5e7eb;
  --primary-foreground: #0a0a0a;

  --secondary: #111827;
  --secondary-foreground: #e5e7eb;

  --muted: #111827;
  --muted-foreground: #9ca3af;

  --accent: #111827;
  --accent-foreground: #e5e7eb;

  --destructive: #7f1d1d;
  --destructive-foreground: #f8fafc;

  --border: #1f2937;
  --input: #1f2937;
  --ring: #e5e7eb;
}

/* Map tokens to Tailwind v4 theme vars (keep your existing entries) */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```
- Keep only one `@theme inline` block; merge values if one already exists.

### 4) Optional: enable class-based dark mode toggle
- Install theme helper:
```bash
npm i next-themes
```
- Create a client wrapper `src/components/theme-provider.tsx`:
```tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
```
- Wrap in `src/app/layout.tsx`:
```tsx
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```
- If you keep your current media-query dark mode instead, skip this step and the `.dark` tokens; shadcn examples assume the class strategy.

### 5) Verify with a sample component on the home page
- Use a shadcn component:
```tsx
// src/app/page.tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="p-8">
      <Button>Shadcn Button</Button>
    </main>
  );
}
```

### 6) Run and test
```bash
npm run dev
```
- Check that components render correctly (focus states, dialogs/portals, theme toggle if enabled).

### 7) Merge safety notes (if other branches don’t use shadcn)
- Keep a single `@import "tailwindcss"` and a single `@theme inline` block.
- Ensure tokens appear once; merge, don’t duplicate.
- If enabling `.dark`, remove conflicting media-query overrides or scope them to avoid fighting styles.
- Reconcile `layout.tsx` if other providers were added.
- Ensure only one `src/lib/utils.ts` and imports use the same `cn` helper.

That’s it—this reproduces your current stack and layers shadcn/ui on top in a clean, merge-friendly way.


