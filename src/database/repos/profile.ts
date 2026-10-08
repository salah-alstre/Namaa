import { db, bool, num, str, type Row } from '../index';
import type { ComfortLevel, Goal, Profile } from '@/types';

function toProfile(r: Row): Profile {
  return {
    name: str(r.name),
    avatar: str(r.avatar) || 'sigma',
    comfortLevel: (str(r.comfort_level) || 'beginner') as ComfortLevel,
    goal: (str(r.goal) || 'general') as Goal,
    onboarded: bool(r.onboarded),
    placementDone: bool(r.placement_done),
    createdAt: num(r.created_at),
  };
}

export async function loadProfile(): Promise<Profile> {
  const rows = await db().query('SELECT * FROM profile WHERE id = 1');
  if (rows[0]) return toProfile(rows[0]);
  await db().execute('INSERT INTO profile (id, created_at) VALUES (1, ?)', [Date.now()]);
  const again = await db().query('SELECT * FROM profile WHERE id = 1');
  return toProfile(again[0] as Row);
}

export async function saveProfile(p: Partial<Profile>): Promise<void> {
  const map: [keyof Profile, string][] = [
    ['name', 'name'],
    ['avatar', 'avatar'],
    ['comfortLevel', 'comfort_level'],
    ['goal', 'goal'],
    ['onboarded', 'onboarded'],
    ['placementDone', 'placement_done'],
  ];
  const sets: string[] = [];
  const params: (string | number | boolean | null)[] = [];
  for (const [k, col] of map) {
    if (p[k] === undefined) continue;
    sets.push(`${col} = ?`);
    params.push(p[k] as string | boolean);
  }
  if (sets.length === 0) return;
  await db().execute(`UPDATE profile SET ${sets.join(', ')} WHERE id = 1`, params);
}

export async function loadNotes(): Promise<string> {
  const rows = await db().query<{ content: string }>('SELECT content FROM notes WHERE id = 1');
  return rows[0]?.content ?? '';
}

export async function saveNotes(content: string): Promise<void> {
  await db().execute(
    'INSERT INTO notes (id, content, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at',
    [content, Date.now()],
  );
}
