import { GET } from '../../src/app/api/my-designs/route';
import { NextResponse } from 'next/server';
import { auth } from '../../src/lib/firebaseAdmin';

// Mock external dependencies
jest.mock('../../src/models/DesignModel', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn(),
  },
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

describe('GET /api/my-designs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authorization token is missing', async () => {
    const mockRequest = {
      headers: new Headers(),
    } as any; // Cast to any to bypass type checking for mock

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authorization token missing.');
  });

  it('should return 401 if authorization token is invalid', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer invalid-token' }),
    } as any;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (auth.verifyIdToken as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'));

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid authorization token.');
    consoleErrorSpy.mockRestore();
  });

  it('should return designs for the authenticated user on success', async () => {
    const userId = 'test-user-id';
    const mockDesigns = [
      { userId, prompt: 'design 1', imageUrl: 'url1' },
      { userId, prompt: 'design 2', imageUrl: 'url2' },
    ];

    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
    } as any;

    (auth.verifyIdToken as jest.Mock).mockResolvedValueOnce({ uid: userId });

    const DesignModel = require('../../src/models/DesignModel').default;
    DesignModel.find.mockReturnThis();
    DesignModel.sort.mockResolvedValueOnce(mockDesigns);

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockDesigns);
    expect(DesignModel.find).toHaveBeenCalledWith({ userId });
    expect(DesignModel.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });
});
