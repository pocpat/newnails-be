import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import axios from 'axios';
import DesignModel from '@/models/DesignModel';
import dbConnect from '@/lib/db';


export async function POST(request: Request): Promise<NextResponse> {
  await dbConnect();

  const { prompt, temporaryImageUrl } = await request.json();

  if (!prompt || !temporaryImageUrl) {
    return NextResponse.json({ error: 'Prompt and temporary image URL are required.' }, { status: 400 });
  }

  try {
    const imageResponse = await axios.get(temporaryImageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    const urlParts = temporaryImageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: imageResponse.headers['content-type'],
    });

    const newDesign = new DesignModel({
      userId,
      prompt,
      imageUrl: blob.url,
      isFavorite: false,
    });
    await newDesign.save();

    return NextResponse.json({ message: 'Design saved successfully!', design: newDesign, blob });
  } catch (error: any) {
    console.error('Error saving design:', error);
    return NextResponse.json({ error: error.message || 'Failed to save design.' }, { status: 500 });
  }
}
