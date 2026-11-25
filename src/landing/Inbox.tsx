/**
 * Hero animation: messages stream in, then stop (ruk jao) and the scams are stamped.
 *
 * It freezes after `FREEZE_AFTER_MS`, or at once under reduced motion. The stream is
 * hidden from assistive tech and the whole block is one image with a text description.
 * Messages come from `inbox.ts`.
 *
 * @see ACCESSIBILITY.md › Built in
 */

import { useEffect, useState } from 'react';
import { Stamp } from '../Stamp';
import { INBOX } from './inbox';

const FREEZE_AFTER_MS = 2600;
const STAMP_STAGGER_MS = 110;

const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Messages pour in, then everything stops (ruk jao) and the scams get stamped. */
export const Inbox = () => {
  const [frozen, setFrozen] = useState(reducedMotion);

  useEffect(() => {
    if (frozen) return;
    const timer = window.setTimeout(() => {
      setFrozen(true);
    }, FREEZE_AFTER_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [frozen]);

  return (
    <div className="inbox" data-frozen={frozen} role="img" aria-label="An inbox of incoming messages. The stream stops and every scam message gets stamped.">
      <ol className="inbox__stream" aria-hidden="true">
        {[...INBOX, ...INBOX].map((message, index) => (
          <li key={index} className={`bubble${message.scam ? ' bubble--scam' : ''}`}>
            <span className="bubble__from">{message.from}</span>
            <span className="bubble__text">{message.text}</span>
            {message.scam && <Stamp verdict="scam" className="bubble__stamp" delayMs={index * STAMP_STAGGER_MS} />}
          </li>
        ))}
      </ol>
    </div>
  );
};
