import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  barcode: text("barcode").notNull().unique(),
  title: text("title").notNull(),
  brand: text("brand"),
  category: text("category"),
});

export const insertProductSchema = createInsertSchema(products).pick({
  barcode: true,
  title: true,
  brand: true,
  category: true,
});

// Store schema
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
});

export const insertStoreSchema = createInsertSchema(stores).pick({
  name: true,
  logo: true,
});

// Price schema
export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  storeId: integer("store_id").notNull(),
  price: text("price").notNull(),
  currency: text("currency").default("USD"),
  inStock: integer("in_stock").default(1),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPriceSchema = createInsertSchema(prices).pick({
  productId: true,
  storeId: true,
  price: true,
  currency: true,
  inStock: true,
});

// Scan history schema
export const scanHistory = pgTable("scan_history", {
  id: serial("id").primaryKey(),
  barcode: text("barcode").notNull(),
  productData: json("product_data").notNull(),
  scannedAt: timestamp("scanned_at").defaultNow(),
});

export const insertScanHistorySchema = createInsertSchema(scanHistory).pick({
  barcode: true,
  productData: true,
});

// Export types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type Price = typeof prices.$inferSelect;
export type InsertPrice = z.infer<typeof insertPriceSchema>;

export type ScanHistory = typeof scanHistory.$inferSelect;
export type InsertScanHistory = z.infer<typeof insertScanHistorySchema>;

// Define Product Response types for API
export const productResponseSchema = z.object({
  barcode: z.string(),
  title: z.string(),
  brand: z.string().optional(),
  category: z.string().optional(),
  stores: z.array(z.object({
    id: z.number(),
    name: z.string(),
    price: z.string(),
    currency: z.string().default("USD"),
    inStock: z.number().optional(),
    isBestPrice: z.boolean().optional(),
    updatedAt: z.string(),
  }))
});

export type ProductResponse = z.infer<typeof productResponseSchema>;
