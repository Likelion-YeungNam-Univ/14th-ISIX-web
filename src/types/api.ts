/** 백엔드 · AI 서버 공통 응답 봉투 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}
