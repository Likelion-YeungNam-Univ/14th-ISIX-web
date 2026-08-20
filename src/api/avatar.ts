import { apiClient } from './client';

import type { ApiResponse } from '@/types/api';
import type { AvatarJob } from '@/types/avatar';

/**
 * 아바타 생성 요청.
 *
 * 비동기 작업이므로 jobId를 받은 뒤 상태 API를 폴링합니다.
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

/** 아바타 생성 상태 조회 */
export const getAvatarJob = async (
  jobId: string,
): Promise<AvatarJob> => {
  const { data } = await apiClient.get<ApiResponse<AvatarJob>>(
    `/api/v1/avatars/${jobId}`,
  );

  return data.data!;
};

/** 현재 세션에 저장된 아바타 목록 조회 */
export const getMyAvatars = async (): Promise<AvatarJob[]> => {
  const { data } = await apiClient.get<ApiResponse<AvatarJob[]>>(
    '/api/v1/avatars/me',
  );

  return data.data ?? [];
};

/**
 * 저장된 아바타 삭제.
 *
 * ⚠ 백엔드에 아직 이 경로가 없습니다. 지금 부르면 405 가 옵니다.
 *   DELETE /api/v1/avatars/{id}   -> 405 Method Not Allowed
 *   DELETE /api/v1/fittings/{id}  -> 404 (이건 있음)
 *
 * 경로와 형태는 피팅 기록 삭제(deleteFitting)를 그대로 따랐습니다.
 * 백엔드가 열리면 이 함수는 그대로 두고 화면만 켜면 됩니다.
 */
export const deleteAvatar = async (
  avatarId: number,
): Promise<void> => {
  await apiClient.delete(
    `/api/v1/avatars/${avatarId}`,
  );
};