import { Injectable, NestMiddleware, Inject, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { betterAuth } from 'better-auth';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject('BETTER_AUTH') private readonly auth: BetterAuthInstance,
    private readonly authService: AuthService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract token from headers or cookies
      const token = this.extractToken(req);
      if (!token) {
        return res.status(401).json({ 
          status: false, 
          message: 'Authentication required' 
        });
      }

      // Verify token
      const session = await this.authService.getUser(token);
      if (!session?.user) {
        return res.status(401).json({ 
          status: false, 
          message: 'Invalid or expired session' 
        });
      }

      // Attach user to request
      req['user'] = session.user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ 
        status: false, 
        message: 'Authentication error' 
      });
    }
  }

  private extractToken(req: Request): string | null {
    // Extract from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Extract from cookies
    const cookies = req.cookies;
    if (cookies && cookies.session_token) {
      return cookies.session_token;
    }

    return null;
  }
}
