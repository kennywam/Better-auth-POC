import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SessionData {
  userId: string;
  token: string;
  expiresAt: Date;
  userData?: any;
}

@Injectable()
export class SessionStore {
  private sessions: Map<string, SessionData> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async storeSession(token: string, userId: string, userData?: any): Promise<void> {
    console.log(`Storing session for user ${userId} with token ${token.substring(0, 5)}...`);
    
    // Store in memory
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
    
    this.sessions.set(token, {
      userId,
      token,
      expiresAt,
      userData
    });
    
    // Store in database
    try {
      await this.prisma.session.upsert({
        where: { token },
        update: {
          expiresAt,
          userId
        },
        create: {
          token,
          expiresAt,
          userId
        }
      });
      console.log(`Session stored in database for user ${userId}`);
    } catch (error) {
      console.error('Error storing session in database:', error);
    }
  }

  async getSession(token: string): Promise<SessionData | null> {
    console.log(`Getting session for token ${token.substring(0, 5)}...`);
    
    // Try memory first
    if (this.sessions.has(token)) {
      const session = this.sessions.get(token);
      
      if (session) {
        // Check if expired
        if (session.expiresAt < new Date()) {
          console.log('Session expired, removing from memory');
          this.sessions.delete(token);
          return null;
        }
        
        console.log(`Found session in memory for user ${session.userId}`);
        return session;
      }
    }
    
    // Try database
    try {
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });
      
      if (session) {
        // Check if expired
        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
          console.log('Session expired in database');
          return null;
        }
        
        console.log(`Found session in database for user ${session.userId}`);
        
        // Create session data object
        const sessionData: SessionData = {
          userId: session.userId,
          token: session.token,
          expiresAt: session.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
          userData: session.user
        };
        
        // Store in memory for future lookups
        this.sessions.set(token, sessionData);
        
        return sessionData;
      }
    } catch (error) {
      console.error('Error getting session from database:', error);
    }
    
    console.log('Session not found');
    return null;
  }

  async removeSession(token: string): Promise<void> {
    console.log(`Removing session for token ${token.substring(0, 5)}...`);
    
    // Remove from memory
    this.sessions.delete(token);
    
    // Remove from database
    try {
      await this.prisma.session.delete({
        where: { token }
      });
      console.log('Session removed from database');
    } catch (error) {
      console.error('Error removing session from database:', error);
    }
  }
}
