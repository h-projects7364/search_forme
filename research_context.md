
---

## 0) What the prototype proves (in 10–14 days)

* Visitors will **start** the flow (enter a URL).
* We can **auto‑classify** a company from its site into a Thistle‑relevant **sector + regulatory path** with useful **next steps**.
* Showing the tailored result **before** the gate increases **email capture** (and gives us *industry / pain / timeline*).
* Payload lands cleanly in **HubSpot/SFDC**.

**North star for the test:** uplift in **Visit → email-in‑CRM** on the page where we embed the demo.

---

## 1) UX you can ship this week (copy included)

### A) Entry block (inline card or modal)

* **Headline:** *“Paste your company URL — we’ll map your regulatory path in 20 seconds.”*
* **Field:** `https://` prefilled; paste validation & autofocus.
* **Privacy microcopy:** *“We scan only publicly available pages. No login. Not legal advice.”*
* **Button:** **Analyze my site** (spinner → progress dots).

### B) Loading state (6–12s target)

* Progress text cycles: *“Detecting industry” → “Spotting regulated activities” → “Checking AML/FC signals” → “Building next steps…”*

### C) Result (value first, no email yet)

Three cards + a CTA:

1. **Your profile**

   * *“Looks like a **Payment Services / EMI** firm with UK footprint.”*
   * Chips: `FinTech`, `Cards`, `IBAN`, `PSD2/Open Banking`
   * **Confidence:** High / Medium / Low (with a “Change profile” link if wrong)

2. **What we can do for you right now**

   * Primary path: **“Full FCA Authorisation as an EMI”** *or* **“Vary permissions (VOP)”** / **“AR option”**
   * **Timeline band:** e.g., *16–24 weeks*
   * **Critical items:** *RBP, SM\&CR assignments, Safeguarding policy, AML framework* (3–5 bullets)

3. **Likely focus areas**

   * *Safeguarding controls, Transaction monitoring, Complaints & Consumer Duty*
   * Small “why we think this” with citations to the phrases we saw on their site (e.g., “wallet”, “issuing”, “SEPA”)

**Primary CTA (lead gate):**

* **“Email me this plan + checklist”** (button)
* Gate fields: **Work email** (required), **Role** (select), **Timeframe** (0–3 / 3–6 / 6–12 months), checkbox **consent**.
* **Secondary CTA:** “Book 20‑min scoping call” (Calendly inline)

**Trust panel (right under the gate):**

* *“We’ll send this once. Delete my data anytime.”* `SOC/DPA/ISO logos if you have them`

### D) Low‑confidence fallback

If confidence < threshold: show **one disambiguation question** instead of a shaky result:
*“Which best describes you?”* → `Payment Services/EMI, Investments, Credit, General Insurance, Digital Assets, Mortgages` → then render result.

---

## 2) Data you’ll capture (structured)

On **start** (before email):
`{input_domain, inferred_industry, inferred_regulated_activities[], confidence, focus_areas[], path_suggestion, timeline_band}`

On **gate submit:**
`{email, role, timeframe, next_step (plan|meeting), source_page, utm_*}`

Push to CRM as a single JSON blob + mapped fields (e.g., `Custom.Industry`, `Custom.RegActivities`, `Custom.Timeframe`).

---

## 3) Tech: build the smallest thing that works

### A) One‑line embed (loader)

Injects the UI, handles events, and calls your analyzer API.

```html
<script>
(function(){
  var s=document.createElement('script');
  s.src='https://cdn.pockla.dev/site-analyzer.v0.js'; s.defer=true;
  s.dataset.partner='thistle';
  document.head.appendChild(s);
})();
</script>
```

### B) Analyzer API (server/edge)

**Why server‑side?** CORS + you don’t want your client fetching arbitrary sites.

**Endpoints**

* `POST /analyze` → `{ url }` → returns `{industry, activities[], focusAreas[], path, timelineBand, confidence, evidence[] }`
* `POST /lead` → `{ email, role, timeframe, analysis, source }` → sends to HubSpot; returns `{crm_ok:true}`

**Implementation sketch (Node/Edge)**

* Fetch `GET <url>` (normalize to `https://domain.tld`).
* Respect robots.txt (if it blocks, fetch only the HTML of the homepage).
* Parse with Cheerio / HTMLRewriter.
* Extract: `<title>`, `<meta>`, `<h1-h3>`, nav links (to guess sectors), 1–2 linked pages (e.g., `/products`, `/pricing`, `/about`).
* Run **keyword scorers** (see below).
* Compose a **result** with a confidence score and short “evidence” (phrases matched).

> **No LLM required** for v0. Add an LLM later to clean up copy if you want.

### C) Heuristic scorers (copy/paste to start)

```js
const LEX = {
  payment_services: [
    /emi|electronic money|e-money|payment institution|issuing|acquiring|iban|sepa|swift|open banking|psd2|card program/i
  ],
  investments: [
    /mifid|brokerage|asset management|trading platform|custody (?!wallet)|portfolio|fund|adviser/i
  ],
  credit: [
    /lending|loan|credit|bnpl|apr|underwriting|affordability|consumer credit/i
  ],
  general_insurance: [
    /insurance|policy|underwriting|mga|claims|broker/i
  ],
  digital_assets: [
    /crypto|cryptocurrency|exchange|wallet|stablecoin|token|defi|blockchain|virtual asset|mika|mica/i
  ],
  mortgages: [
    /mortgage|buy to let|remortgage|broker (mortgage)/i
  ]
};

function score(text){
  const cats = Object.entries(LEX).map(([k, regs]) => {
    const hits = regs.reduce((n,re)=> n + (text.match(re)?.length || 0), 0);
    return {k, hits};
  }).sort((a,b)=> b.hits - a.hits);
  const top = cats[0]; const second = cats[1] || {hits:0};
  const confidence = top.hits >= 3 && (top.hits - second.hits) >= 2 ? 'high'
                    : top.hits >= 1 ? 'medium' : 'low';
  return {category: top.k, confidence};
}
```

**Mapping to Thistle outputs**

```js
const PATH_BY_CAT = {
  payment_services: { path: "FCA Authorisation as EMI", timelineBand: "16–24 weeks",
    focusAreas: ["Safeguarding", "Transaction monitoring", "SM&CR"] },
  investments: { path: "MiFID Authorisation / Variation", timelineBand: "12–20 weeks",
    focusAreas: ["Best execution", "Client assets (CASS)", "Market abuse"] },
  credit: { path: "Consumer Credit Permissions / VOP", timelineBand: "8–16 weeks",
    focusAreas: ["Affordability", "Forbearance", "Complaints"] },
  general_insurance: { path: "GI Permissions / Appointed Rep", timelineBand: "8–16 weeks",
    focusAreas: ["Product governance", "Claims handling", "Financial promotions"] },
  digital_assets: { path: "Cryptoasset Registration / AML", timelineBand: "12–20 weeks",
    focusAreas: ["KYC/AML", "Travel Rule", "Custody controls"] },
  mortgages: { path: "Mortgage Permissions / AR", timelineBand: "8–16 weeks",
    focusAreas: ["Advice suitability", "Disclosure", "SM&CR"] }
};
```

### D) Result JSON you’ll return (example)

```json
{
  "industry": "FinTech",
  "category": "payment_services",
  "confidence": "high",
  "activities": ["EMI","Issuing","Open Banking"],
  "path": "FCA Authorisation as EMI",
  "timelineBand": "16–24 weeks",
  "focusAreas": ["Safeguarding","Transaction monitoring","SM&CR"],
  "evidence": ["‘issue cards’, ‘IBAN accounts’, ‘SEPA transfers’ found on homepage"]
}
```

### E) Gate → CRM

* Use HubSpot **Forms API** or a lightweight REST call.
* **Map fields:** Email, Role, Timeframe, Category, Path, FocusAreas, Confidence, InputDomain, SourcePage, UTM.
* **Retry** 3× with backoff; log `crm_ok` event.

---

## 4) Demo safety net (so the live demo never blanks)

* **Whitelist** 6 common finserv domains (e.g., OpenPayd, Revolut, VertoFX, eToro, Plum, Santander) with **pre‑baked responses**.
* If fetch fails or robots deny: **fall back** to the whitelist sample that matches best by name, or show the **one disambiguation question**.
* Cap fetch size (e.g., 300KB HTML) and **timeout** at 6s.

---

## 5) Where to place it on Thistle

* **Primary:** near the **hero** or the **“1000+ FCA applications”** proof band → highest intent.
* **Secondary** (if you test two spots): inside **Payment Services** sector page.

**A/B plan:** 50/50 split via localStorage; Variant A = static CTA; Variant B = URL analyzer.

---

## 6) Measurement (minimum events)

Track per session:

* `analyzer_start` `{domain}`
* `analysis_ok` `{category, confidence}`
* `analysis_low_confidence` (if fallback used)
* `lead_submitted` `{email_hash, role, timeframe}`
* `crm_ok` `{lead_id}`

**Success:** start rate ≥ 8–12%; gate drop‑off ≤ 40%; **Visit→Lead uplift ≥ +30%** on the tested page; CRM errors ≤ 1%.

---

## 7) Legal & UX guardrails (important for a compliance brand)

* **Disclaimer** under result: *“Informational only, not legal advice. Based solely on public pages you provided.”*
* **Respect robots.txt** and exclude querystrings/logins.
* **PII minimization:** analyze server‑side; store only derived features + email post‑gate.
* **Accessibility:** focus states, label inputs, transcript for any audio.
* **Edit switch:** “Change profile” lets user correct the category—record the change.

---

## 8) Build plan (3 fast days to first demo)

**Day 1**

* Set up `/analyze` on Cloudflare Worker / Vercel.
* Implement `score(text)` + `PATH_BY_CAT`.
* Build inline UI (modal or card) and plugs for states.
* Return canned JSON for 2–3 sample domains.

**Day 2**

* Add real fetching + parsing; **cache** by domain for 24h.
* Build gate → `/lead` → HubSpot; show success confirmation.
* Add confidence logic + fallback question.

**Day 3**

* Polish copy; add trust micro‑panel; whitelisted samples.
* Ship to a **staging page** on Thistle (or a look‑alike) and record first sessions.

---

## 9) Variations you can prototype next (more data capture)

* **“Paste your product link”** (e.g., pricing or features page) → we extract *limits, stack, use‑cases* and tailor the plan deeper.
* **“Upload your policy PDF (optional)”** → we parse headings only and highlight likely gaps (purely structural), then gate to email the checklist.
* **Voice explainer** of the tailored plan (TTS 30s + transcript) → more comprehension signals; capture *seconds listened*.

---

## 10) Copy you can paste today

* **Entry field label:** *“Paste your company’s homepage URL”*
* **Helper text:** *“We’ll scan public pages to suggest your regulatory path and a realistic timeline.”*
* **Result header:** *“Here’s what we’d do for **{{domain}}**”*
* **Gate header:** *“Where should we send your tailored plan?”*
* **Privacy line:** *“One email. No spam. Delete your data anytime.”*

---

If you want, I can also provide a **ready‑to‑drop HTML/CSS/JS snippet** for the modal/card and a **Vercel/CF Worker** function for `/analyze` you can paste straight into your project.



Absolutely—you can demo this without any access to their code.

You have two great options:

Fastest (no install for them): a Bookmarklet — click a browser bookmark on any page; it injects your overlay.

Most robust: a Chrome Extension (MV3) — a content script injects your overlay; works even when a site’s CSP blocks bookmarklets.

Below I give you both, including copy‑paste code, plus a 2‑day plan and demo safeguards.

Option A — Bookmarklet (fastest)

What it does: When you click the bookmark, it injects a hosted JS file that renders your full‑screen overlay, URL input, “Analyze” button, shows the plan, then gates for email. No install for the prospect.

1) Create the bookmark

Make a new bookmark with this exact URL as the location:

javascript:(function(){var d=document;if(d.getElementById('pockla-demo-overlay'))return;var s=d.createElement('script');s.src='https://cdn.pockla.dev/demo-overlay.js?ts='+Date.now();d.body.appendChild(s);}());


Host demo-overlay.js on your CDN (or any public URL you control). You can update it anytime—no need to change the bookmark.

2) The overlay script (drop this in demo-overlay.js)

This is a minimal, self‑contained overlay that: (a) renders UI in a Shadow DOM (no CSS collisions), (b) calls your /analyze API server‑side, (c) gates for email and calls /lead.

(function(){
  // ----- Mount & Shadow DOM
  const mountId = 'pockla-demo-overlay';
  if (document.getElementById(mountId)) return;
  const host = document.createElement('div');
  host.id = mountId;
  host.style.all = 'initial';
  host.style.position = 'fixed';
  host.style.inset = '0';
  host.style.zIndex = '2147483647';
  host.style.display = 'block';
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });

  // ----- Styles
  const css = `
    :host { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
    .backdrop { position: fixed; inset:0; background: rgba(6,10,20,0.55); }
    .panel { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:min(720px,94vw);
      background:#0b1020; color:#fff; border-radius:16px; box-shadow:0 20px 80px rgba(0,0,0,0.35); overflow:hidden; }
    header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:#121a35; }
    header h1 { font-size:16px; margin:0; font-weight:600; }
    button.icon { all:unset; cursor:pointer; opacity:.8; padding:6px; }
    .body { padding:20px; display:grid; gap:14px; }
    .row { display:flex; gap:8px; }
    input.url { flex:1; padding:12px 14px; border-radius:10px; border:1px solid #283257; background:#0f1630; color:#e8eeff;}
    button.primary { padding:12px 16px; background:#7c93ff; color:#0b1020; border:none; border-radius:10px; font-weight:700; cursor:pointer;}
    .hint { font-size:12px; color:#a7b3d6; }
    .card { padding:14px; border:1px solid #283257; border-radius:12px; background:#0f1630; }
    .chips { display:flex; flex-wrap:wrap; gap:6px; }
    .chip { background:#1a2448; padding:4px 8px; border-radius:999px; font-size:12px; color:#c9d5ff;}
    .footer { display:flex; gap:10px; align-items:center; justify-content:space-between; margin-top:6px; }
    .lead { display:flex; gap:8px; }
    input.email { flex:1; padding:10px 12px; border-radius:10px; border:1px solid #283257; background:#0f1630; color:#e8eeff;}
    .small { font-size:11px; color:#9fb0ea; }
    .grid { display:grid; grid-template-columns:1fr; gap:10px; }
    @media(min-width:700px){ .grid{ grid-template-columns:1fr 1fr 1fr; } }
    .loading { font-size:13px; color:#9fb0ea; }
    a.link { color:#9fb0ea; text-decoration:underline; }
  `;
  const style = document.createElement('style'); style.textContent = css; root.appendChild(style);

  // ----- HTML
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="backdrop"></div>
    <div class="panel" role="dialog" aria-modal="true" aria-label="Pockla Demo">
      <header>
        <h1>Map your regulatory path (demo)</h1>
        <button class="icon" id="pockla-close" aria-label="Close">✕</button>
      </header>
      <div class="body">
        <div class="row">
          <input class="url" id="pockla-url" placeholder="https://yourcompany.com" value="">
          <button class="primary" id="pockla-analyze">Analyze</button>
        </div>
        <div class="hint">We’ll scan public pages only. This is informational, not legal advice.</div>
        <div id="pockla-status" class="loading"></div>
        <div id="pockla-result" style="display:none;">
          <div class="grid">
            <div class="card" id="card-profile"></div>
            <div class="card" id="card-path"></div>
            <div class="card" id="card-focus"></div>
          </div>
          <div class="footer">
            <div class="lead">
              <input class="email" id="pockla-email" placeholder="Work email to receive this plan">
              <button class="primary" id="pockla-send">Email me this plan</button>
            </div>
          </div>
          <div class="small">You’ll get one email with your plan & checklist. <a class="link" target="_blank" href="https://pockla.dev/privacy">Privacy</a></div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(wrap);

  // ----- Interactions
  const $ = sel => root.querySelector(sel);
  $('#pockla-close').onclick = () => host.remove();
  root.addEventListener('keydown', e => { if (e.key === 'Escape') host.remove(); });

  async function analyze(url){
    const status = $('#pockla-status'); status.textContent = 'Detecting industry…';
    try {
      const res = await fetch('https://demo.pockla.dev/analyze', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ url, partner: 'thistle', source: location.href })
      });
      if (!res.ok) throw new Error('Analyze failed');
      const data = await res.json();
      renderResult(data);
      status.textContent = '';
    } catch(e){
      status.textContent = 'Could not analyze that URL. Try a different homepage.';
    }
  }

  function renderResult(d){
    $('#pockla-result').style.display = 'block';
    $('#card-profile').innerHTML = `
      <strong>Your profile</strong><br>
      Looks like <em>${(d.category || '—').replace('_',' ')}</em> in <em>${d.industry || '—'}</em>.<br>
      Confidence: <em>${d.confidence || '—'}</em>
      <div class="chips">${(d.activities||[]).map(x=>`<span class="chip">${x}</span>`).join('')}</div>`;
    $('#card-path').innerHTML = `
      <strong>What we’d do next</strong><br>
      ${d.path || '—'}<br>
      Timeline: <em>${d.timelineBand || '—'}</em>`;
    $('#card-focus').innerHTML = `
      <strong>Likely focus areas</strong>
      <ul>${(d.focusAreas||[]).map(x=>`<li>${x}</li>`).join('')}</ul>`;
  }

  $('#pockla-analyze').onclick = () => {
    const u = $('#pockla-url').value.trim();
    if (!/^https?:\/\//i.test(u)) { $('#pockla-status').textContent='Enter a valid URL starting with https://'; return; }
    $('#pockla-status').textContent = 'Analyzing…';
    analyze(u);
  };

  $('#pockla-send').onclick = async () => {
    const email = $('#pockla-email').value.trim();
    if (!/.+@.+\..+/.test(email)) return alert('Enter a work email');
    const payload = {
      email,
      analysis: 'shown',
      source: location.href
    };
    try{
      const res = await fetch('https://demo.pockla.dev/lead', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)
      });
      alert('Sent! Check your inbox.');
      host.remove();
    }catch(e){ alert('Could not send just now.'); }
  };
}());


Your /analyze and /lead endpoints can be the simple ones we outlined earlier (server does the site fetch & classification; /lead posts to HubSpot). For a first demo, they can return canned JSON for 5–6 known domains.

Pros: zero install for the prospect; works anywhere you can click a bookmark.
Cons: some sites’ CSP can block remote scripts → always bring the extension as Plan B.