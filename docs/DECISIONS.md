# Architecture decisions

Each record states the problem, the choice, and what it costs. They are short on purpose: the code is the detail.

## 1. Rule engine first, AI second

- **Context:** a scam checker that is wrong in the "safe" direction causes real loss. LLMs can be talked out of a verdict, they rate-limit, and they cost time.
- **Decision:** a deterministic rule engine (`server/engine`) always runs and always produces a complete answer. Gemini reviews afterwards and may only make the verdict **stricter** (`mergeVerdict` in `server/checker.ts`).
- **Consequences:** a prompt-injected "this is safe" can never lower a hard-rule scam. The app keeps working with the AI down. The cost is that brand-new scam wording relies on Gemini until a rule is added.

## 2. Hard rules for things no genuine sender asks

- **Context:** a weighted score alone could leave "share your OTP" at *suspicious* if the message has no other signs.
- **Decision:** four signals are `hard` and make a message a scam on their own: OTP or PIN requests, "enter your PIN to receive money", remote-access apps, and "digital arrest". Everything else adds to a 0–100 score, with thresholds (`SUSPICIOUS_AT`, `SCAM_AT`) defined once in `shared/schema.ts`.
- **Consequences:** a genuine bank OTP notice ("do not share this OTP") must not trip the OTP rule, so the patterns look for a *request* verb near the secret. `tests/engine.test.ts` locks both cases.

## 3. The plan is ordered by what the user already did

- **Context:** the same scam needs different first steps. Someone who has paid needs 1930 within the hour, while someone who has done nothing just needs to not reply.
- **Decision:** `chooseSteps` (`server/engine/plan.ts`) builds the plan from lookup tables in a fixed order: action → tactic → persona → channel, with duplicates removed. `isUrgent` shows the red "call 1930" bar only when money or secrets have already left.
- **Consequences:** the decision logic is data, not branches, so it is easy to review and test. Adding a scam family means adding a row.

## 4. One zod contract for server, client and model

- **Context:** the request, the result and the AI's output must agree, and the model's JSON cannot be trusted.
- **Decision:** `shared/schema.ts` defines every shape and enum. The server validates requests with it, the client parses responses with it, and the Gemini response schema is generated from `aiReviewSchema` with `z.toJSONSchema`.
- **Consequences:** a renamed field fails type-checking everywhere at once. Invalid model output is discarded, not patched.

## 5. Dependencies are injected, wired in one file

- **Context:** tests must never spend Gemini quota or touch Firestore.
- **Decision:** `createApp`, `createChecker` and `createReviewer` take one-function dependencies (`Checker`, `Reviewer`, `PatternStore`, `Generate`). `server/index.ts` is the only file that reads the environment and wires real services.
- **Consequences:** every path, including model failures and a broken store, is unit tested with plain fakes.

## 6. Store counts, never messages

- **Context:** the messages people check can contain names, account numbers and family details.
- **Decision:** Firestore keeps one document per scam family per week, `{tactic, count}`, updated with an atomic increment. The cache key is a SHA-256 hash held in memory. Message text is never written or logged.
- **Consequences:** "checked 42 times this week" still works. There is nothing personal to leak or delete.

## 7. One small Cloud Run service

- **Context:** the expected load is modest, and the budget is the free tier.
- **Decision:** a single Hono service serves both the API and the built client. It scales to zero with at most one instance. The rate limiter and LRU cache are in memory, marked `ponytail:` with their limit.
- **Consequences:** there is no CORS and no second deployment. Scaling out would need a shared store for the limiter, which the code comment names.

## 8. No UI framework beyond React

- **Context:** the first users are on low-end phones, often elders.
- **Decision:** routing uses the History API (`src/lib/route.ts`), state is `useState`, styling is plain CSS, and the hero animation is CSS keyframes with one timer. The checker is code-split. Fonts are self-hosted and split by `unicode-range`.
- **Consequences:** a small bundle and a strict CSP with no inline code or third parties. The trade-off is writing a small router (about 35 lines) by hand.
