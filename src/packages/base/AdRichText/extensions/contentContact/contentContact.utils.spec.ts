import { describe, expect, it } from 'vitest';

import {
  findContentEmails,
  findContentPhones,
  normalizeContentEmail,
  normalizeContentPhone,
} from './contentContact.utils';

describe('Phone Content recognition', () => {
  it.each([
    ['0909 123 456', '0909123456'],
    ['+84 (909) 123-456', '+84909123456'],
    ['0909.123.456', '0909123456'],
    ['123456789', '123456789'],
  ])('normalizes %s', (raw, expected) => {
    expect(normalizeContentPhone(raw)).toBe(expected);
  });

  it.each(['42', '2026', '12345', '21 / 50', 'version 1.2.3'])(
    'rejects normal numeric text %s',
    (raw) => {
      expect(findContentPhones(raw)).toEqual([]);
    },
  );

  it('finds formatted phone text without consuming surrounding prose', () => {
    expect(findContentPhones('Call me at 0909 123 456 today')).toEqual([
      {
        kind: 'phone',
        from: 11,
        to: 23,
        text: '0909 123 456',
        normalized: '0909123456',
      },
    ]);
  });
});

describe('Email Content recognition', () => {
  it.each([
    ['alice@example.com', 'alice@example.com'],
    ['Alice@EXAMPLE.COM', 'Alice@example.com'],
  ])('normalizes %s', (raw, expected) => {
    expect(normalizeContentEmail(raw)).toBe(expected);
  });

  it.each([
    'alice',
    '@example.com',
    'alice@localhost',
    'alice..nook@example.com',
    'alice@example.c',
  ])('rejects malformed email %s', (raw) => {
    expect(normalizeContentEmail(raw)).toBeNull();
  });

  it('finds email text without trailing punctuation', () => {
    expect(findContentEmails('Email alice@example.com, please.')).toEqual([
      {
        kind: 'email',
        from: 6,
        to: 23,
        text: 'alice@example.com',
        normalized: 'alice@example.com',
      },
    ]);
  });
});
