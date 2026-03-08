# /commit Command

Create a properly formatted commit for the photography website project.

## Branch Strategy

```
main          - Production (live site)
develop       - Integration branch (default working branch)
feature/*     - New features or sections
fix/*         - Bug fixes
content/*     - Copy, image, or content-only changes
chore/*       - Dependencies, config, tooling, folder structure
docs/*        - Documentation only
```

Always branch from `develop`. Never push directly to `main`.

## Commit Message Format

```
<type>: <short description>

<optional body — what changed and why>

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types

| Type | Use For |
|------|---------|
| `feat` | New page, section, or feature |
| `fix` | Bug fix |
| `refactor` | Code restructure (no behavior change) |
| `content` | Copy changes, image updates, data-only changes |
| `style` | CSS/visual changes only |
| `docs` | Documentation only |
| `chore` | Package updates, config, tooling |
| `perf` | Performance improvements |

### Examples

```
feat: Add portfolio gallery with category filter

GalleryGrid and CategoryFilter components added. Images sourced from
Cloudinary. Filter state managed locally in the gallery page component.

Co-Authored-By: Claude <noreply@anthropic.com>
```

```
fix: Mobile nav menu not closing after link click

Added onClick handler to close menu on route change.

Co-Authored-By: Claude <noreply@anthropic.com>
```

```
content: Update about page copy and hero photo

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Pre-Commit Checklist

- [ ] `npm run build` passes with no errors
- [ ] No console errors in browser dev tools
- [ ] Tested at mobile (375px) and desktop (1280px)
- [ ] No secrets or API keys in source code
- [ ] .env.local is NOT staged (check with `git status`)
- [ ] Images have alt text
- [ ] PROGRESS_TRACKER.md updated

## Important Notes

Never commit `.env.local` — it contains real secrets.
Confirm `.env.local` is in `.gitignore` before first commit.

When adding new environment variables, add the variable name (with no value)
to `.env.example` so other developers know it is required.
