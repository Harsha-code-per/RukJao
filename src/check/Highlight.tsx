import type { Flag } from '../../shared/schema';

interface Segment {
  text: string;
  labels: string[];
}

interface Run {
  start: number;
  end: number;
  labels: Set<string>;
}

/** Joins overlapping or touching flags into single runs, in reading order. */
const mergeRuns = (flags: Flag[]): Run[] =>
  [...flags]
    .sort((a, b) => a.start - b.start)
    .reduce<Run[]>((runs, flag) => {
      const last = runs.at(-1);
      if (last && flag.start <= last.end) {
        last.end = Math.max(last.end, flag.end);
        last.labels.add(flag.label);
      } else {
        runs.push({ start: flag.start, end: flag.end, labels: new Set([flag.label]) });
      }
      return runs;
    }, []);

/** Splits the message into plain and flagged parts. */
export const segment = (message: string, flags: Flag[]): Segment[] => {
  const segments: Segment[] = [];
  let cursor = 0;
  for (const run of mergeRuns(flags)) {
    if (run.start > cursor) segments.push({ text: message.slice(cursor, run.start), labels: [] });
    segments.push({ text: message.slice(run.start, run.end), labels: [...run.labels] });
    cursor = run.end;
  }
  if (cursor < message.length) segments.push({ text: message.slice(cursor), labels: [] });
  return segments;
};

/** The original message with every red flag marked and named for assistive tech. */
export const Highlight = ({ message, flags }: { message: string; flags: Flag[] }) => (
  <blockquote className="slip">
    {segment(message, flags).map((part, index) =>
      part.labels.length === 0 ? (
        <span key={index}>{part.text}</span>
      ) : (
        <mark key={index} title={part.labels.join('; ')}>
          {part.text}
          <span className="visually-hidden"> (warning: {part.labels.join('; ')})</span>
        </mark>
      ),
    )}
  </blockquote>
);
