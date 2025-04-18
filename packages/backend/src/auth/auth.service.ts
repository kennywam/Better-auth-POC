import { Inject, Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { AuthResponse } from './auth.interface';

type BetterAuthInstance = ReturnType<typeof betterAuth>;


@Injectable()
export class AuthService {
  constructor(@Inject('BETTER_AUTH') private readonly auth: BetterAuthInstance) {}

  async registerWithEmail(email: string, password: string): Promise<AuthResponse> {
    const result = await this.auth.handler(new Request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }));
    return result.json();
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    const result = await this.auth.handler(new Request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }));
    return result.json();
  }

  async getUser(sessionToken: string): Promise<AuthResponse> {
    const result = await this.auth.handler(new Request('/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
    }));
    return result.json();
  }

  async logout(sessionToken: string): Promise<AuthResponse> {
    const result = await this.auth.handler(new Request('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
    }));
    return result.json();
  }

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const result = await this.auth.handler(new Request('/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }));
    return result.json();
  }

  async sendMagicLink(email: string): Promise<AuthResponse> {
    const result = await this.auth.handler(new Request('/auth/request-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }));
    return result.json();
  }

  async registerPasskey(sessionToken: string, email: string): Promise<AuthResponse> {
    const result = await this.auth.handler(new Request('/auth/passkey/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ email }),
    }));
    return result.json();
  }

  async authenticatePasskey(credential: any): Promise<AuthResponse> {
    const result = await this.auth.handler(new Request('/auth/passkey/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    }));
    return result.json();
  }
}
