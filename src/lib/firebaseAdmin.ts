import * as admin from 'firebase-admin';

// NEW LOG TO FORCE A REBUILD
console.log('Initializing Firebase Admin SDK (v2)...');

export function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    throw new Error(
      'Firebase environment variable FIREBASE_SERVICE_ACCOUNT_BASE64 is not set.'
    );
  }

  try {
    const serviceAccountJson = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      'base64'
    ).toString('utf-8');

    const serviceAccount = JSON.parse(serviceAccountJson);

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw new Error('Could not initialize Firebase Admin SDK. Check the FIREBASE_SERVICE_ACCOUNT_BASE64 variable.');
  }
}

// Optional: A function to get the initialized app instance
export function getFirebaseAdmin() {
  return initializeFirebaseAdmin();
}