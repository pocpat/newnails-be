import { NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkGenerationLimit } from '@/utils/rateLimiter';

export async function POST(request: Request) {
  const { userId, prompt, model, negative_prompt, width, height, num_images } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
  }

  const { allowed, remaining } = checkGenerationLimit(userId);
  if (!allowed) {
    return NextResponse.json({ error: `Daily generation limit reached. Remaining: ${remaining}` }, { status: 429 });
  }

  if (!prompt || !model) {
    return NextResponse.json({ error: 'Prompt and model are required.' }, { status: 400 });
  }

  try {
    const imageUrls = await generateImage({
      prompt,
      model,
      negative_prompt,
      width,
      height,
      num_images,
    });
    return NextResponse.json({ imageUrls });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image.' }, { status: 500 });
  }
}
