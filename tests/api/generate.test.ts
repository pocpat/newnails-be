import { POST } from '../../src/app/api/generate/route';
import { NextResponse } from 'next/server';
import { auth } from '../../src/lib/firebaseAdmin';

// Mock external dependencies
jest.mock('../../src/utils/imageRouter', () => ({
  generateImage: jest.fn(),
}));

jest.mock('../../src/utils/rateLimiter', () => ({
  checkDailyGenerationLimit: jest.fn(),
  incrementGenerationCount: jest.fn(),
}));

jest.mock('../../src/lib/firebaseAdmin', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

describe('POST /api/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authorization token is missing', async () => {
    const mockRequest = {
      headers: new Headers(),
      json: () => Promise.resolve({}),
    } as any; // Cast to any to bypass type checking for mock

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authorization token missing.');
  });

  it('should return 401 if authorization token is invalid', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer invalid-token' }),
      json: () => Promise.resolve({}),
    } as any;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (auth.verifyIdToken as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid authorization token.');
    consoleErrorSpy.mockRestore();
  });

  it('should return 429 if daily generation limit is reached', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
      json: () => Promise.resolve({
        prompt: 'test',
        model: 'test-model',
      }),
    } as any;

    (auth.verifyIdToken as jest.Mock).mockResolvedValueOnce({ uid: 'test-user-id' });

    const { checkDailyGenerationLimit } = require('../../src/utils/rateLimiter');
    checkDailyGenerationLimit.mockResolvedValueOnce({
      allowed: false,
      message: 'Daily generation limit reached.',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Daily generation limit reached.');
  });

  it('should return generated image URLs on success', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
      json: () => Promise.resolve({
        prompt: 'test',
        model: 'test-model',
        negative_prompt: 'bad',
        n: 1,
        size: '512x512',
      }),
    } as any;
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    (auth.verifyIdToken as jest.Mock).mockResolvedValueOnce({ uid: 'test-user-id' });

    const { checkDailyGenerationLimit, incrementGenerationCount } = require('../../src/utils/rateLimiter');
    checkDailyGenerationLimit.mockResolvedValueOnce({ allowed: true });

    const { generateImage } = require('../../src/utils/imageRouter');
    generateImage.mockResolvedValueOnce(['url1', 'url2']);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.imageUrls).toEqual(['url1', 'url2']);
    expect(generateImage).toHaveBeenCalledWith({
      prompt: 'test',
      model: 'test-model',
      negative_prompt: 'bad',
      n: 1,
      size: '512x512',
    });
    expect(incrementGenerationCount).toHaveBeenCalledWith('test-user-id');
    consoleLogSpy.mockRestore();
  });
});