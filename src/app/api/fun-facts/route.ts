import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import FunFact from '@/models/FunFact';

export async function GET() {
  await dbConnect();

  try {
    const count = await FunFact.countDocuments();
    if (count === 0) {
      return NextResponse.json({ error: 'No fun facts found.' }, { status: 404 });
    }

    const random = Math.floor(Math.random() * count);
    const funFact = await FunFact.findOne().skip(random);

    return NextResponse.json(funFact);
  } catch (error) {
    console.error('Error fetching fun fact:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
