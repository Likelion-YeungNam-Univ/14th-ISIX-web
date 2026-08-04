import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { FittingResponse, Garment } from '@/types/fitting';

export const getGarments = async (): Promise<Garment[]> => {
  const { data } = await apiClient.get<ApiResponse<{ garments: Garment[] }>>(
    '/api/v1/garments',
  );
  return data.data!.garments;
};

/**
 * 가상 피팅 결과 조회.
 *
 * 사전 계산된 결과를 꺼내오므로 1초 이내에 응답합니다.
 * 배치 시뮬레이션에서 실패한 조합은 FITTING_NOT_AVAILABLE 이 반환됩니다.
 */
export const getFitting = async (
  avatarId: string,
  garmentId: string,
  size: string,
): Promise<FittingResponse> => {
  const { data } = await apiClient.post<ApiResponse<FittingResponse>>('/api/v1/fittings', {
    avatarId,
    garmentId,
    size,
  });
  return data.data!;
};
