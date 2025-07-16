import { NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';

export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  try {
    const designs = await DesignModel.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(designs);
  } catch (error: any) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch designs.' }, { status: 500 });
  }
}
