import { apiClient } from './client';

import type { ApiResponse } from '@/types/api';
import type { LikedGarment } from '@/types/like';

export const getMyLikes = async (): Promise<LikedGarment[]> => {
  const { data } = await apiClient.get<
    ApiResponse<LikedGarment[]>
  >('/api/v1/likes/me');

  return data.data ?? [];
};

export const likeGarment = async (
  garmentId: number,
): Promise<void> => {
  await apiClient.post(
    `/api/v1/garments/${garmentId}/like`,
  );
};

export const unlikeGarment = async (
  garmentId: number,
): Promise<void> => {
  await apiClient.delete(
    `/api/v1/garments/${garmentId}/like`,
  );
};