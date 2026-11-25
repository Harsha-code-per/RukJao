# Code quality

RukJao is deliberately small: about 30 source files, one package, no framework beyond React and Hono.

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
- Each exported function has a one-line doc comment saying *why*, not *what*.
- Deliberate shortcuts are marked `ponytail:` with their limit and upgrade path (for example, the in-memory rate limiter).
- No dead code and no speculative abstraction: one implementation, no interface.
