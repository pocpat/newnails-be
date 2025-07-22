import { NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkDailyGenerationLimit, incrementGenerationCount } from '@/utils/rateLimiter';

export async function POST(request: Request) {
  const { prompt, model, negative_prompt, n, size } = await request.json();

  // The user ID is now passed from the middleware after token verification.
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    // This case should not be reached if middleware is configured correctly.
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }
  console.log('Generate API: Authenticated userId:', userId);

  try {
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
