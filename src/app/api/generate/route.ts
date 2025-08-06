
import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkDailyGenerationLimit, incrementGenerationCount } from '@/utils/rateLimiter';
import { verifyAuth } from '@/lib/auth';
import { withCors } from '@/lib/cors'; // Import the CORS middleware

async function handler(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error('Generate API - Body Parse Error:', error);
    return NextResponse.json({ error: 'Invalid request body. Could not parse JSON.' }, { status: 400 });
  }
  
  const {
    length,
    shape,
    style,
    color: colorConfig,
    baseColor,
    model,
    negative_prompt,
    num_images,
    width,
    height,
  } = requestBody;

  console.log('Generate API: Authenticated userId:', userId);
  console.log('Generate API: Received raw selections:', { length, shape, style, colorConfig, baseColor, model });

  try {
    if (!length || !shape || !style || !model) {
      return NextResponse.json({ error: 'Length, shape, style, and model are required.' }, { status: 400 });
    }

    const { allowed, message } = await checkDailyGenerationLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    const nailDetails = `${length}, ${shape}-shaped nails in a ${style} style`;
    let colorDetails = '';
    if (baseColor && colorConfig && colorConfig !== 'Pick a Base Color' && colorConfig !== 'unified') {
      colorDetails = `The color palette uses ${baseColor} as a base, arranged in a beautiful ${colorConfig} color scheme.`;
    } else if (baseColor) {
      colorDetails = `The design prominently features the color ${baseColor}.`;
    } else {
      colorDetails = `The design features a stunning and creative color palette.`;
    }
    const finalPrompt = `award-winning photograph, professional manicure, macro photography, studio lighting, detailed closeup of a woman's hand with flawless skin, showcasing a stunning nail design. The design features ${nailDetails}. ${colorDetails} beautiful and elegant, sharp focus, high-resolution, bokeh background.`;
    
    console.log('Generate API: Constructed Final Prompt:', finalPrompt);

    const imageUrls = await generateImage({
      prompt: finalPrompt,
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

// Wrap the handler with the CORS middleware
export const POST = withCors(handler as any);
