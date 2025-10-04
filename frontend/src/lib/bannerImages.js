// Random cool banner images for hackathons
const BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=400&fit=crop', // Code on screen
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&h=400&fit=crop', // Coding workspace
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=400&fit=crop', // Code editor
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=400&fit=crop', // Laptop and tech
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&h=400&fit=crop', // Developer workspace
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&h=400&fit=crop', // Tech background
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=400&fit=crop', // Team collaboration
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=400&fit=crop', // Startup vibe
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=400&fit=crop', // Office teamwork
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&h=400&fit=crop', // Modern workspace
];

/**
 * Get a random banner image for hackathons without cover images
 * Uses hackathon ID to ensure consistent image per hackathon
 */
export const getRandomBanner = (hackathonId) => {
  if (!hackathonId) return BANNER_IMAGES[0];
  
  // Convert ID to a number for consistent randomness
  const hash = hackathonId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const index = Math.abs(hash) % BANNER_IMAGES.length;
  return BANNER_IMAGES[index];
};

/**
 * Get banner image for a hackathon (use cover_image if available, otherwise random)
 */
export const getHackathonBanner = (hackathon) => {
  return hackathon.cover_image || getRandomBanner(hackathon.id);
};
