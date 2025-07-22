import { NextResponse } from 'next/server';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import * as admin from 'firebase-admin';

export async function GET(request: Request) {
  await dbConnect();

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Authorization token missing.' }, { status: 401 });
  }

  let userId: string;
  try {
    const { initializeFirebaseAdmin } = await import('@/lib/firebaseAdmin');
    const adminApp = initializeFirebaseAdmin();
    const auth = adminApp.auth();
    const decodedToken = await auth.verifyIdToken(token);
    userId = decodedToken.uid;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return NextResponse.json({ error: 'Invalid authorization token.' }, { status: 401 });
  }

  try {
    const designs = await DesignModel.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(designs);
  } catch (error: unknown) {
    console.error('Error fetching designs:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch designs.' }, { status: 500 });
  }
}
