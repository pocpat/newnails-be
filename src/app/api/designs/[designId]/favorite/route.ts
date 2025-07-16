import { NextRequest, NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PATCH(request: NextRequest, context: { params: any })
 {  await dbConnect();

  const { designId } = context.params as { designId: string };

  if (!designId) {
    return NextResponse.json({ error: 'Design ID is required.' }, { status: 400 });
  }

  try {
    const design = await DesignModel.findOne({ _id: designId });

    if (!design) {
      return NextResponse.json({ error: 'Design not found.' }, { status: 404 });
    }

    design.isFavorite = !design.isFavorite;
    await design.save();

    return NextResponse.json({ message: 'Favorite status updated successfully!', design });
  } catch (error: unknown) {
    console.error('Error updating favorite status:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to update favorite status.' }, { status: 500 });
  }
}
