export type Verdict = 'loose' | 'good' | 'snug' | 'tight';
export type Overall = 'fit' | 'snug' | 'unfit';

export interface FitItem {
  part: string;
  label: string;
  /** 여유량 (cm). 음수면 낌 */
  ease: number;
  verdict: Verdict;
  color: string;
}

export interface FittingResponse {
  glbUrl: string;
  fitReport: FitItem[];
  overall: Overall;
  recommendedSize: string;
  message: string;
}

export interface Garment {
  garmentId: string;
  name: string;
  category: 'top' | 'bottom' | 'outer' | 'dress';
  thumbnailUrl: string;
  sizes: string[];
}
