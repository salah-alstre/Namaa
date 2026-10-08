import { LESSONS } from '@/content/lessons';
import { recordAttempt } from '@/database/repos/attempts';
import { logEvent } from '@/lib/log';
import { checkAnswer } from '@/math-engine/validate';
import { usePlayer } from '@/stores/player';
import { useSettings } from '@/stores/settings';
import type { Question, UserAnswer, Verdict } from '@/types';

export interface JudgeOptions {
  sessionId?: number | null;
  examId?: number | null;
  /** Grants XP per question. Exams, the daily challenge and placement pay a bundle at the end instead. */
  awardXp: boolean;
  /** Adjusts the topic's adaptive difficulty. */
  adaptive?: boolean;
  saveMistake?: boolean;
  mistakeId?: number | null;
}

export interface Judged {
  verdict: Verdict;
  xp: number;
}

/** Checks an answer, records the attempt (topic stats, mistakes, XP) and refreshes the player. Never throws. */
export async function judgeAndRecord(q: Question, answer: UserAnswer | null, hintsUsed: number, timeMs: number, opts: JudgeOptions): Promise<Judged> {
  const verdict = checkAnswer(q, answer);
  const player = usePlayer.getState();
  const settings = useSettings.getState().settings;
  const prevLevel = player.level.level;
  let xp = 0;
  try {
    const out = await recordAttempt({
      question: q,
      answer,
      verdict,
      hintsUsed,
      timeMs,
      sessionId: opts.sessionId ?? undefined,
      examId: opts.examId ?? undefined,
      topic: player.topics[q.topicId],
      lessonDone: LESSONS.some((l) => l.topicId === q.topicId && player.doneLessons.has(l.id)),
      adaptive: opts.adaptive ?? settings.adaptive,
      awardXp: opts.awardXp,
      saveMistake: opts.saveMistake ?? true,
      mistakeId: opts.mistakeId ?? undefined,
    });
    xp = out.xp;
  } catch (e) {
    logEvent('error', `recordAttempt failed: ${String(e)}`);
  }
  await usePlayer.getState().afterProgress(prevLevel);
  return { verdict, xp };
}
