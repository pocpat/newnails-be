import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkDailyGenerationLimit, incrementGenerationCount } from '@/utils/rateLimiter';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  console.log('Generate API: Attempting to parse request body...');
  let requestBody;
  try {
    requestBody = await request.json();
    console.log('Generate API: Successfully parsed request body:', requestBody);
  } catch (error: unknown) {
    console.error('Generate API: Error parsing request body:', (error as Error).message);
    return NextResponse.json({ error: 'Invalid request body format.' }, { status: 400 });
  }

  const { length, shape, style, colorConfig, baseColor, model, negative_prompt, num_images, width, height } = requestBody;

  console.log('Generate API: Authenticated userId:', userId);
  console.log('Generate API: Parsed design parameters:', { length, shape, style, colorConfig, baseColor, model });

  try {
    if (!length || !shape || !style || !colorConfig || !model) {
      return NextResponse.json({ error: 'Length, shape, style, color configuration, and model are required.' }, { status: 400 });
    }

    const { allowed, message } = await checkDailyGenerationLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    let fullPrompt = `High quality manicure image , made by professional photographer. Nail design with ${length} length, ${shape} shape, ${style} style,`;

    if (colorConfig === "Select" && baseColor) {
      fullPrompt += ` and a base color of ${baseColor} with a ${colorConfig} color configuration.`;
    } else {
      fullPrompt += ` and ${colorConfig} color configuration.`;
    }

    const imageUrls = await generateImage({
      prompt: fullPrompt,
      model,
      negative_prompt,
      num_images,
      width,
      height,
    });

    await incrementGenerationCount(userId);

    return NextResponse.json({ imageUrls });
  } catch (error: unknown) {
    console.error('Error in /api/generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `Image generation failed: ${errorMessage}` }, { status: 500 });
  }
}
