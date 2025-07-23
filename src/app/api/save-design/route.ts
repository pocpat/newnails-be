import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';
import { checkTotalStorageLimit } from '@/utils/rateLimiter';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const userId = await verifyAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 401 });
  }

  await dbConnect();

  const { prompt, temporaryImageUrl } = await request.json();

  if (!prompt || !temporaryImageUrl) {
    return NextResponse.json({ error: 'Prompt and temporary image URL are required.' }, { status: 400 });
  }

  try {
    const { allowed, message } = await checkTotalStorageLimit(userId);
    if (!allowed) {
      return NextResponse.json({ error: message }, { status: 429 });
    }

    const imageResponse = await axios.get(temporaryImageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    // Use the URL constructor for more robust parsing of the filename.
    const filename = new URL(temporaryImageUrl).pathname.split('/').pop();

    if (!filename) {
      return NextResponse.json({ error: 'Could not determine filename from temporary URL.' }, { status: 400 });
    }

    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: imageResponse.headers['content-type'],
    });

    const newDesign = new DesignModel({
      userId, // Save the userId
      prompt,
      imageUrl: blob.url,
      isFavorite: false,
    });
    await newDesign.save();

    // It's best practice to return only the data the client needs.
    // Avoid exposing the entire database model or blob storage response.
    return NextResponse.json({
      message: 'Design saved successfully!',
      designId: newDesign._id,
    });
  } catch (error: unknown) {
    console.error('Error saving design:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to save design.' }, { status: 500 });
  }
}
