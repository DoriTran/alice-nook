// @vitest-environment jsdom

import { MantineProvider } from '@mantine/core';
import { Sparkles, SquareCheckBig } from 'lucide-react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ActionPicker from './ActionPicker';

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

describe('ActionPicker disabled options', () => {
  it('keeps a disabled Coming Soon option last and does not select it', () => {
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    const onSelect = vi.fn();

    act(() => {
      root?.render(
        <MantineProvider>
          <ActionPicker
            label="Variant"
            description="Choose a variant."
            icon={SquareCheckBig}
            showIcon
            active={false}
            opened
            onOpenChange={vi.fn()}
            onSelect={onSelect}
            options={[
              {
                value: 'todo',
                label: 'Todo',
                description: 'Checklist.',
                icon: SquareCheckBig,
                selected: false,
              },
              {
                value: 'ai',
                label: 'AI',
                description: 'Coming Soon.',
                icon: Sparkles,
                selected: false,
                disabled: true,
              },
            ]}
          />
        </MantineProvider>,
      );
    });

    const options =
      document.querySelectorAll<HTMLButtonElement>('[role="option"]');
    expect(options).toHaveLength(2);
    expect(options[1].textContent).toContain('AI');
    expect(options[1].getAttribute('aria-disabled')).toBe('true');
    act(() => options[1].click());
    expect(onSelect).not.toHaveBeenCalled();
  });
});
