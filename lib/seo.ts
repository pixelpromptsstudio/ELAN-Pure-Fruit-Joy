import { FLAVOURS, NUTRITION_BENEFITS } from './constants';

const isProd = process.env.NODE_ENV === 'production';
const rawBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');
const rawConfiguredUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');

function resolveSiteBase(): { origin: string; siteUrl: string } {
  const defaultOrigin = isProd ? 'https://pixelpromptsstudio.github.io' : 'http://localhost:3000';
  if (!rawConfiguredUrl) {
    return {
      origin: defaultOrigin,
      siteUrl: `${defaultOrigin}${rawBasePath}`,
    };
  }

  const parsed = new URL(rawConfiguredUrl);
  const withoutTrailingBase =
    rawBasePath && rawConfiguredUrl.endsWith(rawBasePath)
      ? rawConfiguredUrl.slice(0, -rawBasePath.length)
      : rawConfiguredUrl;

  return {
    origin: parsed.origin,
    siteUrl: `${withoutTrailingBase}${rawBasePath}`,
  };
}

const { origin: SITE_ORIGIN_VALUE, siteUrl: SITE_URL_VALUE } = resolveSiteBase();

export const BASE_PATH = rawBasePath;
export const SITE_ORIGIN = SITE_ORIGIN_VALUE;
export const SITE_URL = SITE_URL_VALUE;
export const CANONICAL_URL = `${SITE_URL}/`;

export const SITE_NAME = 'ÉLAN — Pure Fruit Joy';
export const SITE_TITLE = 'ÉLAN — Pure Fruit Joy | Cold-Pressed Raw Fruit Juice in Bhopal';
export const SITE_DESCRIPTION =
  '100% raw cold-pressed fruit juice crafted in Bhopal, India. Zero added sugar or preservatives — Alphonso Mango, Pink Guava & Berry in crystal glass.';

/**
 * Resolves either a root-relative path ('/pr1/lineup.png') or a basePath-prefixed
 * asset path ('/ELAN-Pure-Fruit-Joy/pr1/mango.webp') to an absolute canonical URL.
 */
export function toAbsoluteUrl(pathOrAsset: string): string {
  let cleanPath = pathOrAsset.startsWith('/') ? pathOrAsset : `/${pathOrAsset}`;
  if (BASE_PATH && cleanPath.startsWith(`${BASE_PATH}/`)) {
    cleanPath = cleanPath.slice(BASE_PATH.length);
  } else if (BASE_PATH && cleanPath === BASE_PATH) {
    cleanPath = '/';
  }
  return `${SITE_URL}${cleanPath}`;
}

export const OG_IMAGE_URL = toAbsoluteUrl('/pr1/lineup.png');

export function buildStructuredData() {
  const organizationId = `${CANONICAL_URL}#organization`;
  const websiteId = `${CANONICAL_URL}#website`;
  const webpageId = `${CANONICAL_URL}#webpage`;
  const listId = `${CANONICAL_URL}#flavours`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'ÉLAN Beverages India Pvt. Ltd.',
        alternateName: ['ÉLAN', 'ÉLAN Pure Fruit Joy', 'ELAN Cold Pressed Juice'],
        url: CANONICAL_URL,
        logo: {
          '@type': 'ImageObject',
          url: toAbsoluteUrl('/icon-192.png'),
          width: 192,
          height: 192,
        },
        image: OG_IMAGE_URL,
        description:
          '100% natural, unfiltered raw cold-pressed fruit juice harvested from organic orchards and crafted in Bhopal, Madhya Pradesh, India.',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Bhopal',
          addressRegion: 'Madhya Pradesh',
          addressCountry: 'IN',
        },
        knowsAbout: NUTRITION_BENEFITS.map((b) => `${b.stat} ${b.label}`),
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: CANONICAL_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'en-IN',
        publisher: { '@id': organizationId },
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: CANONICAL_URL,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        inLanguage: 'en-IN',
        isPartOf: { '@id': websiteId },
        about: { '@id': organizationId },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: OG_IMAGE_URL,
          width: 1200,
          height: 800,
        },
      },
      {
        '@type': 'ItemList',
        '@id': listId,
        name: 'ÉLAN Signature Cold-Pressed Fruit Juice Collection',
        numberOfItems: FLAVOURS.length,
        itemListElement: FLAVOURS.map((flavour, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: `ÉLAN ${flavour.name}`,
            description: flavour.description,
            image: toAbsoluteUrl(flavour.image),
            sku: flavour.id,
            category: 'Cold-Pressed Fruit Juice',
            brand: {
              '@type': 'Brand',
              name: 'ÉLAN',
            },
            size: flavour.volume,
            countryOfOrigin: {
              '@type': 'Country',
              name: 'India',
            },
            additionalProperty: [
              {
                '@type': 'PropertyValue',
                name: 'Sugar Density',
                value: flavour.brix,
              },
              {
                '@type': 'PropertyValue',
                name: 'Harvest Origin',
                value: flavour.origin,
              },
              {
                '@type': 'PropertyValue',
                name: 'Tasting Notes',
                value: flavour.tastingNotes.join(', '),
              },
              {
                '@type': 'PropertyValue',
                name: 'Key Bio-Actives',
                value: flavour.vitamins.join(', '),
              },
            ],
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: flavour.priceNum,
              availability: 'https://schema.org/InStock',
              url: `${CANONICAL_URL}#flavours`,
              seller: { '@id': organizationId },
            },
          },
        })),
      },
    ],
  };
}

