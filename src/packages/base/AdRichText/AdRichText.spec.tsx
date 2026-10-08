// @vitest-environment jsdom

import { MantineProvider } from '@mantine/core';
import { act, createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AdRichTextHandle, RichTextContent } from './types';

import AdRichText from './AdRichText';
import { createRichTextContent } from './richtext/createRichTextContent';

let root: Root | undefined;

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
});

describe('AdRichText paragraph input', () => {
  it('creates a paragraph, not a hard break, for the newline key', () => {
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    const editorRef = createRef<AdRichTextHandle>();
    let latest: RichTextContent | undefined;

    act(() => {
      root?.render(
        <MantineProvider>
          <AdRichText
            ref={editorRef}
            value={createRichTextContent({
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'one' }],
                },
              ],
            })}
            onChange={(content) => {
              latest = content;
            }}
            onSubmit={vi.fn()}
            enterSubmits
          />
        </MantineProvider>,
      );
      editorRef.current?.focus('end');
    });

    const proseMirror = container.querySelector<HTMLElement>('.ProseMirror');
    expect(proseMirror).not.toBeNull();
    act(() => {
      proseMirror?.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(latest?.json.content?.map((node) => node.type)).toEqual([
      'paragraph',
      'paragraph',
    ]);
    expect(JSON.stringify(latest?.json)).not.toContain('hardBreak');
  });
});
