import { Inject, Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { AuthResponse } from './auth.interface';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

@Injectable()
export class AuthService {
  constructor(@Inject('BETTER_AUTH') private readonly auth: BetterAuthInstance) {}

  private createAuthRequest(path: string, method: string, body?: any, headers?: any): Request {
    const fullPath = path.startsWith('http') ? path : `http://localhost${path}`;
    
    const requestHeaders: HeadersInit = { 'Content-Type': 'application/json', ...headers };
    const requestInit: RequestInit = { method, headers: requestHeaders };
    
    if (body) {
      requestInit.body = JSON.stringify(body);
    }
    
    console.log(`Creating auth request to: ${fullPath}`);
    return new Request(fullPath, requestInit);
  }
  
  async registerWithEmail(email: string, password: string, name?: string): Promise<AuthResponse> {
    try {
      console.log('Creating registration request with data:', { email, name });
      
      // Use the Better Auth API directly instead of creating a custom request
      console.log('Calling Better Auth API signUpEmail method');
      
      const result = await this.auth.api.signUpEmail({
        body: { 
          email, 
          password, 
          name: name || ''
        },
        query: {
          callbackUrl: '/'
        }
      });
      
      console.log('Registration successful:', result);
      return {
        status: true,
        message: 'Registration successful',
        user: result.user,
        session: result.token ? { token: result.token } : null
      };
    } catch (error) {
      console.error('Error in registerWithEmail:', error);
      return { 
        status: false, 
        message: error instanceof Error ? error.message : 'Registration failed',
        error: { 
          message: error instanceof Error ? error.message : 'Registration failed',
          status: 400,
          statusText: 'Bad Request'
        } 
      };
    }
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Creating login request with data:', { email });
      
      console.log('Calling Better Auth API signInEmail method');
      
      const result = await this.auth.api.signInEmail({
        body: { 
          email, 
          password 
        },
        query: {
          callbackUrl: '/'
        }
      });
      
      console.log('Login successful:', result);
      return {
        status: true,
        message: 'Login successful',
        user: result.user,
        session: result.token ? { token: result.token } : null
      };
    } catch (error) {
      console.error('Error in loginWithEmail:', error);
      return { 
        status: false,
        message: error instanceof Error ? error.message : 'Login failed',
        user: null,
        session: null,
        error: { 
          message: error instanceof Error ? error.message : 'Login failed',
          status: 400,
          statusText: 'Bad Request'
        } 
      };
    }
  }

  async getUser(sessionToken: string): Promise<AuthResponse> {
    try {
      console.log('Getting user session with token');
      
      const result = await this.auth.api.getSession({
        headers: new Headers({
          'Authorization': `Bearer ${sessionToken}`
        })
      });
      
      console.log('Session retrieved successfully:', result);
      return {
        status: true,
        message: 'Session retrieved successfully',
        user: result?.user || null,
        session: result?.session?.token ? { token: result.session.token } : null
      };
    } catch (error) {
      console.error('Error in getUser:', error);
      return { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to get user session',
        error: { 
          message: error instanceof Error ? error.message : 'Failed to get user session',
          status: 401,
          statusText: 'Unauthorized'
        } 
      };
    }
  }

  async logout(sessionToken: string): Promise<AuthResponse> {
    try {
      console.log('Logging out user with session token');
      
      const result = await this.auth.api.signOut({
        headers: new Headers({
          'Authorization': `Bearer ${sessionToken}`
        })
      });
      
      console.log('Logout successful:', result);
      return {
        status: true,
        message: 'Logout successful'
      };
    } catch (error) {
      console.error('Error in logout:', error);
      return { 
        status: false, 
        message: error instanceof Error ? error.message : 'Failed to logout',
        error: { 
          message: error instanceof Error ? error.message : 'Failed to logout',
          status: 400,
          statusText: 'Bad Request'
        } 
      };
    }
  }

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const request = this.createAuthRequest(
      '/auth/verify-email', 
      'POST', 
      { token }
    );
    const result = await this.auth.handler(request);
    return result.json();
  }

  async sendMagicLink(email: string): Promise<AuthResponse> {
    const request = this.createAuthRequest(
      '/auth/magic-link', 
      'POST', 
      { email }
    );
    const result = await this.auth.handler(request);
    return result.json();
  }

  async registerPasskey(sessionToken: string, email: string): Promise<AuthResponse> {
    const request = this.createAuthRequest(
      '/auth/passkey/register', 
      'POST', 
      { email }, 
      { 'Authorization': `Bearer ${sessionToken}` }
    );
    const result = await this.auth.handler(request);
    return result.json();
  }

  async authenticatePasskey(credential: any): Promise<AuthResponse> {
    const request = this.createAuthRequest(
      '/auth/passkey/authenticate', 
      'POST', 
      { credential }
    );
    const result = await this.auth.handler(request);
    return result.json();
  }
}
