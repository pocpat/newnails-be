import DesignModel from '@/models/DesignModel';

// const DAILY_GENERATION_LIMIT = 20;
const TOTAL_STORAGE_LIMIT = 40;

// This function is a placeholder and needs to be implemented with a proper user model if you want to track daily limits.
// For now, we will just check the total storage limit.
export async function checkDailyGenerationLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  // This will require adding a user schema with fields for lastGenerationDate and generationCount.
  console.log(`Daily generation limit check for user ${userId} is not yet implemented. Allowing request.`);
  return { allowed: true };
}

// This function is a placeholder and needs to be implemented with a proper user model.
export async function incrementGenerationCount(userId: string) {
  // TODO: Implement incrementing generation count in a user model in MongoDB.
  console.log(`Incrementing generation count for user ${userId} is not yet implemented.`);
}

export async function checkTotalStorageLimit(userId: string): Promise<{ allowed: boolean; message?: string }> {
  try {
    const designCount = await DesignModel.countDocuments({ userId: userId });

    if (designCount >= TOTAL_STORAGE_LIMIT) {
      return { allowed: false, message: 'Total storage limit reached.' };
    }
    return { allowed: true };
  } catch (error) {
    console.error('Error checking total storage limit:', error);
    // Fail open to not block users if the check fails
    return { allowed: true };
  }
}