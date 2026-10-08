import { create } from 'zustand';
import { loadProfile, saveProfile } from '@/database/repos/profile';
import type { Profile } from '@/types';

const EMPTY: Profile = { name: '', avatar: 'sigma', comfortLevel: 'beginner', goal: 'general', onboarded: false, placementDone: false, createdAt: Date.now() };

interface ProfileState {
  profile: Profile;
  ready: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Profile>) => Promise<void>;
}

export const useProfile = create<ProfileState>((set, get) => ({
  profile: EMPTY,
  ready: false,
  load: async () => set({ profile: await loadProfile(), ready: true }),
  update: async (patch) => {
    set({ profile: { ...get().profile, ...patch } });
    await saveProfile(patch);
  },
}));
