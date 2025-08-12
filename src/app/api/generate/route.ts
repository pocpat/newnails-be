
import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkDailyGenerationLimit, incrementGenerationCount } from '@/utils/rateLimiter';
import { verifyAuth } from '@/lib/auth';
import { withCors } from '@/lib/cors'; // Import the CORS middleware

interface GenerateApiRequest {
  length: string;
  shape: string;
  style: string;
  model: string;
  color?: string;
  baseColor?: string;
  negative_prompt?: string;
  num_images?: number;
  width?: number;
  height?: number;
}

/**
 * Constructs the prompt for image generation based on user selections.
 * @param details - The user's selections for the nail design.
 * @returns A string representing the final prompt.
 */
function buildPrompt(details: Omit<GenerateApiRequest, 'model' | 'negative_prompt' | 'num_images' | 'width' | 'height'>): string {
  const { length, shape, style, color: colorConfig, baseColor } = details;

  const promptParts = [
    "award-winning photograph", "professional manicure", "macro photography", "studio lighting",
    "detailed closeup of a woman's hand with flawless skin, showcasing a stunning nail design.",
    `The design features ${length}, ${shape}-shaped nails in a ${style} style.`
  ];

  if (baseColor && colorConfig && colorConfig !== 'Pick a Base Color' && colorConfig !== 'unified') {
    promptParts.push(`The color palette uses ${baseColor} as a base, arranged in a beautiful ${colorConfig} color scheme.`);
  } else if (baseColor) {
    promptParts.push(`The design prominently features the color ${baseColor}.`);
  } else {
    promptParts.push(`The design features a stunning and creative color palette.`);
  }

  promptParts.push("beautiful and elegant", "sharp focus", "high-resolution", "bokeh background.");

  return promptParts.join(' ');
}

async function handler(request: NextRequest): Promise<Response> {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  let requestBody: GenerateApiRequest;
  try {
 const rawBody = await request.text();
    console.log('=== BACKEND DEBUG ===');
    console.log('Raw request body:', rawBody);
    
    requestBody = JSON.parse(rawBody);
    console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
    console.log('Request body keys:', Object.keys(requestBody));
    console.log('Length value:', requestBody.length, 'Type:', typeof requestBody.length);
    console.log('Shape value:', requestBody.shape, 'Type:', typeof requestBody.shape);
    console.log('Style value:', requestBody.style, 'Type:', typeof requestBody.style);
    console.log('=====================');

   // requestBody = await request.json();
  } catch (error) {
    console.error('Generate API - Body Parse Error:', error);
    return NextResponse.json({ error: 'Invalid request body. Could not parse JSON.' }, { status: 400 });
  }
  
  const {
    model,
    negative_prompt,
    num_images,
    width,
    height,
  } = requestBody;

  console.log('Generate API: Authenticated userId:', userId);
  console.log('Generate API: Received raw selections:', requestBody);

  try {
    if (!requestBody.length || !requestBody.shape || !requestBody.style || !model) {
      return NextResponse.json({ error: 'Length, shape, style, and model are required.' }, { status: 400 });
    }

    const { allowed, message } = await checkDailyGenerationLimit(userId);
    if (!allowed) {
      console.log('Daily generation limit reached for user:', userId);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      return NextResponse.json({
        limitReached: true,
        message,
        imageUrls: [`${baseUrl}/images/ph.png`],
      });
    }

    const finalPrompt = buildPrompt(requestBody);
    
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

    return NextResponse.json({ imageUrls, prompt: finalPrompt });

  } catch (error: unknown) {
    console.error('Error in /api/generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

    // ⭐ NEW: Check if it's a rate limit error and return mock response
    if (errorMessage.includes('Daily limit')) {
      console.log('Daily limit reached, returning placeholder image');
      return NextResponse.json({ 
        imageUrls: [
          '/images/ph.png'
        ]
      });
    }
    
    // For all other errors, return the original error response
    return NextResponse.json({ error: `Image generation failed: ${errorMessage}` }, { status: 500 });
  }
}

// Wrap the handler with the CORS middleware
export const POST = withCors(handler);
