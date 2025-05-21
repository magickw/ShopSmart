import { 
  Product, InsertProduct, 
  ScanHistory, InsertScanHistory,
  productResponseSchema,
  type ProductResponse
} from "@shared/schema";

export interface IStorage {
  // Product methods
  getProductByBarcode(barcode: string): Promise<ProductResponse | undefined>;
  saveProduct(product: ProductResponse): Promise<void>;
  
  // History methods
  getScanHistory(): Promise<ScanHistory[]>;
  saveScanHistory(history: InsertScanHistory): Promise<ScanHistory>;
  clearScanHistory(): Promise<void>;
}

export class MemStorage implements IStorage {
  private products: Map<string, ProductResponse>;
  private history: ScanHistory[];
  private currentHistoryId: number;

  constructor() {
    this.products = new Map();
    this.history = [];
    this.currentHistoryId = 1;
  }

  async getProductByBarcode(barcode: string): Promise<ProductResponse | undefined> {
    return this.products.get(barcode);
  }

  async saveProduct(product: ProductResponse): Promise<void> {
    this.products.set(product.barcode, product);
  }

  async getScanHistory(): Promise<ScanHistory[]> {
    return [...this.history].sort((a, b) => {
      // Convert to string first to ensure we're working with valid date values
      const dateA = new Date(String(a.scannedAt)).getTime();
      const dateB = new Date(String(b.scannedAt)).getTime();
      return dateB - dateA;
    });
  }

  async saveScanHistory(insertHistory: InsertScanHistory): Promise<ScanHistory> {
    const id = this.currentHistoryId++;
    const now = new Date();
    const history: ScanHistory = { 
      ...insertHistory, 
      id, 
      scannedAt: now 
    };
    this.history.push(history);
    return history;
  }

  async clearScanHistory(): Promise<void> {
    this.history = [];
  }
}

export const storage = new MemStorage();
