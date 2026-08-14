import 'server-only';
import type { Metadata } from 'next';

import { env } from '@/lib/env';

/**
 * Turns a CMS row into Next metadata.
 *
 * One place, so every public page gets the same treatment: the founder's meta
 * title and description win when set, the content's own title is the fallback,
 * and Open Graph never goes out empty.
 */
export function metadataFor(row: {
  title: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  excerpt?: string | null;
  summary?: string | null;
  tagline?: string | null;
  ogImageUrl?: string | null;
  coverImageUrl?: string | null;
}): Metadata {
  const title = row.metaTitle ?? row.title;
  const description =
    row.metaDescription ?? row.excerpt ?? row.summary ?? row.tagline ?? null;
  const image = row.ogImageUrl ?? row.coverImageUrl ?? null;

  return {
    title,
    ...(description ? { description } : {}),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      siteName: 'Softmato',
      type: 'website',
      ...(image ? { images: [image] } : {}),
    },
  };
}

/** Absolute site URL, for canonical links and the sitemap. */
export function siteUrl(path = '/'): string {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  return `${base}${path}`;
}
