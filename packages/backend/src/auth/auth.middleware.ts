import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { betterAuth } from 'better-auth';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject('BETTER_AUTH') private readonly auth: BetterAuthInstance,
    private readonly authService: AuthService,
  ) {}

  async use(req: FastifyRequest, res: FastifyReply, next: Function) {
    try {
      // Extract token from headers or cookies
      const token = this.extractToken(req);
      if (!token) {
        return res.code(401).send({ 
          status: false, 
          message: 'Authentication required' 
        });
      }

      // Verify token
      const session = await this.authService.getUser(token);
      if (!session?.user) {
        return res.code(401).send({ 
          status: false, 
          message: 'Invalid or expired session' 
        });
      }

      // Attach user to request
      req['user'] = session.user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.code(500).send({ 
        status: false, 
        message: 'Authentication error' 
      });
    }
  }

  private extractToken(req: FastifyRequest): string | null {
    // Extract from Authorization header
    const authHeader = req.headers.authorization as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Extract from cookies
    const cookies = req.cookies as Record<string, string>;
    if (cookies && cookies.session_token) {
      return cookies.session_token;
    }

    return null;
  }
}
