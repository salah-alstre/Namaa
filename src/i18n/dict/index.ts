import { challenges } from './challenges';
import { common } from './common';
import { english } from './english';
import { exams } from './exams';
import { home } from './home';
import { learn } from './learn';
import { library } from './library';
import { notify } from './notify';
import { practice } from './practice';
import { question } from './question';
import { settings } from './settings';
import { shell } from './shell';
import { weekly } from './weekly';

export const DICT = { ...common, ...shell, ...notify, ...weekly, ...question, ...practice, ...home, ...learn, ...exams, ...challenges, ...library, ...settings, ...english } as const;
export type Key = keyof typeof DICT;
