/**
 * Link checker: finds the links in a message and flags the ones that hide where they
 * really go.
 *
 * A link is risky if it is shortened, a bare IP, punycode, plain http, an .apk
 * download, on a throwaway domain ending, or uses a bank or government name on a domain
 * that is not the official one. Each test is a one-line predicate in a list, so adding
 * one is one entry. Feeds `detect` in `analyze.ts` as the `risky_link` signal.
 *
 * @see README.md › 1. Rule engine (`server/engine`)
 */

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|net|org|xyz|top|click|icu|live|online|info|buzz|site|co|me|ly|gd|at|cc|sbi)\/[^\s<>"']*/gi;

const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 'cutt.ly', 'is.gd', 't.ly', 'rb.gy', 'shorturl.at', 'tiny.cc', 'goo.gl', 'ow.ly', 's.id']);
const RISKY_TLDS = new Set(['xyz', 'top', 'click', 'icu', 'live', 'online', 'buzz', 'site', 'info']);
const BRANDS = ['sbi', 'hdfc', 'icici', 'axis', 'kotak', 'paytm', 'phonepe', 'gpay', 'npci', 'uidai', 'aadhaar', 'indiapost', 'epfo', 'incometax', 'bescom', 'tneb', 'msedcl'];
const OFFICIAL_SUFFIXES = ['.gov.in', '.nic.in', 'sbi.co.in', 'onlinesbi.sbi', 'hdfcbank.com', 'icicibank.com', 'axisbank.com', 'kotak.com', 'paytm.com', 'phonepe.com', 'npci.org.in'];
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/** Where a risky link sits in the message. */
export interface LinkHit {
  start: number;
  end: number;
}

const hostOf = (raw: string): string | null => {
  try {
    const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const isOfficial = (host: string): boolean =>
  OFFICIAL_SUFFIXES.some((suffix) => host === suffix.replace(/^\./, '') || host.endsWith(suffix));

const impersonatesBrand = (host: string): boolean =>
  BRANDS.some((brand) => host.includes(brand)) && !isOfficial(host);

const RAW_CHECKS: ((raw: string) => boolean)[] = [(raw) => /^http:\/\//i.test(raw), (raw) => /\.apk(\b|$)/i.test(raw)];

const HOST_CHECKS: ((host: string) => boolean)[] = [
  (host) => SHORTENERS.has(host),
  (host) => IPV4.test(host),
  (host) => host.split('.').some((label) => label.startsWith('xn--')),
  (host) => RISKY_TLDS.has(host.split('.').at(-1) ?? ''),
  impersonatesBrand,
];

/** True when a link's real destination is hidden or pretends to be someone else. */
export const isRiskyLink = (raw: string): boolean => {
  const host = hostOf(raw);
  return host === null || RAW_CHECKS.some((check) => check(raw)) || HOST_CHECKS.some((check) => check(host));
};

/** Spans of every risky link in the message. */
export const findRiskyLinks = (message: string): LinkHit[] =>
  [...message.matchAll(URL_PATTERN)]
    .filter((match) => isRiskyLink(match[0]))
    .map((match) => ({ start: match.index, end: match.index + match[0].length }));
