import React from 'react';

export default function SEO({ 
  title = "Hackov8 - Discover & Participate in Hackathons",
  description = "Join Hackov8 to discover hackathons, build innovative projects, compete with developers worldwide, and win amazing prizes.",
  keywords = "hackathon, coding competition, developer events, programming contests",
  ogImage = "https://hackov8.xyz/og-image.png",
  url = "https://hackov8.xyz",
  type = "website",
  structuredData = null
}) {
  const fullTitle = title.includes('Hackov8') ? title : `${title} | Hackov8`;
  
  return (
    <>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Hackov8" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </>
  );
}
