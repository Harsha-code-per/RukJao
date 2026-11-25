import { useEffect, useRef, useState } from 'react';
import { RISK_MAX, SCAM_AT, SUSPICIOUS_AT, type CheckResult, type Language } from '../../shared/schema';
import { Stamp } from '../Stamp';
import { RESULT_COPY } from './copy';
import { Highlight } from './Highlight';
import { shareWarning, warningText } from './share';

interface ResultProps {
  result: CheckResult;
  message: string;
  language: Language;
  onReset: () => void;
}

/** The verdict, the plan and the evidence. Focus lands on the verdict so it is announced first. */
export const Result = ({ result, message, language, onReset }: ResultProps) => {
  const copy = RESULT_COPY[language];
  const heading = useRef<HTMLHeadingElement>(null);
  const [status, setStatus] = useState('');
  const labels = [...new Set(result.flags.map((flag) => flag.label))];

  useEffect(() => {
    heading.current?.focus();
  }, [result]);

  const share = async (): Promise<void> => {
    const sent = await shareWarning(warningText(result, language, window.location.origin));
    setStatus(sent ? copy.shared : '');
  };

  return (
    <article className={`result result--${result.verdict}`} lang={language} aria-labelledby="verdict">
      <div className="result__head">
        <Stamp verdict={result.verdict} className="result__stamp" />
        <h2 id="verdict" ref={heading} tabIndex={-1}>{copy.title[result.verdict]}</h2>
        <p className="risk">
          <span>{copy.risk(result.risk)}</span>
          <meter min={0} max={RISK_MAX} low={SUSPICIOUS_AT - 1} high={SCAM_AT - 1} optimum={0} value={result.risk} aria-label={copy.risk(result.risk)} />
        </p>
      </div>

      {result.urgent && <a className="urgent" href="tel:1930">{copy.urgent}</a>}

      <h3>{copy.steps}</h3>
      <ol className="steps">
        {result.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>

      <h3>{copy.why}</h3>
      <p className="why">{result.explanation}</p>

      {labels.length > 0 && (
        <>
          <h3>{copy.marked}</h3>
          <Highlight message={message} flags={result.flags} />
          <ul className="signs">{labels.map((label) => <li key={label}>{label}</li>)}</ul>
        </>
      )}

      <p className="meta">
        {result.seenThisWeek > 0 && <span>{copy.seen(result.seenThisWeek)} </span>}
        <span>{copy.source[result.source]}</span>
      </p>

      <div className="result__actions">
        <button type="button" className="button" onClick={() => void share()}>{copy.share}</button>
        <button type="button" className="button button--quiet" onClick={onReset}>{copy.again}</button>
      </div>
      <p className="status" role="status">{status}</p>
    </article>
  );
};
