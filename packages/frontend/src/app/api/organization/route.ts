import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get the session token from cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionToken = cookieHeader
      .split('; ')
      .find(row => row.startsWith('session_token='))
      ?.split('=')[1];

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Forward the request to our backend service to get organization data
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/protected/organization`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch organization data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching organization data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
