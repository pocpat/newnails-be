import { NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { auth } from '../../lib/firebaseAdmin';
import { checkDailyGenerationLimit, incrementGenerationCount } from '../../utils/rateLimiter';

export async function POST(request: Request) {
  const { prompt, model, negative_prompt, n, size } = await request.json();

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Authorization token missing.' }, { status: 401 });
  }

  let userId: string;
  try {
    const decodedToken = await auth.verifyIdToken(token);
    userId = decodedToken.uid;
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return NextResponse.json({ error: 'Invalid authorization token.' }, { status: 401 });
  }

  console.log('Received generate request with:');
  console.log('  Prompt:', prompt);
  console.log('  Model:', model);
  console.log('  N:', n);
  console.log('  Size:', size);
  console.log('  User ID:', userId);

  if (!prompt || !model) {
    return NextResponse.json({ error: 'Prompt and model are required.' }, { status: 400 });
  }

  try {
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
