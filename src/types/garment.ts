export type GarmentSize = 'S' | 'M' | 'L';

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