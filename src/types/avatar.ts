export type AvatarStatus =
  | 'processing'
  | 'done'
  | 'failed';

export interface AvatarJob {
  status: AvatarStatus;
  avatarId: number | null;
  jobId: string;

  /** 사용자가 붙인 이름. 없으면 화면에서 순번으로 부릅니다. */
  name?: string | null;

  createdAt?: string | null;

  height?: number;
  weight?: number;
  glbUrl: string | null;
  measurements:
    | Record<string, number>
    | null;

  confidence?: number | null;
  warnings?: string[] | null;

  bodyType?: string | null;
  bodyTypeLabel?: string | null;
  bodyTypeMessage?: string | null;
  bodyTypeStyling?: string[] | null;
}

export interface AvatarResponse {
  avatarId: number;
  glbUrl: string;
  measurements: Record<string, number>;
}