import type { FieldSpec } from '@/lib/cms';

/** Every field component takes the same three things. */
export interface FieldProps {
  spec: FieldSpec;
  defaultValue: string;
  /** `| undefined` is required by exactOptionalPropertyTypes. */
  error?: string | undefined;
}
