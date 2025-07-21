import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';


/**
 * API route for testing Firebase authentication.
 * It expects a POST request with a Firebase ID token in the Authorization header.
 * It verifies the token and returns the decoded user data on success.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header is missing or invalid.' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Firebase ID token is missing.' }, { status: 401 });
    }

    // Lazy import firebaseAdmin to avoid issues during build time
    const admin = (await import('@/lib/firebaseAdmin')).default;
    const auth = admin.auth();
    const decodedToken = await auth.verifyIdToken(idToken);

    // If the token is valid, return the user's UID and email.
    return NextResponse.json({ uid: decodedToken.uid, email: decodedToken.email });

  } catch (error: unknown) {
    console.error('Authentication test failed:', error);
    return NextResponse.json({
       error: 'Invalid or expired Firebase ID token.', 
       details: error instanceof Error ? error.message : String(error),}, { status: 403 });
  }
}
