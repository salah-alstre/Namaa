import type { EnLevel, PlacementQuestion } from '@/english-engine/types';
import { mcq, chooseWord, tf, enAr, arEn, readComp } from './build';

type PEx = PlacementQuestion['exercise'];

const q = (level: EnLevel, ex: unknown): PlacementQuestion => {
  const exercise = ex as PEx;
  return { id: `pl-${exercise.id}`, level, exercise };
};

export const PLACEMENT: PlacementQuestion[] = [
  // Starter
  q('starter', enAr('s1', 'hello', ['مرحبا', 'شكرا', 'وداعا'], 0)),
  q('starter', mcq('s2', 'I ___ a student.', ['am', 'is', 'are'], 0)),
  q('starter', arEn('s3', 'كتاب', ['book', 'pen', 'bag'], 0)),
  q('starter', mcq('s4', 'She ___ my sister.', ['am', 'is', 'are'], 1)),
  q('starter', chooseWord('s5', 'This is ___ apple.', ['a', 'an', 'the'], 1)),
  q('starter', enAr('s6', 'mother', ['أم', 'أب', 'أخت'], 0)),
  q('starter', tf('s7', '"They is happy" is correct.', false)),
  q('starter', mcq('s8', 'What colour is the sky?', ['Blue', 'Eat', 'Happy'], 0)),
  // A1
  q('a1', mcq('a1', 'He ___ to school every day.', ['go', 'goes', 'going'], 1)),
  q('a1', mcq('a2', '___ you like tea?', ['Do', 'Does', 'Are'], 0)),
  q('a1', chooseWord('a3', 'The book is ___ the table.', ['on', 'at', 'in'], 0)),
  q('a1', enAr('a4', 'tomorrow', ['غدا', 'أمس', 'اليوم'], 0)),
  q('a1', mcq('a5', 'My brother ___ a car.', ['have', 'has', 'is'], 1)),
  q('a1', mcq('a6', '___ is your name?', ['What', 'Where', 'When'], 0)),
  q('a1', tf('a7', '"She don\'t like coffee" is correct.', false)),
  q('a1', arEn('a8', 'متعب', ['tired', 'happy', 'easy'], 0)),
  // A2
  q('a2', mcq('b1', 'Yesterday we ___ to the market.', ['go', 'went', 'gone'], 1)),
  q('a2', mcq('b2', 'This bag is ___ than that one.', ['cheap', 'cheaper', 'cheapest'], 1)),
  q('a2', mcq('b3', 'I ___ visit my aunt next week.', ['am going to', 'went', 'was'], 0)),
  q('a2', enAr('b4', 'expensive', ['غالٍ', 'رخيص', 'مريح'], 0)),
  q('a2', mcq('b5', 'She ___ TV when I called.', ['watched', 'was watching', 'watches'], 1)),
  q('a2', chooseWord('b6', 'I forgot my ___ at the airport. (travel document)', ['passport', 'weather', 'recipe'], 0)),
  q('a2', mcq('b7', 'He is the ___ student in the class.', ['tall', 'taller', 'tallest'], 2)),
  q('a2', tf('b8', '"I didn\'t went there" is correct.', false)),
  // B1
  q('b1', mcq('c1', 'I ___ never been to Paris.', ['have', 'am', 'did'], 0)),
  q('b1', mcq('c2', 'If it rains, we ___ at home.', ['stay', 'will stay', 'stayed'], 1)),
  q('b1', chooseWord('c3', '___ it was late, we kept working.', ['Although', 'Therefore', 'Because of'], 0)),
  q('b1', mcq('c4', 'She has lived here ___ 2019.', ['for', 'since', 'during'], 1)),
  q('b1', enAr('c5', 'opportunity', ['فرصة', 'نصيحة', 'مسؤولية'], 0)),
  q('b1', mcq('c6', 'You ___ wear a seatbelt. It is the law.', ['must', 'might', 'would'], 0)),
  q('b1', mcq('c7', 'I\'m looking forward ___ you.', ['to see', 'to seeing', 'seeing'], 1)),
  q('b1', tf('c8', '"He suggested to go" is the most natural form.', false)),
  // B2
  q('b2', mcq('d1', 'The report ___ by the team last week.', ['was written', 'wrote', 'has write'], 0)),
  q('b2', mcq('d2', 'If I ___ more time, I would learn Spanish.', ['have', 'had', 'will have'], 1)),
  q('b2', mcq('d3', 'She said she ___ the next day.', ['will come', 'would come', 'comes'], 1)),
  q('b2', chooseWord('d4', 'The company is ___ for the damage. (legally responsible)', ['liable', 'reluctant', 'sustainable'], 0)),
  q('b2', enAr('d5', 'inevitable', ['لا مفر منه', 'متردد', 'تقريبي'], 0)),
  q('b2', mcq('d6', 'Not only ___ late, but he also forgot the files.', ['he was', 'was he', 'is he'], 1)),
  q('b2', arEn('d7', 'عواقب', ['consequences', 'evidence', 'attitude'], 0)),
  q('b2', readComp('d8', 'The new regulation aims to reduce plastic waste, whereas critics argue it will raise prices.', 'What do critics argue?', ['It will raise prices', 'It will reduce waste', 'It is illegal'], 0)),
];

export const PLACEMENT_BY_LEVEL = (level: EnLevel) => PLACEMENT.filter((p) => p.level === level);
