import { describe, expect, it } from 'vitest';

import type { TodoMessage } from '@/store/diary/type';

import { createRichTextContent } from '@/packages/base/AdRichText/richtext';

import { createInitialDraft } from './composer.types';
import {
  buildDraftFromMessage,
  buildMessagePayload,
  convertDraftToVariant,
} from './composer.utils';

const rich = createRichTextContent({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'First', marks: [{ type: 'bold' }] },
        {
          type: 'contentTag',
          attrs: { tagId: 'tag:one', label: 'One' },
        },
      ],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Second' }],
    },
  ],
});

describe('Todo RichContent composer conversion', () => {
  it('converts top-level blocks into canonical Todo rows without flattening marks', () => {
    const draft = { ...createInitialDraft(), content: rich };
    const converted = convertDraftToVariant(draft, 'todo');

    expect(converted.todoItems).toHaveLength(2);
    expect(converted.todoItems[0]?.content.json.content?.[0]).toEqual(
      rich.json.content?.[0],
    );
    expect(converted.todoItems[0]).not.toHaveProperty('text');
  });

  it('joins Todo row blocks without losing RichContent semantics', () => {
    const todo = convertDraftToVariant(
      { ...createInitialDraft(), content: rich },
      'todo',
    );
    const converted = convertDraftToVariant(
      { ...createInitialDraft(), ...todo },
      'text',
    );

    expect(converted.content.json).toEqual(rich.json);
  });

  it('builds canonical payloads and unions inline tags across rows', () => {
    const todo = convertDraftToVariant(
      { ...createInitialDraft(), content: rich },
      'todo',
    );
    const payload = buildMessagePayload(
      { ...createInitialDraft(), ...todo },
      'chatbox:1',
    );

    expect(payload?.variant).toBe('todo');
    expect(payload?.tagIds).toEqual(['tag:one']);
    if (payload?.variant !== 'todo') throw new Error('Expected Todo payload');
    expect((payload as TodoMessage).content.items[0]).not.toHaveProperty(
      'text',
    );
  });

  it('restores sent Todo JSON directly for editing', () => {
    const todo = convertDraftToVariant(
      { ...createInitialDraft(), content: rich },
      'todo',
    );
    const payload = buildMessagePayload(
      { ...createInitialDraft(), ...todo },
      'chatbox:1',
    );
    if (!payload || payload.variant !== 'todo') {
      throw new Error('Expected Todo payload');
    }
    const message = {
      ...payload,
      id: 'message:1',
      edited: false,
      createdAt: '2026-10-06T00:00:00.000Z',
      updatedAt: '2026-10-06T00:00:00.000Z',
    } as TodoMessage;

    expect(buildDraftFromMessage(message).todoItems[0]?.content.json).toEqual(
      (payload as TodoMessage).content.items[0]?.content.json,
    );
  });
});
