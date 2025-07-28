import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// A list of all API routes that require authentication.
const protectedPaths = [
  '/api/my-designs',
  '/api/save-design',
  '/api/designs',
  '/api/generate',
];

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  console.log('Middleware: Authorization Header:', authHeader);
  const token = authHeader?.replace('Bearer ', '');
  console.log('Middleware: Extracted Token:', token ? 'Token present' : 'Token missing');

  console.log('Incoming Headers:', request.headers);
  if (isProtectedRoute && !token) {
    console.log('Auth: No token found in Authorization header.');
    return new NextResponse('Authorization token is required.', { status: 401 });
  }

  return NextResponse.next();
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
