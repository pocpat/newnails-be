export const generateMockDesigns = (count: number = 5) => {
  const mockImageUrls = [];
  for (let i = 0; i < count; i++) {
    // Using a placeholder image service to get varied images
    const imageUrl = `https://picsum.photos/512/512?random=${i}`;
    mockImageUrls.push(imageUrl);
  }
  return { imageUrls: mockImageUrls };
};