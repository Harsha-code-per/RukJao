/**
 * App shell: the skip link, a single `<main>`, and the switch between the landing page
 * and the checker.
 *
 * The checker is code-split, so the landing page ships less JavaScript. On every route
 * change the shell sets the title, scrolls to the top and moves focus to `<main>`, so a
 * screen reader announces the new screen. Routing is `src/lib/route.ts`.
 *
 * @see ACCESSIBILITY.md › Built in
 * @see EFFICIENCY.md › Client
 */

import { lazy, Suspense, useEffect, useRef } from 'react';
import { Landing } from './landing/Landing';
import { InkFilter } from './Stamp';
import { usePath } from './lib/route';

const CheckPage = lazy(() => import('./check/CheckPage'));

const TITLES: Record<string, string> = {
  '/': 'RukJao: check a message before you pay',
  '/check': 'Check a message | RukJao',
};

/** Two screens: the landing page and the checker, which loads on demand. */
export const App = () => {
  const path = usePath();
  const main = useRef<HTMLElement>(null);
  const isCheck = path === '/check';

  useEffect(() => {
    document.title = TITLES[path] ?? TITLES['/'] ?? '';
    window.scrollTo(0, 0);
    // Move focus to the new screen so screen-reader users hear the change.
    if (document.activeElement !== document.body) main.current?.focus();
  }, [path]);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <InkFilter />
      <main id="main" ref={main} tabIndex={-1}>
        {isCheck ? (
          <Suspense fallback={<p className="loading">Opening the checker…</p>}>
            <CheckPage />
          </Suspense>
        ) : (
          <Landing />
        )}
      </main>
    </>
  );
};
