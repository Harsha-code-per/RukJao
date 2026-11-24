import { followLink } from '../lib/route';
import { CheckForm } from './CheckForm';
import { Result } from './Result';
import { useCheck } from './useCheck';

/** The checker: form on one side, the verdict on the other (stacked on phones). */
const CheckPage = () => {
  const { state, run, reset } = useCheck();

  return (
    <>
      <header className="bar">
        <a className="brand" href="/" onClick={followLink}>RukJao</a>
        <a className="bar__link" href="tel:1930">Paid a scammer? Call 1930</a>
      </header>
      <div className="check">
        <div className="check__form">
          <h1 className="check__title">Check a message</h1>
          <CheckForm busy={state.status === 'loading'} error={state.status === 'error' ? state.error : null} onSubmit={(request) => void run(request)} />
        </div>
        <section className="check__result" aria-label="Result" aria-live="polite">
          {state.status === 'done' ? (
            <Result result={state.result} message={state.request.message} language={state.request.language} onReset={reset} />
          ) : (
            <p className="placeholder">{state.status === 'loading' ? 'Reading the message for known tricks…' : 'Your verdict and the steps to take will appear here.'}</p>
          )}
        </section>
      </div>
    </>
  );
};

export default CheckPage;
