import { NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';

export async function GET(request: Request) {
  await dbConnect();

  try {
    const designs = await DesignModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(designs);
  } catch (error: any) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch designs.' }, { status: 500 });
  }
}
