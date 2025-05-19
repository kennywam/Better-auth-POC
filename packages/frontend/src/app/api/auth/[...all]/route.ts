import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    console.log('Getting session...');
    const session = await auth.api.getSession({
      headers: request.headers
    });
    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;
    console.log('API Path:', path);
    
    if (path.endsWith('/api/auth/sign-up/email')) {
      const body = await request.json();
      console.log('Sign-up request body:', body);
      
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        console.log(`Forwarding to backend: ${backendUrl}/auth/register`);
        
        const response = await fetch(`${backendUrl}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: body.email,
            password: body.password,
            name: body.name || '',
          }),
        });

        const data = await response.json();
        console.log('Backend response:', data);
        
        if (!response.ok) {
          return NextResponse.json({ error: data.message || 'Registration failed' }, { status: response.status });
        }

        // Use Better Auth to create a session
        const signUpResult = await auth.api.signUpEmail({
          body: {
            email: body.email,
            password: body.password,
            name: body.name,
          },
          headers: request.headers,
        });

        return NextResponse.json(signUpResult);
      } catch (error) {
        console.error('Sign-up error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Unknown error" },
          { status: 500 }
        );
      }
    }
    else if (path.endsWith('/api/auth/sign-in/email')) {
      const body = await request.json();
      console.log('Sign-in request body:', body);
      
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        console.log(`Forwarding to backend: ${backendUrl}/auth/login`);
        
        const response = await fetch(`${backendUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: body.email,
            password: body.password,
          }),
          credentials: 'include',
        });

        const data = await response.json();
        console.log('Backend response:', data);
        
        if (!response.ok) {
          return NextResponse.json({ error: data.message || 'Login failed' }, { status: response.status });
        }

        // Use Better Auth to create a session
        const signInResult = await auth.api.signInEmail({
          body: {
            email: body.email,
            password: body.password,
          },
          headers: request.headers,
        });

        return NextResponse.json(signInResult);
      } catch (error) {
        console.error('Sign-in error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Unknown error" },
          { status: 500 }
        );
      }
    }
    else {
      const body = await request.json();
      const { action } = body;

      switch (action) {
        case 'signIn':
          const signInResult = await auth.api.signInEmail({
            body: body.credentials,
            headers: request.headers,
            asResponse: true
          });
          return NextResponse.json(signInResult);
        case 'signUp':
          const signUpResult = await auth.api.signUpEmail({
            body: body.credentials,
            headers: request.headers,
            asResponse: true
          });
          return NextResponse.json(signUpResult);
        case 'signOut':
          const signOutResult = await auth.api.signOut({
            headers: request.headers,
            asResponse: true
          });
          return NextResponse.json(signOutResult);
        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
