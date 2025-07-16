import { NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { del } from '@vercel/blob';


export async function DELETE(request: Request, { params }: { params: { designId: string } }) {
  await dbConnect();

  const { designId } = params;

  if (!designId) {
    return NextResponse.json({ error: 'Design ID is required.' }, { status: 400 });
  }

  try {
    const design = await DesignModel.findOne({ _id: designId });

    if (!design) {
      return NextResponse.json({ error: 'Design not found.' }, { status: 404 });
    }

    // Delete image from Vercel Blob
    await del(design.imageUrl);

    // Delete document from MongoDB
    await DesignModel.deleteOne({ _id: designId });

    return NextResponse.json({ message: 'Design deleted successfully!' });
  } catch (error: any) {
    console.error('Error deleting design:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete design.' }, { status: 500 });
  }
}
