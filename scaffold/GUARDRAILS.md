# Web Development Guardrails
# Photography Portfolio + Booking Website — Master Reference

This file is read at the start of every session. It defines the rules, structure,
and standards for this project. All recommendations must comply with everything here.

---

## Always-On Rules (Apply to Every Response)

### Rule 1 — Mobile-First, Then Scale Up
Every UI component is designed for mobile (320px minimum) first.
Desktop layout is an enhancement, not the starting point.
Provide both the mobile and desktop approach when building any UI.

### Rule 2 — Best Practices Only; Correct the Developer
If a fragile or non-scalable approach is suggested:
1. Explain why it is risky
2. Propose the best-practice alternative
3. Keep the simplest option that still scales

### Rule 3 — Small, Testable Increments (Vertical Slices)
Each increment must:
- Render without errors in dev and build
- Be visually verifiable in the browser
- Have a quick test checklist before moving on

### Rule 4 — No Magic Leaps
Define web/framework terminology briefly when first used, then use it consistently.

### Rule 5 — Explicit Decisions + Rationale
For architecture choices, always include:
- Option A / Option B (brief)
- Recommendation
- Why it is better for maintainability and the photography use case

### Rule 6 — Never Break the Site with Refactors
Safe migration plan format:
1. Step 1: Add new system alongside old one
2. Step 2: Switch all usage to new system
3. Step 3: Delete old system

### Rule 7 — Scope Control
Do not add features, refactors, or "improvements" beyond what was asked.
A bug fix does not need surrounding code cleaned up.
A simple feature does not need extra configurability.

### Rule 8 — Safety Rails
Proactively warn before hitting these common web pitfalls:
- Storing secrets in frontend code or git (use environment variables)
- Missing alt text on images (accessibility + SEO)
- Layout breakage at common breakpoints (320, 375, 768, 1024, 1440px)
- Unoptimized images (use next/image or equivalent lazy loading)
- Missing meta tags for SEO (title, description, OG tags)
- Form submissions without CSRF/rate-limit protection
- SQL injection or XSS via unescaped user input
- Missing loading and error states in async flows

---

## Session Response Structure

When asked for any feature, bug fix, or design change, respond using this exact structure:

1. **Feature Summary** — 1 to 5 bullets describing what the user/visitor experiences
2. **Data + Systems** — what data, components, and APIs are needed
3. **Architecture Plan** — how it stays modular and maintainable
4. **Visual/UI Steps** — what it looks like, responsive behavior, any design decisions
5. **Code Plan** — files/components list with responsibilities
6. **Implementation Steps** — ordered checklist the developer can follow
7. **Test Plan** — how to verify it works in browser across breakpoints
8. **Next Scalable Extension** — one optional future hook already being enabled

---

## Coding Standards (Hard Rules)

| Rule | Standard |
|------|----------|
| Component responsibility | One responsibility per component. No god components. |
| Composition | Compose small components into larger ones. Avoid prop drilling beyond 2 levels — use context or state management. |
| Naming | PascalCase for components, camelCase for functions/vars, kebab-case for files/routes |
| Secrets | Never hardcode API keys, tokens, or credentials. Use `.env.local` and environment variables. |
| Images | Always include width, height, and descriptive alt text. Use framework image optimization. |
| Accessibility | Semantic HTML (nav, main, section, article, button, etc.). Keyboard navigable. ARIA labels where needed. |
| Error handling | Validate at form submission. Show friendly error states. Never expose stack traces to users. |
| Comments | Short comments only where intent is not obvious |
| CSS | Follow mobile-first conventions. Avoid magic pixel values — use spacing/sizing tokens or Tailwind scale. |
| State | Keep state as close to where it is used as possible. Lift only when needed. |
| API calls | Always handle loading, error, and empty states. |

---

## Content and Data Strategy

Decisions to make (update this section as confirmed):

- **Portfolio images**: Where are they stored? (Cloudinary, S3, local, CMS-hosted)
- **Portfolio metadata**: Titles, categories, descriptions — managed in code, CMS, or markdown?
- **Booking data**: Where are submissions stored? (Email only, database, third-party tool)
- **Site copy**: Hardcoded strings, CMS, or i18n file?

For every new feature, state:
- What data it needs and where that data lives
- How to add more content of this type without code changes (if applicable)

---

## Definition of Done

A feature is complete only when all of the following are true:
- [ ] It renders correctly in both mobile and desktop viewports
- [ ] It passes a basic accessibility check (keyboard nav, alt text, semantic HTML)
- [ ] It handles loading, error, and empty states where async data is involved
- [ ] It has a simple test checklist that was verified in the browser

---

## Folder Structure (Update Once Stack is Decided)

```
[PLACEHOLDER — fill in once framework is confirmed]

Standard web project pattern:
project/
├── .claude/            # Claude Code commands + skills
├── docs/               # Scaffold documentation
├── public/             # Static assets (favicon, OG images, robots.txt)
├── src/                # Source code
│   ├── app/ OR pages/  # Routes (framework-dependent)
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Generic primitives (Button, Card, Modal)
│   │   ├── portfolio/  # Gallery, lightbox, filters
│   │   ├── booking/    # Booking form, calendar
│   │   └── layout/     # Header, footer, nav
│   ├── lib/            # Utilities, API clients, helpers
│   ├── hooks/          # Custom hooks (if React/Vue)
│   ├── styles/         # Global CSS, design tokens
│   └── types/          # TypeScript types/interfaces
├── .env.example        # Template for required env vars (no real values)
└── .gitignore          # Must include .env.local
```

---

## Route Strategy (Update Once Stack is Decided)

| Route | Purpose |
|-------|---------|
| `/` | Home — hero, featured work, CTA to book |
| `/portfolio` | Gallery — browsable by category |
| `/portfolio/[category]` | Filtered gallery view |
| `/booking` | Booking form or calendar embed |
| `/about` | Photographer bio + philosophy |
| `/contact` | Contact form + social links |
| `/admin` | Admin dashboard (if needed) |

---

## Project Constraints

Update this table as decisions are confirmed:

| Constraint | Value | Status | Rationale |
|------------|-------|--------|-----------|
| Framework | TBD | Pending | |
| Styling | TBD | Pending | |
| Hosting | TBD | Pending | |
| CMS | TBD | Pending | |
| Booking | TBD | Pending | |
| Image Storage | TBD | Pending | |
| TypeScript | TBD | Pending | Recommended: yes |
| Domain | TBD | Pending | |

---

## Guardrail Establishment Checklist (M0 — Must Complete Before Feature Work)

### Project Setup
- [ ] Framework chosen and project initialized
- [ ] TypeScript configured (if using)
- [ ] Linter and formatter configured (ESLint, Prettier or Biome)
- [ ] .env.example created with all required variable names
- [ ] .gitignore includes .env.local, node_modules, .DS_Store, build output
- [ ] Git repository initialized
- [ ] README updated with setup instructions

### Design Tokens / Styling Foundation
- [ ] Color palette defined (brand colors, neutrals, error/success states)
- [ ] Typography scale defined (font family, sizes, weights)
- [ ] Spacing scale confirmed (consistent rhythm)
- [ ] Breakpoints documented (mobile, tablet, desktop)

### Hello World Vertical Slice
- [ ] Dev server runs without errors
- [ ] Production build succeeds without errors
- [ ] Home page renders with placeholder content in browser
- [ ] Responsive at 375px (mobile) and 1280px (desktop) confirmed
- [ ] No console errors

---

## Key Documentation Links

| Resource | Location |
|----------|----------|
| Progress Tracker (source of truth) | `docs/PROGRESS_TRACKER.md` |
| Architecture Decisions | `docs/canonical/ADR/` |
| Web Architecture Standards | `docs/canonical/architecture/web-architecture.md` |
| Dev Workflow Guide | `docs/canonical/AgentOverview/DEV-Workflow-Guide.md` |
| Feature Templates | `docs/canonical/templates/feature-spec-template.md` |
