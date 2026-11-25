/**
 * Checker form: the message and the four context questions that shape the plan.
 *
 * Every control is a native, labelled input. An empty message shows an error only after
 * a submit attempt, linked to the field with `aria-describedby` and `aria-invalid`.
 * Example buttons fill the form from `options.ts`. Submits to `CheckPage.tsx`.
 *
 * @see ACCESSIBILITY.md › Built in
 * @see README.md › User journey
 */

import { useState, type SubmitEvent } from 'react';
import { MESSAGE_MAX, type CheckRequest } from '../../shared/schema';
import { ChoiceGroup } from './ChoiceGroup';
import { ACTION_OPTIONS, CHANNEL_OPTIONS, LANGUAGE_OPTIONS, PERSONA_OPTIONS, SAMPLES } from './options';

/** The form's starting state: empty message, the most common context. */
export const EMPTY_REQUEST: CheckRequest = { message: '', persona: 'general', channel: 'sms', action: 'none', language: 'en' };

interface CheckFormProps {
  busy: boolean;
  error: string | null;
  onSubmit: (request: CheckRequest) => void;
}

/** The message plus the context that shapes the advice. Every control is a native, labelled input. */
export const CheckForm = ({ busy, error, onSubmit }: CheckFormProps) => {
  const [request, setRequest] = useState<CheckRequest>(EMPTY_REQUEST);
  const [touched, setTouched] = useState(false);
  const empty = request.message.trim() === '';
  const showEmpty = touched && empty;
  const update = (patch: Partial<CheckRequest>): void => {
    setRequest((current) => ({ ...current, ...patch }));
  };

  const submit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setTouched(true);
    if (!empty) onSubmit(request);
  };

  return (
    <form className="form" onSubmit={submit} noValidate aria-busy={busy}>
      <label className="form__label" htmlFor="message">Paste the message, or describe the call</label>
      <textarea
        id="message"
        className="form__message"
        rows={7}
        maxLength={MESSAGE_MAX}
        value={request.message}
        aria-invalid={showEmpty}
        aria-describedby={showEmpty ? 'message-error' : 'message-hint'}
        onChange={(event) => {
          update({ message: event.target.value });
        }}
      />
      <p id="message-hint" className="hint">We never store it. Up to {MESSAGE_MAX} characters.</p>
      {showEmpty && <p id="message-error" className="error">Paste the message you want checked.</p>}

      <div className="samples" role="group" aria-label="Try an example">
        <span className="samples__label">Try an example:</span>
        {SAMPLES.map((sample) => (
          <button key={sample.label} type="button" className="sample" onClick={() => { update(sample.request); }}>
            {sample.label}
          </button>
        ))}
      </div>

      <ChoiceGroup legend="Who got this message?" name="persona" options={PERSONA_OPTIONS} value={request.persona} onChange={(persona) => { update({ persona }); }} />
      <ChoiceGroup legend="How did it arrive?" name="channel" options={CHANNEL_OPTIONS} value={request.channel} onChange={(channel) => { update({ channel }); }} />
      <ChoiceGroup legend="What has been done so far?" name="action" options={ACTION_OPTIONS} value={request.action} onChange={(action) => { update({ action }); }} />
      <ChoiceGroup legend="Answer in" name="language" options={LANGUAGE_OPTIONS} value={request.language} onChange={(language) => { update({ language }); }} />

      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="button form__submit" disabled={busy}>
        {busy ? 'Checking…' : 'Check this message'}
      </button>
    </form>
  );
};
