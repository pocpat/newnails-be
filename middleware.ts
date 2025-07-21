import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';

export async function middleware(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    // Allow access to public routes, e.g., /api/generate if it doesn't require auth
    // For now, we'll redirect to a login or return unauthorized for protected routes
    if (request.nextUrl.pathname.startsWith('/api/my-designs') ||
        request.nextUrl.pathname.startsWith('/api/save-design') ||
        request.nextUrl.pathname.slice(0, request.nextUrl.pathname.lastIndexOf('/')).startsWith('/api/designs')) { // Adjusted path check
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return NextResponse.next();
  }

  let auth: admin.auth.Auth;
  try {
    ({ auth } = (await import('./src/lib/firebaseAdmin')).initializeFirebaseAdmin());
    const decodedToken = await auth.verifyIdToken(token);
    // You can attach the decodedToken to the request if needed for later use in API routes
    // For example, by setting a custom header or using a context object if available in Next.js middleware
    // For now, just verifying the token is enough to allow the request to proceed.
    return NextResponse.next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
}

export const config = {
  matcher: [
    '/api/my-designs/:path*',
    '/api/save-design/:path*',
    '/api/designs/:path*',
    '/api/generate/:path*',
    // Add other protected API routes here
  ],
};
