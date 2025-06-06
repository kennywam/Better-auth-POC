import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { passkey } from 'better-auth/plugins/passkey';
import { magicLink } from 'better-auth/plugins';
import { SessionStore } from './session.store';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthMiddleware } from './auth.middleware';
import { ProtectedController } from './protected.controller';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { OrganizationsService } from '../core/organizations/organizations.service';

@Module({
  providers: [
    SessionStore,
    {
      provide: 'BETTER_AUTH',
      useFactory: (prisma: PrismaService, organizationsService: OrganizationsService) => {
        return betterAuth({
          database: prismaAdapter(prisma, {
            provider: 'postgresql',
          }),
          databaseHooks: {
            user: {
              create: {
                after: async (user) => {
                  try {
                    console.log('After create user hook:', user);
                    // Create a default organization for the user
                    const organization = await organizationsService.createDefaultOrganization(user.name || 'User');
                    console.log('Created organization:', organization);
                    
                    // Update the user with the organization ID
                    await prisma.user.update({
                      where: { id: user.id },
                      data: { organizationId: organization.id }
                    });
                    
                    console.log('Updated user with organization ID');
                  } catch (error) {
                    console.error('Error in afterCreateUser hook:', error);
                  }
                }
              }
            }
          },
          emailAndPassword: {
            enabled: true,
            minPasswordLength: 8,
            requireEmailVerification: true,
          },
          emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            sendVerificationEmail: async ({ user, url, token }, request) => {
              // In a production environment, you would send an actual email
              console.log('Verification email details:', {
                to: user.email,
                subject: 'Verify your email address',
                verificationUrl: url,
                verificationToken: token
              });
              
              // For development, log the verification URL
              console.log(`Development verification URL: ${url}`);
              console.log(`Development verification token: ${token}`);
            }
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
      inject: [PrismaService, OrganizationsService],
    },
    PrismaService,
    OrganizationsService,
    AuthService,
  ],
  controllers: [AuthController, ProtectedController],
  exports: ['BETTER_AUTH', AuthService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply auth middleware to protected routes, but NOT to the session endpoint
    consumer
      .apply(AuthMiddleware)
      .forRoutes('api/auth/sign-out', 'api/protected');
  }
}
