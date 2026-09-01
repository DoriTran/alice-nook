import authBg from '@/assets/v2/auth/background/auth-bg.png';
import authDesk from '@/assets/v2/auth/background/auth-desk.png';
import cardBg from '@/assets/v2/auth/background/card.png';
import bookstack from '@/assets/v2/auth/decoration/stuff/bookstack.png';
import cup from '@/assets/v2/auth/decoration/stuff/cup.png';
import diary from '@/assets/v2/auth/decoration/stuff/diary.png';
import lamp from '@/assets/v2/auth/decoration/stuff/lamp.png';
import linedHeart from '@/assets/v2/auth/decoration/stuff/lined heart.png';
import noteOpen from '@/assets/v2/auth/decoration/stuff/note-open.png';
import pinnedSticker from '@/assets/v2/auth/decoration/stuff/pinned sticker.png';
import shelves from '@/assets/v2/auth/decoration/stuff/shelves.png';
import vase from '@/assets/v2/auth/decoration/stuff/vase.png';
import washiTape from '@/assets/v2/auth/decoration/stuff/washi-tape.png';
import windowImg from '@/assets/v2/auth/decoration/stuff/window.png';
import authLogo from '@/assets/v2/auth/decoration/text/alice-nook_auth-logo.png';
import logoDivider from '@/assets/v2/auth/decoration/text/alice-nook_divider.png';
import helpText from '@/assets/v2/auth/decoration/text/alice-nook_help-text.png';
import slogan from '@/assets/v2/auth/decoration/text/alice-nook_slogan.png';
import panelDivider from '@/assets/v2/auth/decoration/text/panel_divider.png';
import peekSideWaving from '@/assets/v2/auth/mascot/chibi_peak-side-waving.png';
import peekSide from '@/assets/v2/auth/mascot/chibi_peak-side.png';
import peekUp from '@/assets/v2/auth/mascot/chibi_peak-up.png';
import writingMascot from '@/assets/v2/auth/mascot/chibi_writing.png';

/** Tunable: how many floating background decorations to place. */
export const RANDOM_DECORATION_COUNT = 30;

const flowerPotModules = import.meta.glob<{ default: string }>(
  '../../assets/v2/auth/decoration/flower pots/*.png',
  { eager: true },
);

const decorationModules = import.meta.glob<{ default: string }>(
  '../../assets/v2/auth/decoration/decorations/*.png',
  { eager: true },
);

function urlsFromGlob(modules: Record<string, { default: string }>): string[] {
  return Object.entries(modules)
    .filter(([path]) => !path.endsWith('/base.png'))
    .map(([, mod]) => mod.default);
}

export const FLOWER_POTS = urlsFromGlob(flowerPotModules);
export const RANDOM_DECORATIONS = urlsFromGlob(decorationModules);

export const authAssets = {
  authBg,
  authDesk,
  cardBg,
  bookstack,
  cup,
  diary,
  lamp,
  linedHeart,
  noteOpen,
  pinnedSticker,
  shelves,
  vase,
  washiTape,
  window: windowImg,
  authLogo,
  helpText,
  slogan,
  logoDivider,
  panelDivider,
  peekSide,
  peekSideWaving,
  peekUp,
  writingMascot,
} as const;
