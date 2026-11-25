# Testing

```bash
npm test               # Vitest: unit, integration and component tests
npm run test:coverage  # with v8 coverage and enforced thresholds
npm run e2e            # Playwright (desktop + Pixel 7) with axe accessibility scans
```

| Suite | File | What it proves |
|---|---|---|
| Rule engine | `tests/engine.test.ts` | Each hard signal alone gives "scam"; soft signals add up and count once; real bank OTP notices stay safe; Hindi detection; spans point at the right text; link checker (shorteners, IPs, punycode, look-alikes, `.apk`, official domains trusted) |
| Planner | `tests/plan.test.ts` | Paid → 1930 first; shared OTP → block the bank first; call → hang up; persona and tactic steps without repeats; Hindi output; urgency rules |
| Checker | `tests/checker.test.ts` | AI can raise but never lower a verdict; invented AI quotes dropped; cache hit skips the model and the counter; fallback not cached; broken store degrades to 0 |
| AI layer | `tests/gemini.test.ts` | Prompt fencing against tag-closing injection; reader and language in prompt; model chain falls through errors, empty, malformed and schema-invalid output; null when all fail |
| HTTP | `tests/app.test.ts` | 200/400/413/403/429/404/500 paths; CSP and HSTS headers; immutable asset caching; SPA fallback; rate-limit window reset; client IP parsing |
| Support | `tests/support.test.ts` | LRU eviction; env config defaults; Firestore counter against a fake db; week buckets |
| UI | `tests/ui.test.tsx` | Full user flow with focus on the verdict; empty-message validation; Hindi example; server error shown in an alert; reset; share/copy; landing freeze timing |
| End to end | `e2e/app.spec.ts` | Real production build: axe WCAG 2.2 AA on landing and result, keyboard-only check, Hindi answer, cross-site POST refused, no console/CSP errors |

The AI is tested through an injected `Generate` function, so tests never call the network and never spend quota. CI (`.github/workflows/ci.yml`) runs lint, types, coverage, build and e2e on every push.
