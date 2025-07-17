import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
