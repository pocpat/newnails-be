import { NextRequest } from 'next/server';
import { initializeFirebaseAdmin } from './firebaseAdmin';

/**
 * Verifies the Firebase ID token from an incoming request.
 * @param request The NextRequest object.
 * @returns The UID of the authenticated user, or null if authentication fails.
 */
export async function verifyAuth(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  console.log('Auth: Received Authorization Header:', authHeader);

  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    console.log('Auth: No token found in Authorization header.');
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
