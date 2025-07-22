import { NextRequest, NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { del } from '@vercel/blob';

interface DeleteContext {
  params: { designId: string };
}

export async function DELETE(request: NextRequest, context: DeleteContext) {
  await dbConnect();
  const { designId } = context.params;

  // The user ID is now passed from the middleware after token verification.
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    // This case should not be reached if middleware is configured correctly.
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  if (!designId) {
    return NextResponse.json({ error: 'Design ID is required.' }, { status: 400 });
  }

  try {
    // Find the design only if it matches the designId AND belongs to the user.
    // This is more secure and efficient than a separate ownership check.
    const design = await DesignModel.findOne({ _id: designId, userId });

    if (!design) {
      return NextResponse.json({ error: 'Design not found or you do not have permission to delete it.' }, { status: 404 });
    }

    // Delete image from Vercel Blob
    await del(design.imageUrl);

    await design.deleteOne();

    return NextResponse.json({ message: 'Design deleted successfully!' });
  } catch (error: unknown) {
    console.error('Error deleting design:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to delete design.' }, { status: 500 });
  }
}
