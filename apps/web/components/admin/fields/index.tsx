/** Field kind → component. The one place that mapping lives. */
import type { FieldSpec } from '@/lib/cms';

import { MarkdownField } from './markdown-field';
import { TagsField } from './tags-field';
import { TextField } from './text-field';
import { TextareaField } from './textarea-field';

export function Field({
  spec,
  defaultValue,
  error,
}: {
  spec: FieldSpec;
  defaultValue: string;
  error?: string | undefined;
}) {
  const props = { spec, defaultValue, error };

  switch (spec.kind) {
    case 'markdown':
      return <MarkdownField {...props} />;
    case 'textarea':
      return <TextareaField {...props} />;
    case 'tags':
      return <TagsField {...props} />;
    case 'number':
      return <TextField {...props} type="number" />;
    case 'text':
      return <TextField {...props} />;
  }
}

export * from './field-shell';
export type { FieldProps } from './types';
