import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session_token')?.value;
    
    if (!sessionToken) {
      console.log('No session token found in cookies');
      return NextResponse.json({ user: null, session: null });
    }
    
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      const host = request.headers.get('host')?.split(':')[0] || 'localhost';
      backendUrl = `http://${host}:3000`;
      console.log(`Using derived backend URL: ${backendUrl}`);
    }
    
    console.log(`Fetching session from backend: ${backendUrl}/api/auth/session`);
    
    const response = await fetch(`${backendUrl}/api/auth/session`, {
      headers: {
        'Cookie': `session_token=${sessionToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }).catch(err => {
      console.error(`Network error fetching session: ${err.message}`);
      throw new Error(`Failed to connect to backend server: ${err.message}`);
    });
    
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
    
    console.log('Session data from backend:', data);
    
    if (!data || !data.user) {
      console.log('No user found in session response');
      return NextResponse.json({ user: null, session: null });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { 
        user: null, 
        session: null, 
        error: error instanceof Error ? error.message : 'Failed to fetch session' 
      },
      { status: 500 }
    );
  }
}
