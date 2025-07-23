import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import Design from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

// The same fix is applied here: destructure 'params' directly in the
// function signature to avoid the type conflict.

export async function DELETE(
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

    if (design.userId.toString() !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the image from Vercel Blob storage
    if (design.permanentUrl) {
      await del(design.permanentUrl);
    }

    // Delete the design from the database
    await Design.findByIdAndDelete(designId);

    return NextResponse.json({ message: 'Design deleted successfully' });
  } catch (error) {
    console.error('Error deleting design:', error);
    return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
  }
}