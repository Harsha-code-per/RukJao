/**
 * Routing for two screens on the History API, without a router library.
 *
 * `navigate` pushes a path and fires `popstate`, so back, forward and in-app links all
 * update `usePath` the same way. `followLink` leaves new-tab and modified clicks to the
 * browser. Used by `App.tsx` and the screen headers.
 *
 * @see docs/DECISIONS.md › 8. No UI framework beyond React
 */

import { useEffect, useState, type MouseEvent } from 'react';

const ROUTE_EVENT = 'popstate';

/** Client-side navigation without a router library: history API plus a popstate signal. */
export const navigate = (path: string): void => {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent(ROUTE_EVENT));
};

/** The current pathname, kept in sync with back/forward and `navigate`. */
export const usePath = (): string => {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const sync = (): void => {
      setPath(window.location.pathname);
    };
    window.addEventListener(ROUTE_EVENT, sync);
    return () => {
      window.removeEventListener(ROUTE_EVENT, sync);
    };
  }, []);
  return path;
};

/** Click handler for internal links: keeps new-tab and modified clicks native. */
export const followLink = (event: MouseEvent<HTMLAnchorElement>): void => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  navigate(event.currentTarget.pathname);
};
