import { useEffect } from 'react';

export default function SEO({ 
  title = "Hackov8 - Discover & Participate in Hackathons",
  description = "Join Hackov8 to discover hackathons, build innovative projects, compete with developers worldwide, and win amazing prizes.",
  keywords = "hackathon, coding competition, developer events, programming contests",
  ogImage = "https://hackov8.xyz/og-image.png",
  url = "https://hackov8.xyz",
  type = "website"
}) {
  const fullTitle = title.includes('Hackov8') ? title : `${title} | Hackov8`;
  
  useEffect(() => {
    // Update title
    document.title = fullTitle;
    
    // Helper to update or create meta tag
    const updateMetaTag = (selector, attribute, content) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (attribute === 'name') {
          element.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
        } else {
          element.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };
    
    // Update meta tags
    updateMetaTag('meta[name="description"]', 'name', description);
    updateMetaTag('meta[name="keywords"]', 'name', keywords);
    updateMetaTag('meta[property="og:type"]', 'property', type);
    updateMetaTag('meta[property="og:url"]', 'property', url);
    updateMetaTag('meta[property="og:title"]', 'property', fullTitle);
    updateMetaTag('meta[property="og:description"]', 'property', description);
    updateMetaTag('meta[property="og:image"]', 'property', ogImage);
    updateMetaTag('meta[property="twitter:card"]', 'property', 'summary_large_image');
    updateMetaTag('meta[property="twitter:title"]', 'property', fullTitle);
    updateMetaTag('meta[property="twitter:description"]', 'property', description);
    updateMetaTag('meta[property="twitter:image"]', 'property', ogImage);
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [fullTitle, description, keywords, ogImage, url, type]);
  
  return null;
}
