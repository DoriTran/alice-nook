export type ContentContactKind = 'phone' | 'email';

export type ContentContactMatch = {
  kind: ContentContactKind;
  from: number;
  to: number;
  text: string;
  normalized: string;
};

const EMAIL_CANDIDATE =
  /[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const PHONE_CANDIDATE = /\+?\d[\d ().-]{5,}\d/g;
const TOKEN_CHAR = /[A-Za-z0-9_]/;

const hasTokenBoundary = (text: string, from: number, to: number) =>
  (from === 0 || !TOKEN_CHAR.test(text[from - 1] ?? '')) &&
  (to === text.length || !TOKEN_CHAR.test(text[to] ?? ''));

export const normalizeContentEmail = (raw: string): string | null => {
  const value = raw.trim();
  if (!value || value.length > 254) return null;
  const parts = value.split('@');
  if (parts.length !== 2) return null;
  const [local, domain] = parts;
  if (
    !local ||
    local.length > 64 ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..') ||
    !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)
  )
    return null;
  const labels = domain.split('.');
  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        label.startsWith('-') ||
        label.endsWith('-') ||
        !/^[A-Za-z0-9-]+$/.test(label),
    ) ||
    !/^[A-Za-z]{2,}$/.test(labels.at(-1) ?? '')
  )
    return null;
  return `${local}@${domain.toLowerCase()}`;
};

export const normalizeContentPhone = (raw: string): string | null => {
  const value = raw.trim();
  if (!value || !/^\+?[\d ().-]+$/.test(value)) return null;
  if (
    (value.match(/\+/g) ?? []).length > 1 ||
    (value.includes('+') && !value.startsWith('+'))
  )
    return null;
  let balance = 0;
  for (const character of value) {
    if (character === '(') balance += 1;
    if (character === ')') balance -= 1;
    if (balance < 0) return null;
  }
  if (balance !== 0) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null;
  const hasPhoneFormatting = value.startsWith('+') || /[ ().-]/.test(value);
  if (!hasPhoneFormatting && digits.length < 9) return null;
  return `${value.startsWith('+') ? '+' : ''}${digits}`;
};

const collectMatches = (
  text: string,
  kind: ContentContactKind,
  pattern: RegExp,
  normalize: (value: string) => string | null,
): ContentContactMatch[] => {
  pattern.lastIndex = 0;
  const matches: ContentContactMatch[] = [];
  for (const match of text.matchAll(pattern)) {
    const from = match.index;
    const value = match[0];
    const to = from + value.length;
    const normalized = normalize(value);
    if (normalized && hasTokenBoundary(text, from, to))
      matches.push({ kind, from, to, text: value, normalized });
  }
  return matches;
};

export const findContentEmails = (text: string): ContentContactMatch[] =>
  collectMatches(text, 'email', EMAIL_CANDIDATE, normalizeContentEmail);

export const findContentPhones = (text: string): ContentContactMatch[] =>
  collectMatches(text, 'phone', PHONE_CANDIDATE, normalizeContentPhone);
