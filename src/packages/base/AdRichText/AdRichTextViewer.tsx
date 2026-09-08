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
  const [popover, setPopover] = useState<{
    url: string;
    rect: DOMRect;
    touch: boolean;
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

  useEffect(() => {
    if (!popover) return;

    const handleOutsidePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest('a[href]') &&
        rootRef.current?.contains(target)
      ) {
        return;
      }

      setPopover(null);
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown, true);
    return () =>
      document.removeEventListener(
        'pointerdown',
        handleOutsidePointerDown,
        true,
      );
  }, [popover]);

  const showForTarget = (
    target: EventTarget | null,
    touch = false,
  ): boolean => {
    if (!linkPreviewOnHover || !(target instanceof Element)) return false;
    const anchor = target.closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return false;
    const url = normalizeLinkPreviewUrl(anchor.href);
    if (!url) return false;
    setPopover((current) => ({
      url,
      rect: anchor.getBoundingClientRect(),
      touch: touch || (current?.url === url && current.touch),
    }));
    return true;
  };

  return (
    <div
      ref={rootRef}
      className={rootClass}
      onPointerOver={(event: PointerEvent<HTMLDivElement>) => {
        if (!showForTarget(event.target, event.pointerType !== 'mouse')) {
          setPopover(null);
        }
      }}
      onMouseLeave={() => setPopover(null)}
      onFocusCapture={(event) => showForTarget(event.target)}
      onBlurCapture={() => setPopover(null)}
    >
      <EditorContent editor={editor} />
      {popover ? (
        <LinkPreviewPopover
          url={popover.url}
          anchorRect={popover.rect}
          dismissOnBackdrop={popover.touch}
          onDismiss={() => setPopover(null)}
        />
      ) : null}
    </div>
  );
};

export default AdRichTextViewer;
