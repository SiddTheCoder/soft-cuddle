import {
  publishContent,
  unpublishContent,
} from '@/app/(admin)/admin/cms/actions/publish';
import { SubmitButton } from '@/components/admin/submit-button';

/**
 * Publish / unpublish, kept apart from the edit form.
 *
 * Saving and publishing are different acts. Merging them into one button is
 * how a half-written draft reaches the public site.
 */
export function PublicationPanel({
  kindSlug,
  id,
  published,
}: {
  kindSlug: string;
  id: number;
  published: boolean;
}) {
  return (
    <section className="mt-8 border-t border-border pt-4">
      <h2 className="text-sm font-medium">Publication</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {published
          ? 'This is live on the public site. Saving an edit changes it immediately.'
          : 'This is a draft and is not visible on the public site.'}
      </p>

      <form
        action={published ? unpublishContent : publishContent}
        className="mt-3"
      >
        <input type="hidden" name="kind" value={kindSlug} />
        <input type="hidden" name="id" value={id} />
        <SubmitButton variant="secondary">
          {published ? 'Unpublish' : 'Publish'}
        </SubmitButton>
      </form>
    </section>
  );
}
