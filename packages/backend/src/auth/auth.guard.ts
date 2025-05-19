import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { SessionStore } from './session.store';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionStore: SessionStore
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      // First try our custom session store for more reliable authentication
      console.log('Auth guard checking token in session store:', token.substring(0, 5) + '...');
      const sessionData = await this.sessionStore.getSession(token);
      
      if (sessionData && sessionData.userData) {
        console.log('Auth guard found session in custom store');
        // Attach user to request
        request.user = sessionData.userData;
        return true;
      }
      
      // Fall back to the auth service if not found in session store
      console.log('Auth guard falling back to auth service');
      const session = await this.authService.getUser(token);
      
      if (!session?.user) {
        throw new UnauthorizedException('Invalid or expired session');
      }
      
      // Store in session store for future requests
      await this.sessionStore.storeSession(token, session.user.id, session.user);
      
      // Attach user to request
      request.user = session.user;
      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractToken(request: any): string | null {
    // Extract from Authorization header
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Extract from cookies
    const cookies = request.cookies;
    if (cookies && cookies.session_token) {
      return cookies.session_token;
    }

    return null;
  }
}
