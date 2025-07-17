import { POST } from '../../../src/app/api/auth/test-signin/route';
import { auth } from '../../../src/lib/firebaseAdmin';
import { NextRequest } from 'next/server';

// Mock the Firebase Admin SDK
jest.mock('../../../src/lib/firebaseAdmin', () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

describe('POST /api/auth/test-signin', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return user data for a valid token', async () => {
    const mockToken = 'valid-firebase-id-token';
    const mockDecodedToken = { uid: '12345', email: 'test@example.com' };

    // Configure the mock to return a resolved promise with the decoded token
    (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);

    const request = new NextRequest('http://localhost/api/auth/test-signin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ uid: '12345', email: 'test@example.com' });
    expect(auth.verifyIdToken).toHaveBeenCalledWith(mockToken);
  });

  it('should return 401 if Authorization header is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/test-signin', {
      method: 'POST',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain('Authorization header is missing');
  });

  it('should return 403 if token is invalid', async () => {
    const mockToken = 'invalid-firebase-id-token';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Configure the mock to throw an error
    (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    const request = new NextRequest('http://localhost/api/auth/test-signin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain('Invalid or expired Firebase ID token');
    consoleErrorSpy.mockRestore();
  });
});
