import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const session = await this.authService.getUser(token);
      if (!session?.user) {
        throw new UnauthorizedException('Invalid or expired session');
      }
      
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
