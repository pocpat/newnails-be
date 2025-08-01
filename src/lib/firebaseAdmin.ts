import * as admin from 'firebase-admin';

/**
 * A singleton pattern to initialize Firebase Admin SDK only once.
 * This prevents re-initialization on every hot-reload in development
 * and on every function invocation in a serverless environment.
 */
export function initializeFirebaseAdmin(): admin.app.App {
  // If the app is already initialized, return the existing instance.
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

// Get the key from environment variables.
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON!;

// Repair the newline characters that get corrupted by Vercel.
const repairedServiceAccountString = serviceAccountString.replace(/\\n/g, '\n');

// Now parse the repaired string.
const serviceAccount = JSON.parse(repairedServiceAccountString);
  // Initialize the Firebase Admin SDK.
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}