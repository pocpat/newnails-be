import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';
import { checkDailyGenerationLimit, incrementGenerationCount } from '@/utils/rateLimiter';
import { verifyAuth } from '@/lib/auth';
import { withCors } from '@/lib/cors';

// In-memory cache for free models (shared with /api/models endpoint)
let cachedFreeModels: { models: string[]; fetchedAt: number } | null = null;
const CACHE_TTL = 2 * 24 * 60 * 60 * 1000; // 2 days
const MAX_MODELS_TO_TRY = 4; // Generate with up to 4 models in parallel

const IMAGEROUTER_API_KEY = process.env.IMAGEROUTER_API_KEY;
const IMAGEROUTER_MODELS_URL = 'https://api.imagerouter.io/v1/models';

async function fetchFreeImageModels(): Promise<string[]> {
  if (!IMAGEROUTER_API_KEY) {
    console.error('IMAGEROUTER_API_KEY is not set');
    return [];
  }

  const response = await fetch(IMAGEROUTER_MODELS_URL, {
    headers: { 'Authorization': `Bearer ${IMAGEROUTER_API_KEY}` },
  });

  if (!response.ok) {
    console.error(`ImageRouter models API returned ${response.status}`);
    return [];
  }

  const data = await response.json();
  const freeModels: string[] = [];

  for (const [modelId, info] of Object.entries(data)) {
    const modelInfo = info as {
      output?: string[];
      providers?: { pricing?: { value?: number } }[];
    };

    if (!modelInfo.output?.includes('image')) continue;

    const hasFree = modelInfo.providers?.some(
      (p) => p.pricing?.value === 0
    );

    if (hasFree) {
      freeModels.push(modelId);
    }
  }

  return freeModels;
}

async function getCachedFreeModels(): Promise<string[]> {
  if (cachedFreeModels && Date.now() - cachedFreeModels.fetchedAt < CACHE_TTL) {
    return cachedFreeModels.models;
  }

  const models = await fetchFreeImageModels();
  cachedFreeModels = { models, fetchedAt: Date.now() };
  return models;
}

interface GenerateApiRequest {
  length: string;
  shape: string;
  style: string;
  color?: string;
  baseColor?: string;
  negative_prompt?: string;
  num_images?: number;
  width?: number;
  height?: number;
}

/**
 * Constructs the prompt for image generation based on user selections.
 */
function buildPrompt(details: Omit<GenerateApiRequest, 'negative_prompt' | 'num_images' | 'width' | 'height'>): string {
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
    requestBody = await request.json();
  } catch (error) {
    console.error('Generate API - Body Parse Error:', error);
    return NextResponse.json({ error: 'Invalid request body. Could not parse JSON.' }, { status: 400 });
  }

  console.log('Generate API: Authenticated userId:', userId);
  console.log('Generate API: Received selections:', requestBody);

  try {
    if (!requestBody.length || !requestBody.shape || !requestBody.style) {
      return NextResponse.json({ error: 'Length, shape, and style are required.' }, { status: 400 });
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

    // Fetch available free models (cached for 2 days)
    const freeModels = await getCachedFreeModels();
    const modelsToUse = freeModels.slice(0, MAX_MODELS_TO_TRY);

    if (modelsToUse.length === 0) {
      return NextResponse.json(
        { error: 'No free image generation models are currently available. Please try again later.' },
        { status: 503 }
      );
    }

    console.log(`Generate API: Using ${modelsToUse.length} models:`, modelsToUse);

    // Generate with all selected models in parallel
    const results = await Promise.all(
      modelsToUse.map(async (model) => {
        try {
          const imageUrls = await generateImage({
            prompt: finalPrompt,
            model,
            negative_prompt: requestBody.negative_prompt,
            num_images: requestBody.num_images || 1,
            width: requestBody.width || 1024,
            height: requestBody.height || 1024,
          });
          return { imageUrls, prompt: finalPrompt };
        } catch (error) {
          console.error(`Model ${model} failed:`, error instanceof Error ? error.message : error);
          return null;
        }
      })
    );

    // Collect all successful image URLs
    const validResults = results.filter((r): r is { imageUrls: string[]; prompt: string } => r !== null);
    const allImageUrls = validResults.flatMap((r) => r.imageUrls);

    if (allImageUrls.length === 0) {
      return NextResponse.json(
        { error: 'All image generation models failed. Please try again later.' },
        { status: 500 }
      );
    }

    await incrementGenerationCount(userId);

    return NextResponse.json({
      imageUrls: allImageUrls,
      prompt: finalPrompt,
    });

  } catch (error: unknown) {
    console.error('Error in /api/generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';

    if (errorMessage.includes('Daily limit')) {
      return NextResponse.json({
        imageUrls: ['/images/ph.png'],
      });
    }

    return NextResponse.json({ error: `Image generation failed: ${errorMessage}` }, { status: 500 });
  }
}

// Wrap the handler with the CORS middleware
export const POST = withCors(handler);