import { NextResponse } from 'next/server';
import { generateImage } from '@/utils/imageRouter';


export async function POST(request: Request) {
  const { prompt, model, negative_prompt, n, size } = await request.json();

  console.log('Received generate request with:');
  console.log('  Prompt:', prompt);
  console.log('  Model:', model);
  console.log('  N:', n);
  console.log('  Size:', size);

  if (!prompt || !model) {
    return NextResponse.json({ error: 'Prompt and model are required.' }, { status: 400 });
  }

  try {
    const imageUrls = await generateImage({
      prompt,
      model,
      negative_prompt,
      n,
      size,
    });
    return NextResponse.json({ imageUrls });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image.' }, { status: 500 });
  }
}
