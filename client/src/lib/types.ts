// Import types from shared schema
import type { 
  Product, 
  Store, 
  Price, 
  ScanHistory, 
  ProductResponse 
} from "@shared/schema";

// Re-export for frontend use
export type { 
  Product, 
  Store, 
  Price, 
  ScanHistory, 
  ProductResponse 
};

// Additional frontend-specific types
export interface StoreWithPrice extends Store {
  price: string;
  currency: string;
  inStock: number;
  isBestPrice?: boolean;
  updatedAt: string;
}
