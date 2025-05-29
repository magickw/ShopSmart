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

// Define the upcitemdb API base URL
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

      // // If not cached, fetch from Barcode Lookup API
      // const apiKey = process.env.BARCODE_LOOKUP_API_KEY;
      // if (!apiKey) {
      //   return res.status(500).json({ message: "API key not configured" });
      // }

      // const response = await axios.get(BARCODE_API_URL, {
      //   params: {
      //     upc: barcode,  // NOTE: upc, not barcode
      //     key: apiKey,
      //     formatted: "y"
      //   }
      // });

      const response = await axios.post(
      BARCODE_API_URL,
      { upc: barcode },  // The trial endpoint expects a POST body, not query params
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );

      // Accessed response.data.items (not products — UPCitemdb’s response uses items)
      if (!response.data.items || response.data.items.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      const apiProduct = response.data.items[0];
      const stores = apiProduct.offers.map((offer, index) => ({
        id: index + 1,
        name: offer.merchant,
        price: offer.price.toFixed(2),
        currency: offer.currency || "USD",  // fallback if missing
        inStock: offer.availability !== "Out of Stock" ? 1 : 0,
        isBestPrice: false,  // we'll compute this below
        updatedAt: new Date(offer.updated_t * 1000).toISOString(),  // convert Unix timestamp
        link: offer.link || "",  // ensure link is always a string
        imageUrl: offer.image || apiProduct.images[0] || ""  // fallback to product image if offer image is missing
      }));


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
        description: apiProduct.description,
        model: apiProduct.model,
        images: apiProduct.images,
        lowestRecordedPrice: apiProduct.lowest_recorded_price,
        highestRecordedPrice: apiProduct.highest_recorded_price,
        stores
      };

      // Validate with Zod schema
      const validatedProduct = productResponseSchema.parse(product);

      // Cache the product
      await storage.saveProduct(validatedProduct);

      // Save to scan history
      await storage.saveScanHistory({
        barcode,
        productData: validatedProduct,
        userId: req.isAuthenticated() && req.user ? (req.user.id || req.user.claims?.sub) : null
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
      let history;
      // If user is authenticated, get their specific history
      if (req.isAuthenticated() && req.user) {
        const userId = req.user.id || req.user.claims?.sub;
        if (userId) {
        history = await storage.getScanHistory(userId);
        } else {
          // Fallback for anonymous users
          history = await storage.getScanHistory();
        }
      } else {
        // For anonymous users, get general history
        history = await storage.getScanHistory();
      }

      res.json(history || []);
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

  // Clear history
  app.post("/api/history/clear", async (req, res) => {
    try {
      await storage.clearScanHistory();
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing history:", error);
      res.status(500).json({ message: "Error clearing history" });
    }
  });

  // Get saved products
  app.get("/api/saved", async (req, res) => {
    try {
      const savedProducts = await storage.getSavedProducts();
      res.json(savedProducts);
    } catch (error) {
      console.error("Error fetching saved products:", error);
      res.status(500).json({ message: "Error fetching saved products" });
    }
  });

  // Save a product
  app.post("/api/saved", async (req, res) => {
    try {
      const product = productResponseSchema.parse(req.body);
      await storage.saveProductToFavorites(product);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data" });
      }
      res.status(500).json({ message: "Error saving product" });
    }
  });

  // Remove saved product
  app.delete("/api/saved/:barcode", async (req, res) => {
    try {
      const { barcode } = req.params;
      await storage.removeSavedProduct(barcode);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing saved product:", error);
      res.status(500).json({ message: "Error removing saved product" });
    }
  });

  // Clear all saved products
  app.post("/api/saved/clear", async (req, res) => {
    try {
      await storage.clearSavedProducts();
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing saved products:", error);
      res.status(500).json({ message: "Error clearing saved products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}