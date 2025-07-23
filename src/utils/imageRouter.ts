import axios from 'axios';

const IMAGEROUTER_API_KEY = process.env.IMAGEROUTER_API_KEY;
const IMAGEROUTER_BASE_URL = 'https://api.imagerouter.io/v1/openai/images/generations';

interface ImageGenerationOptions {
  prompt: string;
  model: string;
  negative_prompt?: string;
  n?: number; // Number of images to generate
  size?: string; // Image size, e.g., "1024x1024"
}

export async function generateImage(options: ImageGenerationOptions): Promise<string[]> {
  console.log('ImageRouter: Checking for API Key...');
  if (!IMAGEROUTER_API_KEY) {
    console.error('ImageRouter Error: IMAGEROUTER_API_KEY is not defined in the environment.');
    throw new Error('Configuration error: Image generation API key is missing.');
  }
  console.log('ImageRouter: API Key is present. Type:', typeof IMAGEROUTER_API_KEY, 'Length:', IMAGEROUTER_API_KEY.length);

  console.log('Attempting to call ImageRouter API:');
  console.log('  URL:', IMAGEROUTER_BASE_URL);
  console.log('  Model:', options.model);
  console.log('  API Key (last 4 chars):', IMAGEROUTER_API_KEY.slice(-4));
  console.log('  N:', options.n);
  console.log('  Size:', options.size);

  try {
    const response = await axios.post(
      IMAGEROUTER_BASE_URL,
      {
        prompt: options.prompt,
        model: options.model,
        n: options.n,
        size: options.size,
        negative_prompt: options.negative_prompt,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${IMAGEROUTER_API_KEY}`,
        },
      }
    );

    console.log('ImageRouter API response data:', response.data);
    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: { url: string }) => item.url) as string[];
    } else {
      console.error('Unexpected ImageRouter API response format:', response.data);
      throw new Error('Invalid response from ImageRouter API.');
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('ImageRouter API Axios Error:', error.response?.status, error.response?.data || error.message);
      throw new Error(`ImageRouter API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    } else {
      console.error('Unexpected error during image generation:', error);
      throw new Error('An unexpected error occurred during image generation.');
    }
  }
}

