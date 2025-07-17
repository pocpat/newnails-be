import { checkDailyGenerationLimit, incrementGenerationCount, checkTotalStorageLimit } from '../../src/utils/rateLimiter';
import { db } from '../../src/lib/firebaseAdmin';

// Mock Firebase Admin SDK's firestore
jest.mock('../../src/lib/firebaseAdmin', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(), // Add mock for set method
    where: jest.fn().mockReturnThis(), // Add mock for where method
    limit: jest.fn().mockReturnThis(), // Add mock for limit method
  },
}));

describe('Rate Limiter - checkDailyGenerationLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return allowed: false if daily generation limit is reached', async () => {
    const userId = 'testUser123';
    const mockDate = new Date();
    mockDate.setHours(0, 0, 0, 0);

    // Mock the database response to simulate limit reached
    (db.collection('users').doc('testUser123').get as jest.Mock).mockResolvedValueOnce({
      exists: true,
      data: () => ({
        lastGenerationDate: { toDate: () => mockDate },
        generationCount: 20,
      }),
    });

    const result = await checkDailyGenerationLimit(userId);

    expect(result.allowed).toBe(false);
    expect(result.message).toBe('Daily generation limit reached.');
  });

  it('should return allowed: true if daily generation limit is NOT reached', async () => {
    const userId = 'testUser456';
    const mockDate = new Date();
    mockDate.setHours(0, 0, 0, 0);

    // Mock the database response to simulate limit NOT reached
    (db.collection('users').doc('testUser456').get as jest.Mock).mockResolvedValueOnce({
      exists: true,
      data: () => ({
        lastGenerationDate: { toDate: () => mockDate },
        generationCount: 10, // Less than 20
      }),
    });

    const result = await checkDailyGenerationLimit(userId);

    expect(result.allowed).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('should return allowed: true if user has no previous generation data', async () => {
    const userId = 'newUser789';

    // Mock the database response to simulate no existing user data
    (db.collection('users').doc('newUser789').get as jest.Mock).mockResolvedValueOnce({
      exists: false,
      data: () => undefined, // No data for a non-existent user
    });

    const result = await checkDailyGenerationLimit(userId);

    expect(result.allowed).toBe(true);
    expect(result.message).toBeUndefined();
  });
});

describe('Rate Limiter - incrementGenerationCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should increment generation count for an existing user on the same day', async () => {
    const userId = 'existingUser1';
    const mockDate = new Date();
    mockDate.setHours(0, 0, 0, 0);

    // Mock existing user data
    (db.collection('users').doc(userId).get as jest.Mock).mockResolvedValueOnce({
      exists: true,
      data: () => ({
        lastGenerationDate: { toDate: () => mockDate },
        generationCount: 5,
      }),
    });

    await incrementGenerationCount(userId);

    // Expect db.set to be called with incremented count and same date
    expect(db.collection('users').doc(userId).set).toHaveBeenCalledWith(
      expect.objectContaining({
        generationCount: 6,
        lastGenerationDate: expect.any(Date),
      }),
      { merge: true }
    );
  });

  it('should reset generation count for a new day', async () => {
    const userId = 'existingUser2';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mock existing user data from yesterday
    (db.collection('users').doc(userId).get as jest.Mock).mockResolvedValueOnce({
      exists: true,
      data: () => ({
        lastGenerationDate: { toDate: () => yesterday },
        generationCount: 15,
      }),
    });

    await incrementGenerationCount(userId);

    // Expect db.set to be called with count 1 and today's date
    expect(db.collection('users').doc(userId).set).toHaveBeenCalledWith(
      expect.objectContaining({
        generationCount: 1,
        lastGenerationDate: expect.any(Date),
      }),
      { merge: true }
    );
  });

  it('should initialize generation count for a new user', async () => {
    const userId = 'newUser';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mock no existing user data
    (db.collection('users').doc(userId).get as jest.Mock).mockResolvedValueOnce({
      exists: false,
      data: () => undefined,
    });

    await incrementGenerationCount(userId);

    // Expect db.set to be called with count 1 and today's date
    expect(db.collection('users').doc(userId).set).toHaveBeenCalledWith(
      expect.objectContaining({
        generationCount: 1,
        lastGenerationDate: expect.any(Date),
      }),
      { merge: true }
    );
  });
});

describe('Rate Limiter - checkTotalStorageLimit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return allowed: false if total storage limit is reached', async () => {
    const userId = 'storageUser1';

    // Mock the database response to simulate limit reached
    (db.collection('user_designs').where('userId', '==', userId).get as jest.Mock).mockResolvedValueOnce({
      size: 40, // Equal to limit
    });

    const result = await checkTotalStorageLimit(userId);

    expect(result.allowed).toBe(false);
    expect(result.message).toBe('Total storage limit reached.');
  });

  it('should return allowed: true if total storage limit is NOT reached', async () => {
    const userId = 'storageUser2';

    // Mock the database response to simulate limit NOT reached
    (db.collection('user_designs').where('userId', '==', userId).get as jest.Mock).mockResolvedValueOnce({
      size: 10, // Less than limit
    });

    const result = await checkTotalStorageLimit(userId);

    expect(result.allowed).toBe(true);
    expect(result.message).toBeUndefined();
  });
});