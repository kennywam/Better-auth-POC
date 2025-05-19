import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get the session token from cookies
    const cookieHeader = request.headers.get('cookie');
    const cookies = cookieHeader ? Object.fromEntries(
      cookieHeader.split(';').map(cookie => {
        const [key, value] = cookie.trim().split('=');
        return [key, value];
      })
    ) : {};
    
    const sessionToken = cookies.session_token;
    
    if (!sessionToken) {
      console.log('No session token found in cookies');
      return NextResponse.json({ user: null, session: null });
    }
    
    console.log('Session token found:', sessionToken.substring(0, 5) + '...');
    
    const backendUrl = 'http://localhost:3000';
    console.log(`Fetching direct session from backend: ${backendUrl}/api/auth/direct-session`);
    
    // Try both with and without Bearer prefix to maximize chances of success
    const response = await fetch(`${backendUrl}/api/auth/direct-session`, {
      method: 'GET',
      headers: {
        'Authorization': sessionToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    }).catch(err => {
      console.error(`Network error fetching session: ${err.message}`);
      throw new Error(`Failed to connect to backend server: ${err.message}`);
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      console.error(`Backend session request failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { user: null, session: null, error: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json().catch(err => {
      console.error(`Error parsing session response: ${err.message}`);
      throw new Error('Invalid response from backend server');
    });
    
    console.log('Direct session data from backend:', JSON.stringify(data));
    
    if (!data || !data.user) {
      console.log('No user found in direct session response');
      return NextResponse.json({ user: null, session: null });
    }
    
    const nextResponse = NextResponse.json(data);
    
    if (data.session?.token && data.session.token !== sessionToken) {
      console.log('Updating session token cookie');
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
    console.error('Error fetching direct session:', error);
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
