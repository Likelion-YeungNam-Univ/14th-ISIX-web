import type { GarmentSize } from '@/types/garment';

export interface FitPart {
  part: string;
  actualEase: number;
  refEase: number;
  deviation: number;
  verdict: string;
  color: string;
}

export interface FittingSizeDetail {
  glbUrl: string | null;
  easeUrl: string | null;
  parts: FitPart[];
  penalty: number;
  totalDev: number;
  wearable: boolean;
  recommended: boolean;
}

export type FittingSizes = Record<
  GarmentSize,
  FittingSizeDetail
>;

export interface FittingResult {
  garmentId: number;
  sizes: FittingSizes;
  recommendedSize: GarmentSize;
  recommendationReason: string;
}

export interface FittingRecord {
  fittingId: number;
  avatarId: number;
  garmentId: number;
  garmentName: string;
  recommendedSize: GarmentSize | null;
  wearable: boolean;
  fittedAt: string;
}

export interface FittingRecordList {
  fittings: FittingRecord[];
}

export interface FittingRecordDetail {
  fittingId: number;
  avatarId: number;
  garmentId: number;
  garmentName: string;
  fittedAt: string;
  result: FittingResult;
}