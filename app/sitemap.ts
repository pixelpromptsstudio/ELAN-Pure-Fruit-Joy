import type { MetadataRoute } from 'next';
import { CANONICAL_URL, toAbsoluteUrl } from '@/lib/seo';
import { FLAVOURS, GALLERY_ITEMS } from '@/lib/constants';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const uniqueImages = Array.from(
    new Set([
      toAbsoluteUrl('/pr1/lineup.png'),
      ...FLAVOURS.map((f) => toAbsoluteUrl(f.image)),
      toAbsoluteUrl('/pr2/packaging-poster.webp'),
      ...GALLERY_ITEMS.map((g) => toAbsoluteUrl(g.image)),
    ])
  );

  return [
    {
      url: CANONICAL_URL,
      lastModified: new Date('2026-11-13T00:00:00.000Z'),
      changeFrequency: 'weekly',
      priority: 1,
      images: uniqueImages,
    },
  ];
}

