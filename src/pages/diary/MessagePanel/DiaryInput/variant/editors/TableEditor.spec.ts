// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { isTableInteractionPreserved } from './TableEditor';

describe('TableEditor selection preservation', () => {
  it('keeps the active cell while interacting with the Content shelf', () => {
    const table = document.createElement('div');
    const shelf = document.createElement('section');
    const alignmentButton = document.createElement('button');
    shelf.dataset.contentShelf = '';
    shelf.append(alignmentButton);

    expect(isTableInteractionPreserved(table, alignmentButton)).toBe(true);
  });

  it('clears selection for an unrelated outside interaction', () => {
    const table = document.createElement('div');
    const outsideButton = document.createElement('button');

    expect(isTableInteractionPreserved(table, outsideButton)).toBe(false);
  });
});
