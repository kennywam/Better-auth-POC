'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [testToken, setTestToken] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Function to verify email with token
  const verifyEmail = useCallback(async (verificationToken: string) => {
    try {
      setStatus('loading');
      setMessage('Verifying your email...');
      
      toast.promise(
        async () => {
          console.log(`Verifying email with token: ${verificationToken}`);
          
          // Use our custom API endpoint to verify the email
          const response = await fetch(`/api/auth/verify-email/${verificationToken}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Email verification failed');
          }
          
          const data = await response.json();
          
          if (!data || data.error) {
            console.error('Verification error:', data?.error || 'Unknown error');
            throw new Error(data?.error?.message || 'Email verification failed');
          }
          
          if (!data) {
            throw new Error('No data returned from verification');
          }
          
          console.log('Verification successful:', data);
          
          // Clear the pending verification email from localStorage
          localStorage.removeItem('pendingVerificationEmail');
          
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          
          // Better Auth should automatically sign in the user after verification
          // if autoSignInAfterVerification is enabled
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          
          return data;
        },
        {
          loading: 'Verifying your email address...',
          success: 'Email verified successfully!',
          error: (err) => err.message || 'Failed to verify email'
        }
      );
    } catch (error) {
      console.error('Error verifying email:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again later.');
      toast.error('Verification failed');
    }
  }, [router]);

  // Use effect to verify email when token is available
  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
    
    // Get the email from localStorage if available
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    if (storedEmail) {
      setUserEmail(storedEmail);
      // Generate a test token for development purposes
      setTestToken(`test-token-${Date.now()}`);
    }
  }, [token, verifyEmail]);

  // Function to resend verification email
  const resendVerification = useCallback(async () => {
    try {
      setStatus('loading');
      setMessage('Sending verification email...');
      
      const email = localStorage.getItem('pendingVerificationEmail') || '';
      if (!email) {
        setStatus('error');
        setMessage('No email address found for verification. Please try logging in again.');
        toast.error('No email address found for verification');
        return;
      }
      
      toast.promise(
        async () => {
          const { error: apiError } = await authClient.sendVerificationEmail({
            email,
            callbackURL: `${window.location.origin}/auth/verify-email`,
          });
          
          if (apiError) {
            throw new Error(apiError.message || 'Failed to send verification email');
          }
          
          // Generate a new test token
          const newTestToken = `test-token-${Date.now()}`;
          setTestToken(newTestToken);
          
          setStatus('idle');
          setMessage('Verification email has been sent. For testing purposes, you can use the link below.');
          return email;
        },
        {
          loading: 'Sending verification email...',
          success: (email) => `Verification email sent to ${email}`,
          error: (err) => {
            setStatus('error');
            setMessage(err.message || 'Failed to send verification email');
            return err.message || 'Failed to send verification email';
          }
        }
      );
    } catch (error) {
      console.error('Error sending verification email:', error);
      setStatus('error');
      setMessage('Failed to send verification email. Please try again later.');
      toast.error('Failed to send verification email');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[90%] max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            {status === 'idle' && !token && 'Please verify your email address to continue'}
            {status === 'loading' && 'Processing...'}
            {status === 'success' && 'Verification Successful'}
            {status === 'error' && 'Verification Failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {status === 'loading' && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
            <p className="mt-4">{message}</p>
            
            {/* Display user email if available */}
            {userEmail && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">Email: <strong>{userEmail}</strong></p>
              </div>
            )}
            
            {/* Display test verification link for development */}
            {testToken && status !== 'success' && (
              <div className="mt-6 p-4 border border-dashed border-amber-300 rounded-md bg-amber-50">
                <p className="text-sm font-medium text-amber-800 mb-2">Test Verification Link (Development Only)</p>
                <div className="relative">
                  <Input 
                    value={`${window.location.origin}/auth/verify-email?token=${testToken}`}
                    readOnly
                    className="pr-20 text-xs bg-white"
                  />
                  <Button 
                    className="absolute right-0 top-0 h-full px-3 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/auth/verify-email?token=${testToken}`);
                      toast.success('Verification link copied to clipboard');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-amber-700 mt-2">Click the link above or copy it to test verification without email</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === 'error' && (
            <Button onClick={resendVerification} disabled={false}>
              Resend Verification Email
            </Button>
          )}
          {status === 'success' && (
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          )}
          {status === 'idle' && !token && (
            <Button onClick={resendVerification} disabled={false}>
              Send Verification Email
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
