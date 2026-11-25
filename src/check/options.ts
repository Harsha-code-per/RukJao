/**
 * Answers for the four context questions, plus the ready-made example messages.
 *
 * Values are typed against `CheckRequest`, so renaming an enum in `shared/schema.ts`
 * breaks the build here instead of sending a value the server rejects. Used by
 * `CheckForm.tsx`.
 */

import type { CheckRequest } from '../../shared/schema';

type Options<K extends keyof CheckRequest> = { value: CheckRequest[K]; label: string; lang?: string }[];

/** Who got the message. */
export const PERSONA_OPTIONS: Options<'persona'> = [
  { value: 'general', label: 'Me' },
  { value: 'elder', label: 'My parent or grandparent' },
  { value: 'student', label: 'A student' },
  { value: 'shopkeeper', label: 'A shopkeeper' },
];

/** How it arrived. */
export const CHANNEL_OPTIONS: Options<'channel'> = [
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'call', label: 'Phone call' },
  { value: 'email', label: 'Email' },
];

/** What has been done so far. */
export const ACTION_OPTIONS: Options<'action'> = [
  { value: 'none', label: 'Nothing yet' },
  { value: 'clicked', label: 'Opened the link' },
  { value: 'shared', label: 'Shared an OTP, PIN or details' },
  { value: 'paid', label: 'Paid or sent money' },
];

/** Language of the answer. Hindi carries `lang` so it is read with Hindi voices. */
export const LANGUAGE_OPTIONS: Options<'language'> = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी', lang: 'hi' },
];

/** Ready-made examples so anyone can see RukJao work without a scam of their own. */
export const SAMPLES: { label: string; request: Partial<CheckRequest> & { message: string } }[] = [
  { label: 'Fake KYC SMS', request: { channel: 'sms', message: 'Dear customer, your bank account will be blocked today. Update your KYC immediately at http://bnk-kyc-update.xyz/login' } },
  { label: '“Digital arrest” call', request: { channel: 'call', message: 'Caller said he is a CBI officer. A parcel with drugs was found in my name, I am under digital arrest, I must stay on video call, not tell anyone, and transfer Rs 50000 for verification.' } },
  { label: 'UPI refund trick', request: { channel: 'whatsapp', persona: 'shopkeeper', message: 'Sir I sent extra money by mistake. Please scan this QR to receive the refund amount and enter your UPI PIN to receive it.' } },
  { label: 'बिजली बिल (Hindi)', request: { channel: 'sms', persona: 'elder', language: 'hi', message: 'प्रिय उपभोक्ता, आपका बिजली कनेक्शन आज रात 9:30 बजे काट दिया जाएगा। तुरंत इस नंबर पर कॉल करें।' } },
];
