import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      console.log('No token provided in manual session request');
      return NextResponse.json({ user: null, session: null });
    }
    
    console.log('Manual session request with token:', token.substring(0, 5) + '...');
    
    const backendUrl = 'http://localhost:3000';
    console.log(`Fetching manual session from backend: ${backendUrl}/api/auth/direct-session`);
    
    const response = await fetch(`${backendUrl}/api/auth/direct-session`, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    }).catch(err => {
      console.error(`Network error fetching manual session: ${err.message}`);
      throw new Error(`Failed to connect to backend server: ${err.message}`);
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      console.error(`Backend manual session request failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { user: null, session: null, error: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json().catch(err => {
      console.error(`Error parsing manual session response: ${err.message}`);
      throw new Error('Invalid response from backend server');
    });
    
    console.log('Manual session data from backend:', JSON.stringify(data));
    
    if (!data || !data.user) {
      console.log('No user found in manual session response');
      return NextResponse.json({ user: null, session: null });
    }
    
    const nextResponse = NextResponse.json(data);
    
    // Set the session token in the cookie
    if (data.session?.token) {
      console.log('Setting session token cookie from manual session');
      nextResponse.cookies.set('session_token', data.session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
    
    return nextResponse;
  } catch (error) {
    console.error('Error handling manual session:', error);
    return NextResponse.json(
      { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
