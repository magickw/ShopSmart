import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { productResponseSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { setupAuth, isAuthenticated } from "./auth";

// Define the Barcode Lookup API base URL
const BARCODE_API_URL = "https://api.upcitemdb.com/prod/trial/lookup";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  await setupAuth(app);
  // API route for looking up barcode
  app.get("/api/lookup/:barcode", async (req, res) => {
    try {
      const barcode = req.params.barcode;
      
      // Check if we already have this product cached
      const cachedProduct = await storage.getProductByBarcode(barcode);
      if (cachedProduct) {
        return res.json(cachedProduct);
      }
      
      // If not cached, fetch from Barcode Lookup API
      const apiKey = process.env.BARCODE_LOOKUP_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "API key not configured" });
      }
      
      const response = await axios.get(BARCODE_API_URL, {
        params: {
          upc: barcode,  // NOTE: upc, not barcode
          key: apiKey,
          formatted: "y"
        }
      });
      
      // Process the response and extract relevant data
      if (!response.data.products || response.data.products.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const apiProduct = response.data.products[0];
      
      // Create stores array with pricing information
      // In a real app, you would query multiple retailer APIs or a unified API
      // For this example, we'll simulate the data for different stores
      const stores = [
        {
          id: 1,
          name: "Walmart",
          price: (parseFloat(apiProduct.price) * 1.05).toFixed(2),
          currency: "USD",
          inStock: 1,
          isBestPrice: false,
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: "Costco",
          price: (parseFloat(apiProduct.price) * 0.85).toFixed(2),
          currency: "USD",
          inStock: 1,
          isBestPrice: false,
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          name: "Safeway",
          price: (parseFloat(apiProduct.price) * 1.10).toFixed(2),
          currency: "USD",
          inStock: 1,
          isBestPrice: false,
          updatedAt: new Date().toISOString()
        },
        {
          id: 4,
          name: "Target",
          price: (parseFloat(apiProduct.price) * 0.95).toFixed(2),
          currency: "USD",
          inStock: 1,
          isBestPrice: false,
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Find the best price
      const minPrice = Math.min(...stores.map(store => parseFloat(store.price)));
      stores.forEach(store => {
        if (parseFloat(store.price) === minPrice) {
          store.isBestPrice = true;
        }
      });
      
      // Create product response object
      const product = {
        barcode,
        title: apiProduct.title,
        brand: apiProduct.brand,
        category: apiProduct.category,
        stores
      };
      
      // Validate with Zod schema
      const validatedProduct = productResponseSchema.parse(product);
      
      // Cache the product
      await storage.saveProduct(validatedProduct);
      
      // Save to scan history
      await storage.saveScanHistory({
        barcode,
        productData: validatedProduct
      });
      
      return res.json(validatedProduct);
    } catch (error) {
      console.error("Error in /api/lookup:", error);
      
      if (error instanceof z.ZodError) {
        const readableError = fromZodError(error);
        return res.status(422).json({ message: "Invalid data format from API", details: readableError.message });
      }
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || "Unknown error";
        return res.status(status).json({ message });
      }
      
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // API route for getting scan history (works for both authenticated and non-authenticated users)
  app.get("/api/history", async (req, res) => {
    try {
      // If user is authenticated, get their specific history
      if (req.isAuthenticated() && req.user) {
        const userId = req.user.id || req.user.claims?.sub;
        if (userId) {
          const history = await storage.getScanHistory(userId);
          return res.json(history);
        }
      }
      
      // Otherwise return general (or anonymous) history
      const history = await storage.getScanHistory();
      res.json(history);
    } catch (error) {
      console.error("Error in /api/history:", error);
      res.status(500).json({ message: "Failed to retrieve scan history" });
    }
  });
  
  // API route for clearing scan history
  app.post("/api/history/clear", async (req, res) => {
    try {
      // If user is authenticated, clear only their history
      if (req.isAuthenticated() && req.user) {
        const userId = req.user.id || req.user.claims?.sub;
        if (userId) {
          await storage.clearScanHistory(userId);
          return res.json({ message: "Your scan history cleared successfully" });
        }
      }
      
      // Otherwise clear general history
      await storage.clearScanHistory();
      res.json({ message: "Scan history cleared successfully" });
    } catch (error) {
      console.error("Error in /api/history/clear:", error);
      res.status(500).json({ message: "Failed to clear scan history" });
    }
  });
  
  // API route for user profile (protected)
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Send back user info without sensitive data
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Error in /api/profile:", error);
      res.status(500).json({ message: "Failed to retrieve user profile" });
    }
  });
  
  // API route for updating user profile (protected)
  app.patch("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id || req.user.claims?.sub;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      const { firstName, lastName } = req.body;
      const updateData: any = {};
      
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Send back updated user info without sensitive data
      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
      });
    } catch (error) {
      console.error("Error in PATCH /api/profile:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  
  // PayPal donation routes
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  const httpServer = createServer(app);
  return httpServer;
}
