/**
 * modelCheckAgent — Dipsy agent that keeps IMAGE_GENERATION_MODELS healthy.
 *
 * Runs once per day (first app open of the day triggers it via /api/models).
 * Compares the app's candidate image models against ImageRouter's public
 * model catalog (GET https://api.imagerouter.io/v1/models — free, no quota),
 * and returns only models that are:
 *   1. listed in the catalog  (dead/renamed models get dropped)
 *   2. free (:free suffix)    (no paid tier surprises)
 *   3. text-to-image          (output includes "image" AND supported_params.text)
 *   4. priced at 0 for the user (free provider pricing)
 *
 * Result is cached in MongoDB until the next calendar day (UTC date), so the
 * check costs one catalog fetch per day regardless of how many app opens.
 */

import axios from 'axios';
import FreeModelRegistry from '@/models/FreeModelRegistry';

const IMAGEROUTER_BASE_URL = 'https://api.imagerouter.io';
const CATALOG_TIMEOUT_MS = 15000;

/** Candidate free text-to-image models the app wants to use. */
export const CANDIDATE_MODELS = [
  'stabilityai/sdxl-turbo:free',
  'black-forest-labs/FLUX-1-schnell:free',
  'HiDream-ai/HiDream-I1-Fast:free',
  'Tongyi-MAI/Z-Image-Turbo:free',
  'qwen/qwen-image:free',
  'black-forest-labs/FLUX-2-klein-4b:free',
  'google/nano-banana-2-lite:free',
];

/** Fallback list used if the catalog is unreachable and the cache is stale. */
export const FALLBACK_MODELS = [
  'stabilityai/sdxl-turbo:free',
  'black-forest-labs/FLUX-1-schnell:free',
  'HiDream-ai/HiDream-I1-Fast:free',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CatalogEntry = any;

interface CheckResult {
  models: string[];
  checkedAt: string;
  source: 'fresh' | 'cache' | 'fallback';
  dropped: string[];
}

function isUsableTextToImageFreeModel(name: string, entry: CatalogEntry): boolean {
  if (!name.endsWith(':free')) return false;
  const output = entry?.output;
  const params = entry?.supported_params;
  if (!Array.isArray(output) || !output.includes('image')) return false;
  if (!params?.text) return false;
  // Every provider that serves this free model must price it at 0.
  const providers = Array.isArray(entry?.providers) ? entry.providers : [];
  if (providers.length === 0) return false;
  return providers.every((p: CatalogEntry) => p?.pricing?.type === 'fixed' && p?.pricing?.value === 0);
}

export async function runModelCheck(): Promise<CheckResult> {
  await dbConnectSafe();

  const today = new Date().toISOString().slice(0, 10); // UTC calendar day
  let registry = await FreeModelRegistry.findOne({ key: 'free_image_models' });

  if (registry && registry.lastCheckedDay === today) {
    return {
      models: registry.models,
      checkedAt: registry.updatedAt.toISOString(),
      source: 'cache',
      dropped: [],
    };
  }

  // Cache is stale (or missing) — this is the one catalog fetch for today.
  const dropped: string[] = [];
  let fresh: string[] | null = null;

  try {
    const response = await axios.get(`${IMAGEROUTER_BASE_URL}/v1/models`, {
      timeout: CATALOG_TIMEOUT_MS,
      // The catalog is public; no Authorization header, no quota consumed.
    });

    const catalog = response.data ?? {};
    fresh = CANDIDATE_MODELS.filter((name) => {
      // A candidate absent from the catalog is dead (renamed/retired) — drop it.
      const usable = name in catalog && isUsableTextToImageFreeModel(name, catalog[name]);
      if (!usable) dropped.push(name);
      return usable;
    });

    if (fresh.length === 0) fresh = null; // catalog answered but nothing usable -> treat as failure
  } catch (err) {
    console.error('modelCheckAgent: catalog fetch failed:', axios.isAxiosError(err) ? err.message : err);
  }

  if (fresh) {
    if (!registry) {
      registry = new FreeModelRegistry({ key: 'free_image_models' });
    }
    registry.models = fresh;
    registry.lastCheckedDay = today;
    await registry.save();

    return { models: fresh, checkedAt: new Date().toISOString(), source: 'fresh', dropped };
  }

  // Catalog unreachable: use cache if present, otherwise the hardcoded fallback.
  if (registry && registry.models.length > 0) {
    return { models: registry.models, checkedAt: registry.updatedAt.toISOString(), source: 'cache', dropped };
  }
  return { models: FALLBACK_MODELS, checkedAt: new Date().toISOString(), source: 'fallback', dropped };
}

async function dbConnectSafe(): Promise<void> {
  const dbConnect = (await import('@/lib/db')).default;
  await dbConnect();
}