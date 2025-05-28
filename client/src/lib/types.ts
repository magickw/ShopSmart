// Import types from shared schema
import type { 
  Product, 
  Store, 
  Price, 
  ScanHistory, 
  ProductResponse as BaseProductResponse 
} from "@shared/schema";

// Re-export for frontend use
export type { 
  Product, 
  Store, 
  Price, 
  ScanHistory
};

// Extend ProductResponse to add imageUrl for frontend convenience
export interface ProductResponse extends BaseProductResponse {
  imageUrl?: string;  // Optional image URL for easier access
}

// Additional frontend-specific types
export interface StoreWithPrice extends Store {
  price: string;
  currency: string;
  inStock: number;
  isBestPrice?: boolean;
  updatedAt: string;
  link: string; // e.g., product or offer URL
}
