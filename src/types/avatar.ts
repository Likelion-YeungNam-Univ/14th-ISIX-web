export interface AvatarResponse {
  avatarId: string;
  glbUrl: string;
  /** 체형 12구간 코드. H{0-2}B{0-3} */
  bodyBucket: string;
  /** 12부위 치수 (cm) */
  measurements: Record<string, number>;
  /** 0~1. 0.6 미만이면 재촬영 안내 */
  confidence: number;
  warnings: string[];
}

/** 아바타 생성은 최대 30초가 걸리는 비동기 작업입니다. */
export interface AvatarJob {
  status: 'processing' | 'done' | 'failed';
  progress?: number;
  step?: string;
  avatarId?: number;
  errorCode?: string;
}
