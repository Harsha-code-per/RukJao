/**
 * The rubber-stamp verdict mark, shared by the landing inbox and the result card.
 *
 * Decorative only (`aria-hidden`): the verdict is always given in text beside it. The
 * rough ink edge is one SVG filter, rendered once by `App.tsx` and referenced from
 * `styles.css`.
 */

import type { Verdict } from '../shared/schema';

const WORDS: Record<Verdict, { hi: string; en: string }> = {
  scam: { hi: 'धोखा', en: 'Scam' },
  suspicious: { hi: 'सावधान', en: 'Careful' },
  safe: { hi: 'ठीक है', en: 'Looks okay' },
};

/** A rubber-stamp impression in office-violet ink. Decorative: the verdict is always also given in text. */
export const Stamp = ({ verdict, className = '', delayMs = 0 }: { verdict: Verdict; className?: string; delayMs?: number }) => (
  <span className={`stamp stamp--${verdict} ${className}`} style={{ animationDelay: `${delayMs}ms` }} aria-hidden="true">
    <span className="stamp__hi">{WORDS[verdict].hi}</span>
    <span className="stamp__en">{WORDS[verdict].en}</span>
  </span>
);

/** Roughens stamp edges like ink on paper. Rendered once, referenced from CSS. */
export const InkFilter = () => (
  <svg className="ink-filter" aria-hidden="true" focusable="false">
    <filter id="ink">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
      <feDisplacementMap in="SourceGraphic" scale="2.4" />
    </filter>
  </svg>
);
