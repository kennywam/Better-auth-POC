'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('Attempting login with:', { email, callbackURL: '/' })

      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          callbackURL: '/',
          rememberMe: true,
        }),
        credentials: 'include',
      })

      const result = await response.json()
      console.log('Login response:', result)

      if (result.error) {
        if (
          result.error.message === 'Email not verified' ||
          result.error.message?.includes('verify') ||
          result.error.code === 'EMAIL_NOT_VERIFIED'
        ) {
          localStorage.setItem('pendingVerificationEmail', email)
          router.push('/auth/verify-email')
          return
        }
        setError(result.error.message || 'Authentication failed')
      } else if (result.user) {
        console.log('Login successful:', result)

        // Explicitly check if email is verified
        if (result.user.emailVerified) {
          console.log('Login successful, user email is verified');
          
          // Store the session token in localStorage as a backup
          if (result.session?.token) {
            console.log('Storing session token in localStorage as backup');
            localStorage.setItem('session_token_backup', result.session.token);
          }
          
          // Redirect to dashboard immediately
          // The session cookie should already be set by the login response
          console.log('Redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('Email not verified, redirecting to verification page')
          localStorage.setItem('pendingVerificationEmail', email)
          router.push('/auth/verify-email')
        }
      } else {
        setError('Login failed - no user returned')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <Card className='w-[90%] max-w-md'>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className='space-y-4'
          >
            <div className='space-y-2'>
              <Input
                type='email'
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Input
                type='password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className='text-sm text-red-500'>{error}</div>}
            <Button
              type='submit'
              className='w-full'
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className='text-sm text-center'>
            Don&apos;t have an account?
            <Link
              href='/auth/register'
              className='text-blue-500 hover:underline'
            >
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
