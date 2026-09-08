import { useEffect, useState } from 'react';

export const DIARY_BREAKPOINTS = {
  mobile: 640,
  singlePane: 900,
  compactList: 1024,
  swapDetail: 1280,
  wide: 1536,
} as const;

export type DiaryResponsiveMode =
  | 'mobile'
  | 'single-pane'
  | 'compact-list'
  | 'swap-detail'
  | 'overlay-detail'
  | 'wide';

const resolveMode = (width: number): DiaryResponsiveMode => {
  if (width < DIARY_BREAKPOINTS.mobile) return 'mobile';
  if (width < DIARY_BREAKPOINTS.singlePane) return 'single-pane';
  if (width < DIARY_BREAKPOINTS.compactList) return 'compact-list';
  if (width < DIARY_BREAKPOINTS.swapDetail) return 'swap-detail';
  if (width < DIARY_BREAKPOINTS.wide) return 'overlay-detail';
  return 'wide';
};

export const useDiaryResponsiveMode = (): DiaryResponsiveMode => {
  const [mode, setMode] = useState<DiaryResponsiveMode>(() =>
    resolveMode(
      typeof window === 'undefined'
        ? DIARY_BREAKPOINTS.wide
        : window.innerWidth,
    ),
  );

  useEffect(() => {
    const update = () => setMode(resolveMode(window.innerWidth));
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return mode;
};
