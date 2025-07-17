import { POST } from '../../../src/app/api/auth/revoke-token/route';
import { auth } from '../../../src/lib/firebaseAdmin';
import { NextRequest } from 'next/server';

// Mock the Firebase Admin SDK
jest.mock('../../../src/lib/firebaseAdmin', () => ({
  auth: {
    revokeRefreshTokens: jest.fn(),
  },
}));

describe('POST /api/auth/revoke-token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should revoke refresh tokens for a given UID', async () => {
    const mockUid = 'test-user-uid';

    const request = new NextRequest('http://localhost/api/auth/revoke-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: mockUid }),
    });

    (auth.revokeRefreshTokens as jest.Mock).mockResolvedValue(undefined);

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe(`Refresh tokens revoked for user ${mockUid}.`);
    expect(auth.revokeRefreshTokens).toHaveBeenCalledWith(mockUid);
  });

  it('should return 400 if UID is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/revoke-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('User UID is required.');
    expect(auth.revokeRefreshTokens).not.toHaveBeenCalled();
  });

  it('should return 500 if revoking tokens fails', async () => {
    const mockUid = 'test-user-uid';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const request = new NextRequest('http://localhost/api/auth/revoke-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: mockUid }),
    });

    (auth.revokeRefreshTokens as jest.Mock).mockRejectedValue(new Error('Firebase error'));

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to revoke refresh tokens.');
    expect(body.details).toBe('Firebase error');
    expect(auth.revokeRefreshTokens).toHaveBeenCalledWith(mockUid);
    consoleErrorSpy.mockRestore();
  });
});
