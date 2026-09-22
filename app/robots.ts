import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'https://nepalmarket.id';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/saved', '/profile', '/my-products', '/login'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
