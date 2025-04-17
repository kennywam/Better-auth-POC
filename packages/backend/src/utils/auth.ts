import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { passkey } from 'better-auth/plugins/passkey';
import { magicLink } from 'better-auth/plugins';

const prisma = new PrismaClient();
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  // socialProviders: {
  //     google: {
  //         enabled: true,
  //         clientId: process.env.GOOGLE_CLIENT_ID,
  //         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  //     },
  //     ...other providers
  // },
  plugins: [
    passkey(),
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        // send email
      },
    }),
  ],
});
