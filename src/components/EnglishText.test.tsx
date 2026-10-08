import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EnglishText, Mixed } from './EnglishText';
import { splitRuns } from '@/lib/bidi';
import { pickVoice, normalizeRate } from '@/lib/tts';

const enRuns = (s: string) => splitRuns(s).filter((r) => r.en).map((r) => r.text);

describe('bidi isolation', () => {
  it('wraps an English sentence quoted inside Arabic, punctuation included', () => {
    const src = 'الجملة "I am a developer." تعني "أنا مبرمج."';
    expect(enRuns(src)).toEqual(['I am a developer.']);
    expect(splitRuns(src).map((r) => r.text).join('')).toBe(src);
  });

  it('wraps a single quoted word', () => {
    expect(enRuns('كلمة "beautiful" تعني "جميل".')).toEqual(['beautiful']);
  });

  it('keeps contractions inside the run', () => {
    expect(enRuns("قل I don't know ثم توقف.")).toEqual(["I don't know"]);
  });

  it('renders isolated LTR spans with lang=en', () => {
    const html = renderToStaticMarkup(<Mixed text={'كلمة "beautiful" تعني "جميل".'} />);
    expect(html).toContain('<span lang="en" dir="ltr" class="en-text">beautiful</span>');
    expect(html).toContain('جميل');
    expect(html.match(/dir="ltr"/g)).toHaveLength(1);
  });

  it('block mode renders a div', () => {
    expect(renderToStaticMarkup(<EnglishText block>Hello</EnglishText>)).toContain('<div lang="en" dir="ltr"');
  });
});

describe('tts helpers', () => {
  const v = (voiceURI: string, lang: string, localService = true) => ({ voiceURI, name: voiceURI, lang, localService });
  it('prefers the chosen English voice, else local en-US, ignoring non-English', () => {
    const list = [v('ar', 'ar-SA'), v('gb', 'en-GB'), v('us', 'en-US'), v('net', 'en-US', false)];
    expect(pickVoice(list, 'gb')?.voiceURI).toBe('gb');
    expect(pickVoice(list, 'ar')?.voiceURI).toBe('us');
    expect(pickVoice(list, '')?.voiceURI).toBe('us');
    expect(pickVoice([v('ar', 'ar-SA')], '')).toBeNull();
  });
  it('normalises rates to normal or slow', () => {
    expect(normalizeRate(0.75)).toBe(0.75);
    expect(normalizeRate(1)).toBe(1);
    expect(normalizeRate(NaN)).toBe(1);
  });
});
