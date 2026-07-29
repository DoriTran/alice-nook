import type { JSONContent } from '@tiptap/core';
import emojiRegex from 'emoji-regex';

import { CUSTOM_EMOJI_SHORTCODE_RE } from '../../AdEmojiPicker/customEmojis';

/** Build a RegExp that matches custom shortcodes or native emoji sequences. */
const buildTokenPattern = (): RegExp => {
  // Do NOT add the `u` flag — same constraint as AdEmojiText.
  const emojiSource = emojiRegex().source;
  return new RegExp(`${CUSTOM_EMOJI_SHORTCODE_RE.source}|${emojiSource}`, 'g');
};

/** Split plain text into TipTap inline nodes (text + emoji). */
export const splitPlainTextToInlineNodes = (text: string): JSONContent[] => {
  if (!text) {
    return [];
  }

  const nodes: JSONContent[] = [];
  const pattern = buildTokenPattern();
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }

    nodes.push({
      type: 'emoji',
      attrs: { value: match[0] },
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return nodes;
};

/** True when the whole string is a single emoji or custom shortcode. */
export const isEmojiToken = (value: string): boolean => {
  if (!value) {
    return false;
  }

  const pattern = buildTokenPattern();
  const match = pattern.exec(value);
  return Boolean(match && match[0] === value && match.index === 0);
};
