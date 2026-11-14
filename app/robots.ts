import type { MetadataRoute } from 'next';
import { BASE_PATH, SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const apiPath = BASE_PATH ? `${BASE_PATH}/api/` : '/api/';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: BASE_PATH ? [apiPath, '/api/'] : '/api/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

