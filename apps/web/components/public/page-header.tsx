/** Page title with an optional eyebrow and lead paragraph. */
export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow?: string | undefined;
  title: string;
  lead?: string | null | undefined;
}) {
  return (
    <header>
      {eyebrow ? (
        <p className="eyebrow text-xs text-muted-foreground">{eyebrow}</p>
      ) : null}
      <h1 className="headline mt-1 text-3xl">{title}</h1>
      {lead ? (
        <p className="mt-3 text-lg text-muted-foreground">{lead}</p>
      ) : null}
    </header>
  );
}
