import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertPropertySchema, insertMessageSchema, insertFavoriteSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Middleware to verify JWT token
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profilePictureUrl: req.user.profilePictureUrl,
        bio: req.user.bio,
        phone: req.user.phone,
      },
    });
  });

  app.put("/api/auth/profile", authenticateToken, async (req: any, res) => {
    try {
      const { name, bio, profilePictureUrl, phone } = req.body;
      
      const updatedUser = await storage.updateUser(req.user.id, {
        name,
        bio,
        profilePictureUrl,
        phone,
      });

      res.json({
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          profilePictureUrl: updatedUser.profilePictureUrl,
          bio: updatedUser.bio,
          phone: updatedUser.phone,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // Property routes
  app.get("/api/properties", async (req, res) => {
    try {
      const { location, rooms, maxPrice } = req.query;
      const filters: any = {};
      
      if (location) filters.location = location as string;
      if (rooms) filters.rooms = parseInt(rooms as string);
      if (maxPrice) filters.maxPrice = parseInt(maxPrice as string);

      const properties = await storage.getProperties(filters);
      res.json(properties);
    } catch (error) {
      console.error("Get properties error:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      res.json(property);
    } catch (error) {
      console.error("Get property error:", error);
      res.status(500).json({ message: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'landlord') {
        return res.status(403).json({ message: "Only landlords can create properties" });
      }

      const requestData = { ...req.body, landlordId: req.user.id };
      
      // Convert availableFrom string to Date if provided
      if (requestData.availableFrom && typeof requestData.availableFrom === 'string') {
        requestData.availableFrom = new Date(requestData.availableFrom);
      }
      
      const propertyData = insertPropertySchema.parse(requestData);

      const property = await storage.createProperty(propertyData);
      res.json(property);
    } catch (error) {
      console.error("Create property error:", error);
      res.status(400).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update this property" });
      }

      const requestData = { ...req.body };
      
      // Convert availableFrom string to Date if provided
      if (requestData.availableFrom && typeof requestData.availableFrom === 'string') {
        requestData.availableFrom = new Date(requestData.availableFrom);
      }
      
      const updateData = insertPropertySchema.partial().parse(requestData);
      const updatedProperty = await storage.updateProperty(id, updateData);

      res.json(updatedProperty);
    } catch (error) {
      console.error("Update property error:", error);
      res.status(400).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      if (property.landlordId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this property" });
      }

      await storage.deleteProperty(id);
      res.json({ message: "Property deleted successfully" });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  // Message routes
  app.get("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const { otherUserId } = req.query;
      const messages = await storage.getMessages(
        req.user.id,
        otherUserId ? parseInt(otherUserId as string) : undefined
      );
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/conversations", authenticateToken, async (req: any, res) => {
    try {
      const conversations = await storage.getConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.put("/api/conversations/:otherUserId/read", authenticateToken, async (req: any, res) => {
    try {
      const otherUserId = parseInt(req.params.otherUserId);
      await storage.markConversationAsRead(req.user.id, otherUserId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark conversation as read error:", error);
      res.status(500).json({ message: "Failed to mark conversation as read" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        fromUserId: req.user.id,
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Favorite routes
  app.get("/api/favorites", authenticateToken, async (req: any, res) => {
    try {
      const favorites = await storage.getFavorites(req.user.id);
      res.json(favorites);
    } catch (error) {
      console.error("Get favorites error:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", authenticateToken, async (req: any, res) => {
    try {
      const { propertyId } = req.body;
      
      const isAlreadyFavorite = await storage.isFavorite(req.user.id, propertyId);
      if (isAlreadyFavorite) {
        return res.status(400).json({ message: "Property already in favorites" });
      }

      const favorite = await storage.addFavorite({
        userId: req.user.id,
        propertyId,
      });

      res.json(favorite);
    } catch (error) {
      console.error("Add favorite error:", error);
      res.status(400).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:propertyId", authenticateToken, async (req: any, res) => {
    try {
      const propertyId = parseInt(req.params.propertyId);
      await storage.removeFavorite(req.user.id, propertyId);
      res.json({ message: "Favorite removed successfully" });
    } catch (error) {
      console.error("Remove favorite error:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  // User info route for getting landlord details
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return only public user information
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
