import { describe, expect, it } from 'vitest';

import {
  collectPendingSecretPayloads,
  secretPreviewText,
} from './contentSecret.utils';

describe('contentSecret utilities', () => {
  it('uses a safe persisted preview and collects only pending plaintext', () => {
    const fragment = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'secret' }] },
      ],
    };
    const json = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'secretContentInline',
              attrs: { secretId: 'new', ciphertext: '' },
            },
            {
              type: 'secretContentInline',
              attrs: { secretId: 'saved', ciphertext: 'cipher' },
            },
          ],
        },
      ],
    };
    expect(secretPreviewText()).toBe('[Secret]');
    expect(collectPendingSecretPayloads(json, { new: fragment })).toEqual([
      { secretId: 'new', fragment },
    ]);
  });
});
