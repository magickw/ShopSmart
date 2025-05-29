import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Session configuration
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "local-dev-secret",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Helper functions for password handling
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT token helpers
export function generateToken(user: any): string {
  const secret = process.env.JWT_SECRET || "local-dev-secret";
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
    },
    secret,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): any {
  const secret = process.env.JWT_SECRET || "local-dev-secret";
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated?.() && req.user) {
      return next();
    }
  
  // Also check for JWT in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) {
      req.user = user;
      return next();
    }
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

// Setup auth routes and passport strategies
export async function setupAuth(app: Express) {
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Setup Google OAuth if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Look up user by Google ID or create if not exists
            let user = await storage.getUserByGoogleId(profile.id);
            
            if (!user) {
              // Create new user based on Google profile
              user = await storage.createUser({
                id: profile.id,
                email: profile.emails?.[0]?.value,
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                profileImageUrl: profile.photos?.[0]?.value,
                googleId: profile.id,
                passwordHash: null,
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  // Local login route
  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isMatch = await comparePassword(password, user.passwordHash);
      
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Login successful
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Generate JWT token
        const token = generateToken(user);
        
        return res.json({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
          },
          token,
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Registration route
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        id: Date.now().toString(), // Simple ID generation
        email,
        firstName,
        lastName,
        passwordHash,
        googleId: null,
        profileImageUrl: null,
      });
      
      // Auto login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Generate JWT token
        const token = generateToken(user);
        
        return res.status(201).json({
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          token,
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Google OAuth routes
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/login",
    }),
    (req, res) => {
      // Successful authentication, redirect home
      const token = generateToken(req.user);
      res.redirect(`/login/success?token=${token}`);
    }
  );

  // Current user route
  app.get("/api/auth/user", isAuthenticated, (req, res) => {
    res.json({ user: req.user });
  });

  // Logout route
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session?.destroy(() => {
        res.json({ success: true });
      });
    });
  });
}