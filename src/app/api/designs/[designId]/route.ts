import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Design from '@/models/DesignModel';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/api-helpers';

export async function OPTIONS(request: NextRequest) {
    const preflightResponse = handleCorsPreflight(request);
    
    if (preflightResponse) {
        return preflightResponse; // If origin is allowed, return the response with headers
    }

    // If origin is NOT allowed, explicitly deny the request.
    // This gives a clearer error than a blank 204.
    return new NextResponse('CORS policy does not allow this origin.', { status: 403 });
}

// WORKAROUND: Use ONLY the 'request' parameter to avoid the Next.js build bug.
export async function DELETE(request: NextRequest) {
  let response: NextResponse;
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return addCorsHeaders(request, response);
    }

    // Extract the designId directly from the request URL
    const pathname = new URL(request.url).pathname;
    const segments = pathname.split('/'); // e.g., ['', 'api', 'designs', 'THE_ID']
    const designId = segments[3];

    if (!designId) {
        response = NextResponse.json({ error: 'Design ID missing from URL' }, { status: 400 });
        return addCorsHeaders(request, response);
    }

    await dbConnect();

    const designToDelete = await Design.findOne({ _id: designId, userId });

    if (!designToDelete) {
      response = NextResponse.json({ error: 'Design not found or you do not have permission to delete it' }, { status: 404 });
      return addCorsHeaders(request, response);
    }

    await Design.findByIdAndDelete(designId);

    response = NextResponse.json({ message: 'Design deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting design:', error);
    response = NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
  }

  return addCorsHeaders(request, response);
}