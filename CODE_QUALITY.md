# Code quality

RukJao is deliberately small: 32 source files, one package, and no framework beyond React and Hono. The design choices behind this are recorded in [docs/DECISIONS.md](docs/DECISIONS.md).

## Structure

| Layer | Folder | Rule |
|---|---|---|
| Contract | `shared/` | Zod schemas are the single source of truth for API types, used by the server, the client and the AI output check |
| Domain | `server/engine/` | Pure functions, no I/O: `detect` → `assess` → `chooseSteps`. Rules and plan steps are data tables, not branches |
| Integrations | `server/ai/`, `server/store/` | Each sits behind a one-function type (`Reviewer`, `PatternStore`) and is injected, so tests never touch the network |
| HTTP | `server/app.ts`, `server/http/` | `createApp(deps)` builds the app from its dependencies. `server/index.ts` is the only file that reads the environment and wires real services |
| Client | `src/` | Screens (`landing/`, `check/`), with logic in hooks (`useCheck`) and pure helpers (`segment`, `warningText`) |

## Enforced by tooling (`eslint.config.js`, `tsconfig.json`)

- TypeScript `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
- typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`
- `complexity` ≤ 8, `max-depth` ≤ 3, `max-params` ≤ 3
- functions ≤ 30 lines in `.ts` and ≤ 60 in components. The two data tables (`rules.ts`, `plan.ts`) are exempt because their length is data.
- `eqeqeq`, consistent type imports, no stray `console.log`
- `npm run check` runs lint, types, tests with coverage thresholds, and the build. CI runs the same on every push.

## Conventions

- Named constants for every threshold (`SCAM_AT`, `BODY_LIMIT_BYTES`, `WEEK_MS`…) and HTTP status maps instead of bare numbers.
- Shared values live in one place: the risk thresholds (`SUSPICIOUS_AT`, `SCAM_AT`, `RISK_MAX`) are defined in `shared/schema.ts` and drive the engine's verdict, the API schema and the result meter alike.
- Each exported function has a one-line doc comment saying *why*, not *what*.
- Deliberate shortcuts are marked `ponytail:` with their limit and upgrade path (for example, the in-memory rate limiter).
- No dead code and no speculative abstraction: one implementation, no interface.

## Measured audit

Measured on the current `main` with `npm run check`, `npx eslint . --max-warnings 0` and a line count that skips blanks and comments.

| Check | Result |
|---|---|
| ESLint (`strictTypeChecked`, `stylisticTypeChecked`, react-hooks) | 0 errors, 0 warnings |
| `tsc --noEmit` (strict, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`) | 0 errors |
| Source files (`server/`, `shared/`, `src/`) | 32 |
| Longest logic file | `server/ai/gemini.ts`, 77 lines (`rules.ts`, at 172 lines, is a data table) |
| Longest component | `src/landing/Landing.tsx`, 64 lines |
| Cyclomatic complexity | ≤ 8 everywhere (lint error above) |
| Function length | ≤ 30 lines in `.ts`, ≤ 60 in components (lint error above) |
| Parameters per function | ≤ 3 (lint error above) |
| `any`, `@ts-ignore`, `eslint-disable` | none |
| `innerHTML`, `dangerouslySetInnerHTML`, `eval` | none |
| Tests | 80 Vitest tests at 100% line coverage, plus 10 Playwright runs |
| Production dependencies with known vulnerabilities | 0 (`npm audit --omit=dev`) |

## Repository hygiene

- `.editorconfig` fixes encoding, line endings and indentation for every editor.
- `.env.example` documents every setting, with its default and purpose.
- CI (`.github/workflows/ci.yml`) runs `npm audit`, lint, types, tests with coverage thresholds, the build and the e2e suite on every push. CodeQL scans every push.
- One branch (`main`) and small, descriptive commits.
