import type { AppMode, AppTheme } from '../app/type';

export type DiaryDataSource = 'local' | 'cloud';

/**
 * Appearance extras. These are persisted as the future home for global
 * look-and-feel tokens but are NOT applied to the app yet (suggested).
 */
export type UiDensity = 'comfortable' | 'compact';
export type BorderRadiusPref = 'sharp' | 'rounded' | 'soft';
export type FontSizePref = 'small' | 'medium' | 'large';
export type AccentStylePref = 'solid' | 'soft' | 'outline';

export type AppearancePreferences = {
  density: UiDensity;
  borderRadius: BorderRadiusPref;
  fontSize: FontSizePref;
  reduceMotion: boolean;
  accentStyle: AccentStylePref;
};

/**
 * Composer / editor preferences.
 * `enterKeyBehavior` is wired into DiaryInput; other fields are scaffolded
 * for future work (suggested in Settings until implemented).
 */
export type EnterKeyBehavior = 'enter-sends' | 'shift-enter-sends';

export type ComposerPreferences = {
  enterKeyBehavior: EnterKeyBehavior;
  autoFocus: boolean;
  restoreDraft: boolean;
  autoExpand: boolean;
  autoExpandRows: number;
  spellCheck: boolean;
  markdownShortcuts: boolean;
  smartQuotes: boolean;
  pasteImagesDirectly: boolean;
};

export type AttachmentPreferences = {
  imagePreviewSize: 'small' | 'medium' | 'large';
  autoplayVideos: boolean;
  loopGifs: boolean;
  compressUploads: boolean;
  openImageInModal: boolean;
};

export type TicketCompletionAnimation = 'tear' | 'fade' | 'none';
export type TicketUndoVisibility = 'always' | 'hover' | 'never';
export type TicketCompletedStyle = 'gray' | 'strike' | 'hidden';

export type TicketPreferences = {
  completionAnimation: TicketCompletionAnimation;
  undoVisibility: TicketUndoVisibility;
  askBeforeCompleting: boolean;
  completedStyle: TicketCompletedStyle;
  autoCollapseCompleted: boolean;
};

export type TimerDefaultMode = 'timer' | 'countup' | 'datetime';

export type TimerPreferences = {
  defaultMode: TimerDefaultMode;
  defaultDurationMs: number;
  playSound: boolean;
  autoStart: boolean;
  showMilliseconds: boolean;
  timeFormat: '12h' | '24h';
};

export type TodoNewItemPosition = 'top' | 'bottom';

export type TodoPreferences = {
  enterKeyBehavior: EnterKeyBehavior;
  newItemPosition: TodoNewItemPosition;
  enterCreatesNext: boolean;
  completeAnimation: boolean;
};

export type DecorationPreferences = {
  ticket: TicketPreferences;
  timer: TimerPreferences;
  todo: TodoPreferences;
};

export type MessagePreferences = {
  timestampFormat: '12h' | '24h';
  bubbleWidth: 'narrow' | 'regular' | 'wide';
  animationSpeed: 'slow' | 'normal' | 'fast';
  linkPreviews: boolean;
  defaultMediaLayout: 'grid' | 'stack';
};

/**
 * Central preference scaffold. Only `theme` and `mode` (below) are wired into
 * the app today; everything here is the future home for feature settings.
 */
export type SettingsPreferences = {
  appearance: AppearancePreferences;
  composer: ComposerPreferences;
  attachments: AttachmentPreferences;
  decorations: DecorationPreferences;
  messages: MessagePreferences;
};

export type SettingsStoreState = {
  theme: AppTheme;
  mode: AppMode;
  diaryDataSource: DiaryDataSource;
  diaryLocalExplicit: boolean;
  preferences: SettingsPreferences;
};

export type SettingsStoreActions = {
  setTheme: (theme: AppTheme) => void;
  setMode: (mode: AppMode) => void;
  setDiaryDataSource: (source: DiaryDataSource) => void;
  setDiaryDataSourcePreference: (source: DiaryDataSource) => void;
  updatePreferences: (patch: DeepPartial<SettingsPreferences>) => void;
  resetToDefaults: () => void;
};

export type SettingsStore = SettingsStoreState & SettingsStoreActions;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
