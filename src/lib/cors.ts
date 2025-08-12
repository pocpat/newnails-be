import { NextRequest, NextResponse } from 'next/server';

// Define the function signature for a Next.js App Router handler.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppRouteHandlerFn = (req: NextRequest, ...args: any[]) => Promise<Response> | Response;

// Define the origins that are allowed to access your API.
// Using a whitelist is more secure than allowing all origins ('*').
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? [
        'https://newnails-web-fe.vercel.app/', 
        'https://your-production-mobile-frontend.com', // TODO: Add your production mobile app URL if applicable
      ]
    : [
        'http://localhost:3000', // Next.js dev server
        'http://localhost:5173', // Vite dev server (from your web-fe)
        'http://localhost:8081', // Expo dev server
        'http://localhost:19006', // Expo web dev server
      ];

/**
 * A higher-order function to add CORS headers to an App Router API route.
 * @param handler The API route handler function.
 * @returns A new handler function with CORS logic.
 */
export function withCors(handler: AppRouteHandlerFn) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ...args: any[]) => {
    const origin = req.headers.get('origin') ?? '';

    // --- 1. Handle pre-flight OPTIONS request ---
    // The browser sends this automatically before the actual request.
    if (req.method === 'OPTIONS') {
      const headers = new Headers();
      // Only allow requests from whitelisted origins.
      if (allowedOrigins.includes(origin)) {
        headers.set('Access-Control-Allow-Origin', origin);
      }
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      headers.set('Access-Control-Max-Age', '86400'); // Cache pre-flight response for 24 hours

      return new NextResponse(null, { status: 204, headers });
    }

    // --- 2. Handle actual API request ---
    const response = await handler(req, ...args);

    // --- 3. Add the essential CORS header to the actual response ---
    // The browser needs this to allow the frontend code to access the response.
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    return response;
  };
}