import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';

// A list of all API routes that require authentication.
const protectedPaths = [
  '/api/my-designs',
  '/api/save-design',
  '/api/designs',
  '/api/generate',
];

export async function middleware(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  console.log('Middleware: Received token:', token ? 'Token present' : 'Token missing');

  const isProtectedRoute = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  // If the route is not protected, allow the request to continue.
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // If the route is protected and there is no token, deny access.
  if (!token) {
    console.log('Middleware: Access denied. No token for protected route.');
    return new NextResponse('Authorization token is required.', { status: 401 });
  }

  try {
    const firebaseAdminApp = (await import('./src/lib/firebaseAdmin')).initializeFirebaseAdmin();
    const decodedToken = await firebaseAdminApp.auth().verifyIdToken(token);

    // Token is valid. Attach user's UID to the request headers
    // so our API routes can access it.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decodedToken.uid);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
}

export const config = {
  matcher: [
    /*
     * Match all API routes except for the ones that start with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/api/:path*',
  ],
};
