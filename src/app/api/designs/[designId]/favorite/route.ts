import { NextRequest, NextResponse } from 'next/server';
import Design from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// The fix is to destructure the params directly from the context object
// and provide the type inline. This avoids the conflict with Next.js's
// internal type generation during the build process.

export async function PATCH(
  request: NextRequest,
    context: any // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 'designId' is now directly available from the destructured 'params'
  const { designId } = context.params;

  if (!designId) {
    return NextResponse.json({ error: 'Design ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();

    const design = await Design.findById(designId);

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // Important: Ensure you are comparing consistent types.
    // If 'userId' is a string from verifyAuth and design.userId is an ObjectId,
    // converting the ObjectId to a string is the correct approach.
    if (design.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    design.isFavorite = !design.isFavorite;
    await design.save();

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error updating favorite status:', error);
    return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
  }
}