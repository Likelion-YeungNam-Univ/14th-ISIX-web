import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export const createGuestSession = async (): Promise<string> => {
  const { data } = await apiClient.post<
    ApiResponse<{ sessionToken: string }>
  >('/api/v1/sessions');

  const sessionToken = data.data?.sessionToken;

  if (!sessionToken) {
    throw new Error('게스트 세션 토큰을 발급받지 못했습니다.');
  }

  localStorage.setItem('session_token', sessionToken);

  return sessionToken;
};

export const ensureGuestSession = async (): Promise<string> => {
  const existingToken = localStorage.getItem('session_token');

  if (existingToken) {
    return existingToken;
  }

  return createGuestSession();
};