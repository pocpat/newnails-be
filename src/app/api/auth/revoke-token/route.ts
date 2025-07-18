import { NextResponse } from 'next/server';

// This forces the route to be rendered dynamically, preventing build-time errors.
export const dynamic = 'force-dynamic';

/**
 * API route to revoke a user's refresh tokens, effectively signing them out from all devices.
 * It expects a POST request with a 'uid' in the request body.
 */
export async function POST(req: Request) {
  try {
    // Lazy import firebaseAdmin to avoid issues during build time
    const { auth } = (await import('@/lib/firebaseAdmin')).initializeFirebaseAdmin();

    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User UID is required.' }, { status: 400 });
    }

    await auth.revokeRefreshTokens(uid);

    return NextResponse.json({ message: `Refresh tokens revoked for user ${uid}.` });
  } catch (error: unknown) {
    console.error('Error revoking refresh tokens:', error);
    return NextResponse.json(
      {
        error: 'Failed to revoke refresh tokens.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

