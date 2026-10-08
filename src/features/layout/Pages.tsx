import { Achievements } from '@/features/achievements/Achievements';
import { Challenges } from '@/features/challenges/Challenges';
import { Dashboard } from '@/features/dashboard/Dashboard';
import { ExamResult } from '@/features/exams/ExamResult';
import { ExamRun } from '@/features/exams/ExamRun';
import { Exams } from '@/features/exams/Exams';
import { EnGrammar } from '@/features/english/EnGrammar';
import { EnHome } from '@/features/english/EnHome';
import { EnLearn } from '@/features/english/EnLearn';
import { EnLessonPlayer } from '@/features/english/EnLessonPlayer';
import { EnListening } from '@/features/english/EnListening';
import { EnMistakes } from '@/features/english/EnMistakes';
import { EnPlacement } from '@/features/english/EnPlacement';
import { EnPractice } from '@/features/english/EnPractice';
import { EnProgress } from '@/features/english/EnProgress';
import { EnQuick } from '@/features/english/EnQuick';
import { EnReading } from '@/features/english/EnReading';
import { EnReview } from '@/features/english/EnReview';
import { EnSpeaking } from '@/features/english/EnSpeaking';
import { EnVocab } from '@/features/english/EnVocab';
import { EnWriting } from '@/features/english/EnWriting';
import { GlobalHome } from '@/features/home/GlobalHome';
import { ProgressHub } from '@/features/home/ProgressHub';
import { ReviewCenter } from '@/features/home/Review';
import { Formulas } from '@/features/formulas/Formulas';
import { Learn } from '@/features/learning/Learn';
import { LessonPlayer } from '@/features/learning/LessonPlayer';
import { Mistakes } from '@/features/mistakes/Mistakes';
import { Placement } from '@/features/placement/Placement';
import { PracticeRun } from '@/features/practice/PracticeRun';
import { PracticeSetup } from '@/features/practice/PracticeSetup';
import { Settings } from '@/features/settings/Settings';
import { useRouter } from '@/stores/router';

/** Maps the current route to its page. */
export function Pages() {
  const route = useRouter((s) => s.route);
  switch (route.name) {
    case 'home':
      return <GlobalHome />;
    case 'math':
      return <Dashboard />;
    case 'review':
      return <ReviewCenter />;
    case 'en-home':
      return <EnHome />;
    case 'en-quick':
      return <EnQuick />;
    case 'en-learn':
      return <EnLearn />;
    case 'en-lesson':
      return <EnLessonPlayer lessonId={route.lessonId} />;
    case 'en-vocab':
      return <EnVocab />;
    case 'en-review':
      return <EnReview />;
    case 'en-grammar':
      return <EnGrammar topicId={route.topicId} />;
    case 'en-practice':
      return <EnPractice skill={route.skill} pattern={route.pattern} />;
    case 'en-listening':
      return <EnListening />;
    case 'en-reading':
      return <EnReading />;
    case 'en-writing':
      return <EnWriting />;
    case 'en-speaking':
      return <EnSpeaking />;
    case 'en-placement':
      return <EnPlacement />;
    case 'en-mistakes':
      return <EnMistakes />;
    case 'en-progress':
      return <EnProgress />;
    case 'learn':
      return <Learn />;
    case 'lesson':
      return <LessonPlayer lessonId={route.lessonId} />;
    case 'practice':
      return <PracticeSetup />;
    case 'practice-run':
      return <PracticeRun />;
    case 'challenges':
      return <Challenges />;
    case 'exams':
      return <Exams />;
    case 'exam-run':
      return <ExamRun examId={route.examId} />;
    case 'exam-result':
      return <ExamResult examId={route.examId} />;
    case 'mistakes':
      return <Mistakes />;
    case 'formulas':
      return <Formulas />;
    case 'progress':
      return <ProgressHub />;
    case 'achievements':
      return <Achievements />;
    case 'settings':
      return <Settings />;
    case 'placement':
      return <Placement />;
  }
}
