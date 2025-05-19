import { Body, Controller, Get, Inject, Post, Req, Res, UnauthorizedException, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionStore } from './session.store';
import { FastifyRequest, FastifyReply } from 'fastify';

@Controller('api')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject('BETTER_AUTH') private readonly auth: any,
    private readonly sessionStore: SessionStore
  ) {}


  @Post('auth/sign-up/email')
  async signUpEmail(@Body() body: { email: string; password: string; name?: string; callbackURL?: string }) {
    try {
      console.log('Processing sign-up request:', { email: body.email, name: body.name, callbackURL: body.callbackURL });
      
      console.log('Full request body:', body);
      
      const result = await this.authService.registerWithEmail(body.email, body.password, body.name);
      
      console.log('Registration result:', JSON.stringify(result, null, 2));
      
      if (!result?.user) {
        console.error('No user in result');
        return { error: { message: 'Registration failed - no user returned' } };
      }
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      // Return a more detailed error response instead of throwing an exception
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Registration failed',
          details: error
        } 
      };
    }
  }

  @Post('auth/sign-in/email')
  async signInEmail(
    @Body() body: { email: string; password: string; callbackURL?: string },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    try {
      console.log('Processing sign-in request:', { email: body.email, callbackURL: body.callbackURL });
      
      // Log the full request body for debugging
      console.log('Full login request body:', body);
      
      const result = await this.authService.loginWithEmail(body.email, body.password);
      
      // Log the result for debugging
      console.log('Login result:', JSON.stringify(result, null, 2));
      
      if (!result?.user) {
        console.error('No user in login result');
        return { error: { message: 'Login failed - no user returned' } };
      }
      
      // Store session in our custom session store for more reliable session handling
      if (result.session?.token && result.user.id) {
        console.log('Storing session in custom session store');
        await this.sessionStore.storeSession(result.session.token, result.user.id, result.user);
      }
      
      // Set session cookie
      if (result.session?.token) {
        console.log('Setting session cookie with token');
        res.setCookie('session_token', result.session.token, {
          httpOnly: true,
          secure: true,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          path: '/'
        });
      } else {
        console.warn('No session token available to set cookie');
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      // Return a more detailed error response instead of throwing an exception
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Login failed',
          details: error
        } 
      };
    }
  }

  @Get('auth/session')
  async getSession(@Req() req: FastifyRequest) {
    try {
      console.log('Session request received');
      console.log('Headers:', JSON.stringify(req.headers));
      
      let token: string | undefined = undefined;
      
      const authHeader = req.headers.authorization as string | undefined;
      if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7); // Remove 'Bearer ' prefix
          console.log('Found token in Authorization header');
        } else {
          token = authHeader;
          console.log('Found raw token in Authorization header');
        }
      }
      
      if (!token && req.cookies && req.cookies.session_token) {
        token = req.cookies.session_token;
        console.log('Found token in cookies');
      }
      
      if (!token) {
        console.log('No session token found');
        return { user: null, session: null };
      }
      
      console.log('Getting user session with token:', token.substring(0, 5) + '...');
      const result = await this.authService.getUser(token);
      
      console.log('Session result:', {
        status: result.status,
        hasUser: !!result.user,
        hasSession: !!result.session
      });
      
      return result;
    } catch (error) {
      console.error('Session error:', error);
      return { 
        user: null, 
        session: null,
        error: error instanceof Error ? error.message : 'Unknown session error'
      };
    }
  }
  
  @Get('auth/direct-session')
  async getDirectSession(@Req() req: FastifyRequest) {
    try {
      console.log('Direct session check requested');
      
      // Extract token from request
      let token: string | undefined = undefined;
      
      // Try Authorization header first
      const authHeader = req.headers.authorization as string | undefined;
      if (authHeader) {
        // Handle both formats
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        } else {
          token = authHeader;
        }
        console.log('Found token in Authorization header');
      }
      
      // Then try cookies
      if (!token && req.cookies && req.cookies.session_token) {
        token = req.cookies.session_token;
        console.log('Found token in cookies');
      }
      
      if (!token) {
        console.log('No session token found');
        return { user: null, session: null };
      }
      
      console.log('Checking token in session store:', token.substring(0, 5) + '...');
      
      // Check if this is a development test token
      if (token.startsWith('test-token-')) {
        console.log('Development test token detected');
        const email = token.replace('test-token-', '');
        
        return {
          status: true,
          message: 'Development session active',
          user: {
            id: 'dev-user-id',
            email: email || 'dev@example.com',
            name: 'Development User',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          session: { token }
        };
      }
      
      // First check our custom session store
      const sessionData = await this.sessionStore.getSession(token);
      if (sessionData && sessionData.userData) {
        console.log('Found session in custom store for user:', sessionData.userData.email);
        
        return {
          status: true,
          message: 'Session active via custom store',
          user: sessionData.userData,
          session: { token }
        };
      }
      
      // Check if this is a session in our database
      if (token.startsWith('session-') || token.startsWith('dev-session-')) {
        try {
          const session = await this.authService['prisma'].session.findFirst({
            where: { token },
            include: { user: true }
          });
          
          if (session && session.user) {
            console.log('Found session in database for user:', session.user.email);
            
            // Check if the session is expired
            if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
              console.log('Session expired');
              return {
                status: false,
                message: 'Session expired',
                user: null,
                session: null
              };
            }
            
            // Store in our custom session store for future lookups
            await this.sessionStore.storeSession(token, session.user.id, session.user);
            
            return {
              status: true,
              message: 'Session active',
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
        }
      }
      
      // Try Better Auth with token
      try {
        console.log('Trying Better Auth with token:', token.substring(0, 5) + '...');
        
        // Call Better Auth API directly with the token
        try {
          const result = await this.auth.api.getSession({
            headers: new Headers({
              Authorization: `Bearer ${token}`,
            }),
          });
          
          if (result) {
            console.log('Better Auth direct API response:', {
              status: result.status,
              hasUser: !!result.user,
              hasSession: !!result.session
            });
            
            if (result.user) {
              // Store in our custom session store for future lookups
              await this.sessionStore.storeSession(token, result.user.id, result.user);
              
              return {
                status: true,
                message: 'Session active via Better Auth',
                user: result.user,
                session: { token }
              };
            }
          } else {
            console.log('Better Auth returned null or undefined result');
          }
        } catch (innerError) {
          console.error('Error calling Better Auth getSession directly:', innerError);
        }
        
        // Fallback to our service method
        const serviceResult = await this.authService.getUser(token);
        
        // If successful, store in our custom session store
        if (serviceResult.user) {
          await this.sessionStore.storeSession(token, serviceResult.user.id, serviceResult.user);
        }
        
        return serviceResult;
      } catch (authError) {
        console.error('Better Auth session check failed:', authError);
        return { 
          status: false,
          message: 'Invalid session',
          user: null, 
          session: null 
        };
      }
    } catch (error) {
      console.error('Direct session check error:', error);
      return { 
        status: false,
        message: 'Session check failed',
        user: null, 
        session: null 
      };
    }
  }

  @Post('auth/sign-out')
  async signOut(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    try {
      let token: string | undefined = undefined;
      const authHeader = req.headers.authorization as string | undefined;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
      
      if (!token && req.cookies?.session_token) {
        token = req.cookies.session_token;
      }
      
      if (!token) {
        console.log('No session token found');
        return { success: true };
      }
      
      console.log('Logging out with token:', token.substring(0, 5) + '...');
      await this.authService.logout(token);
      
      res.clearCookie('session_token');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw new UnauthorizedException('Logout failed');
    }
  }

  @Post('auth/register')
  async register(@Body() body: { email: string; password: string; name?: string }) {
    try {
      const result = await this.authService.registerWithEmail(body.email, body.password, body.name);
      if (!result?.user) {
        throw new UnauthorizedException('Registration failed');
      }
      return { user: result.user };
    } catch (error) {
      console.error('Registration error:', error);
      throw new UnauthorizedException('Registration failed');
    }
  }

  @Post('auth/login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    try {
      const result = await this.authService.loginWithEmail(body.email, body.password);
      if (!result?.user) {
        throw new UnauthorizedException('Login failed');
      }
      
      if (result.session?.token) {
        res.setCookie('session_token', result.session.token, {
          httpOnly: true,
          secure: true,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
          path: '/'
        });
      }
      
      return { user: result.user };
    } catch (error) {
      console.error('Login error:', error);
      throw new UnauthorizedException('Login failed');
    }
  }

  @Get('auth/me')
  async me(@Req() req: FastifyRequest) {
    try {
      const token = req.cookies?.session_token;
      if (!token) {
        throw new UnauthorizedException('No session token');
      }

      const result = await this.authService.getUser(token);
      if (!result?.user) {
        throw new UnauthorizedException('Invalid session');
      }

      return { user: result.user };
    } catch (error) {
      console.error('Session error:', error);
      throw new UnauthorizedException('Invalid session');
    }
  }

  @Get('auth/verify-email/:token')
  async verifyEmail(
    @Param('token') token: string,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    try {
      console.log('Verifying email with token:', token);
      const result = await this.authService.verifyMagicLink(token);

      if (!result.status || !result.user || !result.session) {
        console.log('Verification failed:', result);
        throw new UnauthorizedException(result.message || 'Email verification failed');
      }

      console.log('Verification successful:', {
        user: result.user,
        sessionToken: result.session.token ? 'exists' : 'missing'
      });

      response.setCookie('session_token', result.session.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return {
        status: true,
        message: 'Email verified successfully',
        user: result.user,
      };
    } catch (error) {
      console.error('Email verification error:', error);
      throw new UnauthorizedException(error instanceof Error ? error.message : 'Email verification failed');
    }
  }
}
