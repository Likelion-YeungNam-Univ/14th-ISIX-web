import { apiClient } from './client';

import type { ApiResponse } from '@/types/api';
import type { Garment, GarmentListResponse } from '@/types/garment';


export const getGarments = async (): Promise<Garment[]> => {
  const { data } = await apiClient.get<ApiResponse<GarmentListResponse>>(
    '/api/v1/garments',
  );

  return data.data?.garments ?? [];
};