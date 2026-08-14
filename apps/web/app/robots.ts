import type { MetadataRoute } from 'next';

import { env } from '@/lib/env';
import { siteUrl } from '@/lib/cms/metadata';

/**
 * A preview deployment must not be indexed. Staging copy showing up in search
 * results is a real and hard-to-undo mistake, so anything that is not
 * production is disallowed outright.
 *
 * The admin, checkout and portal surfaces are separate subdomains, but their
 * underlying paths are excluded too — belt and braces, since a rewrite means
 * the same origin can serve both.
 */
export default function robots(): MetadataRoute.Robots {
  if (env.APP_ENV !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/checkout', '/portal', '/api/'],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
  };
}
