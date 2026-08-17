import { apiClient } from './client';

import type { ApiResponse } from '@/types/api';
import type {
  Garment,
  GarmentDetail,
  GarmentListResponse,
} from '@/types/garment';

export const getGarments = async (): Promise<Garment[]> => {
  const { data } = await apiClient.get<
    ApiResponse<GarmentListResponse>
  >('/api/v1/garments');

  return data.data?.garments ?? [];
};

export const getGarmentDetail = async (
  garmentId: number,
): Promise<GarmentDetail> => {
  const { data } = await apiClient.get<
    ApiResponse<GarmentDetail>
  >(`/api/v1/garments/${garmentId}`);

  if (!data.data) {
    throw new Error(
      '의류 상세 정보를 불러오지 못했습니다.',
    );
  }

  return data.data;
};