// @vitest-environment jsdom

import { MantineProvider } from '@mantine/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ContentShelf from './ContentShelf';

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

describe('ContentShelf choice controls', () => {
  it('renders all registry-driven Alignment choices inline and runs one', () => {
    const container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    const onRunFeature = vi.fn();

    act(() => {
      root?.render(
        <MantineProvider>
          <ContentShelf
            activeFeatures={{
              alignment: { enabled: true, active: true, value: 'mixed' },
            }}
            onRunFeature={onRunFeature}
          />
        </MantineProvider>,
      );
    });

    expect(container.textContent).toContain('Formatting');
    expect(container.textContent).toContain('Alignment');
    expect(
      container.querySelectorAll('[data-content-feature="alignment"]'),
    ).toHaveLength(3);
    expect(container.querySelector('[aria-label="Align Left"]')).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Align Center"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Align Right"]'),
    ).not.toBeNull();
    expect(
      container.querySelectorAll(
        '[data-content-feature="alignment"][data-active]',
      ),
    ).toHaveLength(0);

    const center = container.querySelector<HTMLButtonElement>(
      '[aria-label="Align Center"]',
    );
    const mouseDown = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    center?.dispatchEvent(mouseDown);
    expect(mouseDown.defaultPrevented).toBe(true);
    act(() => center?.click());

    expect(onRunFeature).toHaveBeenCalledOnce();
    expect(onRunFeature).toHaveBeenCalledWith(
      'alignment',
      expect.objectContaining({ value: 'center' }),
    );
  });
});
