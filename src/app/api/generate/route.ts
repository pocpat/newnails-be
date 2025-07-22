import { NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkDailyGenerationLimit, incrementGenerationCount } from '@/utils/rateLimiter';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  const { prompt, model, negative_prompt, n, size } = await request.json();

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  console.log('Generate API: Received token:', token);
  if (!token) {
    return NextResponse.json({ error: 'Authorization token missing.' }, { status: 401 });
  }

  let userId: string;
  try {
    const { initializeFirebaseAdmin } = await import('@/lib/firebaseAdmin');
    const adminApp = initializeFirebaseAdmin();
    const auth = adminApp.auth();
    const db = adminApp.firestore();
    const decodedToken = await auth.verifyIdToken(token);
    userId = decodedToken.uid;
    console.log('Generate API: Decoded userId:', userId);

    if (!prompt || !model) {
      return NextResponse.json({ error: 'Prompt and model are required.' }, { status: 400 });
    }

    const { allowed, message } = await checkDailyGenerationLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    const imageUrls = await generateImage({
      prompt,
      model,
      negative_prompt,
      n,
      size,
    });

    await incrementGenerationCount(userId);

    return NextResponse.json({ imageUrls });
  } catch (error: unknown) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to generate image.' }, { status: 500 });
  }
}
