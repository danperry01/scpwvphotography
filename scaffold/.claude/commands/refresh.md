# /refresh Command

Restore full context after compaction or at the start of a new session.

## Steps

1. Read the guardrails and project context:
   - `scaffold/GUARDRAILS.md` — rules, coding standards, session structure (read first)
   - `scaffold/CLAUDE.md` — project constraints, architecture overview
   - `scaffold/docs/PROGRESS_TRACKER.md` — current milestone and sprint status

2. Read architecture standards if working on a new system:
   - `scaffold/docs/canonical/architecture/web-architecture.md`
   - `scaffold/docs/canonical/ADR/` — any decisions relevant to current work

3. Check recent session log in `scaffold/docs/PROGRESS_TRACKER.md` to understand
   what was last completed and what is next.

## Quick Reference After Refresh

### Session Response Structure
Every feature/fix response must use this 8-part structure:
1. Feature Summary
2. Data + Systems
3. Architecture Plan
4. Visual/UI Steps
5. Code Plan
6. Implementation Steps
7. Test Plan
8. Next Scalable Extension

### Hard Coding Standards
- One component, one responsibility
- Secrets in environment variables only
- Images always optimized with alt text
- Mobile-first CSS
- Validate on both client and server
- Handle loading, error, and empty states

### Definition of Done
- Renders correctly at mobile and desktop breakpoints
- Passes basic accessibility check
- Handles async states (loading, error, empty)
- Test checklist verified in browser

### Key File Locations
| Item | Path |
|------|------|
| Guardrails | `scaffold/GUARDRAILS.md` |
| Project Context | `scaffold/CLAUDE.md` |
| Progress | `scaffold/docs/PROGRESS_TRACKER.md` |
| ADRs | `scaffold/docs/canonical/ADR/` |
| Web Architecture | `scaffold/docs/canonical/architecture/web-architecture.md` |
| Working Project | `site/` |
