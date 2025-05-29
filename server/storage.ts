import dotenv from 'dotenv';
dotenv.config();

import { 
  Product, InsertProduct, 
  ScanHistory, InsertScanHistory,
  User, InsertUser,
  productResponseSchema,
  type ProductResponse
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";

export interface IStorage {
  // Product methods
  getProductByBarcode(barcode: string): Promise<ProductResponse | undefined>;
  saveProduct(product: ProductResponse): Promise<void>;
  
  // History methods
  getScanHistory(userId?: string): Promise<ScanHistory[]>;
  saveScanHistory(history: InsertScanHistory): Promise<ScanHistory>;
  clearScanHistory(userId?: string): Promise<void>;
  
  // Saved products methods
  getSavedProducts(userId?: string): Promise<ProductResponse[]>;
  saveProductToFavorites(product: ProductResponse, userId?: string): Promise<void>;
  removeSavedProduct(barcode: string, userId?: string): Promise<void>;
  clearSavedProducts(userId?: string): Promise<void>;
  
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined>;
}

export class MemStorage implements IStorage {
  private products: Map<string, ProductResponse>;
  private history: ScanHistory[];
  private savedProducts: Map<string, ProductResponse>;
  private users: Map<string, User>;
  private usersByEmail: Map<string, User>;
  private usersByGoogleId: Map<string, User>;
  private currentHistoryId: number;

  constructor() {
    this.products = new Map();
    this.history = [];
    this.savedProducts = new Map();
    this.users = new Map();
    this.usersByEmail = new Map();
    this.usersByGoogleId = new Map();
    this.currentHistoryId = 1;
  }

  async getProductByBarcode(barcode: string): Promise<ProductResponse | undefined> {
    return this.products.get(barcode);
  }

  async saveProduct(product: ProductResponse): Promise<void> {
    this.products.set(product.barcode, product);
  }

  async getScanHistory(userId?: string): Promise<ScanHistory[]> {
    let filteredHistory = this.history;
    
    // Filter by user ID if provided
    if (userId) {
      filteredHistory = filteredHistory.filter(h => h.userId === userId);
    }
    
    return [...filteredHistory].sort((a, b) => {
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
      scannedAt: now,
      userId: insertHistory.userId || null,
      isFavorite: insertHistory.isFavorite || false
    };
    this.history.push(history);
    return history;
  }

  async clearScanHistory(userId?: string): Promise<void> {
    if (userId) {
      this.history = this.history.filter(h => h.userId !== userId);
    } else {
      this.history = [];
    }
  }

  async getSavedProducts(userId?: string): Promise<ProductResponse[]> {
    return Array.from(this.savedProducts.values());
  }

  async saveProductToFavorites(product: ProductResponse, userId?: string): Promise<void> {
    this.savedProducts.set(product.barcode, product);
  }

  async removeSavedProduct(barcode: string, userId?: string): Promise<void> {
    this.savedProducts.delete(barcode);
  }

  async clearSavedProducts(userId?: string): Promise<void> {
    this.savedProducts.clear();
  }
  
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.usersByEmail.get(email);
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.usersByGoogleId.get(googleId);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(user.id, newUser);
    
    if (user.email) {
      this.usersByEmail.set(user.email, newUser);
    }
    
    if (user.googleId) {
      this.usersByGoogleId.set(user.googleId, newUser);
    }
    
    return newUser;
  }
  
  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    
    if (!existingUser) {
      return undefined;
    }
    
    // Update email index if email is changing
    if (userData.email && userData.email !== existingUser.email) {
      if (existingUser.email) {
        this.usersByEmail.delete(existingUser.email);
      }
      this.usersByEmail.set(userData.email, existingUser);
    }
    
    // Update googleId index if googleId is changing
    if (userData.googleId && userData.googleId !== existingUser.googleId) {
      if (existingUser.googleId) {
        this.usersByGoogleId.delete(existingUser.googleId);
      }
      this.usersByGoogleId.set(userData.googleId, existingUser);
    }
    
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }
}

export class DatabaseStorage implements IStorage {
  // Product methods
  async getProductByBarcode(barcode: string): Promise<ProductResponse | undefined> {
    try {
      const [product] = await db.query.products.findMany({
        where: eq(schema.products.barcode, barcode),
      });
      
      if (!product) {
        return undefined;
      }
      
      // Get store prices for this product
      const prices = await db.query.prices.findMany({
        where: eq(schema.prices.productId, product.id),
        with: {
          store: true,
        },
      });
      
      // Format as ProductResponse
      const storesWithPrices = prices.map(price => ({
        id: price.store.id,
        name: price.store.name,
        logo: price.store.logo,
        link: price.store.link,
        price: price.price,
        currency: price.currency,
        inStock: price.inStock,
        updatedAt: price.updatedAt.toISOString(),
        isBestPrice: false, // Will be calculated below
      }));
      
      // Calculate best price
      if (storesWithPrices.length > 0) {
        const sortedPrices = [...storesWithPrices].sort((a, b) => 
          parseFloat(a.price) - parseFloat(b.price)
        );
        sortedPrices[0].isBestPrice = true;
      }
      
      return {
        barcode: product.barcode,
        title: product.title,
        brand: product.brand || "",
        category: product.category || "",
        stores: storesWithPrices,
      };
    } catch (error) {
      console.error("Error fetching product by barcode:", error);
      return undefined;
    }
  }
  
  async saveProduct(product: ProductResponse): Promise<void> {
    try {
      // Start a transaction
      await db.transaction(async (tx) => {
        // First, check if product exists
        const [existingProduct] = await tx.query.products.findMany({
          where: eq(schema.products.barcode, product.barcode),
        });
        
        let productId: number;
        
        if (existingProduct) {
          productId = existingProduct.id;
          
          // Update existing product
          await tx.update(schema.products)
            .set({
              title: product.title,
              brand: product.brand || null,
              category: product.category || null,
            })
            .where(eq(schema.products.id, productId));
        } else {
          // Insert new product
          const [newProduct] = await tx.insert(schema.products)
            .values({
              barcode: product.barcode,
              title: product.title,
              brand: product.brand || null,
              category: product.category || null,
            })
            .returning();
          
          productId = newProduct.id;
        }
        
        // Handle stores and prices
        for (const storeData of product.stores) {
          // Find or create store
          const [existingStore] = await tx.query.stores.findMany({
            where: eq(schema.stores.name, storeData.name),
          });
          
          let storeId: number;
          
          if (existingStore) {
            storeId = existingStore.id;
            
            // Update store if needed
            const updateData: any = {};
            if (storeData.logo && existingStore.logo !== storeData.logo) {
              updateData.logo = storeData.logo;
            }
            if (storeData.link && existingStore.link !== storeData.link) {
              updateData.link = storeData.link;
            }
            
            if (Object.keys(updateData).length > 0) {
              await tx.update(schema.stores)
                .set(updateData)
                .where(eq(schema.stores.id, storeId));
            }
          } else {
            // Create new store
            const [newStore] = await tx.insert(schema.stores)
              .values({
                name: storeData.name,
                logo: storeData.logo,
                link: storeData.link,
              })
              .returning();
            
            storeId = newStore.id;
          }
          
          // Find existing price entry
          const [existingPrice] = await tx.query.prices.findMany({
            where: (fields, { and, eq }) => and(
              eq(fields.productId, productId),
              eq(fields.storeId, storeId)
            ),
          });
          
          if (existingPrice) {
            // Update price
            await tx.update(schema.prices)
              .set({
                price: storeData.price,
                currency: storeData.currency,
                inStock: storeData.inStock,
                updatedAt: new Date(),
              })
              .where(eq(schema.prices.id, existingPrice.id));
          } else {
            // Insert new price
            await tx.insert(schema.prices)
              .values({
                productId,
                storeId,
                price: storeData.price,
                currency: storeData.currency,
                inStock: storeData.inStock,
              });
          }
        }
      });
    } catch (error) {
      console.error("Error saving product:", error);
      throw error;
    }
  }
  
  // History methods
  async getScanHistory(userId?: string): Promise<ScanHistory[]> {
    try {
      const query = userId 
        ? db.query.scanHistory.findMany({
            where: eq(schema.scanHistory.userId, userId),
            orderBy: (fields, { desc }) => [desc(fields.scannedAt)],
          })
        : db.query.scanHistory.findMany({
            orderBy: (fields, { desc }) => [desc(fields.scannedAt)],
          });
      
      return await query;
    } catch (error) {
      console.error("Error fetching scan history:", error);
      return [];
    }
  }
  
  async saveScanHistory(history: InsertScanHistory): Promise<ScanHistory> {
    try {
      const [newHistory] = await db.insert(schema.scanHistory)
        .values(history)
        .returning();
      
      return newHistory;
    } catch (error) {
      console.error("Error saving scan history:", error);
      throw error;
    }
  }
  
  async clearScanHistory(userId?: string): Promise<void> {
    try {
      if (userId) {
        await db.delete(schema.scanHistory)
          .where(eq(schema.scanHistory.userId, userId));
      } else {
        await db.delete(schema.scanHistory);
      }
    } catch (error) {
      console.error("Error clearing scan history:", error);
      throw error;
    }
  }

  async getSavedProducts(userId?: string): Promise<ProductResponse[]> {
    try {
      const query = userId 
        ? db.query.savedProducts.findMany({
            where: eq(schema.savedProducts.userId, userId),
            orderBy: (fields, { desc }) => [desc(fields.savedAt)],
          })
        : db.query.savedProducts.findMany({
            orderBy: (fields, { desc }) => [desc(fields.savedAt)],
          });
      
      const saved = await query;
      return saved.map(item => item.productData as ProductResponse);
    } catch (error) {
      console.error("Error fetching saved products:", error);
      return [];
    }
  }

  async saveProductToFavorites(product: ProductResponse, userId?: string): Promise<void> {
    try {
      await db.insert(schema.savedProducts)
        .values({
          barcode: product.barcode,
          productData: product,
          userId: userId || null,
        })
        .onConflictDoUpdate({
          target: [schema.savedProducts.userId, schema.savedProducts.barcode],
          set: {
            productData: product,
            savedAt: new Date(),
          },
        });
    } catch (error) {
      console.error("Error saving product to favorites:", error);
      throw error;
    }
  }

  async removeSavedProduct(barcode: string, userId?: string): Promise<void> {
    try {
      if (userId) {
        await db.delete(schema.savedProducts)
          .where(
            eq(schema.savedProducts.barcode, barcode) && 
            eq(schema.savedProducts.userId, userId)
          );
      } else {
        await db.delete(schema.savedProducts)
          .where(eq(schema.savedProducts.barcode, barcode));
      }
    } catch (error) {
      console.error("Error removing saved product:", error);
      throw error;
    }
  }

  async clearSavedProducts(userId?: string): Promise<void> {
    try {
      if (userId) {
        await db.delete(schema.savedProducts)
          .where(eq(schema.savedProducts.userId, userId));
      } else {
        await db.delete(schema.savedProducts);
      }
    } catch (error) {
      console.error("Error clearing saved products:", error);
      throw error;
    }
  }
  
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.query.users.findMany({
        where: eq(schema.users.id, id),
      });
      
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.query.users.findMany({
        where: eq(schema.users.email, email),
      });
      
      return user;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    try {
      const [user] = await db.query.users.findMany({
        where: eq(schema.users.googleId, googleId),
      });
      
      return user;
    } catch (error) {
      console.error("Error fetching user by Google ID:", error);
      return undefined;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(schema.users)
        .values(user)
        .returning();
      
      return newUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db.update(schema.users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, id))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }
}

// Use Database storage if DATABASE_URL is available, otherwise use MemStorage
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
