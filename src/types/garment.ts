export type GarmentSize = 's' | 'm' | 'l';

export interface Garment {
  garmentId: number;
  name: string;
  thumbnailUrl: string | null;
  category: string;
  sizes: GarmentSize[];
}

export interface GarmentListResponse {
  garments: Garment[];
}

export interface GarmentDetailSize {
  size: string;
  available: boolean;
  unavailableReason: string | null;
}

export interface GarmentDetail {
  garmentId: number;
  name: string;
  thumbnailUrl: string | null;
  category: string;
  design: string;
  fit: string;
  purchaseUrl: string | null;
  liked: boolean;
  sizes: GarmentDetailSize[];
}