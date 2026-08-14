import Link from 'next/link';

import { listPublishedLegalDocuments } from '@/lib/cms/public-queries';

/**
 * Legal links come from the CMS, so a policy that has not been published yet
 * does not appear in the footer. A link to an unpublished policy would 404,
 * which on a legal page is worse than no link.
 */
export async function SiteFooter() {
  const legal = await listPublishedLegalDocuments();

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-8 text-sm text-muted-foreground">
        {legal.length > 0 ? (
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/legal/${doc.slug}`}
                  className="hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {doc.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-6">
          © {new Date().getFullYear()} Softmato Technology Pvt Ltd
        </p>
      </div>
    </footer>
  );
}
