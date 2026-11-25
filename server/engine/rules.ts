/**
 * Red-flag rules: every signal the engine looks for, kept as data.
 *
 * Each rule carries a weight, the scam family it points to, a label in both languages
 * and patterns for English, Hinglish and Hindi. Patterns look for a request near the
 * secret ("share your OTP"), not the secret alone, so a genuine bank OTP notice stays
 * safe. Adding a pattern means one entry here and one case in `tests/engine.test.ts`.
 * Read by `analyze.ts`.
 *
 * @see docs/DECISIONS.md › 2. Hard rules for things no genuine sender asks
 * @see README.md › Sources
 */

import type { Language, Tactic } from '../../shared/schema';

/** One red-flag signal. `weight` adds to the 0–100 risk score. */
export interface Rule {
  id: string;
  weight: number;
  /** A hard rule alone makes the verdict "scam": no genuine sender ever asks for this. */
  hard: boolean;
  tactic: Tactic | null;
  label: Record<Language, string>;
  patterns: RegExp[];
}

const rule = (r: Rule): Rule => r;

/**
 * Signals drawn from public advisories by I4C (cybercrime.gov.in), RBI and DoT
 * on the scams most reported in India. Hindi patterns cover common Hinglish too.
 */
export const RULES: readonly Rule[] = [
  rule({
    id: 'otp_request',
    weight: 50,
    hard: true,
    tactic: 'otp_theft',
    label: { en: 'Asks for an OTP or PIN', hi: 'OTP या PIN माँग रहा है' },
    patterns: [
      /\b(share|send|tell|give|forward|read out)\b[^.!?\n]{0,30}\b(otp|pin|cvv|password)\b/gi,
      /\b(otp|cvv|upi pin)\b[^.!?\n]{0,30}\b(share|send|tell|batao|bataye|bhejo)\b/gi,
      /(OTP|पिन|ओटीपी)[^।.!?\n]{0,20}(बताएं|बताइए|बताओ|भेजें|भेजो|शेयर)/g,
    ],
  }),
  rule({
    id: 'upi_collect',
    weight: 50,
    hard: true,
    tactic: 'upi_collect',
    label: { en: 'Says you must enter a PIN or scan to receive money', hi: 'पैसे पाने के लिए PIN या स्कैन बोल रहा है' },
    patterns: [
      /\b(enter|put|type)\b[^.!?\n]{0,25}\bpin\b[^.!?\n]{0,30}\b(receive|get|credit)/gi,
      /\bscan\b[^.!?\n]{0,30}\b(receive|get)\b[^.!?\n]{0,15}\b(money|payment|amount|refund|cashback)/gi,
      /\b(approve|accept)\b[^.!?\n]{0,20}\b(collect request|request)\b[^.!?\n]{0,30}\b(receive|refund|cashback)/gi,
      /पैसे\s*(पाने|लेने)[^।.!?\n]{0,25}(PIN|पिन|स्कैन)/g,
    ],
  }),
  rule({
    id: 'remote_access',
    weight: 50,
    hard: true,
    tactic: 'remote_access',
    label: { en: 'Asks you to install an app or share your screen', hi: 'ऐप इंस्टॉल या स्क्रीन शेयर करने को कह रहा है' },
    patterns: [/\b(anydesk|teamviewer|quick ?support|rustdesk|screen ?shar(e|ing))\b/gi, /\b\S+\.apk\b/gi],
  }),
  rule({
    id: 'digital_arrest',
    weight: 50,
    hard: true,
    tactic: 'digital_arrest',
    label: { en: 'Threatens arrest or a police/CBI case', hi: 'गिरफ्तारी या पुलिस/CBI केस की धमकी' },
    patterns: [
      /\b(digital arrest|arrest warrant|money laundering|narcotics|drugs?\b[^.!?\n]{0,20}\b(found|parcel)|(stay|remain) on (a )?video call|fir (registered|filed)|cbi|ncb|enforcement directorate|cyber (police|cell)|customs (officer|department))\b/gi,
      /(डिजिटल अरेस्ट|गिरफ्तार|वारंट|मनी लॉन्ड्रिंग|पुलिस केस)/g,
    ],
  }),
  rule({
    id: 'kyc_block',
    weight: 30,
    hard: false,
    tactic: 'kyc_bank',
    label: { en: 'Says your account or KYC will be blocked', hi: 'खाता या KYC बंद होने की बात' },
    patterns: [
      /\b(kyc|pan|aadhaar)\b[^.!?\n]{0,40}\b(update|expire[ds]?|pending|suspend(ed)?|block(ed)?)\b/gi,
      /\b(account|card|wallet|sim)\b[^.!?\n]{0,25}\b(will be )?(blocked|suspended|deactivated|frozen)\b/gi,
      /(KYC|खाता|अकाउंट)[^।.!?\n]{0,25}(बंद|ब्लॉक|अपडेट)/g,
    ],
  }),
  rule({
    id: 'bill_disconnect',
    weight: 35,
    hard: false,
    tactic: 'bill_disconnect',
    label: { en: 'Threatens to cut your electricity or connection', hi: 'बिजली या कनेक्शन काटने की धमकी' },
    patterns: [
      /\b(electricity|power|light|gas)\b[^.!?\n]{0,40}\b(disconnect(ed|ion)?|cut|cut off)\b/gi,
      /बिजली[^।.!?\n]{0,30}(कट|काट)/g,
    ],
  }),
  rule({
    id: 'prize',
    weight: 35,
    hard: false,
    tactic: 'lottery',
    label: { en: 'Promises a prize, lottery or cashback you never entered', hi: 'इनाम, लॉटरी या कैशबैक का लालच' },
    patterns: [
      /\b(you (have )?won|winner|lottery|lucky draw|jackpot|kbc|prize money|claim your (prize|reward|gift))\b/gi,
      /(लॉटरी|इनाम|जीत गए|जीते हैं|कैशबैक)/g,
    ],
  }),
  rule({
    id: 'job_task',
    weight: 35,
    hard: false,
    tactic: 'fake_job',
    label: { en: 'Easy money from home, likes or tasks', hi: 'घर बैठे आसान कमाई या टास्क का लालच' },
    patterns: [
      /\b(part[- ]time|work from home|earn (rs\.?|₹|inr)?\s?\d+|daily income|like (youtube )?videos|rate (hotels|products)|prepaid task)\b/gi,
      /(घर बैठे|रोज़? कमाएं|पार्ट टाइम)/g,
    ],
  }),
  rule({
    id: 'investment',
    weight: 35,
    hard: false,
    tactic: 'investment',
    label: { en: 'Guaranteed or very high returns', hi: 'गारंटीड या बहुत ज़्यादा मुनाफे का वादा' },
    patterns: [
      /\b(guaranteed (returns?|profit)|double your money|\d{2,3}\s?% (returns?|profit)|stock tips|ipo allotment|crypto (profit|trading group))\b/gi,
      /(पैसा डबल|गारंटीड मुनाफा)/g,
    ],
  }),
  rule({
    id: 'delivery',
    weight: 20,
    hard: false,
    tactic: 'delivery',
    label: { en: 'A parcel problem you did not expect', hi: 'अनजान पार्सल की समस्या' },
    patterns: [
      /\b(parcel|package|shipment|courier)\b[^.!?\n]{0,40}\b(held|on hold|seized|returned|failed|pending|address)\b/gi,
      /(पार्सल|कूरियर)[^।.!?\n]{0,25}(रुका|ज़ब्त|फेल)/g,
    ],
  }),
  rule({
    id: 'urgency',
    weight: 15,
    hard: false,
    tactic: null,
    label: { en: 'Rushes you to act now', hi: 'तुरंत कुछ करने का दबाव' },
    patterns: [
      /\b(immediately|urgent(ly)?|within \d+ (hours?|minutes?|hrs?|mins?)|today itself|last (chance|warning|reminder)|act now|tonight)\b/gi,
      /(तुरंत|अभी|आज ही|जल्दी करें|आखिरी मौका)/g,
    ],
  }),
  rule({
    id: 'secrecy',
    weight: 20,
    hard: false,
    tactic: null,
    label: { en: 'Tells you to keep it secret', hi: 'किसी को न बताने को कह रहा है' },
    patterns: [/\b(don'?t|do not|not to|not) (tell|inform|share with) (anyone|your family|anybody|the bank)\b/gi, /\bkeep (this|it) (confidential|secret)\b/gi, /(किसी को (मत|न) बताएं)/g],
  }),
  rule({
    id: 'call_number',
    weight: 15,
    hard: false,
    tactic: null,
    label: { en: 'Pushes you to call or message an unknown number', hi: 'अनजान नंबर पर कॉल या मैसेज करने का दबाव' },
    patterns: [/\b(call|contact|whatsapp|message)\b (us )?(on|at) (this|the (below|given)|our) (number|helpline)\b/gi, /\bjoin (our |the )?telegram\b/gi, /इस नंबर पर (कॉल|संपर्क)/g],
  }),
  rule({
    id: 'personal_data',
    weight: 20,
    hard: false,
    tactic: null,
    label: { en: 'Wants card, Aadhaar or bank details', hi: 'कार्ड, आधार या बैंक डिटेल माँग रहा है' },
    patterns: [/\b(card number|expiry date|cvv|net ?banking (password|id)|aadhaar (number|copy)|bank details|account number)\b/gi, /(आधार नंबर|कार्ड नंबर|बैंक डिटेल)/g],
  }),
  rule({
    id: 'payment_push',
    weight: 25,
    hard: false,
    tactic: null,
    label: { en: 'Asks you to pay a fee or deposit first', hi: 'पहले फीस या पैसे जमा करने को कह रहा है' },
    patterns: [/\b(registration fee|processing fee|security deposit|pay (rs\.?|₹|inr)\s?\d+|transfer (rs\.?|₹|inr)?\s?\d+|refundable (fee|deposit))\b/gi, /(फीस जमा|पैसे भेजें|शुल्क)/g],
  }),
];

/** Label for flags raised by the link checker and by the AI reviewer. */
export const LINK_LABEL: Record<Language, string> = {
  en: 'Link that hides where it really goes',
  hi: 'संदिग्ध लिंक, असली पता छिपा है',
};
/** Risk added once when any link in the message is risky. */
export const LINK_WEIGHT = 25;
/** Flag id for red flags quoted by the AI reviewer. */
export const AI_FLAG_ID = 'ai_signal';
