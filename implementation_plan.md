## Actionable Build Steps (v1 demo — bookmarklet‑first, prompt‑led moments)

- Setup & hosting (minimal)
  - Create CDN location for overlay script (e.g., cdn/pockla/demo-overlay.js) and staging domain for a single `/analyze` endpoint.
  - Defer CRM and secrets; focus on client UX and fast iteration.

- Overlay (bookmarklet)
  - Implement Shadow‑DOM overlay skeleton (compact chat/cards, not fullscreen) with URL input, analyze action, compact results, and trust microcopy.
  - Host overlay JS on CDN and generate the bookmarklet URL; verify loads under 1s on target page.
  - Add event wiring for UX only: `analyzer_start`, `analysis_ok/low_confidence` (defer lead events).

- Analyzer API
  - v0: return canned JSON for 3–6 finserv domains (OpenPayd, Revolut, VertoFX) + generic low‑confidence fallback.
  - v1: optional quick fetch/parse (homepage + 1 page), robots.txt respect, 24h cache, 4s timeout.
  - Heuristic scoring → {category, confidence}; map to {path, timelineBand, focusAreas}; include `evidence[]`.
  - Low‑confidence fallback: `needs_disambiguation` flag for one question UI.

- (Defer) Lead/CRM
  - Skip CRM integration in v1. If needed for the demo, add a stub endpoint later.

- Thistle dataset (Option B)
  - Use pre‑scraped content: key Sectors/Services + case studies/testimonials (≤30 pages, depth≤2).
  - Extract offerings, audiences, proofs, CTAs into a single JSON file with source links and confidence flags.
  - Serve dataset statically or via `GET /thistle-dataset` for overlay hydration.

- Prompting (10 moments — guidance only)
  - Write system prompts/templates instructing the LLM to aim for the 10 moments using: visitor analysis, Thistle dataset, and proof links.
  - No hard‑coded logic; LLM assembles self‑recognition, problem naming, outcome vision, proof insertion, and CTA copy.

- Fallbacks & safety
  - If fetch blocked/timeout: use meta‑only summary or closest whitelisted sample.
  - Respect robots.txt; SSRF guard (block RFC1918/loopback); size cap 300KB.
  - Disambiguation question when `confidence` low; always show disclaimer.

- SLOs, QA, and a11y
  - TTFP (overlay) <1.0s; personalized update <2.5s (cap 4.0s); measure and log.
  - Accessibility: focus order, labels, Escape to close, contrast check.
  - Copy review for compliance tone; trust panel with memberships/awards links.

- Demo runbook
  - Provide bookmarklet instructions and a shareable link; list supported sample domains.
  - Staging URL with the overlay pre‑mounted; instructions for A/B toggle via localStorage.

## Implementation Plan — Thistle Initiatives Personalized Overlay (Bookmarklet‑first)

### 0) Objectives and success criteria

- Prove, in a realistic demo, that a visitor can paste their company URL, we auto‑classify into a Thistle‑relevant sector/path, and we show a credible, helpful next‑steps plan that increases lead capture.
- North star: uplift in Visit → email‑in‑CRM on the page where the overlay runs.
- Guardrails: fast perceived performance, strong privacy posture, clear disclaimers, trustworthy aesthetics.


### 1) Scope (Option B + personalization)

- Precompute Thistle dataset (Option B): crawl and summarize key Sectors/Services + case studies/testimonials to capture offerings, audiences, proofs, and CTAs.
- Real‑time personalization: on visitor URL input, fetch 1–3 public pages, infer industry/regulated activities, and tailor the 10 conversion moments to that visitor.
- Delivery surface: bookmarklet‑injected overlay (primary), Chrome MV3 extension fallback where CSP blocks bookmarklets.
- Measurement & CRM: gate after value, send payload into HubSpot/SFDC with mapped fields.


### 2) Non‑goals (v1 demo)

- No full‑site semantic index or site‑wide search for Thistle (light index only, see §7).
- No custom ML training; rely on rules + light embeddings as needed.
- No authenticated/doc scanning; only public pages within robots.txt.
- No hard‑coded implementation of the 10 conversion moments; v1 uses prompt‑led guidance only.


### 3) User journeys

- Core happy path:
  1) Visitor clicks bookmarklet on a Thistle page (or look‑alike). Overlay loads instantly with skeleton and Thistle defaults.
  2) Visitor pastes URL → server analyzes → result cards render (profile, path, focus areas) with confidence, proof and CTA.
  3) Gate: “Email me this plan + checklist” or “Book 20‑min scoping call.”
  4) CRM: payload lands in HubSpot/SFDC; confirmation shown.
- Low‑confidence fallback: ask one disambiguation question (Payment Services / Investments / Credit / Insurance / Digital Assets / Mortgages) before rendering.
- Failure modes: fetch blocked/timeout → show pre‑baked sample closest to input; or keep defaults + sector picker.


### 4) System architecture overview

- Client (overlay via bookmarklet)
  - One‑line bookmarklet injects a hosted JS file that renders a full‑screen overlay in Shadow DOM to prevent CSS collisions.
  - Shows instant skeleton (default Thistle copy) and upgrades to personalized content on analysis completion.
  - Extension fallback (MV3 content script) for CSP‑restricted sites.

- Edge/API (server or edge function)
  - POST /analyze { url } → returns visitor analysis (category, activities, path, timeline, focus areas, confidence, evidence).
  - POST /lead { email, role, timeframe, analysis, source } → submits to HubSpot/SFDC and returns crm_ok.
  - GET /thistle‑dataset → serves precomputed Thistle dataset (offerings, audiences, proofs, CTAs) to client (cacheable).
  - Firecrawl used server‑side for Thistle pre‑crawl and, optionally, visitor 1–3 page summary (with strict timeouts and robots.txt respect).

- Data & cache
  - Thistle dataset JSON + light vector index (for proof/offering matching) stored server‑side.
  - Visitor analysis cache by domain (24h TTL).
  - Event stream for analytics (start, ok, low_confidence, lead_submitted, crm_ok).


### 5) Thistle dataset (Option B) — crawl plan and content model

- Target URLs
  - Sectors: /sectors/investments, /sectors/payment‑services, /sectors/credit‑mortgages, /sectors/digitalassets, /sectors/insurance
  - Services: /services/compliance‑support, /services/financial‑crime (+ child pages: sanctions, fraud), /services/audits‑advisory, /services/applications, /services/managed‑services, /services/icara‑and‑fca‑reporting, /services/risk‑management, /services/change‑and‑transformation (as available)
  - Proof: /about/case‑studies/*, testimonials embedded on sector/service pages, /about/news‑and‑press/* (for credibility), awards/memberships on /about/about‑us
  - Limits: depth ≤ 2 within paths above; page cap 25–30; ignore query params; dedupe similar URLs.

- Crawl settings
  - formats: markdown, links; onlyMainContent: true; deduplicateSimilarURLs: true; ignoreQueryParameters: true; maxDiscoveryDepth: 2; limit: 30.
  - QA: coverage matrix; missing‑data report per offering; confidence scores per field.

- Content model (LLM‑ready JSON)
  - company: { name, tagline, positioning, proofStats: { fcaApplications, customers, awardsRange }, memberships: [APCC, PIMFA, …] }
  - offerings[]: { id, title, summary, category: sector|service, pains[], outcomes[], features[], audienceTags[], proofRefs[], ctas[] }
  - proofs[]: { id, type: testimonial|caseStudy|award|press, title, client, sector, problem, intervention, outcomeMetrics[], quotes[], link }
  - audiences[]: { tag, description, pains[], desiredOutcomes[] }
  - safetyTrust: { certifications[], memberships[], privacyStatements[] }
  - contact: { phone, email, forms[], nextSteps[] }
  - meta: { sourceUrls[], lastCrawled, coverage }


### 6) Personalization data contracts (runtime)

- visitor_profile
  - { url, domain, industry_guess, size_guess?, geo?, keywords[], compliance_terms[], tech_signals[], summary }

- visitor_fit_scores[]
  - { offering_id, audience_tag, similarity, rationale, matched_terms[] }

- personalized_moments (optional, later)
  - For v1, these are produced ad‑hoc by the LLM from prompts; no schema dependency or deterministic programming. A future version may formalize this as { self_recognition, problem_named_back, outcome_vision, credible_proof_ids[], feasibility_steps, personal_payoff, low_risk_commit, clear_next_step, trust_safety }.

- ctas[]
  - { label, url, type: consultation|guide|case_study, microcommit_level }

- analytics events
  - analyzer_start { domain }
  - analysis_ok { category, confidence }
  - analysis_low_confidence {}
  - lead_submitted { email_hash, role, timeframe }
  - crm_ok { lead_id }


### 7) Indexing strategy (lightweight)

- Purpose: fast matching of visitor signals to Thistle offerings/proofs.
- Method: section‑level chunks (≈200–400 tokens) with metadata {type, sector, client, date, confidence}.
- Storage: JSONL for chunks + FAISS/SQLite for vectors; inverted map for exact term filters.
- Not required for the demo but recommended; keep behind a feature flag.


### 8) Copy guidance for the 10 conversion moments (prompt‑only in v1)

1. Self‑recognition → audiences[].tag, offerings[].audienceTags → overlay hero line
2. Problem named back → offerings[].pains + visitor matched_terms → subhead
3. Outcome vision → offerings[].outcomes → bullets
4. Credible proof → proofs[] filtered by sector/client similarity → testimonial/case study tile
5. Feasibility → offerings[].features with process steps; contact.nextSteps → accordion “How it works”
6. Personal payoff → outcomes mapped to time/risk/money; outcomeMetrics → sidebar highlights
7. Low‑risk commitment → ctas: free consultation, downloadable guide → micro‑commit row
8. Clear next step → contact.nextSteps + CTA button
9. Trust & safety → safetyTrust + memberships (APCC/PIMFA) → trust panel
10. Aesthetic & craft → consistent visual language, crisp typography, brand assets → overall overlay polish

Note: In v1 these are goals communicated via system prompts/templates to the LLM; there is no hard‑coded logic enforcing each moment.


### 9) Overlay UX (bookmarklet‑first)

- Above‑the‑fold: self‑recognition + problem named back + primary CTA.
- Secondary: outcome vision + credible proof.
- Drawer/accordion: feasibility steps + personal payoff.
- Footer: low‑risk commitment + clear next step + trust badges.
- Progressive disclosure: skeleton defaults within ~1s; personalize within ~2.5s.
- Accessibility: focus order, labels, keyboard close (Esc), color contrast.
- Copy constraints: straightforward, compliance‑appropriate tone; avoid legal guarantees.


### 10) Analyzer pipeline (runtime)

- Input hygiene: normalize URL; SSRF guard (block RFC1918/loopback); check robots.txt.
- Fetch plan: homepage + one high‑signal page (products/services/about) if available; cap 2–3 pages.
- Parse: title, meta, h1–h3, prominent nav/section labels; extract regulated terms (FCA, EMI, AISP/PISP, PSD2, CASS, AML/KYC).
- Heuristic scorers: category classification via regex lexicon; confidence from hits and gap to second best.
- Mapping: category → path, timelineBand, focusAreas (maintained table aligned to Thistle).
- Evidence: list of matched phrases for transparency; keep it short.
- Timeouts: target ≤ 2s total; hard cap 4s; use cached summary if present.


### 11) Latency & fallbacks (SLOs)

- Time‑to‑first‑paint (overlay skeleton): < 1.0s.
- Personalized update visible: < 2.5s; hard cap 4.0s then keep defaults.
- Fallbacks: meta‑only summary; single disambiguation question; pre‑baked results for 5–6 finserv domains.
- Caching: 24h per‑domain visitor cache; LRU eviction.


### 12) Privacy, security, and compliance

- Explicit microcopy: “We scan only publicly available pages. No login. Informational, not legal advice.”
- Respect robots.txt; ignore querystrings; no authenticated paths.
- PII minimization: analyze server‑side; store derived features; capture email only post‑gate.
- SSRF protection and rate limiting; input validation; domain allow/deny logic.
- Consent: short notice near the input; link to privacy page.


### 13) QA, observability, and content governance

- QA: unit tests for parser/scorer; snapshot tests for overlay rendering; accessibility checks.
- Content QA: no invented metrics; proofs link back to source pages; confidence scores drive visibility.
- Observability: structured logs for analyzer; metrics dashboard for SLOs; alert on CRM error rate > 1%.


### 14) Measurement & CRM integration

- Events: analyzer_start, analysis_ok, analysis_low_confidence, lead_submitted, crm_ok.
- CRM mapping: Email, Role, Timeframe, Category, Path, FocusAreas, Confidence, InputDomain, SourcePage, UTM.
- Uplift target: Visit→Lead +30% on tested page; start rate ≥ 8–12%; gate drop‑off ≤ 40%.


### 15) Deliverables

- Thistle dataset JSON (Option B) + coverage matrix and gaps report.
- Lightweight index (optional, behind flag) for matching proofs/offerings.
- System prompts and lightweight message templates that direct the LLM to aim for the 10 moments (no hard‑coded logic in v1).
- Bookmarklet overlay (hosted JS), plus MV3 extension fallback.
- Analyzer and Lead endpoints (server/edge) with caching and observability.
- Human‑readable brief: 1‑pager overview; offering summaries; audience fits; top proofs; trust & safety; next steps.
- Demo instructions (runbook) and A/B harness.


### 16) Timeline (toward a demo)

- Day 1
  - Stand up /analyze and /lead (canned responses for 2–3 sample domains); overlay skeleton via bookmarklet; initial events.
- Day 2
  - Real fetching/parsing + 24h cache; gate → CRM; confidence logic + fallback question; polish trust microcopy.
- Day 3
  - Whitelisted samples; staging demo on a Thistle look‑alike page; record first sessions.
- Days 4–7
  - Option B crawl; build Thistle dataset + light index; extract proofs; draft human brief.
- Days 8–10
  - Personalization templates for the 10 moments; tune matching; add case‑study injections.
- Days 11–14
  - A/B harness; latency tuning; QA and accessibility pass; finalize demo runbook.


### 17) Risks & mitigations

- CSP blocks bookmarklets → have MV3 extension fallback ready.
- Slow/blocked fetches → strict timeouts, caching, pre‑baked samples; show sector picker.
- Misclassification → low‑confidence gate + “Change profile”; conservative copy; evidence chips.
- Compliance tone mismatch → copy review and trust panel; disclaimers; avoid guarantees.


### 18) Open questions

- Preferred primary CTA per sector (consultation vs guide) for the demo?
- Specific case studies Thistle wants highlighted first?
- HubSpot vs SFDC as first CRM target and exact field mappings?


### 19) Acceptance criteria

- Overlay loads via bookmarklet within 1s and personalizes under 2.5s for ≥80% of test domains.
- Analyzer returns structured JSON with confidence and evidence; low‑confidence path works.
- Thistle dataset built with at least 12–18 pages; includes ≥6 proofs (3 case studies, 3 testimonials) with links.
- Events flow captured; CRM submissions succeed ≥99% with retries; dashboards show uplift metrics.


