import { users, properties, messages, favorites, type User, type InsertUser, type Property, type InsertProperty, type Message, type InsertMessage, type Favorite, type InsertFavorite } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Property methods
  getProperties(filters?: {
    location?: string;
    rooms?: number;
    maxPrice?: number;
    landlordId?: number;
  }): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;

  // Message methods
  getMessages(userId: number, otherUserId?: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;

  // Favorite methods
  getFavorites(userId: number): Promise<(Favorite & { property: Property })[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: number, propertyId: number): Promise<boolean>;
  isFavorite(userId: number, propertyId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Property methods
  async getProperties(filters?: {
    location?: string;
    rooms?: number;
    maxPrice?: number;
    landlordId?: number;
  }): Promise<Property[]> {
    const conditions = [eq(properties.available, true)];

    if (filters?.location) {
      conditions.push(ilike(properties.address, `%${filters.location}%`));
    }
    if (filters?.rooms) {
      conditions.push(eq(properties.rooms, filters.rooms));
    }
    if (filters?.maxPrice) {
      conditions.push(eq(properties.price, filters.maxPrice.toString()));
    }
    if (filters?.landlordId) {
      conditions.push(eq(properties.landlordId, filters.landlordId));
    }

    return await db.select().from(properties)
      .where(and(...conditions))
      .orderBy(desc(properties.createdAt));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values(insertProperty)
      .returning();
    return property;
  }

  async updateProperty(id: number, updateData: Partial<InsertProperty>): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set(updateData)
      .where(eq(properties.id, id))
      .returning();
    return property || undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Message methods
  async getMessages(userId: number, otherUserId?: number): Promise<Message[]> {
    const conditions = otherUserId 
      ? or(
          and(eq(messages.fromUserId, userId), eq(messages.toUserId, otherUserId)),
          and(eq(messages.fromUserId, otherUserId), eq(messages.toUserId, userId))
        )
      : or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId));

    return await db.select().from(messages)
      .where(conditions)
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Favorite methods
  async getFavorites(userId: number): Promise<(Favorite & { property: Property })[]> {
    const result = await db
      .select({
        id: favorites.id,
        userId: favorites.userId,
        propertyId: favorites.propertyId,
        createdAt: favorites.createdAt,
        property: properties,
      })
      .from(favorites)
      .innerJoin(properties, eq(favorites.propertyId, properties.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    return result;
  }

  async addFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db
      .insert(favorites)
      .values(insertFavorite)
      .returning();
    return favorite;
  }

  async removeFavorite(userId: number, propertyId: number): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return (result.rowCount || 0) > 0;
  }

  async isFavorite(userId: number, propertyId: number): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
    return !!favorite;
  }
}

export const storage = new DatabaseStorage();
