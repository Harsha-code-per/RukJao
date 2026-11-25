/**
 * A question with one answer, drawn as chips.
 *
 * Native radios inside a fieldset and legend keep arrow-key movement and screen-reader
 * grouping for free. `useId` keeps radio names unique if a question appears twice. Used
 * by `CheckForm.tsx`.
 *
 * @see ACCESSIBILITY.md › Built in
 */

import { useId } from 'react';

interface ChoiceGroupProps<T extends string> {
  legend: string;
  name: string;
  options: { value: T; label: string; lang?: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** A labelled radio group drawn as chips. Native radios keep arrow-key navigation and screen-reader support. */
export const ChoiceGroup = <T extends string>({ legend, name, options, value, onChange }: ChoiceGroupProps<T>) => {
  const id = useId();
  return (
    <fieldset className="choices">
      <legend>{legend}</legend>
      <div className="choices__row">
        {options.map((option) => (
          <label key={option.value} className="chip" lang={option.lang}>
            <input
              type="radio"
              name={`${name}-${id}`}
              value={option.value}
              checked={value === option.value}
              onChange={() => {
                onChange(option.value);
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};
