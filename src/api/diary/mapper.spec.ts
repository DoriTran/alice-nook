import { describe, expect, it } from 'vitest';

import type { DiarySnapshotResponse } from './types';

import { mapDiarySnapshot } from './mapper';

describe('mapDiarySnapshot', () => {
  it('normalizes legacy Cloud rich text without mutating the response', () => {
    const legacyContent = { text: 'legacy cloud message' };
    const snapshot = {
      groups: [],
      chatboxes: [],
      messages: [
        {
          id: 'ms:legacy',
          chatboxId: 'cb:legacy',
          variant: 'text',
          sender: 'user',
          content: legacyContent,
          attachments: [],
          decorators: [],
          tagIds: [],
          reactions: [],
          pinned: false,
          archived: false,
          edited: false,
          replyToMessageId: null,
          sourceMessageId: null,
          linkPreview: null,
          createdAt: '2026-10-04T00:00:00.000Z',
          updatedAt: '2026-10-04T00:00:00.000Z',
        },
      ],
      tags: [],
      palettes: [],
      orders: {
        rootOrders: [],
        groupChatboxOrders: {},
        chatboxMessageOrders: {},
      },
    } as unknown as DiarySnapshotResponse;

    const mapped = mapDiarySnapshot(snapshot);

    expect(mapped.messages['ms:legacy']?.content).toEqual({
      json: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'legacy cloud message' }],
          },
        ],
      },
      preview: 'legacy cloud message',
    });
    expect(legacyContent).toEqual({ text: 'legacy cloud message' });
  });

  it('refreshes a stale preview from canonical JSON', () => {
    const snapshot = {
      groups: [],
      chatboxes: [],
      messages: [
        {
          id: 'ms:rich',
          chatboxId: 'cb:rich',
          variant: 'text',
          sender: 'user',
          content: {
            json: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'canonical',
                      marks: [{ type: 'bold' }],
                    },
                  ],
                },
              ],
            },
            preview: 'stale',
          },
          attachments: [],
          decorators: [],
          tagIds: [],
          reactions: [],
          pinned: false,
          archived: false,
          edited: false,
          replyToMessageId: null,
          sourceMessageId: null,
          linkPreview: null,
          createdAt: '2026-10-04T00:00:00.000Z',
          updatedAt: '2026-10-04T00:00:00.000Z',
        },
      ],
      tags: [],
      palettes: [],
      orders: {
        rootOrders: [],
        groupChatboxOrders: {},
        chatboxMessageOrders: {},
      },
    } as unknown as DiarySnapshotResponse;

    expect(
      mapDiarySnapshot(snapshot).messages['ms:rich']?.content,
    ).toMatchObject({ preview: 'canonical' });
  });

  it('round-trips Phone and Email mark attrs from a Cloud snapshot', () => {
    const richContent = {
      json: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '0909 123 456',
                marks: [
                  {
                    type: 'contentPhone',
                    attrs: { normalizedPhone: '0909123456' },
                  },
                ],
              },
              { type: 'text', text: ' / ' },
              {
                type: 'text',
                text: 'Alice@EXAMPLE.COM',
                marks: [
                  {
                    type: 'contentEmail',
                    attrs: { normalizedEmail: 'Alice@example.com' },
                  },
                ],
              },
            ],
          },
        ],
      },
      preview: 'stale',
    };
    const snapshot = {
      groups: [],
      chatboxes: [],
      messages: [
        {
          id: 'ms:contacts',
          chatboxId: 'cb:contacts',
          variant: 'text',
          sender: 'user',
          content: richContent,
          attachments: [],
          decorators: [],
          tagIds: [],
          reactions: [],
          pinned: false,
          archived: false,
          edited: false,
          replyToMessageId: null,
          sourceMessageId: null,
          linkPreview: null,
          createdAt: '2026-10-05T00:00:00.000Z',
          updatedAt: '2026-10-05T00:00:00.000Z',
        },
      ],
      tags: [],
      palettes: [],
      orders: {
        rootOrders: [],
        groupChatboxOrders: {},
        chatboxMessageOrders: {},
      },
    } as unknown as DiarySnapshotResponse;

    const content = mapDiarySnapshot(snapshot).messages['ms:contacts']?.content;
    expect(content).toEqual({
      ...richContent,
      preview: '0909 123 456 / Alice@EXAMPLE.COM',
    });
  });

  it('round-trips Copy Content attrs and derives its visible preview', () => {
    const richContent = {
      json: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'ALICE20',
                marks: [
                  { type: 'bold' },
                  { type: 'contentCopy', attrs: { copyId: 'copy:alice' } },
                ],
              },
            ],
          },
        ],
      },
      preview: '[Copy] stale',
    };
    const snapshot = {
      groups: [],
      chatboxes: [],
      messages: [
        {
          id: 'ms:copy',
          chatboxId: 'cb:copy',
          variant: 'text',
          sender: 'user',
          content: richContent,
          attachments: [],
          decorators: [],
          tagIds: [],
          reactions: [],
          pinned: false,
          archived: false,
          edited: false,
          replyToMessageId: null,
          sourceMessageId: null,
          linkPreview: null,
          createdAt: '2026-10-05T00:00:00.000Z',
          updatedAt: '2026-10-05T00:00:00.000Z',
        },
      ],
      tags: [],
      palettes: [],
      orders: {
        rootOrders: [],
        groupChatboxOrders: {},
        chatboxMessageOrders: {},
      },
    } as unknown as DiarySnapshotResponse;

    expect(mapDiarySnapshot(snapshot).messages['ms:copy']?.content).toEqual({
      ...richContent,
      preview: 'ALICE20',
    });
  });
});
