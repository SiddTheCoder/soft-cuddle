import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getLegalDocument, publishedSlugs } from '@/lib/cms/public-queries';
import { metadataFor } from '@/lib/cms/metadata';
import { formatBsWithAd } from '@/lib/format/date';
import { Markdown } from '@/components/public/markdown';
import { PageHeader } from '@/components/public/page-header';

export async function generateStaticParams() {
  const slugs = await publishedSlugs('legal');
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/legal/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getLegalDocument(slug);

  return doc ? metadataFor(doc) : { title: 'Not found' };
}

export default async function LegalDocumentPage({
  params,
}: PageProps<'/legal/[slug]'>) {
  const { slug } = await params;
  const doc = await getLegalDocument(slug);

  if (!doc) notFound();

  return (
    <article>
      <PageHeader title={doc.title} />

      {/*
       * Version and effective date are stated on the page, not just stored.
       * A policy a customer cannot date is a policy they cannot rely on.
       */}
      <p className="numeric mt-3 text-xs text-muted-foreground">
        Version {doc.version}
        {doc.effectiveAt
          ? ` · in effect from ${formatBsWithAd(doc.effectiveAt)}`
          : ''}
      </p>

      <Markdown>{doc.body}</Markdown>
    </article>
  );
}
