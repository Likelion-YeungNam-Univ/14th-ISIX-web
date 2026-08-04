import axios, { AxiosInstance } from 'axios';

/**
 * axios 인스턴스.
 *
 * 백엔드용과 AI 서버용을 분리합니다.
 * 대부분의 요청은 백엔드를 거치며, AI 서버는 필요한 경우에만 직접 호출합니다.
 */

const createClient = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 30_000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    // access_token 은 메모리에 보관합니다. localStorage 에 저장하지 않습니다.
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 비로그인 세션 식별자
    const sessionToken = localStorage.getItem('session_token');
    if (sessionToken) {
      config.headers['X-Session-Token'] = sessionToken;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config;
      const code = error.response?.data?.error?.code;

      // 토큰 만료 시 재발급 후 원래 요청을 재시도합니다.
      if (error.response?.status === 401 && code === 'TOKEN_EXPIRED' && !original._retry) {
        original._retry = true;
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh`,
            {},
            { withCredentials: true },
          );
          setAccessToken(data.data.accessToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return instance(original);
        } catch {
          clearAccessToken();
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

// 메모리 보관 — 새로고침 시 사라지며 refresh 로 복구합니다.
let accessToken: string | null = null;

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string) => {
  accessToken = token;
};
export const clearAccessToken = () => {
  accessToken = null;
};

/** 백엔드 API 서버 */
export const apiClient = createClient(import.meta.env.VITE_API_BASE_URL);

/** AI 서버 — 필요한 경우에만 직접 호출 */
export const aiClient = createClient(import.meta.env.VITE_AI_BASE_URL);
