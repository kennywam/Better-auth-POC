import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    
    console.log(`Frontend API: Verifying email with token: ${token}`);
    console.log(`Using backend URL: ${backendUrl}`);
    
    // Forward the verification request to the backend
    const response = await fetch(`${backendUrl}/api/auth/verify-email/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });
    
    // Extract cookies before potentially failing on JSON parsing
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        responseHeaders.append(key, value);
        console.log(`Received cookie from backend: ${key}`);
      }
    });
    
    // Try to parse the JSON response
    let data;
    try {
      data = await response.json();
      console.log('Email verification response data:', data);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      data = { error: 'Invalid response from server', status: false };
    }
    
    // Return the result
    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify email',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: false
      },
      { status: 500 }
    );
  }
}
