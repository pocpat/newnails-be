import { NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';

export async function GET() {
  await dbConnect();

  try {
    const designs = await DesignModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(designs);
  } catch (error: unknown) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch designs.' }, { status: 500 });
  }
}
