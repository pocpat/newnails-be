import admin from 'firebase-admin';

let initializedAdmin: admin.app.App | null = null;

export function initializeFirebaseAdmin() {
  if (!initializedAdmin) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON as string);
      initializedAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error initializing Firebase Admin SDK:', error.message);
      } else {
        console.error('An unknown error occurred during Firebase Admin SDK initialization.', error);
      }
    }
  }
  if (!initializedAdmin) {
    throw new Error("Firebase Admin SDK failed to initialize.");
  }
  return initializedAdmin;
}
