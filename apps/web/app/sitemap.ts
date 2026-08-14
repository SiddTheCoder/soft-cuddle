import type { MetadataRoute } from 'next';

import { publishedPageSlugs, publishedSlugs } from '@/lib/cms/public-queries';
import { siteUrl } from '@/lib/cms/metadata';

/**
 * Sitemap, built from published content only.
 *
 * Every entry comes from a `status = 'published'` query, so a draft cannot
 * be advertised to a crawler — which would be a slower, more public version of
 * the same leak the public queries exist to prevent.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts, services, products, legal] = await Promise.all([
    publishedPageSlugs(),
    publishedSlugs('blog'),
    publishedSlugs('services'),
    publishedSlugs('products'),
    publishedSlugs('legal'),
  ]);

  /** `home` is the root path, not `/home`. */
  const pageUrl = (slug: string) => (slug === 'home' ? '/' : `/${slug}`);

  return [
    ...pages.map((row) => ({
      url: siteUrl(pageUrl(row.slug)),
      lastModified: row.updatedAt,
    })),
    ...posts.map((row) => ({
      url: siteUrl(`/blog/${row.slug}`),
      lastModified: row.updatedAt,
    })),
    ...services.map((row) => ({
      url: siteUrl(`/services/${row.slug}`),
      lastModified: row.updatedAt,
    })),
    ...products.map((row) => ({
      url: siteUrl(`/products/${row.slug}`),
      lastModified: row.updatedAt,
    })),
    ...legal.map((row) => ({
      url: siteUrl(`/legal/${row.slug}`),
      lastModified: row.updatedAt,
    })),
  ];
}
