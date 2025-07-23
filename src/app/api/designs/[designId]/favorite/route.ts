import { NextResponse } from 'next/server';
import Design from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(request: Request, { params }: { params: { designId: string } }) {
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

    design.isFavorite = !design.isFavorite;
    await design.save();

    return NextResponse.json(design);
  } catch (error) {
    console.error('Error updating favorite status:', error);
    return NextResponse.json({ error: 'Failed to update favorite status' }, { status: 500 });
  }
}
