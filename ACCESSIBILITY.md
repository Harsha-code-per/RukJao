# Accessibility

RukJao's first users include elderly parents who are new to smartphones, so accessibility is part of the product, not a checklist.

## Built in

- **Semantic landmarks and headings:** one `h1` per screen, a skip link, `<main>`, `<header>`, `<footer>`, and ordered lists wherever the content really is a sequence.
- **Native controls:** every choice is a real radio inside a `<fieldset>` with a `<legend>` (`ChoiceGroup.tsx`), so arrow keys, screen readers and voice control work without ARIA tricks. Chips have a 44 px minimum height.
- **Focus management:**
  - on a route change, focus moves to `<main>`
  - when a result arrives, focus moves to the verdict heading, so it is announced first
  - the result region is `aria-live="polite"`
  - errors use `role="alert"`
  - share feedback uses `role="status"`
- **Form errors:** the empty-message error sets `aria-invalid` and is linked with `aria-describedby`.
- **Never colour alone:**
  - the verdict is a text heading
  - the risk is written as "Risk 85 of 100" and also shown in a native `<meter>`
  - highlighted words carry hidden text naming the warning, and every warning is also listed below the message
- **Language:** results in Hindi are marked `lang="hi"`, and so is the Hindi option, so screen readers switch voice.
- **Contrast:** text colours were chosen for WCAG AA on the paper background. Focus rings are a 3 px violet outline, white on the dark section.
- **Motion:** the hero stream and stamps respect `prefers-reduced-motion` (the stream starts frozen and the stamps appear without movement). The animated inbox is a single `role="img"` with a text description; its decorative copy is hidden from assistive tech.
- **Reflow:** no horizontal scrolling at 320 CSS px (WCAG 1.4.10). The result card clips its landing-stamp animation, and an e2e test samples the page width on every frame while the stamp lands, on desktop and on a phone.
- **Reading:** an 18 px base size, a 1.55 line height, line lengths under about 75 characters, and plain words.

## Verified

`e2e/app.spec.ts` runs axe (WCAG 2.0/2.1/2.2 A and AA) on the landing page and on a full result, on desktop and on a Pixel 7 viewport, and drives the check by keyboard. Both must report zero violations.
