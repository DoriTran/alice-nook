import { EditorContent } from '@tiptap/react';
import { useMemo, useState, type FC, type PointerEvent } from 'react';

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
  const [popover, setPopover] = useState<{
    url: string;
    rect: DOMRect;
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

  const showForTarget = (target: EventTarget | null): boolean => {
    if (!linkPreviewOnHover || !(target instanceof Element)) return false;
    const anchor = target.closest<HTMLAnchorElement>('a[href]');
    if (!anchor) return false;
    const url = normalizeLinkPreviewUrl(anchor.href);
    if (!url) return false;
    setPopover({ url, rect: anchor.getBoundingClientRect() });
    return true;
  };

  return (
    <div
      className={rootClass}
      onPointerOver={(event: PointerEvent<HTMLDivElement>) => {
        if (!showForTarget(event.target)) setPopover(null);
      }}
      onMouseLeave={() => setPopover(null)}
      onFocusCapture={(event) => showForTarget(event.target)}
      onBlurCapture={() => setPopover(null)}
    >
      <EditorContent editor={editor} />
      {popover ? (
        <LinkPreviewPopover url={popover.url} anchorRect={popover.rect} />
      ) : null}
    </div>
  );
};

export default AdRichTextViewer;
