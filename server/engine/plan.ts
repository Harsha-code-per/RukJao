/**
 * Action planner: turns a verdict and the reader's context into ordered "do this now"
 * steps.
 *
 * The order is fixed: what the reader already did (paid, shared, clicked) comes first
 * because it decides what is urgent, then the fact that defeats this trick, then a step
 * for who they are, then one for how the message arrived. Steps are bilingual data, so
 * the advice can be reviewed without reading logic. Helplines and portals are the
 * official Government of India ones. Called by `server/checker.ts`.
 *
 * @see docs/DECISIONS.md › 3. The plan is ordered by what the user already did
 * @see PROBLEM_ALIGNMENT.md › Example decisions
 */

import type { CheckRequest, Language, Tactic, Verdict } from '../../shared/schema';

type Text = Record<Language, string>;

/** Every step RukJao can give. Helplines and portals are the official Government of India ones. */
const STEPS = {
  call_1930: { en: 'Call 1930 now, the National Cyber Crime Helpline. The first hour gives the best chance of freezing the money.', hi: 'अभी 1930 पर कॉल करें (राष्ट्रीय साइबर क्राइम हेल्पलाइन)। पहले घंटे में पैसा रुकने की संभावना सबसे ज़्यादा होती है।' },
  call_bank_freeze: { en: 'Call your bank on the number printed on your card or passbook and ask them to block the transaction.', hi: 'कार्ड या पासबुक पर छपे नंबर से अपने बैंक को कॉल करें और ट्रांज़ैक्शन रोकने को कहें।' },
  file_cybercrime: { en: 'File a complaint at cybercrime.gov.in with the transaction ID and screenshots.', hi: 'cybercrime.gov.in पर ट्रांज़ैक्शन ID और स्क्रीनशॉट के साथ शिकायत दर्ज करें।' },
  no_recovery_fee: { en: 'Anyone who offers to "recover" your money for a fee is running a second scam.', hi: 'जो फीस लेकर पैसा "वापस दिलाने" की बात करे, वह दूसरा धोखा है।' },
  block_bank: { en: 'Call your bank now to block your card or UPI, and reset your UPI PIN.', hi: 'अभी बैंक को कॉल करके कार्ड या UPI ब्लॉक करवाएं और UPI PIN बदलें।' },
  change_passwords: { en: 'Change your banking and email passwords, and log out of other devices.', hi: 'बैंकिंग और ईमेल के पासवर्ड बदलें और बाकी डिवाइस से लॉग आउट करें।' },
  call_1930_if_money: { en: 'If any money has left your account, call 1930 straight away.', hi: 'अगर खाते से कोई पैसा गया है, तो तुरंत 1930 पर कॉल करें।' },
  close_page: { en: 'Close that page and do not type anything into it.', hi: 'वह पेज बंद करें और उसमें कुछ भी न भरें।' },
  uninstall_app: { en: 'Uninstall any app they asked you to install (AnyDesk, TeamViewer, an .apk file), then restart your phone.', hi: 'जो भी ऐप उन्होंने इंस्टॉल करवाया (AnyDesk, TeamViewer, .apk फ़ाइल) उसे हटाएं और फ़ोन रीस्टार्ट करें।' },
  dont_engage: { en: 'Do not reply, click the link or call back on the number they gave.', hi: 'जवाब न दें, लिंक न खोलें और उनके दिए नंबर पर कॉल न करें।' },
  no_digital_arrest: { en: 'There is no "digital arrest" in Indian law. Police and CBI never question or arrest anyone over a video call.', hi: 'भारतीय कानून में "डिजिटल अरेस्ट" जैसा कुछ नहीं है। पुलिस या CBI वीडियो कॉल पर गिरफ्तारी नहीं करती।' },
  pin_never_receives: { en: 'You never need a UPI PIN or a QR scan to receive money. A PIN only ever sends money out.', hi: 'पैसे पाने के लिए कभी UPI PIN या QR स्कैन की ज़रूरत नहीं होती। PIN से सिर्फ़ पैसा जाता है।' },
  no_job_fee: { en: 'Real jobs and internships never ask you to pay a fee or complete paid "tasks".', hi: 'असली नौकरी या इंटर्नशिप कभी फीस या पैसे वाले "टास्क" नहीं माँगती।' },
  no_prize_fee: { en: 'You cannot win a lottery you never entered. Never pay "tax" or "fees" to claim a prize.', hi: 'जिस लॉटरी में आपने भाग नहीं लिया, वह आप नहीं जीत सकते। इनाम के लिए कोई "टैक्स" या फीस न दें।' },
  bank_never_asks: { en: 'Banks never ask for OTPs, PINs or KYC updates through a link. Use the official app or visit the branch.', hi: 'बैंक कभी लिंक से OTP, PIN या KYC अपडेट नहीं माँगते। आधिकारिक ऐप या ब्रांच का इस्तेमाल करें।' },
  official_bill_app: { en: 'Check your bill only in the official electricity board app or website, never through a number in a message.', hi: 'बिल सिर्फ़ बिजली बोर्ड के आधिकारिक ऐप या वेबसाइट पर देखें, मैसेज वाले नंबर पर नहीं।' },
  track_official: { en: 'Track parcels only on the courier’s own website using the tracking number from your order.', hi: 'पार्सल सिर्फ़ कूरियर की अपनी वेबसाइट पर, अपने ऑर्डर के ट्रैकिंग नंबर से देखें।' },
  sebi_check: { en: 'No genuine investment guarantees returns. Check any adviser on the SEBI website before you pay.', hi: 'कोई असली निवेश गारंटीड मुनाफ़ा नहीं देता। पैसे देने से पहले SEBI वेबसाइट पर सलाहकार की जाँच करें।' },
  tell_family: { en: 'Before you do anything, show this message to a family member you trust.', hi: 'कुछ भी करने से पहले यह मैसेज परिवार के किसी भरोसेमंद सदस्य को दिखाएं।' },
  hang_up: { en: 'Hang up. If you are worried, call the organisation back on a number you find yourself.', hi: 'फ़ोन काट दें। चिंता हो तो खुद ढूँढे गए आधिकारिक नंबर पर कॉल करें।' },
  report_chakshu: { en: 'Report the number on Sanchar Saathi → Chakshu (sancharsaathi.gov.in), then block it.', hi: 'संचार साथी → चक्षु (sancharsaathi.gov.in) पर नंबर रिपोर्ट करें, फिर ब्लॉक करें।' },
  verify_official: { en: 'It looks ordinary, but before paying or sharing anything, confirm it through the official app or a number you already trust.', hi: 'यह सामान्य लगता है, फिर भी पैसे या जानकारी देने से पहले आधिकारिक ऐप या भरोसेमंद नंबर से पुष्टि करें।' },
} satisfies Record<string, Text>;

type StepId = keyof typeof STEPS;

const BY_ACTION: Record<CheckRequest['action'], StepId[]> = {
  paid: ['call_1930', 'call_bank_freeze', 'file_cybercrime', 'no_recovery_fee'],
  shared: ['block_bank', 'change_passwords', 'call_1930_if_money'],
  clicked: ['close_page', 'change_passwords'],
  none: ['dont_engage'],
};

const BY_TACTIC: Record<Tactic, StepId | null> = {
  otp_theft: 'bank_never_asks',
  kyc_bank: 'bank_never_asks',
  upi_collect: 'pin_never_receives',
  digital_arrest: 'no_digital_arrest',
  fake_job: 'no_job_fee',
  lottery: 'no_prize_fee',
  bill_disconnect: 'official_bill_app',
  delivery: 'track_official',
  investment: 'sebi_check',
  remote_access: 'uninstall_app',
  unknown: null,
};

const BY_PERSONA: Record<CheckRequest['persona'], StepId | null> = {
  elder: 'tell_family',
  shopkeeper: 'pin_never_receives',
  student: 'tell_family',
  general: null,
};

interface PlanInput {
  verdict: Verdict;
  tactic: Tactic;
}

/** Ordered step ids: what you already did first, then the trick, who you are, and how it reached you. */
export const chooseSteps = ({ verdict, tactic }: PlanInput, context: CheckRequest): StepId[] => {
  if (verdict === 'safe') return ['verify_official'];
  const channelStep: StepId = context.channel === 'call' ? 'hang_up' : 'report_chakshu';
  const ordered = [...BY_ACTION[context.action], BY_TACTIC[tactic], BY_PERSONA[context.persona], channelStep];
  return [...new Set(ordered.filter((id): id is StepId => id !== null))];
};

/** The action plan in the reader's language. */
export const buildPlan = (input: PlanInput, context: CheckRequest): string[] =>
  chooseSteps(input, context).map((id) => STEPS[id][context.language]);

/** Money already moved or secrets already shared, on anything that is not clearly safe. */
export const isUrgent = (verdict: Verdict, action: CheckRequest['action']): boolean =>
  verdict !== 'safe' && (action === 'paid' || action === 'shared');
