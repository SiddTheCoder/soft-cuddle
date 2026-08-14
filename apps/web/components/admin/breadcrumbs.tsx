import Link from 'next/link';

/** Trail of links, with the current page as unlinked children. */
export function Breadcrumbs({
  trail,
  children,
}: {
  trail: { label: string; href: string }[];
  children: React.ReactNode;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      {trail.map((crumb) => (
        <span key={crumb.href}>
          <Link href={crumb.href} className="hover:underline">
            {crumb.label}
          </Link>
          <span aria-hidden> / </span>
        </span>
      ))}
      <span aria-current="page">{children}</span>
    </nav>
  );
}
