import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import Design from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: { designId: string } }) {
  const userId = await verifyAuth(request as any);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { designId } = params;

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
