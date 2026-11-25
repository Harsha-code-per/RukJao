import { RISK_MAX, SCAM_AT, SUSPICIOUS_AT, type Flag, type Language, type Tactic, type Verdict } from '../../shared/schema';
import { findRiskyLinks } from './links';
import { LINK_LABEL, LINK_WEIGHT, RULES } from './rules';

/** Rule metadata the scorer needs, keyed by flag id. */
interface Signal {
  id: string;
  weight: number;
  hard: boolean;
  tactic: Tactic | null;
}

export interface Detection {
  flags: Flag[];
  signals: Signal[];
}

export interface Assessment {
  risk: number;
  verdict: Verdict;
  tactic: Tactic;
}

const ruleHits = (message: string, language: Language): Detection => {
  const flags: Flag[] = [];
  const signals: Signal[] = [];
  for (const rule of RULES) {
    const spans = rule.patterns.flatMap((pattern) => [...message.matchAll(pattern)]);
    if (spans.length === 0) continue;
    signals.push({ id: rule.id, weight: rule.weight, hard: rule.hard, tactic: rule.tactic });
    for (const span of spans) {
      flags.push({ id: rule.id, label: rule.label[language], start: span.index, end: span.index + span[0].length });
    }
  }
  return { flags, signals };
};

/** Runs every rule and the link checker. Each flag keeps its text span for highlighting. */
export const detect = (message: string, language: Language): Detection => {
  const found = ruleHits(message, language);
  const links = findRiskyLinks(message);
  if (links.length > 0) {
    found.signals.push({ id: 'risky_link', weight: LINK_WEIGHT, hard: false, tactic: null });
    found.flags.push(...links.map((link) => ({ id: 'risky_link', label: LINK_LABEL[language], ...link })));
  }
  found.flags.sort((a, b) => a.start - b.start);
  return found;
};

const verdictFor = (risk: number, hasHard: boolean): Verdict => {
  if (hasHard || risk >= SCAM_AT) return 'scam';
  return risk >= SUSPICIOUS_AT ? 'suspicious' : 'safe';
};

/** The scam family with the heaviest signal, so advice can name the trick. */
const leadingTactic = (signals: Signal[]): Tactic => {
  const ranked = signals.filter((s) => s.tactic !== null).sort((a, b) => b.weight - a.weight);
  return ranked[0]?.tactic ?? 'unknown';
};

/** Turns signals into a 0–100 risk, a verdict and the scam family. Each rule counts once. */
export const assess = (signals: Signal[]): Assessment => {
  const hasHard = signals.some((s) => s.hard);
  const sum = signals.reduce((total, s) => total + s.weight, 0);
  const risk = Math.min(RISK_MAX, hasHard ? Math.max(sum, SCAM_AT) : sum);
  return { risk, verdict: verdictFor(risk, hasHard), tactic: leadingTactic(signals) };
};
