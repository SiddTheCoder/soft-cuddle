import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getProductPage, publishedSlugs } from '@/lib/cms/public-queries';
import { metadataFor } from '@/lib/cms/metadata';
import { Markdown } from '@/components/public/markdown';
import { PageHeader } from '@/components/public/page-header';

export async function generateStaticParams() {
  const slugs = await publishedSlugs('products');
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/products/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductPage(slug);

  return product ? metadataFor(product) : { title: 'Not found' };
}

export default async function ProductPage({
  params,
}: PageProps<'/products/[slug]'>) {
  const { slug } = await params;
  const product = await getProductPage(slug);

  if (!product) notFound();

  return (
    <article>
      <PageHeader
        eyebrow="Product"
        title={product.title}
        lead={product.tagline}
      />

      {product.siteUrl ? (
        <p className="mt-4">
          <a
            href={product.siteUrl}
            className="text-primary underline underline-offset-2"
            rel="noopener noreferrer"
            target="_blank"
          >
            Visit {product.title}
          </a>
        </p>
      ) : null}

      <Markdown>{product.body}</Markdown>

      {product.screenshotUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.screenshotUrl}
          alt={`${product.title} screenshot`}
          className="mt-8 rounded-lg border border-border"
        />
      ) : null}
    </article>
  );
}
