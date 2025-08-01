import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// A list of all API routes that require authentication.
const protectedPaths = [
  '/api/my-designs',
  '/api/save-design',
  '/api/designs',
  '/api/generate',
];

// Set the allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173', // Web FE (local)
  'http://localhost:8081', // Mobile FE (local)
  // Add your production frontend URLs here when you have them
  // 'https://your-web-app.com',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false;

  // Handle Preflight (OPTIONS) requests
  if (request.method === 'OPTIONS') {
    if (isAllowedOrigin) {
      const preflightHeaders = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24 hours
      };
      return new NextResponse(null, { status: 204, headers: preflightHeaders });
    } else {
      return new NextResponse('CORS policy does not allow this origin.', { status: 403 });
    }
  }

  // Handle actual requests
  const response = NextResponse.next();

  // Add CORS headers to the response
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  // Authentication check for protected routes
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const isProtectedRoute = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtectedRoute && !token) {
    console.log('Auth: No token found in Authorization header.');
    return new NextResponse('Authorization token is required.', { status: 401 });
  }

  return response;
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
