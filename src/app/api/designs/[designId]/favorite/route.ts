import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Design from '@/models/DesignModel';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/api-helpers';

// This OPTIONS handler is correct and working. Do not change it.
export async function OPTIONS(request: NextRequest) {
    const preflightResponse = handleCorsPreflight(request);
    if (preflightResponse) {
        return preflightResponse;
    }
    return new NextResponse('CORS policy does not allow this origin.', { status: 403 });
}

// This is the PATCH handler with the final fix.
export async function PATCH(request: NextRequest) {
  // Define response variable at the top
  let response: NextResponse; 

  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      // If unauthorized, create the error response and EXIT the try block
      response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      // Use a SINGLE return point at the end of the function
      return addCorsHeaders(request, response);
    }
    
    const pathname = new URL(request.url).pathname;
    const segments = pathname.split('/');
    const designId = segments[3];

    if (!designId) {
        response = NextResponse.json({ error: 'Design ID missing from URL' }, { status: 400 });
        return addCorsHeaders(request, response);
    }

    await dbConnect();
    const design = await Design.findById(designId);

    if (!design) {
      response = NextResponse.json({ error: 'Design not found' }, { status: 404 });
      return addCorsHeaders(request, response);
    }

    if (design.userId.toString() !== userId) {
      response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return addCorsHeaders(request, response);
    }

    design.isFavorite = !design.isFavorite;
    await design.save();

    // On success, create the success response
    response = NextResponse.json(design);

  } catch (error) {
    console.error('Error updating favorite status:', error);
    // On crash, create the server error response
    response = NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
  }
  
  // This is the SINGLE return point. It guarantees that EVERY possible
  // response, success or error, gets the CORS headers attached.
  return addCorsHeaders(request, response);
}