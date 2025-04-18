import { Module } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { passkey } from 'better-auth/plugins/passkey';
import { magicLink } from 'better-auth/plugins';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [
    {
      provide: 'BETTER_AUTH',
      useFactory: (prisma: PrismaService) => {
        return betterAuth({
          database: prismaAdapter(prisma, {
            provider: 'postgresql',
          }),
          emailAndPassword: {
            enabled: true,
            minPasswordLength: 8,
            requireEmailVerification: true,
          },
          jwt: {
            secret: process.env.JWT_SECRET || 'your-secret-key',
            expiresIn: 604800, // 7 days in seconds
          },
          plugins: [
            passkey({
              rpName: 'Your App Name',
              rpID: process.env.APP_DOMAIN || 'localhost',
              origin: process.env.APP_URL || 'http://localhost:3000',
            }),
            magicLink({
              sendMagicLink: async ({ email, token, url }) => {
                // TODO: Implement email sending logic here
                console.log('Magic link:', { email, token, url });
              },
              expiresIn: 900, // 15 minutes in seconds
            }),
          ],
        });
      },
      inject: [PrismaService],
    },
    PrismaService,
    AuthService,
  ],
  controllers: [AuthController],
  exports: ['BETTER_AUTH'],
})
export class AuthModule {}
