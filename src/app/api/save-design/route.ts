import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import axios from 'axios';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { checkTotalStorageLimit } from '@/utils/rateLimiter';
import * as admin from 'firebase-admin';

export async function POST(request: Request): Promise<NextResponse> {
  await dbConnect();

  const { prompt, temporaryImageUrl } = await request.json();

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Authorization token missing.' }, { status: 401 });
  }

  let userId: string;
  let auth: admin.auth.Auth;
  let db: admin.firestore.Firestore;
  try {
    ({ auth, db } = (await import('@/lib/firebaseAdmin')).initializeFirebaseAdmin());
    const decodedToken = await auth.verifyIdToken(token);
    userId = decodedToken.uid;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return NextResponse.json({ error: 'Invalid authorization token.' }, { status: 401 });
  }

  if (!prompt || !temporaryImageUrl) {
    return NextResponse.json({ error: 'Prompt and temporary image URL are required.' }, { status: 400 });
  }

  try {
    const { allowed, message } = await checkTotalStorageLimit(userId, db);
    if (!allowed) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    const imageResponse = await axios.get(temporaryImageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    const urlParts = temporaryImageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: imageResponse.headers['content-type'],
    });

    const newDesign = new DesignModel({
      userId, // Save the userId
      prompt,
      imageUrl: blob.url,
      isFavorite: false,
    });
    await newDesign.save();

    return NextResponse.json({ message: 'Design saved successfully!', design: newDesign, blob });
  } catch (error: unknown) {
    console.error('Error saving design:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to save design.' }, { status: 500 });
  }
}
