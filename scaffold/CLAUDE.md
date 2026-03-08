# Claude Code Project Notes — Photography Portfolio + Booking Website

## Quick Reference

| Resource | Location |
|----------|----------|
| **GUARDRAILS (read first)** | `GUARDRAILS.md` — rules, coding standards, session structure |
| **Progress Tracker** | `docs/PROGRESS_TRACKER.md` (single source of truth) |
| **Architecture Decisions** | `docs/canonical/ADR/` |
| **Web Architecture Standards** | `docs/canonical/architecture/web-architecture.md` |
| **Dev Workflow** | `docs/canonical/AgentOverview/DEV-Workflow-Guide.md` |

## Project Overview

- **Type**: Photography portfolio and booking website
- **Purpose**: Showcase photographer's work and allow clients to book photography jobs
- **Developer level**: TBD
- **AI role**: Senior web tech lead + UI/UX advisor + architecture advisor
- **Working directory**: `/Users/danperry/Documents/Richwood/Code/SCPWeb/site`
- **Photographer**: [PHOTOGRAPHER_NAME] — update once confirmed

## Project Constraints (Update as Confirmed)

| Constraint | Value | Status | Notes |
|------------|-------|--------|-------|
| Framework | TBD | Pending | Discuss: Next.js, SvelteKit, Astro, etc. |
| Styling | TBD | Pending | Discuss: Tailwind, CSS Modules, etc. |
| Hosting | TBD | Pending | Vercel, Netlify, self-hosted |
| CMS / Content | TBD | Pending | Sanity, Contentful, markdown files, etc. |
| Booking System | TBD | Pending | Custom form, Calendly embed, custom calendar |
| Auth | TBD | Pending | Required if admin dashboard needed |
| Database | TBD | Pending | Only if custom booking/CRM needed |
| Image Storage | TBD | Pending | Cloudinary, S3, local |
| Domain | TBD | Pending | |
| Analytics | TBD | Pending | |

## Site Sections (Update as Defined)

| Section | Value |
|---------|-------|
| Portfolio/Gallery | TBD — categories of work |
| Booking | TBD — form, calendar, or external tool |
| About | TBD — photographer bio, style |
| Contact | TBD — contact form, social links |
| Pricing | TBD — packages or on-request |
| Blog/Journal | TBD — optional |

## Skills and Commands

| Command | Purpose | File |
|---------|---------|------|
| **/refresh** | Restore context after compaction or new session | `.claude/commands/refresh.md` |
| **/verify** | Check work against web architecture and guardrails | `.claude/commands/verify.md` |
| **/progress** | Update tracker and document session work | `.claude/commands/progress.md` |
| **/learn** | Record learnings from failures or discoveries | `.claude/commands/learn.md` |
| **/commit** | Create a properly formatted commit | `.claude/commands/commit.md` |

## Architecture Overview (Update as Stack is Decided)

```
[PLACEHOLDER — fill in once tech stack is confirmed]

Example structure (Next.js App Router):
app/
├── (marketing)/       # Public-facing pages
│   ├── page.tsx       # Home / hero
│   ├── portfolio/     # Gallery pages
│   ├── booking/       # Booking flow
│   ├── about/
│   └── contact/
├── (admin)/           # Password-protected admin (if needed)
└── api/               # API routes (booking submissions, etc.)

components/
├── ui/                # Generic, reusable UI primitives
├── portfolio/         # Gallery, lightbox, category filters
├── booking/           # Form steps, calendar widget
└── layout/            # Header, footer, nav
```

## Operating Rules

1. **Read GUARDRAILS.md first** — every session, before anything else
2. **Progress Tracker is truth** — all tasks originate from `docs/PROGRESS_TRACKER.md`
3. **No emojis** — avoid in all code and documentation
4. **Vertical slices** — each feature must render correctly and be visually testable
5. **Mobile-first** — all UI is designed for mobile before scaling up to desktop
6. **No magic leaps** — define terms, then use them consistently

## Common Tasks

### Start Development Server
```bash
npm run dev        # or: pnpm dev / bun dev — update once stack is set
```

### Run Build Check
```bash
npm run build
```

### Run Linter
```bash
npm run lint
```
