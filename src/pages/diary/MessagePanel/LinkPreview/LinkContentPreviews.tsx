import type { RichTextContent } from '@/packages/base';

import { collectPreviewLinkContent } from '@/packages/base';

import styles from './LinkContentPreviews.module.css';
import LinkPreviewMessage from './LinkPreviewMessage';
import LinkPreviewTray from './LinkPreviewTray';

type Props = {
  content: RichTextContent;
  attached?: boolean;
  disabled?: boolean;
  composer?: boolean;
  onDisablePreview?: (url: string) => void;
};

export const LINK_PREVIEW_TRAY_THRESHOLD = 3;

export const getLinkPreviewLayout = (count: number) =>
  count >= LINK_PREVIEW_TRAY_THRESHOLD ? 'tray' : 'full';

const LinkContentPreviews = ({
  content,
  attached = false,
  disabled = false,
  composer = false,
  onDisablePreview,
}: Props) => {
  const links = collectPreviewLinkContent(content.json);
  if (!links.length) return null;

  if (getLinkPreviewLayout(links.length) === 'tray') {
    return (
      <LinkPreviewTray
        links={links}
        attached={attached}
        disabled={disabled}
        composer={composer}
        onDisablePreview={onDisablePreview}
      />
    );
  }

  return (
    <div className={styles.root} data-count={links.length}>
      {links.map((link, index) => (
        <LinkPreviewMessage
          key={link.normalizedUrl}
          url={link.normalizedUrl}
          attached={attached || index > 0}
          followed={index < links.length - 1}
          disabled={disabled}
          composer={composer}
          onDisablePreview={
            composer && onDisablePreview
              ? () => onDisablePreview(link.normalizedUrl)
              : undefined
          }
        />
      ))}
    </div>
  );
};

export default LinkContentPreviews;
