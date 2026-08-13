export interface CurrentAvatar {
  avatarId: number;
  glbUrl: string | null;
  measurements: Record<string, number> | null;
  height?: number;
  weight?: number;
}

const CURRENT_AVATAR_KEY = 'closr_current_avatar';

export const saveCurrentAvatar = (avatar: CurrentAvatar) => {
  sessionStorage.setItem(
    CURRENT_AVATAR_KEY,
    JSON.stringify(avatar),
  );
};

export const getCurrentAvatar = (): CurrentAvatar | null => {
  const storedAvatar = sessionStorage.getItem(CURRENT_AVATAR_KEY);

  if (!storedAvatar) {
    return null;
  }

  try {
    return JSON.parse(storedAvatar) as CurrentAvatar;
  } catch {
    sessionStorage.removeItem(CURRENT_AVATAR_KEY);
    return null;
  }
};

export const clearCurrentAvatar = () => {
  sessionStorage.removeItem(CURRENT_AVATAR_KEY);
};