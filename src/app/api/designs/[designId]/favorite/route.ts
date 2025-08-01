import { NextRequest, NextResponse } from 'next/server';
import Design from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// WORKAROUND: We are removing the 'context' parameter entirely to bypass a
// Next.js build-time type-checking bug. We will parse the designId from the URL.
export async function PATCH(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Extract the designId directly from the request URL.
  // The URL will be like: '.../api/designs/688c31e213cf034930b42329/favorite'
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split('/');
  // segments will be ['', 'api', 'designs', '688c31e213cf034930b42329', 'favorite']
  const designId = segments[3];

  if (!designId) {
    return NextResponse.json({ error: 'Design ID is missing from URL' }, { status: 400 });
  }

  try {
    await dbConnect();

    const design = await Design.findById(designId);

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // Ensure you are comparing consistent types.
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