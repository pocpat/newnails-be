import axios from 'axios';

const IMAGEROUTER_API_KEY = process.env.IMAGEROUTER_API_KEY;
const IMAGEROUTER_BASE_URL = 'https://api.imagerouter.io/v1/openai/images/generations';

interface ImageGenerationOptions {
  prompt: string;
  model: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_images?: number;
}

export async function generateImage(options: ImageGenerationOptions): Promise<string[]> {
  if (!IMAGEROUTER_API_KEY) {
    console.error('IMAGEROUTER_API_KEY is not defined.');
    throw new Error('IMAGEROUTER_API_KEY is not defined in environment variables.');
  }

  console.log('Attempting to call ImageRouter API:');
  console.log('  URL:', IMAGEROUTER_BASE_URL);
  console.log('  Model:', options.model);
  console.log('  API Key (last 4 chars):', IMAGEROUTER_API_KEY.slice(-4));

  try {
    const response = await axios.post(
      IMAGEROUTER_BASE_URL,
      {
        prompt: options.prompt,
        model: options.model,
        negative_prompt: options.negative_prompt,
        width: options.width,
        height: options.height,
        num_images: options.num_images,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${IMAGEROUTER_API_KEY}`,
        },
      }
    );

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: any) => item.url) as string[];
    } else {
      throw new Error('Invalid response from ImageRouter API.');
    }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('ImageRouter API Axios Error:', error.response?.status, error.response?.data || error.message);
      throw new Error(`ImageRouter API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    } else {
      console.error('Unexpected error during image generation:', error);
      throw new Error('An unexpected error occurred during image generation.');
    }
  }
}

