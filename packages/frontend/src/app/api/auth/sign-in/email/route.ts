import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received sign-in request for:', body.email);
    
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      const host = request.headers.get('host')?.split(':')[0] || 'localhost';
      backendUrl = `http://${host}:3000`;
      console.log(`Using derived backend URL: ${backendUrl}`);
    }
    
    console.log(`Sending sign-in request to backend: ${backendUrl}/api/auth/sign-in/email`);
    
    const response = await fetch(`${backendUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        callbackURL: body.callbackURL || '/',
        rememberMe: body.rememberMe || true
      }),
      credentials: 'include',
    }).catch(err => {
      console.error('Network error connecting to backend:', err);
      throw new Error('Cannot connect to authentication server');
    });

    if (!response.ok) {
      console.error(`Backend returned error status: ${response.status}`);
      const errorData = await response.json().catch(() => ({
        error: { message: `Authentication failed with status ${response.status}` }
      }));
      
      return NextResponse.json(
        { error: errorData.error || { message: 'Authentication failed' } },
        { status: response.status }
      );
    }

    const data = await response.json().catch(err => {
      console.error('Error parsing login response:', err);
      throw new Error('Invalid response from authentication server');
    });
    
    console.log('Login successful, setting cookies');
    console.log('Session data:', JSON.stringify(data.session));
    
    // Create a response with the session data
    const nextResponse = NextResponse.json(data);
    
    // Make sure we set the session token cookie
    if (data.session?.token) {
      console.log('Setting session cookie with token:', data.session.token.substring(0, 5) + '...');
      nextResponse.cookies.set('session_token', data.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    } else {
      console.warn('No session token found in login response');
    }
    
    return nextResponse;
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Unknown error" } },
      { status: 500 }
    );
  }
}
