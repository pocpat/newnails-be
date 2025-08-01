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


// =====================   old ========================
// import { NextRequest, NextResponse } from 'next/server';
// import DesignModel from '@/models/DesignModel';
// import dbConnect from '@/lib/db';
// import { verifyAuth } from '@/lib/auth';


// export async function GET(request: NextRequest): Promise<NextResponse> {
//   const userId = await verifyAuth(request);
//   if (!userId) {
//     return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
//   }

//   await dbConnect();

//   try {
//     // Fetch designs for the authenticated user, sorted by creation date
//     const designs = await DesignModel.find({ userId }).sort({ createdAt: -1 }).exec();
//     return NextResponse.json(designs, { status: 200 });
//   } catch (error) {
//     console.error('Error fetching my-designs:', error);
//     return NextResponse.json({ error: (error as Error).message || 'Failed to fetch designs' }, { status: 500 });
//   }
// }