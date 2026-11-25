/**
 * The landing page at `/`: the promise, how RukJao decides, and the helpline to
 * remember.
 *
 * The three "how it decides" steps describe what the server really does (`server/engine`,
 * `server/ai/gemini.ts`, `server/engine/plan.ts`), so the page never promises more than
 * the product.
 *
 * @see README.md › Approach and logic
 */

import { followLink } from '../lib/route';
import { Inbox } from './Inbox';

const STEPS = [
  {
    title: 'Reads it for known tricks',
    body: 'Sixteen warning signs drawn from I4C, RBI and DoT advisories: OTP requests, “enter PIN to receive money”, fake arrests, links that hide where they go.',
  },
  {
    title: 'Gets a second opinion',
    body: 'Gemini reads the message as untrusted text and explains it in plain words. It can make the verdict stricter, never softer.',
  },
  {
    title: 'Plans around what you already did',
    body: 'Already paid? Shared an OTP? Only clicked? The steps change, and the most urgent one comes first.',
  },
] as const;

/** The front page: the promise, how it decides, and the one number to remember. */
export const Landing = () => (
  <>
    <header className="bar">
      <a className="brand" href="/">RukJao</a>
      <a className="bar__link" href="/check" onClick={followLink}>Check a message</a>
    </header>

    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__copy">
        <h1 id="hero-title" className="hero__title">
          Ruk jao.
          <span className="hero__hindi" lang="hi">रुक जाओ।</span>
        </h1>
        <p className="hero__lede">
          Before you pay, share an OTP or call back, paste the message here. RukJao tells you if it is a scam and exactly what to do next.
        </p>
        <div className="hero__actions">
          <a className="button" href="/check" onClick={followLink}>Check a message</a>
          <a className="hero__urgent" href="tel:1930">Already paid? Call 1930 now</a>
        </div>
      </div>
      <Inbox />
    </section>

    <section className="how" aria-labelledby="how-title">
      <h2 id="how-title">How RukJao decides</h2>
      <ol className="how__list">
        {STEPS.map((step) => (
          <li key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    </section>

    <section className="helpline" aria-labelledby="helpline-title">
      <h2 id="helpline-title" className="helpline__title">
        <a href="tel:1930">1930</a>
      </h2>
      <p>
        The National Cyber Crime Helpline. If money has left your account, call within the first hour: the sooner it is reported, the better the chance your bank can hold it. Then file the complaint at{' '}
        <a href="https://cybercrime.gov.in" rel="noopener noreferrer">cybercrime.gov.in</a>.
      </p>
    </section>

    <footer className="foot">
      <p>RukJao never stores the messages you check. It only counts which kind of trick each one was, so you can see how common it is this week.</p>
      <p>Free to use. RukJao will never ask for your bank details, OTP or PIN.</p>
    </footer>
  </>
);
