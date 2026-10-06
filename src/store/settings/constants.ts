import { Flower, Leaf, MoonStar, Wheat, type LucideIcon } from 'lucide-react';

import type { AppMode, AppTheme } from '../app/type';
import type { SettingsPreferences } from './type';

export const DEFAULT_THEME: AppTheme = 'wheat';
export const DEFAULT_MODE: AppMode = 'light';

export const DEFAULT_TIMER_DURATION_MS = 25 * 60 * 1000;

export const DEFAULT_PREFERENCES: SettingsPreferences = {
  appearance: {
    density: 'comfortable',
    borderRadius: 'soft',
    fontSize: 'medium',
    reduceMotion: false,
    accentStyle: 'solid',
  },
  composer: {
    enterKeyBehavior: 'enter-sends',
    autoFocus: true,
    restoreDraft: true,
    autoExpand: true,
    autoExpandRows: 3,
    spellCheck: true,
    markdownShortcuts: false,
    smartQuotes: false,
    pasteImagesDirectly: true,
  },
  attachments: {
    imagePreviewSize: 'medium',
    autoplayVideos: false,
    loopGifs: true,
    compressUploads: true,
    openImageInModal: true,
  },
  decorations: {
    ticket: {
      completionAnimation: 'tear',
      undoVisibility: 'hover',
      askBeforeCompleting: false,
      completedStyle: 'gray',
      autoCollapseCompleted: false,
    },
    timer: {
      defaultMode: 'timer',
      defaultDurationMs: DEFAULT_TIMER_DURATION_MS,
      playSound: true,
      autoStart: false,
      showMilliseconds: false,
      timeFormat: '24h',
    },
    todo: {
      enterKeyBehavior: 'shift-enter-sends',
      newItemPosition: 'bottom',
      enterCreatesNext: true,
      completeAnimation: true,
    },
  },
  messages: {
    timestampFormat: '12h',
    bubbleWidth: 'regular',
    animationSpeed: 'normal',
    defaultMediaLayout: 'grid',
  },
};

export const THEME_OPTIONS: ReadonlyArray<{
  id: AppTheme;
  label: string;
  icon: LucideIcon;
  iconColor: string;
}> = [
  { id: 'wheat', label: 'Wheat', icon: Wheat, iconColor: '#8f6238' },
  { id: 'blush', label: 'Blush', icon: Flower, iconColor: '#e67f96' },
  { id: 'lavender', label: 'Lavender', icon: MoonStar, iconColor: '#a78bfa' },
  { id: 'mint', label: 'Mint', icon: Leaf, iconColor: '#5cb88a' },
];
