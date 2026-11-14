import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { getAssetPath } from '@/lib/utils';
import {
  CANONICAL_URL,
  OG_IMAGE_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_TITLE,
} from '@/lib/seo';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#050505',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: SITE_TITLE,
    template: '%s | ÉLAN',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'ÉLAN',
  keywords: [
    'ÉLAN',
    'Elan',
    'ÉLAN Pure Fruit Joy',
    'Cold Pressed Juice',
    'Cold Pressed Juice Bhopal',
    'Raw Fruit Juice India',
    'Alphonso Mango Juice',
    'Pink Guava Juice',
    'Strawberry Juice',
    'Mixed Berry Juice',
    'No Added Sugar Juice',
    'Glass Bottled Juice',
  ],
  authors: [{ name: 'ÉLAN Beverages India Pvt. Ltd.', url: CANONICAL_URL }],
  creator: 'ÉLAN Beverages India Pvt. Ltd.',
  publisher: 'ÉLAN Beverages India Pvt. Ltd.',
  category: 'Food & Beverage',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: CANONICAL_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: getAssetPath('/manifest.webmanifest'),
  icons: {
    icon: [
      { url: getAssetPath('/icon.svg'), type: 'image/svg+xml' },
      { url: getAssetPath('/favicon.ico'), sizes: '16x16 32x32 48x48', type: 'image/x-icon' },
      { url: getAssetPath('/favicon-48x48.png'), sizes: '48x48', type: 'image/png' },
      { url: getAssetPath('/icon-192.png'), sizes: '192x192', type: 'image/png' },
    ],
    shortcut: [getAssetPath('/favicon.ico')],
    apple: [{ url: getAssetPath('/apple-touch-icon.png'), sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: CANONICAL_URL,
    siteName: SITE_NAME,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 800,
        alt: 'ÉLAN Pure Fruit Joy — Cold-Pressed Alphonso Mango, Pink Guava, Strawberry and Mixed Berry Juices in Crystal Glass',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE_URL],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} dark antialiased`}>
      <head>
        <link
          rel="preload"
          as="image"
          href={getAssetPath('/pr_seq/frame_000.webp')}
          type="image/webp"
          media="(min-width: 768px)"
        />
        <link
          rel="preload"
          as="image"
          href={getAssetPath('/pr_seq/frame_001.webp')}
          type="image/webp"
          media="(min-width: 768px)"
        />
        <link
          rel="preload"
          as="image"
          href={getAssetPath('/pr_seq/frame_002.webp')}
          type="image/webp"
          media="(min-width: 768px)"
        />
        <link
          rel="preload"
          as="image"
          href={getAssetPath('/pr_seq_mobile/frame_000.webp')}
          type="image/webp"
          media="(max-width: 767px)"
        />
        <link
          rel="preload"
          as="image"
          href={getAssetPath('/pr_seq_mobile/frame_001.webp')}
          type="image/webp"
          media="(max-width: 767px)"
        />
        <link
          rel="preload"
          as="image"
          href={getAssetPath('/pr_seq_mobile/frame_002.webp')}
          type="image/webp"
          media="(max-width: 767px)"
        />
      </head>
      <body className="bg-elan-dark text-elan-cream selection:bg-elan-gold selection:text-elan-dark bg-noise min-h-screen">
        {children}
      </body>
    </html>
  );
}
