import { NextResponse } from 'next/server';
import { withCors } from '@/lib/cors';

// In-memory cache: { models, fetchedAt }
let cachedModels: { models: string[]; fetchedAt: number } | null = null;
const CACHE_TTL = 2 * 24 * 60 * 60 * 1000; // 2 days in ms

const IMAGEROUTER_API_KEY = process.env.IMAGEROUTER_API_KEY;
const IMAGEROUTER_MODELS_URL = 'https://api.imagerouter.io/v1/models';

async function fetchFreeImageModels(): Promise<string[]> {
  if (!IMAGEROUTER_API_KEY) {
    console.error('IMAGEROUTER_API_KEY is not set');
    return [];
  }

  const response = await fetch(IMAGEROUTER_MODELS_URL, {
    headers: {
      'Authorization': `Bearer ${IMAGEROUTER_API_KEY}`,
    },
  });

  if (!response.ok) {
    console.error(`ImageRouter models API returned ${response.status}`);
    return [];
  }

  const data = await response.json();

  // ImageRouter returns an object keyed by model id
  // Each model has: { output: ['image'], providers: [{ pricing: { value: N } }] }
  const freeModels: string[] = [];

  for (const [modelId, info] of Object.entries(data)) {
    const modelInfo = info as {
      output?: string[];
      providers?: { pricing?: { value?: number } }[];
    };

    // Must be an image generation model
    if (!modelInfo.output?.includes('image')) continue;

    // Must have at least one free provider (price = 0)
    const hasFree = modelInfo.providers?.some(
      (p) => p.pricing?.value === 0
    );

    if (hasFree) {
      freeModels.push(modelId);
    }
  }

  return freeModels;
}

async function handler(): Promise<Response> {
  // Return cached models if still fresh
  if (cachedModels && Date.now() - cachedModels.fetchedAt < CACHE_TTL) {
    return NextResponse.json({
      models: cachedModels.models,
      cached: true,
      fetchedAt: cachedModels.fetchedAt,
    });
  }

  try {
    const models = await fetchFreeImageModels();

    cachedModels = {
      models,
      fetchedAt: Date.now(),
    };

    return NextResponse.json({
      models,
      cached: false,
      fetchedAt: cachedModels.fetchedAt,
    });
  } catch (error) {
    console.error('Error fetching free models:', error);

    // If we have stale cached models, return them even on error
    if (cachedModels) {
      return NextResponse.json({
        models: cachedModels.models,
        cached: true,
        fetchedAt: cachedModels.fetchedAt,
        error: 'Failed to fetch fresh models, returning stale cache.',
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch available models.' },
      { status: 500 }
    );
  }
}

// This endpoint is public (no auth) — the frontend needs it to
// show available models before the user generates images.
export const GET = withCors(handler as never);