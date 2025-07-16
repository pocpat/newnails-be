// In-memory rate limiter for demonstration purposes.
// For a production application, this would typically use a persistent store (e.g., Redis, database).

const GENERATION_LIMIT_PER_DAY = 20;
const STORAGE_LIMIT_PER_USER = 40;

interface UserActivity {
  generationCount: number;
  lastGenerationDate: string; // YYYY-MM-DD
  savedDesignsCount: number;
}

const userActivities = new Map<string, UserActivity>();

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function checkGenerationLimit(userId: string): { allowed: boolean; remaining: number } {
  const today = getTodayDate();
  let activity = userActivities.get(userId);

  if (!activity || activity.lastGenerationDate !== today) {
    activity = { generationCount: 0, lastGenerationDate: today, savedDesignsCount: activity?.savedDesignsCount || 0 };
    userActivities.set(userId, activity);
  }

  const allowed = activity.generationCount < GENERATION_LIMIT_PER_DAY;
  const remaining = GENERATION_LIMIT_PER_DAY - activity.generationCount;

  if (allowed) {
    activity.generationCount++;
  }

  return { allowed, remaining };
}

export function checkStorageLimit(userId: string): { allowed: boolean; remaining: number } {
  let activity = userActivities.get(userId);

  if (!activity) {
    activity = { generationCount: 0, lastGenerationDate: getTodayDate(), savedDesignsCount: 0 };
    userActivities.set(userId, activity);
  }

  const allowed = activity.savedDesignsCount < STORAGE_LIMIT_PER_USER;
  const remaining = STORAGE_LIMIT_PER_USER - activity.savedDesignsCount;

  if (allowed) {
    activity.savedDesignsCount++;
  }

  return { allowed, remaining };
}

export function incrementSavedDesigns(userId: string): void {
  let activity = userActivities.get(userId);
  if (activity) {
    activity.savedDesignsCount++;
  } else {
    userActivities.set(userId, { generationCount: 0, lastGenerationDate: getTodayDate(), savedDesignsCount: 1 });
  }
}

export function decrementSavedDesigns(userId: string): void {
  let activity = userActivities.get(userId);
  if (activity && activity.savedDesignsCount > 0) {
    activity.savedDesignsCount--;
  }
}
