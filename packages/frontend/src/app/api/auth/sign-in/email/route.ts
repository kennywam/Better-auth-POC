import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/auth/login`, {
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
