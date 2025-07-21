
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received test request with body:', body);
    return NextResponse.json({ message: 'Backend received the test request successfully!', data: body });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ message: 'Error processing test request' }, { status: 500 });
  }
}
