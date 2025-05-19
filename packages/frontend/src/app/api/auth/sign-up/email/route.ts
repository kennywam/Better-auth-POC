import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/auth/register`, {
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
    
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Registration failed' }, { status: response.status });
    }

    // Use Better Auth to create a session
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: body.email,
        password: body.password,
        name: body.name,
        // Handle callbackURL separately if needed
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
