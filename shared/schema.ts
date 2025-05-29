import { pgTable, text, serial, integer, timestamp, json, varchar, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  productId: integer("product_id").notNull().references(() => products.id),
  storeId: integer("store_id").notNull().references(() => stores.id),
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

// User schema
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"),
  googleId: varchar("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  passwordHash: true,
  googleId: true,
});

// Scan history schema
export const scanHistory = pgTable("scan_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id), // optional, can be null for anonymous scans
  barcode: text("barcode").notNull(),
  productData: json("product_data").notNull(),
  scannedAt: timestamp("scanned_at").defaultNow(),
  isFavorite: boolean("is_favorite").default(false),
});

export const insertScanHistorySchema = createInsertSchema(scanHistory).pick({
  barcode: true,
  productData: true,
  userId: true,
  isFavorite: true,
});

// Scan history relations
export const scanHistoryRelations = relations(scanHistory, ({ one }) => ({
  user: one(users, {
    fields: [scanHistory.userId],
    references: [users.id],
  }),
}));

// Define all relations
export const usersRelations = relations(users, ({ many }) => ({
  scanHistory: many(scanHistory),
}));
export const productsRelations = relations(products, ({ many }) => ({
  prices: many(prices),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  prices: many(prices),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
  store: one(stores, {
    fields: [prices.storeId],
    references: [stores.id],
  }),
}));

// Export types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;

export type Price = typeof prices.$inferSelect;
export type InsertPrice = z.infer<typeof insertPriceSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

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
