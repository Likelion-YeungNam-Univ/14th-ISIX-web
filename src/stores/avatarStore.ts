import { create } from 'zustand';
import type { AvatarResponse } from '@/types/avatar';

interface AvatarState {
  avatar: AvatarResponse | null;
  setAvatar: (avatar: AvatarResponse) => void;
  clearAvatar: () => void;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  avatar: null,
  setAvatar: (avatar) => set({ avatar }),
  clearAvatar: () => set({ avatar: null }),
}));
