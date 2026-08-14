import Link from 'next/link';

/**
 * Linked cards for a collection index — services, products, blog posts.
 * One component rather than three near-identical lists.
 */
export interface CardItem {
  key: string;
  href: string;
  title: string;
  description?: string | null;
  /** Small right-aligned label: a date, a version, anything short. */
  meta?: string | null;
}

export function CardList({
  items,
  empty,
}: {
  items: CardItem[];
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="mt-8 text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="mt-10 grid gap-4">
      {items.map((item) => (
        <li key={item.key}>
          <Link
            href={item.href}
            className="section-frame block rounded-lg p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="headline text-lg">{item.title}</span>
              {item.meta ? (
                <span className="numeric shrink-0 text-xs text-muted-foreground">
                  {item.meta}
                </span>
              ) : null}
            </div>

            {item.description ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
