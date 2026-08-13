export type GarmentSize = 's' | 'm' | 'l';

export interface Garment {
  garmentId: string;
  name: string;
  thumbnailUrl: string | null;
  category: string;
  sizes: GarmentSize[];
}

export interface GarmentListResponse {
  garments: Garment[];
}