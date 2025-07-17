import { PATCH } from '../../src/app/api/designs/[designId]/favorite/route';
import { NextResponse } from 'next/server';
import { auth } from '../../src/lib/firebaseAdmin';

// Mock external dependencies
jest.mock('../../src/models/DesignModel', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
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

describe('PATCH /api/designs/[designId]/favorite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock for auth.verifyIdToken for tests requiring a valid token
    (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: 'test-user-id' });
  });

  it('should return 401 if authorization token is missing', async () => {
    const mockRequest = {
      headers: new Headers(),
    } as any;
    const mockContext = { params: { designId: '123' } };

    const response = await PATCH(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authorization token missing.');
  });

  it('should return 401 if authorization token is invalid', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer invalid-token' }),
    } as any;
    const mockContext = { params: { designId: '123' } };
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (auth.verifyIdToken as jest.Mock).mockRejectedValueOnce(new Error('Invalid token')); // Override for this specific test

    const response = await PATCH(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid authorization token.');
    consoleErrorSpy.mockRestore();
  });

  it('should return 404 if design is not found', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
    } as any;
    const mockContext = { params: { designId: 'non-existent-id' } };

    const DesignModel = require('../../src/models/DesignModel').default;
    DesignModel.findOne.mockResolvedValueOnce(null);

    const response = await PATCH(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Design not found.');
  });

  it('should return 403 if user does not own the design', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
    } as any;
    const mockContext = { params: { designId: 'design-id' } };

    const DesignModel = require('../../src/models/DesignModel').default;
    DesignModel.findOne.mockResolvedValueOnce({
      userId: 'another-user-id',
      imageUrl: 'http://example.com/image.jpg',
    });

    const response = await PATCH(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Unauthorized: You do not own this design.');
  });

  it('should toggle isFavorite status and return 200 on success', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
    } as any;
    const mockContext = { params: { designId: 'design-id' } };

    const DesignModel = require('../../src/models/DesignModel').default;
    const mockDesign = {
      userId: 'test-user-id',
      isFavorite: false,
      save: jest.fn().mockResolvedValueOnce({}),
    };
    DesignModel.findOne.mockResolvedValueOnce(mockDesign);

    const response = await PATCH(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Favorite status updated successfully!');
    expect(data.design.isFavorite).toBe(true);
    expect(mockDesign.save).toHaveBeenCalled();

    // Test toggling back to false
    mockDesign.isFavorite = true; // Set to true for the next call
    DesignModel.findOne.mockResolvedValueOnce(mockDesign);

    const response2 = await PATCH(mockRequest, mockContext);
    const data2 = await response2.json();

    expect(response2.status).toBe(200);
    expect(data2.message).toBe('Favorite status updated successfully!');
    expect(data2.design.isFavorite).toBe(false);
    expect(mockDesign.save).toHaveBeenCalledTimes(2);
  });
});