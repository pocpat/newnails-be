import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON || '{}');

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Firebase Admin initialization error', error);
      throw new Error('Failed to initialize Firebase Admin SDK.');
    }
  }
  return { auth: admin.auth(), db: admin.firestore() };
}

export { initializeFirebaseAdmin };
