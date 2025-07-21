import { NextRequest, NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { del } from '@vercel/blob';
import * as admin from 'firebase-admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, context: { params: any })
 {
  await dbConnect();

  const { designId } = context.params as { designId: string };

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Authorization token missing.' }, { status: 401 });
  }

  let userId: string;
  try {
    const admin = (await import('@/lib/firebaseAdmin')).default;
    const auth = admin.auth();
    const decodedToken = await auth.verifyIdToken(token);
    userId = decodedToken.uid;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return NextResponse.json({ error: 'Invalid authorization token.' }, { status: 401 });
  }

  if (!designId) {
    return NextResponse.json({ error: 'Design ID is required.' }, { status: 400 });
  }

  try {
    const design = await DesignModel.findOne({ _id: designId });

    if (!design) {
      return NextResponse.json({ error: 'Design not found.' }, { status: 404 });
    }

    if (design.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this design.' }, { status: 403 });
    }

    // Delete image from Vercel Blob
    await del(design.imageUrl);

    // Delete document from MongoDB
    await DesignModel.deleteOne({ _id: designId });

    return NextResponse.json({ message: 'Design deleted successfully!' });
  } catch (error: unknown) {
    console.error('Error deleting design:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to delete design.' }, { status: 500 });
  }
}
