import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type { AvatarResponse, AvatarJob } from '@/types/avatar';

/**
 * 아바타 생성 요청.
 *
 * 처리에 최대 30초가 걸리므로 202 + jobId 를 받고 폴링합니다.
 */
export const createAvatar = async (
  photo: File,
  height: number,
  weight: number,
): Promise<{ jobId: string }> => {
  const form = new FormData();
  form.append('photo', photo);

  const { data } = await apiClient.post<ApiResponse<{ jobId: string }>>(
    '/api/v1/avatars',
    form,
    {
      params: {
        height,
        weight,
      },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return data.data!;
};

/** 생성 상태 조회. 2초 간격으로 폴링합니다. */
export const getAvatarJob = async (jobId: string): Promise<AvatarJob> => {
  const { data } = await apiClient.get<ApiResponse<AvatarJob>>(`/api/v1/avatars/${jobId}`);
  return data.data!;
};

export const getAvatar = async (avatarId: number): Promise<AvatarResponse> => {
  const { data } = await apiClient.get<ApiResponse<AvatarResponse>>(
    `/api/v1/avatars/detail/${avatarId}`,
  );
  return data.data!;
};
