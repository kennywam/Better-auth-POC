import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FastifyRequest, FastifyReply } from 'fastify';

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}


  @Post('auth/sign-up/email')
  async signUpEmail(@Body() body: { email: string; password: string; name?: string; callbackURL?: string }) {
    try {
      console.log('Processing sign-up request:', { email: body.email, name: body.name, callbackURL: body.callbackURL });
      
      // Log the full request body for debugging
      console.log('Full request body:', body);
      
      const result = await this.authService.registerWithEmail(body.email, body.password, body.name);
      
      // Log the result for debugging
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
      const token = req.cookies?.session_token;
      if (!token) {
        return { user: null, session: null };
      }

      const result = await this.authService.getUser(token);
      return result;
    } catch (error) {
      console.error('Session error:', error);
      return { user: null, session: null };
    }
  }
  
  @Post('auth/sign-out')
  async signOut(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    try {
      const token = req.cookies?.session_token;
      if (token) {
        await this.authService.logout(token);
      }
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
      
      // Set session cookie
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

      // Set session cookie
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
