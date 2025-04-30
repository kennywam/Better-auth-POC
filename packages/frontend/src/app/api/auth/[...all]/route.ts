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
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
