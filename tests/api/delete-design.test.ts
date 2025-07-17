import { DELETE } from '../../src/app/api/designs/[designId]/route';
import { NextResponse } from 'next/server';

// Mock external dependencies
jest.mock('../../src/models/DesignModel', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
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

jest.mock('@vercel/blob', () => ({
  del: jest.fn(),
}));

describe('DELETE /api/designs/[designId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authorization token is missing', async () => {
    const mockRequest = {
      headers: new Headers(),
    } as any;
    const mockContext = { params: { designId: '123' } };

    const response = await DELETE(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authorization token missing.');
  });

  it('should return 401 if authorization token is invalid', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer invalid-token' }),
    } as any;
    const mockContext = { params: { designId: '123' } };

    const { auth } = require('../../src/lib/firebaseAdmin');
    auth.verifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

    const response = await DELETE(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid authorization token.');
  });

  it('should return 404 if design is not found', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
    } as any;
    const mockContext = { params: { designId: 'non-existent-id' } };

    const { auth } = require('../../src/lib/firebaseAdmin');
    auth.verifyIdToken.mockResolvedValueOnce({ uid: 'test-user-id' });

    const DesignModel = require('../../src/models/DesignModel').default;
    DesignModel.findOne.mockResolvedValueOnce(null);

    const response = await DELETE(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Design not found.');
  });

  it('should return 403 if user does not own the design', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
    } as any;
    const mockContext = { params: { designId: 'design-id' } };

    const { auth } = require('../../src/lib/firebaseAdmin');
    auth.verifyIdToken.mockResolvedValueOnce({ uid: 'test-user-id' });

    const DesignModel = require('../../src/models/DesignModel').default;
    DesignModel.findOne.mockResolvedValueOnce({
      userId: 'another-user-id',
      imageUrl: 'http://example.com/image.jpg',
    });

    const response = await DELETE(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Unauthorized: You do not own this design.');
  });

  it('should delete the design and return 200 on success', async () => {
    const mockRequest = {
      headers: new Headers({ Authorization: 'Bearer valid-token' }),
    } as any;
    const mockContext = { params: { designId: 'design-id' } };

    const { auth } = require('../../src/lib/firebaseAdmin');
    auth.verifyIdToken.mockResolvedValueOnce({ uid: 'test-user-id' });

    const DesignModel = require('../../src/models/DesignModel').default;
    DesignModel.findOne.mockResolvedValueOnce({
      userId: 'test-user-id',
      imageUrl: 'http://example.com/image.jpg',
    });
    DesignModel.deleteOne.mockResolvedValueOnce({});

    const { del } = require('@vercel/blob');
    (del as jest.Mock).mockResolvedValueOnce({});

    const response = await DELETE(mockRequest, mockContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Design deleted successfully!');
    expect(DesignModel.deleteOne).toHaveBeenCalledWith({ _id: 'design-id' });
    expect(del).toHaveBeenCalledWith('http://example.com/image.jpg');
  });
});
