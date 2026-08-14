/** Field kind → component. The one place that mapping lives. */
import type { FieldSpec } from '@/lib/cms';

import { ImageField } from './image-field';
import { MarkdownField } from './markdown-field';
import { TagsField } from './tags-field';
import { TextField } from './text-field';
import { TextareaField } from './textarea-field';

export function Field({
  spec,
  defaultValue,
  error,
  uploadEnabled,
}: {
  spec: FieldSpec;
  defaultValue: string;
  error?: string | undefined;
  /** True when R2 is configured, so image fields can offer an upload. */
  uploadEnabled?: boolean | undefined;
}) {
  const props = { spec, defaultValue, error };

  switch (spec.kind) {
    case 'image':
      return <ImageField {...props} uploadEnabled={uploadEnabled} />;
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
