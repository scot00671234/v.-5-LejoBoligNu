import { users, properties, messages, favorites, type User, type InsertUser, type Property, type InsertProperty, type Message, type InsertMessage, type Favorite, type InsertFavorite } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";

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
  getConversations(userId: number): Promise<Array<{
    otherUserId: number;
    otherUserName: string;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    propertyId?: number;
    propertyTitle?: string;
  }>>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<boolean>;
  markConversationAsRead(userId: number, otherUserId: number): Promise<boolean>;

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
      .orderBy(messages.createdAt); // Order chronologically for conversations
  }

  async getConversations(userId: number): Promise<Array<{
    otherUserId: number;
    otherUserName: string;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    propertyId?: number;
    propertyTitle?: string;
  }>> {
    // Get all messages involving this user
    const allMessages = await db
      .select({
        id: messages.id,
        fromUserId: messages.fromUserId,
        toUserId: messages.toUserId,
        content: messages.content,
        read: messages.read,
        createdAt: messages.createdAt,
        propertyId: messages.propertyId,
      })
      .from(messages)
      .where(or(eq(messages.fromUserId, userId), eq(messages.toUserId, userId)))
      .orderBy(desc(messages.createdAt));

    // Get user names
    const userIds = Array.from(new Set(allMessages.flatMap(m => [m.fromUserId, m.toUserId])));
    const userMap = new Map();
    
    if (userIds.length > 0) {
      const userList = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);
      
      userList.forEach(user => userMap.set(user.id, user.name));
    }

    // Get property titles
    const propertyIds = Array.from(new Set(allMessages.filter(m => m.propertyId).map(m => m.propertyId!)));
    const propertyMap = new Map();
    
    if (propertyIds.length > 0) {
      const propertyList = await db
        .select({ id: properties.id, title: properties.title })
        .from(properties)
        .where(sql`${properties.id} IN (${sql.join(propertyIds.map(id => sql`${id}`), sql`, `)})`);
      
      propertyList.forEach(property => propertyMap.set(property.id, property.title));
    }

    // Group by conversation (other user)
    const conversationMap = new Map();
    
    for (const msg of allMessages) {
      const otherUserId = msg.fromUserId === userId ? msg.toUserId : msg.fromUserId;
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUserId,
          otherUserName: userMap.get(otherUserId) || `Bruger ${otherUserId}`,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
          propertyId: msg.propertyId,
          propertyTitle: msg.propertyId ? propertyMap.get(msg.propertyId) : undefined,
        });
      }
      
      // Count unread messages (messages sent TO this user that are unread)
      if (msg.toUserId === userId && !msg.read) {
        conversationMap.get(otherUserId).unreadCount++;
      }
    }
    
    return Array.from(conversationMap.values());
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

  async markConversationAsRead(userId: number, otherUserId: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.fromUserId, otherUserId),
          eq(messages.toUserId, userId),
          eq(messages.read, false)
        )
      );
    return (result.rowCount || 0) >= 0;
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
