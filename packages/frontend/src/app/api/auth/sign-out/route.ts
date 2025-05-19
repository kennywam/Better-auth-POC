import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log('Processing sign-out request');
    
    const cookieHeader = request.headers.get('cookie');
    const cookies = cookieHeader ? Object.fromEntries(
      cookieHeader.split(';').map(cookie => {
        const [key, value] = cookie.trim().split('=');
        return [key, value];
      })
    ) : {};
    
    const sessionToken = cookies.session_token;
    
    if (!sessionToken) {
      console.log('No session token found in cookies, nothing to sign out');
      return NextResponse.json({ success: true });
    }
    
    console.log('Found session token, sending sign-out request to backend');
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/sign-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
      });
      
      console.log('Backend sign-out response status:', response.status);
    } catch (backendError) {
      console.error('Error calling backend sign-out endpoint:', backendError);
    }
    
    console.log('Clearing session token backup from localStorage');
    
    const response = NextResponse.json({ success: true });
    
    response.cookies.delete('session_token');
    
    console.log('Sign-out successful');
    return response;
  } catch (error) {
    console.error('Sign-out error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
