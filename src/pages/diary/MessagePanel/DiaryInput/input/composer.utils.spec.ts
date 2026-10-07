import { describe, expect, it } from 'vitest';

import type {
  ColumnMessage,
  TableMessage,
  TodoMessage,
} from '@/store/diary/type';

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

describe('Column RichContent composer conversion', () => {
  it('creates two stable columns and preserves blocks through a text round trip', () => {
    const converted = convertDraftToVariant(
      { ...createInitialDraft(), content: rich },
      'column',
    );
    expect(converted.columnItems).toHaveLength(2);
    expect(new Set(converted.columnItems.map((item) => item.id)).size).toBe(2);
    expect(converted.columnItems[0]?.content.json).toEqual(rich.json);

    const restored = convertDraftToVariant(
      { ...createInitialDraft(), ...converted },
      'text',
    );
    expect(restored.content.json).toEqual(rich.json);
  });

  it('persists empty columns, order, ids, and inline tags', () => {
    const converted = convertDraftToVariant(
      { ...createInitialDraft(), content: rich },
      'column',
    );
    const reversed = [...converted.columnItems].reverse();
    const payload = buildMessagePayload(
      { ...createInitialDraft(), ...converted, columnItems: reversed },
      'chatbox:1',
    );
    expect(payload?.variant).toBe('column');
    if (!payload || payload.variant !== 'column' || !payload.content) {
      throw new Error('Expected Column payload');
    }
    expect(payload.content.columns.map((item) => item.id)).toEqual(
      reversed.map((item) => item.id),
    );
    expect(payload.content.columns).toHaveLength(2);
    expect(payload.tagIds).toEqual(['tag:one']);

    const message = {
      ...payload,
      id: 'message:column',
      edited: false,
      createdAt: '2026-10-06T00:00:00.000Z',
      updatedAt: null,
    } as ColumnMessage;
    expect(buildDraftFromMessage(message).columnItems).toEqual(
      payload.content.columns,
    );
  });

  it('maps Todo rows to columns and columns back to Todo in order', () => {
    const todo = convertDraftToVariant(
      { ...createInitialDraft(), content: rich },
      'todo',
    );
    const columns = convertDraftToVariant(
      { ...createInitialDraft(), ...todo },
      'column',
    );
    const restored = convertDraftToVariant(
      { ...createInitialDraft(), ...columns },
      'todo',
    );
    expect(restored.todoItems.map((item) => item.content.json)).toEqual(
      todo.todoItems.map((item) => item.content.json),
    );
  });
});

describe('Table Variant composer conversion', () => {
  it('persists sparse cells and restores their stable structure', () => {
    const converted = convertDraftToVariant(
      { ...createInitialDraft(), content: rich },
      'table',
    );
    expect(converted.tableRows).toHaveLength(3);
    expect(converted.tableColumns).toHaveLength(3);
    expect(Object.keys(converted.tableRows[0]?.cells ?? {})).toHaveLength(1);
    const payload = buildMessagePayload(
      { ...createInitialDraft(), ...converted },
      'chatbox:1',
    );
    if (!payload || payload.variant !== 'table')
      throw new Error('Expected Table payload');
    expect(payload.tagIds).toEqual(['tag:one']);
    const message = {
      ...payload,
      id: 'message:table',
      edited: false,
      createdAt: '2026-10-08T00:00:00.000Z',
      updatedAt: null,
    } as TableMessage;
    const restored = buildDraftFromMessage(message);
    expect(restored.tableColumns).toEqual(message.content.columns);
    expect(restored.tableRows).toEqual(message.content.rows);
  });

  it('converts each Table column into one Column and concatenates top-to-bottom', () => {
    const converted = convertDraftToVariant(
      { ...createInitialDraft(), content: rich },
      'table',
    );
    const firstColumn = converted.tableColumns[0];
    converted.tableRows[1].cells[firstColumn.id] = {
      kind: 'richText',
      content: rich,
    };
    const columns = convertDraftToVariant(
      { ...createInitialDraft(), ...converted },
      'column',
    );
    expect(columns.columnItems).toHaveLength(3);
    expect(columns.columnItems[0].content.json.content).toHaveLength(4);
    expect(columns.columnItems[1].content.preview).toBe('');
  });
});
