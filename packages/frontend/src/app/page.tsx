'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/auth";
import { signOut } from "@/lib/api";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        // Try to get the session using our direct session endpoint for more reliability
        const response = await fetch('/api/auth/direct-session', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store'
        });
        
        const sessionData = await response.json();
        
        if (sessionData && sessionData.user) {
          console.log('User is logged in, redirecting to dashboard');
          setUser(sessionData.user);
          // Redirect to dashboard if user is logged in
          router.push('/dashboard');
          return; // Exit early
        }
        
        // If direct session check fails, try the backup token
        const backupToken = localStorage.getItem('session_token_backup');
        if (backupToken) {
          console.log('Found backup token, trying to restore session');
          try {
            const backupResponse = await fetch('/api/auth/manual-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: backupToken }),
              credentials: 'include',
            });
            
            const backupData = await backupResponse.json();
            if (backupData && backupData.user) {
              console.log('Session restored from backup token, redirecting to dashboard');
              setUser(backupData.user);
              router.push('/dashboard');
              return; // Exit early
            }
          } catch (backupError) {
            console.error('Failed to restore session from backup token:', backupError);
          }
        }
        
        // If we get here, user is not logged in
        console.log('User is not logged in, showing home page');
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
      const success = await signOut();
      if (success) {
        setUser(null);
        window.location.reload();
      }
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
