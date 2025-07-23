import { NextRequest } from 'next/server';
import { initializeFirebaseAdmin } from './firebaseAdmin';

/**
 * Verifies the Firebase ID token from an incoming request.
 * @param request The NextRequest object.
 * @returns The UID of the authenticated user, or null if authentication fails.
 */
export async function verifyAuth(request: NextRequest): Promise<string | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  try {
    const firebaseAdmin = initializeFirebaseAdmin();
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying Firebase ID token in verifyAuth:', error);
    return null;
  }
}
