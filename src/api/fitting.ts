import { apiClient } from './client';

import type { ApiResponse } from '@/types/api';
import type {
  FittingRecordDetail,
  FittingRecordList,
  FittingResult,
} from '@/types/fitting';

/**
 * 선택한 아바타와 의류의 s/m/l 피팅 결과 조회
 */
export const getFittingResult = async (
  avatarId: number,
  garmentId: number,
): Promise<FittingResult> => {
  const { data } = await apiClient.get<
    ApiResponse<FittingResult>
  >(
    `/api/v1/avatars/${avatarId}/garments/${garmentId}/fit`,
  );

  return data.data!;
};

/**
 * 현재 세션의 저장된 피팅 기록 목록 조회
 */
export const getMyFittings =
  async (): Promise<FittingRecordList> => {
    const { data } = await apiClient.get<
      ApiResponse<FittingRecordList>
    >('/api/v1/fittings/me');

    return data.data ?? { fittings: [] };
  };

/**
 * 저장된 피팅 기록 상세 조회
 */
export const getFittingRecord = async (
  fittingId: number,
): Promise<FittingRecordDetail> => {
  const { data } = await apiClient.get<
    ApiResponse<FittingRecordDetail>
  >(`/api/v1/fittings/${fittingId}`);

  if (!data.data) {
    throw new Error(
      '피팅 기록을 불러오지 못했습니다.',
    );
  }

  return data.data;
};