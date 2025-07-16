import { NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { del } from '@vercel/blob';
import { decrementSavedDesigns } from '@/utils/rateLimiter';

export async function DELETE(request: Request, { params }: { params: { designId: string } }) {
  await dbConnect();

  const { designId } = params;
  const { userId } = await request.json(); // Assuming userId is sent in the body for ownership check

  if (!designId || !userId) {
    return NextResponse.json({ error: 'Design ID and User ID are required.' }, { status: 400 });
  }

  try {
    const design = await DesignModel.findOne({ _id: designId, userId });

    if (!design) {
      return NextResponse.json({ error: 'Design not found or unauthorized.' }, { status: 404 });
    }

    // Delete image from Vercel Blob
    await del(design.imageUrl);

    // Delete document from MongoDB
    await DesignModel.deleteOne({ _id: designId });

    decrementSavedDesigns(userId);

    return NextResponse.json({ message: 'Design deleted successfully!' });
  } catch (error: any) {
    console.error('Error deleting design:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete design.' }, { status: 500 });
  }
}
