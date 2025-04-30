'use client';

import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/auth";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data && !('error' in data)) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to get session:', error);
      }
    };
    checkSession();
  }, []);

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
