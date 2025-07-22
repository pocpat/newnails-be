import { NextRequest, NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  await dbConnect();

  const userId = request.headers.get('x-user-id');
  if (!userId) {
    // This case should not be reached if middleware is configured correctly.
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  try {
    // Fetch designs for the authenticated user, sorted by creation date
    const designs = await DesignModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return NextResponse.json(designs, { status: 200 });
  } catch (error) {
    console.error('Error fetching my-designs:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch designs' }, { status: 500 });
  }
}