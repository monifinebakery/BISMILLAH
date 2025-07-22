// src/types/promo.ts

export interface PromoEstimation {
  id: string;
  userId: string;
  createdAt: Date;
  promo_name: string;
  promo_type: 'discount_percent' | 'discount_rp' | 'bogo' | 'bundle';
  base_recipe_id?: string;
  base_recipe_name?: string;
  promo_details: any; // e.g., { value: 10 } or { buy: 2, get: 1 }
  original_price: number;
  original_hpp: number;
  promo_price_effective: number;
  estimated_margin_percent: number;
  estimated_margin_rp: number;
}