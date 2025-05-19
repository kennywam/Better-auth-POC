'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { User } from '@/lib/auth'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [organization, setOrganization] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const data = await response.json()

        if (data && data.user) {
          setUser(data.user)
          // Fetch organization data
          try {
            const orgResponse = await fetch('/api/organization', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            const orgData = await orgResponse.json()
            if (orgData && !('error' in orgData)) {
              setOrganization(orgData)
            }
          } catch (error) {
            console.error('Failed to get organization:', error)
          }
        } else {
          // Redirect to login if not authenticated
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Failed to get session:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'signOut' }),
      })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-white shadow rounded-lg'>
          {/* Header */}
          <div className='px-6 py-5 border-b border-gray-200 flex items-center justify-between'>
            <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
            <Button
              variant='outline'
              onClick={() => router.push('/')}
            >
              Home
            </Button>
          </div>

          {/* User Profile Section */}
          <div className='px-6 py-6'>
            <Card>
              <CardHeader className='flex flex-row items-center gap-4'>
                <Avatar className='h-16 w-16'>
                  <AvatarImage
                    src={user?.image || ''}
                    alt={user?.name || ''}
                  />
                  <AvatarFallback>
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className='text-xl'>
                    {user?.name || 'User'}
                  </CardTitle>
                  <CardDescription>{user?.email}</CardDescription>
                  {user?.emailVerified && (
                    <Badge
                      className='mt-1'
                      variant='outline'
                    >
                      Email Verified
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <h3 className='text-sm font-medium text-gray-500'>
                      User ID
                    </h3>
                    <p className='mt-1 text-sm text-gray-900'>{user?.id}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-medium text-gray-500'>
                      Account Created
                    </h3>
                    <p className='mt-1 text-sm text-gray-900'>
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Organization Section */}
          <div className='px-6 py-6'>
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>Your organization details</CardDescription>
              </CardHeader>
              <CardContent>
                {organization ? (
                  <div className='space-y-4'>
                    <div>
                      <h3 className='text-sm font-medium text-gray-500'>
                        Name
                      </h3>
                      <p className='mt-1 text-sm text-gray-900'>
                        {organization.name}
                      </p>
                    </div>
                    {organization.description && (
                      <div>
                        <h3 className='text-sm font-medium text-gray-500'>
                          Description
                        </h3>
                        <p className='mt-1 text-sm text-gray-900'>
                          {organization.description}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className='text-sm text-gray-500'>
                    No organization information available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className='px-6 py-5 border-t border-gray-200'>
            <CardFooter className='flex justify-between'>
              <Button
                variant='outline'
                onClick={() => router.push('/settings')}
              >
                Account Settings
              </Button>
              <Button
                variant='destructive'
                onClick={handleLogout}
              >
                Logout
              </Button>
            </CardFooter>
          </div>
        </div>
      </div>
    </div>
  )
}
