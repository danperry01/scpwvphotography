# /verify Command

Check completed work against the web architecture standards and guardrails before moving on.

## Steps

1. Re-read the relevant section of `scaffold/GUARDRAILS.md` for the feature type just built.

2. Run through this checklist for the feature:

### Code Quality
- [ ] Each component has a single, clear responsibility
- [ ] No secrets or API keys hardcoded in source
- [ ] No raw `<img>` tags — using framework image optimization
- [ ] All images have descriptive alt text
- [ ] Semantic HTML used (nav, main, section, button, etc.)

### Responsive + Accessibility
- [ ] Tested at 375px (mobile) and 1280px (desktop) minimum
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators visible
- [ ] Color contrast meets 4.5:1 for text

### Data + State
- [ ] Loading state handled where async data is fetched
- [ ] Error state handled — friendly message, not a stack trace
- [ ] Empty state handled where applicable

### Forms (if applicable)
- [ ] Client-side validation in place
- [ ] Server-side validation in place
- [ ] Success and error feedback shown to user
- [ ] No sensitive data in URL params

### Build
- [ ] `npm run build` succeeds with no errors
- [ ] No console errors in browser dev tools

3. Log any issues found as tasks in `scaffold/docs/PROGRESS_TRACKER.md`.

4. Confirm Definition of Done:
- [ ] Renders correctly at mobile and desktop
- [ ] Accessibility basics pass
- [ ] Async states covered
- [ ] Test checklist verified

## Common Web Issues

### 1. Images causing layout shift
Symptom: Page jumps as images load.
Fix: Set explicit width and height on image components. Use `aspect-ratio` CSS if dynamic sizing needed.

### 2. Form submits but no feedback shown
Symptom: User clicks submit and nothing visible happens.
Fix: Add loading state to submit button. Show success/error message after response.

### 3. Page looks broken on mobile
Symptom: Content overflows or overlaps on small screens.
Fix: Check for fixed pixel widths. Use max-width + padding instead. Test at 320px minimum.

### 4. Environment variable not found at runtime
Symptom: API call fails, undefined key.
Fix: Ensure variable is in .env.local (not .env). In Next.js, client-side vars need NEXT_PUBLIC_ prefix.
