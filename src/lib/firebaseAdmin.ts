import * as admin from 'firebase-admin';

let serviceAccount;

// In a production environment (like Vercel), the key is stored in an env var
if (process.env.NODE_ENV === 'production') {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY_JSON environment variable is not set.');
  }
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);
} else {
  // In a local development environment, we load the key from a local file
  try {
    serviceAccount = require('../../firebase-service-account-key.json');
  } catch (error) {
    throw new Error('Could not load firebase-service-account-key.json. Make sure the file exists in the root of the newnails-be project.');
  }
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
  }
}

export const auth = admin.auth();
export const db = admin.firestore();
