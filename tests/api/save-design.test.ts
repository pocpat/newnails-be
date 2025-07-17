import { POST } from '../../src/app/api/save-design/route';
import { NextResponse } from 'next/server';

// Mock external dependencies
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
}));

jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('../../src/models/DesignModel', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  })),
}));

jest.mock('../../src/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../src/lib/firebaseAdmin', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

jest.mock('../../src/utils/rateLimiter', () => ({
  checkTotalStorageLimit: jest.fn(),
}));

describe('POST /api/save-design', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authorization token is missing', async () => {
    const mockRequest = {
      headers: new Headers(),
      json: () => Promise.resolve({}),
    } as any;

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

    const { auth } = require('../../src/lib/firebaseAdmin');
    auth.verifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid authorization token.');
  });

  it('should return 429 if total storage limit is reached', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
      json: () => Promise.resolve({
        prompt: 'test',
        temporaryImageUrl: 'http://example.com/temp.jpg',
      }),
    } as any;

    const { auth } = require('../../src/lib/firebaseAdmin');
    auth.verifyIdToken.mockResolvedValueOnce({ uid: 'test-user-id' });

    const { checkTotalStorageLimit } = require('../../src/utils/rateLimiter');
    checkTotalStorageLimit.mockResolvedValueOnce({
      allowed: false,
      message: 'Total storage limit reached.',
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Total storage limit reached.');
  });

  it('should save the design and return 200 on success', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
      json: () => Promise.resolve({
        prompt: 'test prompt',
        temporaryImageUrl: 'http://example.com/temp.jpg',
      }),
    } as any;

    const { auth } = require('../../src/lib/firebaseAdmin');
    auth.verifyIdToken.mockResolvedValueOnce({ uid: 'test-user-id' });

    const { checkTotalStorageLimit } = require('../../src/utils/rateLimiter');
    checkTotalStorageLimit.mockResolvedValueOnce({ allowed: true });

    const { put } = require('@vercel/blob');
    (put as jest.Mock).mockResolvedValueOnce({ url: 'http://example.com/permanent.jpg' });

    const axios = require('axios');
    axios.get.mockResolvedValueOnce({
      data: Buffer.from('image data'),
      headers: { 'content-type': 'image/jpeg' },
    });

    const DesignModel = require('../../src/models/DesignModel').default;
    const mockDesignInstance = {
      save: jest.fn().mockResolvedValueOnce({}),
    };
    (DesignModel as jest.Mock).mockReturnValue(mockDesignInstance);

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Design saved successfully!');
    expect(data.design).toBeDefined();
    expect(put).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Buffer),
      {
        access: 'public',
        contentType: 'image/jpeg',
      }
    );
    expect(mockDesignInstance.save).toHaveBeenCalled();
    expect(DesignModel).toHaveBeenCalledWith({
      userId: 'test-user-id',
      prompt: 'test prompt',
      imageUrl: 'http://example.com/permanent.jpg',
      isFavorite: false,
    });
  });
});