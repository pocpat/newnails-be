import { NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkDailyGenerationLimit, incrementGenerationCount } from '@/utils/rateLimiter';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: Request) {
  const userId = await verifyAuth(request as any);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  const { prompt, model, negative_prompt, n, size } = await request.json();

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
