import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    try {
      const result = await this.authService.registerWithEmail(body.email, body.password);
      if (!result?.user) {
        throw new UnauthorizedException('Registration failed');
      }
      return { user: result.user };
    } catch (error) {
      throw new UnauthorizedException('Registration failed');
    }
  }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.loginWithEmail(body.email, body.password);
      if (!result?.user) {
        throw new UnauthorizedException('Login failed');
      }
      
      // Set session cookie
      if (result.session?.token) {
        res.cookie('session_token', result.session.token, {
          httpOnly: true,
          secure: true,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });
      }
      
      return { user: result.user };
    } catch (error) {
      throw new UnauthorizedException('Login failed');
    }
  }

  @Get('me')
  async me(@Req() req: Request) {
    try {
      const token = req.cookies['session_token'];
      if (!token) {
        throw new UnauthorizedException('No session token');
      }

      const result = await this.authService.getUser(token);
      if (!result?.user) {
        throw new UnauthorizedException('Invalid session');
      }

      return { user: result.user };
    } catch (error) {
      throw new UnauthorizedException('Invalid session');
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const token = req.cookies['session_token'];
      if (token) {
        await this.authService.logout(token);
      }
      res.clearCookie('session_token');
      return { success: true };
    } catch (error) {
      throw new UnauthorizedException('Logout failed');
    }
  }

  @Post('magic-link/send')
  async sendMagicLink(@Body() body: { email: string }) {
    try {
      const result = await this.authService.sendMagicLink(body.email);
      return { success: true, message: 'Magic link sent' };
    } catch (error) {
      throw new UnauthorizedException('Failed to send magic link');
    }
  }

  @Post('magic-link/verify')
  async verifyMagicLink(
    @Body() body: { token: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.verifyMagicLink(body.token);
      if (!result?.user) {
        throw new UnauthorizedException('Invalid magic link');
      }

      // Set session cookie
      if (result.session?.token) {
        res.cookie('session_token', result.session.token, {
          httpOnly: true,
          secure: true,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });
      }

      return { user: result.user };
    } catch (error) {
      throw new UnauthorizedException('Invalid magic link');
    }
  }

  @Post('passkey/register')
  async registerPasskey(
    @Req() req: Request,
    @Body() body: { email: string },
  ) {
    try {
      const token = req.cookies['session_token'];
      if (!token) {
        throw new UnauthorizedException('No session token');
      }

      const result = await this.authService.registerPasskey(token, body.email);
      return result;
    } catch (error) {
      throw new UnauthorizedException('Passkey registration failed');
    }
  }

  @Post('passkey/authenticate')
  async authenticatePasskey(
    @Body() body: { credential: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const result = await this.authService.authenticatePasskey(body.credential);
      if (!result?.user) {
        throw new UnauthorizedException('Passkey authentication failed');
      }

      // Set session cookie
      if (result.session?.token) {
        res.cookie('session_token', result.session.token, {
          httpOnly: true,
          secure: true,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });
      }

      return { user: result.user };
    } catch (error) {
      throw new UnauthorizedException('Passkey authentication failed');
    }
  }
}
