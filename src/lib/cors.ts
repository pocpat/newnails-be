import { NextRequest, NextResponse } from 'next/server';

// Define your CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function withCors(
  handler: (req: NextRequest, res: NextResponse) => Promise<NextResponse>
) {
  return async (req: NextRequest, res: NextResponse) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, { headers: corsHeaders });
    }

    // Handle actual requests
    const response = await handler(req, res);

    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
