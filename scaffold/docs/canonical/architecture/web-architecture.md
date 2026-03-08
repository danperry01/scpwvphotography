# Web Architecture Standards
# Photography Portfolio + Booking Website

This document is the canonical reference for architectural patterns in this project.
All feature work must comply with these standards.

---

## Confirmed Stack Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | None — plain HTML/CSS/JS | Local-first, zero install, deploys anywhere for free |
| Styling | tokens.css + styles.css | CSS custom properties for easy rebranding |
| JS structure | main.js, gallery.js, booking.js | Lightweight; split further only if complexity demands it |
| Data layer | gallery.json, services.json, packages.json | Content changes require no HTML edits |
| Booking | EmailJS (free tier) — inquiry form only | No backend, no calendar; photographer gets email notification |
| Customer confirmation | Not implemented yet | Photographer-only notification for now |
| Portfolio layout | Single page, filter bar (All / Sports / Formal / Senior / Portrait) | No separate category pages |
| Hosting | Local file initially; free static host later (Netlify/GitHub Pages) | |
| Images | Local files under assets/images/gallery/ | Organised by category folder |

## Guiding Principles

1. **Content-first** — The site exists to showcase photography and convert visitors to clients. Every architectural decision must serve that goal.
2. **Performance is a feature** — Images must load fast. Core Web Vitals matter for SEO and user retention.
3. **Maintainable by a non-developer** — Content updates (photos, prices, copy) require only JSON edits, never HTML.
4. **Mobile-first** — All UI designed at mobile width first, then scaled up.
5. **Keep it simple** — Do not split code into more files than necessary. Complexity grows only when the current structure can no longer hold it.

---

## File Structure (Canonical — Do Not Deviate)

```
site/
├── index.html              # Home: hero, gallery preview, services, packages, contact
├── portfolio.html          # Full gallery with category filter
├── bookings.html           # Session inquiry form
│
├── data/                   # All editable content — no HTML changes needed for content updates
│   ├── gallery.json        # Photos: { src, alt, category, featured }
│   ├── services.json       # Service cards: { id, name, price, pricePrefix, description, image }
│   └── packages.json       # Packages: { name, label, price, bullets[] }
│
├── assets/
│   ├── css/
│   │   ├── tokens.css      # CSS custom properties: colors, fonts, spacing, breakpoints
│   │   └── styles.css      # All layout and component styles — built on tokens only
│   │
│   ├── js/
│   │   ├── main.js         # Shared: nav injection, footer injection, marquee, page init
│   │   ├── gallery.js      # Reads gallery.json — renders grid, category filter, lightbox
│   │   └── booking.js      # Inquiry form steps, validation, EmailJS submission
│   │
│   └── images/
│       ├── logo/
│       │   ├── logo-full.jpg       # Full logo (dark background version)
│       │   └── logo-nav.png        # Horizontal nav logo (orange/teal)
│       └── gallery/
│           ├── hero/               # Hero/banner images
│           ├── sports/
│           ├── formal/
│           ├── senior/
│           └── portrait/
```

## JS Responsibilities

| File | Owns |
|------|------|
| main.js | Nav HTML, footer HTML, marquee animation, any shared page setup |
| gallery.js | Fetch gallery.json, render photo grid, category filter, lightbox open/close |
| booking.js | Form step progression, field validation, EmailJS send, success/error states |

## Data File Contracts

### gallery.json
```json
{
  "photos": [
    {
      "src": "assets/images/gallery/sports/filename.jpg",
      "alt": "Descriptive alt text",
      "category": "sports",
      "featured": true
    }
  ]
}
```
Categories: `sports` | `formal` | `senior` | `portrait`

### services.json
```json
{
  "services": [
    {
      "id": "sports",
      "name": "Sports Session",
      "price": "100",
      "pricePrefix": "From $",
      "description": "...",
      "image": "assets/images/gallery/sports/cover.jpg"
    }
  ]
}
```

### packages.json
```json
{
  "packages": [
    {
      "label": "GAME DAY EXPERIENCE",
      "price": "185",
      "bullets": ["Pregame warm-up shots", "..."]
    }
  ]
}
```

---

## Data Fetching Strategy (Update Once Stack is Confirmed)

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| Portfolio images | Static / build-time | Content does not change per-user. Pre-render for performance. |
| Portfolio metadata | Static / CMS at build time | Same rationale |
| Booking form submission | Client-side POST to API | Dynamic user action |
| Contact form submission | Client-side POST to API | Dynamic user action |
| Admin booking list (if any) | Server-side, authenticated | Sensitive data |

---

## Image Handling

- Always use the framework's image optimization component (next/image, @nuxt/image, etc.)
- Never use raw `<img>` tags for portfolio images
- Every image must have a descriptive `alt` attribute
- Images must have explicit width and height to prevent layout shift (CLS)
- Use lazy loading for images below the fold
- Provide WebP format with JPEG fallback where possible

---

## Forms and Booking

- All form validation occurs on both client (UX) and server (security)
- Never trust client-side validation alone
- Form submissions must provide clear loading, success, and error states
- Protect all form endpoints with rate limiting
- No sensitive data (phone, email, booking details) stored in browser localStorage
- Booking confirmation must be sent by email (transactional email service TBD)

---

## SEO Standards

Every page must have:
- Unique `<title>` tag
- Unique `<meta name="description">` (150–160 chars)
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Canonical URL

Portfolio images must have descriptive file names and alt text for image SEO.

---

## Accessibility Standards (WCAG 2.1 AA target)

- All interactive elements reachable via keyboard
- Focus indicators visible at all times
- Color contrast ratio: 4.5:1 minimum for text
- Screen reader labels on icon buttons and image-only links
- Semantic HTML — use `<nav>`, `<main>`, `<section>`, `<article>`, `<button>` appropriately

---

## Security Standards

- All secrets in environment variables — never in source code
- `.env.local` in `.gitignore` — never committed
- API routes validate and sanitize all input
- CORS configured correctly for API routes
- No sensitive data in URL parameters (email addresses, booking IDs, etc.)
- Dependencies audited with `npm audit` before each milestone

---

## Performance Targets (Core Web Vitals)

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID / INP (Interaction to Next Paint) | < 200ms |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Time to First Byte (TTFB) | < 600ms |
| Lighthouse Performance Score | > 90 |

---

## ADR Process

When a significant architectural decision is made:
1. Create a new file in `docs/canonical/ADR/` using the template
2. Record: context, options considered, decision, consequences
3. Log the decision in the Progress Tracker Architecture Decisions table

Significant decisions include:
- Framework or library selection
- CMS or content strategy
- Booking system approach
- Authentication approach
- Hosting and deployment strategy
