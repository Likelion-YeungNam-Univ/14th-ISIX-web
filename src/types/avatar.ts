export type AvatarStatus = 'processing' | 'done' | 'failed';

export interface AvatarJob {
  status: AvatarStatus;
  avatarId: number | null;
  jobId: string;
  glbUrl: string | null;
  measurements: Record<string, number> | null;
}