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
  } catch (error: any) {
    console.error('Error verifying Firebase ID token in verifyAuth:', error);
    if (error.message.includes('Firebase environment variables')) {
        console.error('################################################################');
        console.error('## CRITICAL: Firebase environment variables are not set in the Vercel deployment.');
        console.error('## Please add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to your Vercel project settings.');
        console.error('################################################################');
    }
    return null;
  }
}
