import { NextRequest, NextResponse } from 'next/server';
import { handleProtectedApi, handleCorsPreflight } from '@/lib/api-helpers';
import dbConnect from '@/lib/db';
import Design from '@/models/DesignModel'; // <-- Only one import is needed.

// Add the OPTIONS handler for CORS preflight requests. This is necessary.
export async function OPTIONS(request: NextRequest) {
    return handleCorsPreflight(request) ?? new NextResponse(null, {status: 204});
}

// Define the GET handler to fetch designs.
export async function GET(request: NextRequest) {
  // Use the wrapper. The try/catch is handled inside this function.
  return handleProtectedApi(request, async (userId) => {
    
    await dbConnect();

    // This is the "happy path" logic. If it throws an error,
    // the helper function will catch it and return a 500 response.
    const designs = await Design.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json(designs);
  });
}

