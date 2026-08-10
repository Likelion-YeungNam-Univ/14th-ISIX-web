import { apiClient } from './client';

import type { ApiResponse } from '@/types/api';
import type { FittingResult } from '@/types/fitting';

/**
 * 선택한 아바타와 의류의 S/M/L 피팅 결과 조회
 */
export const getFittingResult = async (
  avatarId: number,
  garmentId: number,
): Promise<FittingResult> => {
  const { data } = await apiClient.get<ApiResponse<FittingResult>>(
    `/api/v1/avatars/${avatarId}/garments/${garmentId}/fit`,
  );

  return data.data!;
};