# VC Scout — VC Intelligence Interface + Live Enrichment

A Harmonic-style VC discovery interface that supports:
- Company discovery (search + filters + pagination)
- Company profile workflow: open → notes → add to list → enrich → review signals
- Lists (create, add/remove companies, export CSV/JSON)
- Saved searches (save, re-run, share link)
- Live enrichment via server-side `/api/enrich` (Gemini API key never exposed)

## Tech Stack
- Next.js (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Gemini (Google AI) for enrichment (server-side)
- LocalStorage persistence (notes, lists, saved searches, enrichment cache, custom companies)

## Features (Mapped to Assignment)
### App Shell
- Sidebar navigation + clean layout

### Companies (`/companies`)
- Search + filters (industry, stage)
- Results table + pagination
- Share link (URL query params)
- Save search (localStorage)
- Bonus: Add Company form (stores custom companies in localStorage)

### Company Profile (`/companies/[id]`)
- Overview + website link
- Notes (localStorage)
- Add/remove from list (localStorage)
- Live enrichment (server-side) extracting:
  - Summary (1–2 sentences)
  - What they do (3–6 bullets)
  - Keywords (5–10)
  - Derived signals (2–4)
  - Sources + timestamp
- Enrichment cache (localStorage)

### Lists (`/lists`)
- Create lists
- Export JSON + CSV

### Saved Searches (`/saved`)
- View saved searches
- Run search
- Copy link
- Remove saved search

## Local Setup
1) Install dependencies
```bash
npm install
