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
  modelUrl: string | null;
  parts: FitPart[];
  penalty: number;
  totalDev: number;
  wearable: boolean;
  recommended: boolean;
}

export type FittingSizes = Record<GarmentSize, FittingSizeDetail>;

export interface FittingResult {
  garmentId: string;
  sizes: FittingSizes;
  recommendedSize: GarmentSize;
  recommendationReason: string;
}