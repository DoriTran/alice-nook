import { EditorContent } from '@tiptap/react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type PointerEvent,
} from 'react';

import {
  linkifyRichTextDocument,
  normalizeLinkPreviewUrl,
} from '@/pages/diary/MessagePanel/LinkPreview/linkPreview.utils';
import LinkPreviewPopover from '@/pages/diary/MessagePanel/LinkPreview/LinkPreviewPopover';
import { DIARY_BREAKPOINTS } from '@/pages/diary/useDiaryResponsiveMode';

import type { RichTextContent } from './types';

import styles from './AdRichText.module.css';
import { useAdRichTextEditor } from './AdRichTextEngine';

export type AdRichTextViewerProps = {
  value: RichTextContent;
  className?: string;
  linkPreviewOnHover?: boolean;
};

const AdRichTextViewer: FC<AdRichTextViewerProps> = ({
  value,
  className,
  linkPreviewOnHover = false,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const longPressPointerRef = useRef<number | null>(null);
  const consumedLongPressRef = useRef<HTMLAnchorElement | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.innerWidth < DIARY_BREAKPOINTS.mobile,
  );
  const [popover, setPopover] = useState<{
    url: string;
    rect: DOMRect;
    anchor: HTMLAnchorElement;
    interaction: 'hover' | 'hold' | 'focus';
  } | null>(null);
  const linkedValue = useMemo(
    () => ({ ...value, json: linkifyRichTextDocument(value.json) }),
    [value],
  );
  const editor = useAdRichTextEditor({
    content: linkedValue.json,
    editable: false,
  });

  const rootClass = [styles.viewer, className ?? ''].filter(Boolean).join(' ');

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = null;
  };

  const cancelLongPress = () => {
    clearLongPressTimer();
    const pointerId = longPressPointerRef.current;
    const anchor = longPressAnchorRef.current;
    if (pointerId !== null && anchor?.hasPointerCapture(pointerId)) {
      anchor.releasePointerCapture(pointerId);
    }
    longPressStartRef.current = null;
    longPressAnchorRef.current = null;
    longPressPointerRef.current = null;
  };

  useEffect(() => {
    const handleResize = () => {
      const nextMobile = window.innerWidth < DIARY_BREAKPOINTS.mobile;
      setIsMobile(nextMobile);
      cancelLongPress();
      setPopover(null);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelLongPress();
    };
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: globalThis.PointerEvent) => {
      if (
        longPressPointerRef.current === event.pointerId &&
        longPressStartRef.current
      ) {
        const start = longPressStartRef.current;
        if (
          Math.abs(event.clientX - start.x) > 8 ||
          Math.abs(event.clientY - start.y) > 8
        ) {
          cancelLongPress();
        }
      }

      if (
        popover?.interaction === 'hover' &&
        !event.composedPath().includes(popover.anchor)
      ) {
        setPopover(null);
      }
    };
    const handlePointerEnd = (event: globalThis.PointerEvent) => {
      if (longPressPointerRef.current === event.pointerId) cancelLongPress();
    };
    const handleOutsidePointerDown = (event: globalThis.PointerEvent) => {
      if (
        popover?.interaction === 'hold' &&
        !event.composedPath().includes(popover.anchor)
      ) {
        setPopover(null);
      }
    };
    const dismiss = () => {
      cancelLongPress();
      setPopover(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerEnd, true);
    document.addEventListener('pointercancel', handlePointerEnd, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsidePointerDown,
        true,
      );
      document.removeEventListener('pointermove', handlePointerMove, true);
      document.removeEventListener('pointerup', handlePointerEnd, true);
      document.removeEventListener('pointercancel', handlePointerEnd, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [popover]);

  const showForTarget = (
    target: EventTarget | null,
    interaction: 'hover' | 'hold' | 'focus',
  ): boolean => {
    if (!linkPreviewOnHover || !(target instanceof Element)) return false;
    const anchor = target.closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return false;
    const url = normalizeLinkPreviewUrl(anchor.href);
    if (!url) return false;
    if (import.meta.env.DEV) {
      console.debug('[link-preview] resolved hover target', {
        label: anchor.textContent,
        href: anchor.getAttribute('href'),
        normalizedUrl: url,
        interaction,
      });
    }
    setPopover({
      url,
      rect: anchor.getBoundingClientRect(),
      anchor,
      interaction,
    });
    return true;
  };

  return (
    <div
      ref={rootRef}
      className={rootClass}
      onMouseOver={(event) => {
        if (isMobile) return;
        if (!showForTarget(event.target, 'hover')) {
          setPopover(null);
        }
      }}
      onMouseOut={(event) => {
        if (isMobile || popover?.interaction !== 'hover') return;
        if (
          !(event.relatedTarget instanceof Node) ||
          !popover.anchor.contains(event.relatedTarget)
        ) {
          setPopover(null);
        }
      }}
      onMouseLeave={() => {
        if (!isMobile) setPopover(null);
      }}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
        if (!isMobile) return;
        cancelLongPress();

        const target = event.target;
        const anchor =
          target instanceof Element
            ? target.closest<HTMLAnchorElement>('a[href]')
            : null;
        if (!anchor || !normalizeLinkPreviewUrl(anchor.href)) {
          setPopover(null);
          return;
        }

        longPressStartRef.current = { x: event.clientX, y: event.clientY };
        longPressAnchorRef.current = anchor;
        longPressPointerRef.current = event.pointerId;
        anchor.setPointerCapture(event.pointerId);
        longPressTimerRef.current = window.setTimeout(() => {
          if (longPressAnchorRef.current !== anchor) return;
          consumedLongPressRef.current = anchor;
          showForTarget(anchor, 'hold');
          clearLongPressTimer();
          longPressStartRef.current = null;
        }, 450);
      }}
      onClickCapture={(event) => {
        if (!isMobile) return;
        const target = event.target;
        const anchor =
          target instanceof Element
            ? target.closest<HTMLAnchorElement>('a[href]')
            : null;
        if (anchor && consumedLongPressRef.current === anchor) {
          event.preventDefault();
          consumedLongPressRef.current = null;
        }
      }}
      onDragStart={(event) => {
        if (
          isMobile &&
          event.target instanceof Element &&
          event.target.closest('a[href]')
        ) {
          event.preventDefault();
        }
      }}
      onContextMenu={(event) => {
        if (!isMobile) return;
        const target = event.target;
        if (target instanceof Element && target.closest('a[href]')) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onFocus={(event) => showForTarget(event.target, 'focus')}
      onBlur={() => setPopover(null)}
    >
      <EditorContent editor={editor} />
      {popover ? (
        <LinkPreviewPopover
          key={popover.url}
          url={popover.url}
          anchorRect={popover.rect}
        />
      ) : null}
    </div>
  );
};

export default AdRichTextViewer;
