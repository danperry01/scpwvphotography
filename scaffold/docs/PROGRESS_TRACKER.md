# Photography Portfolio + Booking Website — Progress Tracker
# Single Source of Truth for All Tasks

## Project Milestones

| Milestone | Description | Progress | Status |
|-----------|-------------|----------|--------|
| M0 — Setup | File structure, assets placed, design tokens | 0% | Not Started |
| M1 — Home Page | Hero, gallery preview, services, packages, contact, marquee | 0% | Not Started |
| M2 — Portfolio Page | Full gallery grid, category filter, lightbox | 0% | Not Started |
| M3 — Booking Page | Session inquiry form, validation, EmailJS send | 0% | Not Started |
| M4 — Polish | Responsive QA, copy review, accessibility, transitions | 0% | Not Started |
| M5 — Deploy | Static host (Netlify or GitHub Pages), domain TBD | 0% | Not Started |

---

## Current Sprint

### In Progress
- [ ] M0: Initialize site/ folder structure

### Up Next
- [ ] M0: Place logos, create gallery category folders
- [ ] M0: tokens.css with brand colors, fonts, spacing
- [ ] M1: index.html shell + nav + footer via main.js
- [ ] M1: Hero section
- [ ] M1: Services section (data-driven from services.json)
- [ ] M1: Packages section (data-driven from packages.json)
- [ ] M1: Gallery preview (featured photos from gallery.json)
- [ ] M1: Contact section + marquee
- [ ] M2: portfolio.html — full grid + filter bar + lightbox
- [ ] M3: bookings.html — inquiry form + EmailJS

### Completed This Sprint
- [x] Scaffold updated for photography website project
- [x] Architecture confirmed: plain HTML/CSS/JS, data-driven JSON, EmailJS booking

### Blocked
- [ ] None

---

## Architecture Decisions Log

| Decision | Choice | Date |
|----------|--------|------|
| Scaffold updated | Photography website (replaced Unity game scaffold) | 2026-03-08 |
| Framework | None — plain HTML/CSS/JS | 2026-03-08 |
| Styling | tokens.css + styles.css, no framework | 2026-03-08 |
| Hosting (initial) | Local file | 2026-03-08 |
| Hosting (deploy) | Netlify or GitHub Pages (free) — domain TBD | 2026-03-08 |
| Content management | JSON data files — no HTML edits for content updates | 2026-03-08 |
| Booking approach | Session inquiry form via EmailJS, photographer notified only | 2026-03-08 |
| Portfolio layout | Single page, filter bar: All / Sports / Formal / Senior / Portrait | 2026-03-08 |
| JS structure | main.js, gallery.js, booking.js only | 2026-03-08 |
| Copy | Rewritten for polish — fix all Wix spelling/grammar issues | 2026-03-08 |

---

## Confirmed Content (from Wix site)

### Brand
- Name: SCP Photography
- Logo full: `assets/images/logo/logo-full.jpg` (dark navy bg, camera + mountains)
- Logo nav: `assets/images/logo/logo-nav.png` (horizontal, orange aperture)
- Nav links: Home · Portfolio · Book a Session
- Marquee: "CAPTURING MOMENTS • BOOKING MADE EASY • ..."
- Primary font: Serif (headings)
- Body font: Sans-serif

### Colors
| Token | Hex | Use |
|-------|-----|-----|
| --color-navy | #0d1b2a | Headings, nav, footer bar |
| --color-accent | #e07b2a | Buttons, prices, labels |
| --color-bg | #f0f4f8 | Page background |
| --color-white | #ffffff | Cards, nav |
| --color-text | #1a2a3a | Body text |

### Contact
- Email: scp.wvphotography@gmail.com
- Phone: +1 (681) 554-8588
- Instagram: linked (handle TBD — confirm with photographer)

### Services
| Session | Price | Note |
|---------|-------|------|
| Sports | From $100 | Recruiting profiles, individual/team |
| Formal Dance | From $75 | Prom/formal portraits |
| Senior | $125 | Graduation milestone sessions |
| Portrait | $100 | Individuals, families, couples |

### Packages
| Package | Price |
|---------|-------|
| Game Day Experience | $185 |
| Group Formal Dance Experience | $150 |
| Event Sessions | $150 |

---

## Session Log

### Session: 2026-03-08

#### Completed
- Scaffold updated from Unity game project to photography website project
- Architecture finalized: plain HTML/CSS/JS, 3 pages, 3 JS files, 3 data JSON files
- All content confirmed from Wix site screenshots
- Logos obtained and ready to place

#### Decisions Made
- Booking page = session inquiry form only, no live calendar
- Portfolio = single page with filter bar
- EmailJS for form submission — photographer notification only
- Copy to be rewritten polished/professional throughout

#### Next Steps
- Build M0: initialize site/ structure, place logos, write tokens.css
