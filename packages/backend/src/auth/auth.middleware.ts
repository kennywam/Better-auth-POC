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
      const url = req.url;
      if (url.includes('/api/auth/session')) {
        console.log('Skipping auth check for session endpoint');
        return next();
      }

      const token = this.extractToken(req);
      if (!token) {
        console.log('No auth token found in request');
        res.status(401);
        return res.send({ 
          status: false, 
          message: 'Authentication required' 
        });
      }

      console.log(`Auth token found: ${token.substring(0, 5)}...`);

      const session = await this.authService.getUser(token);
      if (!session?.user) {
        console.log('Invalid or expired session');
        res.status(401);
        return res.send({ 
          status: false, 
          message: 'Invalid or expired session' 
        });
      }

      console.log(`User authenticated: ${session.user.email}`);
      req['user'] = session.user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500);
      return res.send({ 
        status: false, 
        message: 'Authentication error' 
      });
    }
  }

  private extractToken(req: FastifyRequest): string | null {
    const authHeader = req.headers.authorization as string | undefined;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      return authHeader;
    }

    const cookies = req.cookies as Record<string, string>;
    if (cookies && cookies.session_token) {
      return cookies.session_token;
    }

    return null;
  }
}
