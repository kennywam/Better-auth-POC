'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/auth";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data && !('error' in data) && data.user) {
          setUser(data.user);
          // Redirect to dashboard if user is logged in
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'signOut' }),
      });
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[90%] max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Better Auth Demo</CardTitle>
          <CardDescription className="text-center">
            {user ? `Welcome, ${user.name || user.email}!` : 'Test our authentication system'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Logged in as: {user.email}</p>
              </div>
              <Button
                className="w-full"
                size="lg"
                variant="destructive"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                className="w-full"
                size="lg"
                variant="default"
                onClick={() => window.location.href = '/auth/login'}
              >
                Login
              </Button>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => window.location.href = '/auth/register'}
              >
                Register
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
