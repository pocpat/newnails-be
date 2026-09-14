/**
 * GET /api/models
 *
 * Public (no auth) endpoint that returns the healthy free image-generation
 * models. The modelCheckAgent runs at most once per UTC calendar day; every
 * app open calls this endpoint, the first open of the day triggers the check,
 * the rest are served from cache.
 *
 * Response: { models: string[], checkedAt: string, source: 'fresh'|'cache'|'fallback' }
 */
import { NextResponse } from 'next/server';
import { runModelCheck } from '@/utils/modelCheckAgent';
import { withCors } from '@/lib/cors';

async function handler() {
  try {
    const result = await runModelCheck();
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in /api/models:', error);
    const { FALLBACK_MODELS } = await import('@/utils/modelCheckAgent');
    return NextResponse.json(
      { models: FALLBACK_MODELS, checkedAt: new Date().toISOString(), source: 'fallback', dropped: [] },
      { status: 200 }
    );
  }
}

export const GET = withCors(handler);