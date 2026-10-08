import clsx from 'clsx';
import { Fragment, type ReactNode } from 'react';
import { hasArabic, splitRuns } from '@/lib/bidi';

/** English text inside the (possibly right-to-left) UI: left-to-right, isolated from the surrounding Arabic. */
export function EnglishText({ children, block = false, className, as }: { children: ReactNode; block?: boolean; className?: string; as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' }) {
  const Tag = as ?? (block ? 'div' : 'span');
  return (
    <Tag lang="en" dir="ltr" className={clsx('en-text', className)}>
      {children}
    </Tag>
  );
}

/** Renders a string that mixes Arabic and English, wrapping every English run in <EnglishText>. */
export function Mixed({ text, className }: { text: string; className?: string }) {
  if (!hasArabic(text)) {
    return <EnglishText className={clsx('block', className)}>{text}</EnglishText>;
  }
  const runs = splitRuns(text);
  return (
    <span className={className}>
      {runs.map((r, i) => (
        <Fragment key={i}>{r.en ? <EnglishText>{r.text}</EnglishText> : r.text}</Fragment>
      ))}
    </span>
  );
}
