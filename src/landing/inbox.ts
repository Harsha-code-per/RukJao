/**
 * Messages for the landing-page inbox: scams mixed with ordinary texts.
 *
 * The scams are composites of patterns from public advisories, with numbers masked, so
 * no real person or sender is shown. Rendered by `Inbox.tsx`.
 */

/** One bubble in the hero. `scam` decides whether it gets stamped. */
export interface InboxMessage {
  from: string;
  text: string;
  scam: boolean;
}

/** Shown twice in a row so the stream can loop without a gap. */
export const INBOX: readonly InboxMessage[] = [
  { from: 'AD-BNKALRT', text: 'Your bank account will be blocked today. Update KYC now at bnk-kyc-update.xyz/u', scam: true },
  { from: 'Maa', text: 'Reached home safely beta. Call when you are free.', scam: false },
  { from: '+91 98•••• 4410', text: 'CBI officer here. Drugs found in a parcel in your name. Stay on video call, you are under digital arrest.', scam: true },
  { from: 'VM-ACCOTP', text: '482913 is your login OTP. Do not share it with anyone.', scam: false },
  { from: '+91 70•••• 1187', text: 'Congratulations! You won ₹25,00,000 in the lucky draw. Pay ₹4,999 processing fee to claim.', scam: true },
  { from: 'JD-PARCEL', text: 'Your order is out for delivery and will arrive by 7 pm.', scam: false },
  { from: '+91 81•••• 0032', text: 'Electricity will be disconnected tonight at 9:30. Call this number immediately.', scam: true },
  { from: 'Rohan', text: 'Bro, notes from today’s lecture are in the group.', scam: false },
  { from: '+91 63•••• 7720', text: 'Part-time job: earn ₹3,000 daily by liking videos. Join our Telegram.', scam: true },
];
