import { Mark, mergeAttributes } from '@tiptap/core';

/** Schema-only compatibility for persisted code marks. */
export const LegacyCodeExtension = Mark.create({
  name: 'code',
  code: true,
  excludes: '_',
  parseHTML: () => [{ tag: 'code' }],
  renderHTML: ({ HTMLAttributes }) => [
    'code',
    mergeAttributes(HTMLAttributes),
    0,
  ],
});
