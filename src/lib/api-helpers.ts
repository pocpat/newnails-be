import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'https://newnails-web-fe.vercel.app',
  // Add production URLs here later
];

/**
 * Handles CORS preflight (OPTIONS) requests.
 * This should be called at the top of any API route that needs to handle CORS.
 */
export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');

// --- ADD THIS LOGGING BLOCK ---
  console.log('--- CORS PREFLIGHT CHECK ---');
  console.log('Received Origin:', origin);
  console.log('Allowed Origins:', allowedOrigins);
  console.log('Is Origin Allowed?:', origin ? allowedOrigins.includes(origin) : 'No origin header');
  console.log('--------------------------');
  // ------------------------------


  if (origin && allowedOrigins.includes(origin)) {
    const preflightHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  return new NextResponse('CORS policy does not allow this origin.', { status: 403 });
}

/**
 * Adds CORS headers to a successful response.
 */
export function addCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  return response;
}

/**
 * A wrapper to handle auth, CORS, and errors for protected API routes.
 */
export async function handleProtectedApi(
  request: NextRequest,
  logic: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  
  // Handle OPTIONS request
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  try {
    // Verify Authentication
    const userId = await verifyAuth(request);
    if (!userId) {
      return addCorsHeaders(request, NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }

    // Execute the route-specific logic
    const response = await logic(userId);
    
    // Attach CORS headers to the final response
    return addCorsHeaders(request, response);

  } catch (error) {
    console.error('API Route Error:', error);
    const errorResponse = NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    return addCorsHeaders(request, errorResponse);
  }
}