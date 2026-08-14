import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPost, publishedSlugs } from '@/lib/cms/public-queries';
import { metadataFor } from '@/lib/cms/metadata';
import { formatBsWithAd } from '@/lib/format/date';
import { Markdown } from '@/components/public/markdown';
import { PageHeader } from '@/components/public/page-header';

export async function generateStaticParams() {
  const slugs = await publishedSlugs('blog');
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return post ? metadataFor(post) : { title: 'Not found' };
}

export default async function BlogPostPage({
  params,
}: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <article>
      <PageHeader
        eyebrow={
          post.publishedAt ? formatBsWithAd(post.publishedAt) : undefined
        }
        title={post.title}
        lead={post.excerpt}
      />

      {post.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImageUrl}
          alt=""
          className="mt-8 rounded-lg border border-border"
        />
      ) : null}

      <Markdown>{post.body}</Markdown>

      {post.tags.length > 0 ? (
        <ul className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
