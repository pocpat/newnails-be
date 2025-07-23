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
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const isProtectedRoute = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedRoute && !token) {
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
