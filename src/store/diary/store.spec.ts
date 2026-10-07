// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { DEFAULT_COLOR_ID } from '@/packages/color';

import type { ColumnMessage, DiaryStore } from './type';

import { mergeLiveContentTagIds } from './store';

describe('Local Diary content tags', () => {
  it('collects live inline tags from Column content during message updates', () => {
    const content: ColumnMessage['content'] = {
      columns: [
        {
          id: 'column:123e4567-e89b-42d3-a456-426614174000',
          content: {
            json: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'contentTag',
                      attrs: { tagId: 'tag:live', label: 'Live' },
                    },
                    {
                      type: 'contentTag',
                      attrs: { tagId: 'tag:deleted', label: 'Deleted' },
                    },
                  ],
                },
              ],
            },
            preview: '#Live #Deleted',
          },
        },
      ],
    };
    const tags = {
      'tag:live': {
        id: 'tag:live',
        label: 'Live',
        colorId: DEFAULT_COLOR_ID,
      },
    } satisfies DiaryStore['tags'];

    expect(mergeLiveContentTagIds(['tag:existing'], content, tags)).toEqual([
      'tag:existing',
      'tag:live',
    ]);
  });
});
