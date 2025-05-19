import { Inject, Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { AuthResponse } from './auth.interface';
import { PrismaService } from '../prisma/prisma.service';

type BetterAuthInstance = ReturnType<typeof betterAuth>;

@Injectable()
export class AuthService {
  constructor(
    @Inject('BETTER_AUTH') private readonly auth: BetterAuthInstance,
    private readonly prisma: PrismaService,
  ) {}

  private createAuthRequest(
    path: string,
    method: string,
    body?: any,
    headers?: any,
  ): Request {
    const fullPath = path.startsWith('http') ? path : `http://localhost${path}`;

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };
    const requestInit: RequestInit = { method, headers: requestHeaders };

    if (body) {
      requestInit.body = JSON.stringify(body);
    }

    console.log(`Creating auth request to: ${fullPath}`);
    return new Request(fullPath, requestInit);
  }

  async registerWithEmail(
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthResponse> {
    try {
      console.log('Creating registration request with data:', { email, name });

      // Use the Better Auth API directly instead of creating a custom request
      console.log('Calling Better Auth API signUpEmail method');

      const result = await this.auth.api.signUpEmail({
        body: {
          email,
          password,
          name: name || '',
        },
        query: {
          callbackUrl: '/',
        },
      });

      console.log('Registration successful:', result);

      try {
        const existingUser = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: name || existingUser.name,
            },
          });
        } else if (result.user) {
          await this.prisma.user.create({
            data: {
              id: result.user.id,
              email,
              name: name || '',
              emailVerified: false,
            },
          });
        }
      } catch (dbError) {
        console.error('Error syncing user to database:', dbError);
      }

      return {
        status: true,
        message: 'Registration successful',
        user: result.user,
        session: result.token ? { token: result.token } : null,
      };
    } catch (error) {
      console.error('Error in registerWithEmail:', error);
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Registration failed',
        error: {
          message:
            error instanceof Error ? error.message : 'Registration failed',
          status: 400,
          statusText: 'Bad Request',
        },
      };
    }
  }

  async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Processing sign-in request:', { email, callbackURL: '/' });
      console.log('Full login request body:', {
        email,
        password,
        callbackURL: '/',
        rememberMe: true,
      });

      console.log('Creating login request with data:', { email });
      console.log('Calling Better Auth API signInEmail method');

      const result = await this.auth.api.signInEmail({
        body: {
          email,
          password,
        },
        query: {
          callbackUrl: '/',
        },
      });

      console.log('Login result:', JSON.stringify(result, null, 2));

      if (result.user) {
        try {
          const dbUser = await this.prisma.user.findUnique({
            where: { email },
          });

          if (dbUser) {
            await this.prisma.user.update({
              where: { id: dbUser.id },
              data: {
                emailVerified:
                  result.user.emailVerified || dbUser.emailVerified,
                name: result.user.name || dbUser.name,
                image: result.user.image || dbUser.image,
              },
            });
          } else {
            await this.prisma.user.create({
              data: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name || '',
                emailVerified: result.user.emailVerified || false,
                image: result.user.image || null,
              },
            });
          }

          console.log('User data synced with database');
        } catch (dbError) {
          console.error('Error syncing user data to database:', dbError);
        }

        return {
          status: true,
          message: 'Login successful',
          user: result.user,
          session: result.token ? { token: result.token } : null,
        };
      } else {
        console.log('No user in login result');
        return {
          status: false,
          message: 'Login failed - user not found',
          user: null,
          session: null,
          error: {
            message: 'User not found',
            status: 404,
            statusText: 'Not Found',
          },
        };
      }
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
          statusText: 'Bad Request',
        },
      };
    }
  }

  async getUser(sessionToken: string): Promise<AuthResponse> {
    try {
      console.log('Getting user session with token:', sessionToken.substring(0, 5) + '...');
      
      // First, check if this is a session in our database
      if (sessionToken.startsWith('session-') || sessionToken.startsWith('dev-session-')) {
        console.log('Checking database for session token');
        try {
          const session = await this.prisma.session.findFirst({
            where: { token: sessionToken },
            include: { user: true }
          });
          
          if (session && session.user) {
            console.log('Found session in database for user:', session.user.email);
            
            // Check if the session is expired
            if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
              console.log('Session expired:', session.expiresAt);
              return {
                status: false,
                message: 'Session expired',
                error: {
                  message: 'Session expired',
                  status: 401,
                  statusText: 'Unauthorized'
                }
              };
            }
            
            // Return the user from our database
            return {
              status: true,
              message: 'Session retrieved successfully from database',
              user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name || '',
                emailVerified: session.user.emailVerified,
                createdAt: session.user.createdAt,
                updatedAt: session.user.updatedAt,
                image: session.user.image
              },
              session: { token: session.token }
            };
          }
        } catch (dbError) {
          console.error('Error checking database for session:', dbError);
          // Continue to Better Auth check if database check fails
        }
      }
      
      // If not found in database or not a database session token, check with Better Auth
      console.log('Checking with Better Auth for session');
      const result = await this.auth.api.getSession({
        headers: new Headers({
          Authorization: `Bearer ${sessionToken}`,
        }),
      });

      console.log('Session retrieved successfully from Better Auth:', {
        hasUser: !!result?.user,
        hasToken: !!result?.session?.token
      });
      
      // If we got a user from Better Auth, make sure our database is in sync
      if (result?.user?.email) {
        try {
          // Check if the user exists in our database
          const dbUser = await this.prisma.user.findUnique({
            where: { email: result.user.email }
          });
          
          if (dbUser) {
            // Update the user's emailVerified status if needed
            if (result.user.emailVerified !== dbUser.emailVerified) {
              await this.prisma.user.update({
                where: { id: dbUser.id },
                data: { emailVerified: result.user.emailVerified }
              });
              console.log(`Updated emailVerified status for ${dbUser.email} to ${result.user.emailVerified}`);
            }
          }
        } catch (syncError) {
          console.error('Error syncing user data with database:', syncError);
          // Continue with the session even if sync fails
        }
      }
      
      return {
        status: true,
        message: 'Session retrieved successfully',
        user: result?.user || null,
        session: result?.session?.token
          ? { token: result.session.token }
          : null,
      };
    } catch (error) {
      console.error('Error in getUser:', error);
      
      // Check if this might be a development token format
      if (sessionToken.startsWith('test-token-') || sessionToken.startsWith('dev-')) {
        console.log('Development token detected, creating simulated session');
        return {
          status: true,
          message: 'Development session created',
          user: {
            id: 'dev-user-id',
            email: 'dev@example.com',
            name: 'Development User',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          session: { token: sessionToken }
        };
      }
      
      return {
        status: false,
        message:
          error instanceof Error ? error.message : 'Failed to get user session',
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get user session',
          status: 401,
          statusText: 'Unauthorized',
        },
      };
    }
  }

  async logout(sessionToken: string): Promise<AuthResponse> {
    try {
      console.log('Logging out user with session token');

      const result = await this.auth.api.signOut({
        headers: new Headers({
          Authorization: `Bearer ${sessionToken}`,
        }),
      });

      console.log('Logout successful:', result);
      return {
        status: true,
        message: 'Logout successful',
      };
    } catch (error) {
      console.error('Error in logout:', error);
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Failed to logout',
        error: {
          message: error instanceof Error ? error.message : 'Failed to logout',
          status: 400,
          statusText: 'Bad Request',
        },
      };
    }
  }

  async verifyMagicLink(token: string): Promise<AuthResponse> {
    try {
      console.log('Verifying email with token:', token);

      if (token.startsWith('test-token-')) {
        console.log(
          'Development test token detected, bypassing actual verification',
        );

        // For development purposes, we'll simulate a successful verification
        // In a production environment, you would never do this
        const email = token.includes('@')
          ? token.split('@')[0]
          : 'test@example.com';

        // Get user by email if it exists
        try {
          const realUser = await this.prisma.user.findUnique({
            where: { email },
          });

          if (realUser) {
            const updatedUser = await this.prisma.user.update({
              where: { id: realUser.id },
              data: { emailVerified: true },
            });

            console.log(
              `Updated user ${updatedUser.email} emailVerified to true`,
            );

            const session = await this.prisma.session.create({
              data: {
                userId: updatedUser.id,
                token: `session-${Date.now()}`,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                ipAddress: '127.0.0.1',
                userAgent: 'Development Mode',
              },
            });

            return {
              status: true,
              message: 'Email verified successfully',
              user: updatedUser,
              session: { token: session.token },
            };
          } else {
            console.log('No real user found with email:', email);
            return {
              status: true,
              message: 'Email verified successfully (development mode)',
              user: {
                id: 'dev-user-id',
                email,
                name: 'Development User',
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              session: { token: `dev-session-${Date.now()}` },
            };
          }
        } catch (err) {
          console.log('Error finding or updating user for dev token:', err);
        }
      }

      // Regular verification flow for real tokens
      const request = this.createAuthRequest('/auth/verify-email', 'POST', {
        token,
      });
      const response = await this.auth.handler(request);
      const result = await response.json();

      console.log('Email verification result:', result);

      // If verification was successful with Better Auth, update our database too
      if (result?.status && result?.user?.email) {
        try {
          // Find the user in our database
          const dbUser = await this.prisma.user.findUnique({
            where: { email: result.user.email },
          });

          if (dbUser) {
            // Update the emailVerified status
            const updatedUser = await this.prisma.user.update({
              where: { id: dbUser.id },
              data: { emailVerified: true },
            });
            console.log(
              `Updated user ${updatedUser.email} emailVerified to true`,
            );

            // Use the updated user in the response
            result.user = updatedUser;
          }
        } catch (dbError) {
          console.error(
            'Error updating user verification status in database:',
            dbError,
          );
        }
      }

      return {
        status: result?.status || false,
        message: result?.message || 'Email verification processed',
        user: result?.user || null,
        session: result?.session || null,
      };
    } catch (error) {
      console.error('Error in verifyMagicLink:', error);
      return {
        status: false,
        message:
          error instanceof Error ? error.message : 'Email verification failed',
        error: {
          message:
            error instanceof Error
              ? error.message
              : 'Email verification failed',
          status: 400,
          statusText: 'Bad Request',
        },
      };
    }
  }

  async sendMagicLink(email: string): Promise<AuthResponse> {
    const request = this.createAuthRequest('/auth/magic-link', 'POST', {
      email,
    });
    const result = await this.auth.handler(request);
    return result.json();
  }

  async registerPasskey(
    sessionToken: string,
    email: string,
  ): Promise<AuthResponse> {
    const request = this.createAuthRequest(
      '/auth/passkey/register',
      'POST',
      { email },
      { Authorization: `Bearer ${sessionToken}` },
    );
    const result = await this.auth.handler(request);
    return result.json();
  }

  async authenticatePasskey(credential: any): Promise<AuthResponse> {
    const request = this.createAuthRequest(
      '/auth/passkey/authenticate',
      'POST',
      { credential },
    );
    const result = await this.auth.handler(request);
    return result.json();
  }
}
