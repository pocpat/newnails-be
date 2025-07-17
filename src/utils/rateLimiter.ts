import { db } from '../lib/firebaseAdmin';

const DAILY_GENERATION_LIMIT = 20;
const TOTAL_STORAGE_LIMIT = 40;

export async function checkDailyGenerationLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    const userData = userDoc.data();
    const lastGenerationDate = userData?.lastGenerationDate?.toDate();
    const generationCount = userData?.generationCount || 0;

    if (lastGenerationDate && lastGenerationDate.getTime() >= today.getTime()) {
      if (generationCount >= DAILY_GENERATION_LIMIT) {
        return { allowed: false, message: 'Daily generation limit reached.' };
      }
    }
  }
  return { allowed: true };
}

export async function incrementGenerationCount(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  let generationCount = 1;
  let lastGenerationDate = today;

  if (userDoc.exists) {
    const userData = userDoc.data();
    const prevLastGenerationDate = userData?.lastGenerationDate?.toDate();
    const prevGenerationCount = userData?.generationCount || 0;

    if (prevLastGenerationDate && prevLastGenerationDate.getTime() >= today.getTime()) {
      generationCount = prevGenerationCount + 1;
    }
  }

  await userRef.set({
    lastGenerationDate: lastGenerationDate,
    generationCount: generationCount,
  }, { merge: true });
}

export async function checkTotalStorageLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  const userDesignsRef = db.collection('user_designs').where('userId', '==', userId);
  const snapshot = await userDesignsRef.get();

  if (snapshot.size >= TOTAL_STORAGE_LIMIT) {
    return { allowed: false, message: 'Total storage limit reached.' };
  }
  return { allowed: true };
}
