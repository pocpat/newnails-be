import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkDailyGenerationLimit, incrementGenerationCount } from '@/utils/rateLimiter';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  const { prompt, model, negative_prompt, n, size } = await request.json();

  console.log('Generate API: Authenticated userId:', userId);
  console.log('Generate API: Received prompt:', prompt);

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
    console.error('Error in /api/generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `Image generation failed: ${errorMessage}` }, { status: 500 });
  }
}
