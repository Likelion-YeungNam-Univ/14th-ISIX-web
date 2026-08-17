export type AvatarStatus =
  | 'processing'
  | 'done'
  | 'failed';

export interface AvatarJob {
  status: AvatarStatus;
  avatarId: number | null;
  jobId: string;
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
}

export interface AvatarResponse {
  avatarId: number;
  glbUrl: string;
  measurements: Record<string, number>;
}