import { HomeExperience } from '@/components/HomeExperience';
import { buildStructuredData } from '@/lib/seo';

export default function Home() {
  const structuredData = buildStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeExperience />
    </>
  );
}
