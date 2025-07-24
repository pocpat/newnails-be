import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkDailyGenerationLimit, checkTotalStorageLimit } from '../../../utils/rateLimiter';
import { generateImage } from '../../../utils/imageRouter';
import { generateMockDesigns } from '../../../utils/mockData'; // Import the mock data generator

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if API mocking is enabled
    if (process.env.MOCK_API === 'true') {
      console.log("API mocking is enabled. Returning mock data.");
      const mockData = generateMockDesigns(5); // Generate 5 mock images
      return NextResponse.json(mockData);
    }

    // Rate limiting checks
    const dailyLimit = await checkDailyGenerationLimit(userId);
    if (!dailyLimit.allowed) {
      return new NextResponse(dailyLimit.message, { status: 429 });
    }

    const storageLimit = await checkTotalStorageLimit(userId);
    if (!storageLimit.allowed) {
      return new NextResponse(storageLimit.message, { status: 429 });
    }

    const body = await req.json();
    const { prompt, model, n, size } = body;

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const imageUrls = await generateImage({ prompt, model, n, size });

    return NextResponse.json({ imageUrls });
  } catch (error) {
    console.error("Error in /api/generate:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

