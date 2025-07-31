import axios from 'axios';

const IMAGEROUTER_API_KEY = process.env.IMAGEROUTER_API_KEY;
const IMAGEROUTER_BASE_URL = 'https://api.imagerouter.io/v1/openai/images/generations';

interface ImageGenerationOptions {
  prompt: string;
  model: string;
  negative_prompt?: string;
  num_images?: number;
  width?: number;
  height?: number;
}

export async function generateImage(options: ImageGenerationOptions): Promise<string[]> {
  if (!IMAGEROUTER_API_KEY) {
    console.error('ImageRouter Error: IMAGEROUTER_API_KEY is not defined.');
    throw new Error('Configuration error: Image generation API key is missing.');
  }

  try {
    const response = await axios.post(
      IMAGEROUTER_BASE_URL,
      {
        prompt: options.prompt,
        model: options.model,
        num_images: options.num_images,
        width: options.width,
        height: options.height,
        negative_prompt: options.negative_prompt,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${IMAGEROUTER_API_KEY}`,
        },
      }
    );

    if (response.data && Array.isArray(response.data.data)) {
      return response.data.data.map((item: { url: string }) => item.url);
    } else {
      console.error('Unexpected ImageRouter API response format:', response.data);
      throw new Error('Invalid response from ImageRouter API.');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Log the detailed error from the API response
      const status = error.response?.status;
      const data = error.response?.data;
      console.error(`ImageRouter API Axios Error: Status ${status}`, data);
      
      // Create a more informative error message
      const message = data?.error?.message || data?.message || 'An unknown API error occurred.';
      throw new Error(`ImageRouter API Error: ${status} - ${message}`);
    } else {
      // Handle non-Axios errors
      console.error('Unexpected error during image generation:', error);
      throw new Error('An unexpected error occurred during image generation.');
    }
  }
}
