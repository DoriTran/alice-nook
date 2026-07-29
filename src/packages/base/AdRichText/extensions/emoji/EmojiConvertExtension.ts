import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import emojiRegex from 'emoji-regex';

import { CUSTOM_EMOJI_SHORTCODE_RE } from '../../../AdEmojiPicker/customEmojis';

const emojiConvertKey = new PluginKey('emojiConvert');

const buildTokenPattern = (): RegExp => {
  const emojiSource = emojiRegex().source;
  return new RegExp(`${CUSTOM_EMOJI_SHORTCODE_RE.source}|${emojiSource}`, 'g');
};

type TextMatch = {
  from: number;
  to: number;
  value: string;
};

const findEmojiInText = (text: string, pos: number): TextMatch[] => {
  const matches: TextMatch[] = [];
  const pattern = buildTokenPattern();
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    matches.push({
      from: pos + match.index,
      to: pos + match.index + match[0].length,
      value: match[0],
    });
  }

  return matches;
};

/**
 * Convert unicode emoji / custom shortcodes inside text nodes into emoji nodes.
 */
export const EmojiConvertExtension = Extension.create({
  name: 'emojiConvert',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: emojiConvertKey,
        appendTransaction(transactions, _oldState, newState) {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) {
            return null;
          }

          // Skip our own conversion transactions.
          if (transactions.some((tr) => tr.getMeta(emojiConvertKey))) {
            return null;
          }

          const matches: TextMatch[] = [];

          newState.doc.descendants((node: ProseMirrorNode, pos: number) => {
            if (!node.isText || !node.text) {
              return;
            }

            matches.push(...findEmojiInText(node.text, pos));
          });

          if (matches.length === 0) {
            return null;
          }

          const emojiType = newState.schema.nodes.emoji;
          if (!emojiType) {
            return null;
          }

          // Replace from end to start so positions stay valid.
          const sorted = [...matches].sort((a, b) => b.from - a.from);
          const tr = newState.tr;
          tr.setMeta(emojiConvertKey, true);

          for (const match of sorted) {
            tr.replaceWith(
              match.from,
              match.to,
              emojiType.create({ value: match.value }),
            );
          }

          return tr;
        },
      }),
    ];
  },
});
