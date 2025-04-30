import { createAuthClient } from 'better-auth/react'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'

export interface User {
  id: string
  name?: string
  email: string
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
  image?: string | null
}

export interface Session {
  user: User
  session: {
    id: string
    createdAt: Date
    updatedAt: Date
    expiresAt: Date
    userId: string
    userAgent?: string
  }
}

// Create the server-side auth instance
export const auth = betterAuth({
  appName: 'Better Auth Demo',
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [nextCookies()],
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000',
  fetchOptions: {
    credentials: 'include',
  }
})

// Create the client-side auth instance
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3000',
  fetchOptions: {
    credentials: 'include',
    onError(e) {
      console.error('Auth error:', e);
    },
  },
})
