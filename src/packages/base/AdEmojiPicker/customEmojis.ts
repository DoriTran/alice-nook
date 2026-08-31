import angry from '@/assets/v0/emoji/Angry.png';
import brush from '@/assets/v0/emoji/Brush.png';
import flower from '@/assets/v0/emoji/Flower.png';
import happy from '@/assets/v0/emoji/Happy.png';
import hope from '@/assets/v0/emoji/Hope.png';
import sad from '@/assets/v0/emoji/Sad.png';
import star from '@/assets/v0/emoji/Star.png';
import surprise from '@/assets/v0/emoji/Surprise.png';

export type AdCustomEmoji = {
  id: string;
  names: string[];
  imgUrl: string;
};

export const AD_CUSTOM_EMOJIS: AdCustomEmoji[] = [
  { id: 'dd-happy', names: ['Happy', 'happy'], imgUrl: happy },
  { id: 'dd-sad', names: ['Sad', 'sad'], imgUrl: sad },
  { id: 'dd-angry', names: ['Angry', 'angry'], imgUrl: angry },
  { id: 'dd-surprise', names: ['Surprise', 'surprise'], imgUrl: surprise },
  { id: 'dd-hope', names: ['Hope', 'hope'], imgUrl: hope },
  { id: 'dd-star', names: ['Star', 'star'], imgUrl: star },
  { id: 'dd-flower', names: ['Flower', 'flower'], imgUrl: flower },
  { id: 'dd-brush', names: ['Brush', 'brush'], imgUrl: brush },
];

/** Matches `:Angry:`-style shortcodes (filename-based custom emojis). */
export const CUSTOM_EMOJI_SHORTCODE_RE = /:([A-Za-z][A-Za-z0-9_]*):/g;

const customEmojiByName = new Map<string, AdCustomEmoji>();

for (const emoji of AD_CUSTOM_EMOJIS) {
  for (const name of emoji.names) {
    customEmojiByName.set(name.toLowerCase(), emoji);
  }
}

/** Resolve `:Angry:` or `Angry` to a custom emoji entry. */
export const getCustomEmojiByShortcode = (
  token: string,
): AdCustomEmoji | undefined => {
  const trimmed = token.trim();
  const name =
    trimmed.startsWith(':') && trimmed.endsWith(':')
      ? trimmed.slice(1, -1)
      : trimmed;

  if (!name) {
    return undefined;
  }

  return customEmojiByName.get(name.toLowerCase());
};

/** Canonical shortcode from filename casing, e.g. `:Angry:`. */
export const toCustomEmojiShortcode = (emoji: AdCustomEmoji): string =>
  `:${emoji.names[0] ?? emoji.id}:`;
