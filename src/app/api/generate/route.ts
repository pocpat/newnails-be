
import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkDailyGenerationLimit, incrementGenerationCount } from '@/utils/rateLimiter';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  let requestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  
  // 1. Destructure ALL the raw selections from the request body
  const {
    length,
    shape,
    style,
    color: colorConfig, // Rename 'color' to 'colorConfig' for clarity
    baseColor,
    model,
    negative_prompt,
    num_images,
    width,
    height,
  } = requestBody;

  console.log('Generate API: Authenticated userId:', userId);
  console.log('Generate API: Received raw selections:', { length, shape, style, colorConfig, baseColor });

  try {
    // Basic validation
    if (!length || !shape || !style || !model) {
      return NextResponse.json({ error: 'Length, shape, style, and model are required.' }, { status: 400 });
    }

    const { allowed, message } = await checkDailyGenerationLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    // --- 2. BUILD THE PROFESSIONAL PROMPT ---

    // Part A: Build the Nail Details
    const nailDetails = `${length}, ${shape}-shaped nails in a ${style} style`;

    // Part B: Build the Color Details with logic
    let colorDetails = '';
    if (baseColor && colorConfig && colorConfig !== 'Pick a Base Color' && colorConfig !== 'unified') {
      colorDetails = `The color palette uses ${baseColor} as a base, arranged in a beautiful ${colorConfig} color scheme.`;
    } else if (baseColor) {
      colorDetails = `The design prominently features the color ${baseColor}.`;
    } else {
      colorDetails = `The design features a stunning and creative color palette.`;
    }

    // Part C: Assemble the Final Prompt using the high-quality template
    const finalPrompt = `award-winning photograph, professional manicure, macro photography, studio lighting, detailed closeup of a woman's hand with flawless skin, showcasing a stunning nail design. The design features ${nailDetails}. ${colorDetails} beautiful and elegant, sharp focus, high-resolution, bokeh background.`;
    
    console.log('Generate API: Constructed Final Prompt:', finalPrompt);

    // 3. Call the image generation service with the final prompt
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