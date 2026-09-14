import { runModelCheck, CANDIDATE_MODELS, FALLBACK_MODELS } from '../../src/utils/modelCheckAgent';
import FreeModelRegistry from '../../src/models/FreeModelRegistry';

// Mock the agent's external fetch + DB layer
jest.mock('axios', () => ({
  get: jest.fn(),
  isAxiosError: jest.fn((e: unknown) => e instanceof Error),
}));
jest.mock('../../src/lib/db', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

const mockedCatalog = {
  'stabilityai/sdxl-turbo:free': {
    output: ['image'],
    supported_params: { text: true },
    providers: [{ pricing: { type: 'fixed', value: 0 } }],
  },
  'black-forest-labs/FLUX-1-schnell:free': {
    output: ['image'],
    supported_params: { text: true },
    providers: [{ pricing: { type: 'fixed', value: 0 } }],
  },
  // Candidate present but NOT usable: not free-of-charge at provider level
  'HiDream-ai/HiDream-I1-Fast:free': {
    output: ['image'],
    supported_params: { text: true },
    providers: [{ pricing: { type: 'fixed', value: 0.001 } }],
  },
  // Candidate present but not text-to-image
  'Tongyi-MAI/Z-Image-Turbo:free': {
    output: ['image'],
    supported_params: { text: false },
    providers: [{ pricing: { type: 'fixed', value: 0 } }],
  },
  'google/gemini-2.0-flash-exp:free': undefined, // dead: absent from catalog
};

const { get: axiosGet } = require('axios');

describe('modelCheckAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (FreeModelRegistry.findOne as any) = jest.fn().mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (FreeModelRegistry as any).prototype.save = jest.fn().mockResolvedValue({});
  });

  it('drops dead / paid / non-text-to-image candidates and keeps healthy ones', async () => {
    axiosGet.mockResolvedValue({ data: mockedCatalog });

    const result = await runModelCheck();

    expect(result.source).toBe('fresh');
    expect(result.models).toEqual(
      expect.arrayContaining(['stabilityai/sdxl-turbo:free', 'black-forest-labs/FLUX-1-schnell:free'])
    );
    expect(result.models).not.toContain('google/gemini-2.0-flash-exp:free'); // dead
    expect(result.models).not.toContain('HiDream-ai/HiDream-I1-Fast:free'); // not zero-cost
    expect(result.models).not.toContain('Tongyi-MAI/Z-Image-Turbo:free'); // not text->image
    expect(result.models).not.toContain('qwen/qwen-image:free'); // dead: absent from catalog
    expect(result.dropped).toEqual(
      expect.arrayContaining(['qwen/qwen-image:free', 'black-forest-labs/FLUX-2-klein-4b:free'])
    );
    expect(result.models.every((m) => CANDIDATE_MODELS.includes(m))).toBe(true);
  });

  it('serves cache when the check already ran today', async () => {
    const today = new Date().toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (FreeModelRegistry.findOne as any).mockResolvedValue({
      models: ['stabilityai/sdxl-turbo:free'],
      lastCheckedDay: today,
      updatedAt: new Date(),
    });

    const result = await runModelCheck();

    expect(result.source).toBe('cache');
    expect(axiosGet).not.toHaveBeenCalled();
    expect(result.models).toEqual(['stabilityai/sdxl-turbo:free']);
  });

  it('falls back to cache when the catalog is unreachable', async () => {
    axiosGet.mockRejectedValue(new Error('network down'));
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (FreeModelRegistry.findOne as any).mockResolvedValue({
      models: ['stabilityai/sdxl-turbo:free'],
      lastCheckedDay: yesterday,
      updatedAt: new Date(),
    });

    const result = await runModelCheck();

    expect(result.source).toBe('cache');
    expect(result.models).toEqual(['stabilityai/sdxl-turbo:free']);
  });

  it('falls back to FALLBACK_MODELS when there is no cache and catalog fails', async () => {
    axiosGet.mockRejectedValue(new Error('network down'));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (FreeModelRegistry.findOne as any).mockResolvedValue(null);

    const result = await runModelCheck();

    expect(result.source).toBe('fallback');
    expect(result.models).toEqual(FALLBACK_MODELS);
  });
});