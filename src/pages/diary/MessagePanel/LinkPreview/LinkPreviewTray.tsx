import type { LinkContentOccurrence } from '@/packages/base';

import CompactLinkPreviewItem from './CompactLinkPreviewItem';
import styles from './LinkPreviewTray.module.css';

type Props = {
  links: LinkContentOccurrence[];
  attached?: boolean;
  disabled?: boolean;
  composer?: boolean;
  onDisablePreview?: (url: string) => void;
};

const LinkPreviewTray = ({
  links,
  attached = false,
  disabled = false,
  composer = false,
  onDisablePreview,
}: Props) => (
  <section
    className={styles.tray}
    data-attached={attached || undefined}
    data-composer={composer || undefined}
    aria-label={`${links.length} link previews`}
  >
    <header className={styles.header}>
      <span>Links</span>
      <span aria-hidden>·</span>
      <span>{links.length}</span>
    </header>
    <div className={styles.grid}>
      {links.map((link) => (
        <CompactLinkPreviewItem
          key={link.normalizedUrl}
          url={link.normalizedUrl}
          disabled={disabled}
          onDisablePreview={
            composer && onDisablePreview
              ? () => onDisablePreview(link.normalizedUrl)
              : undefined
          }
        />
      ))}
    </div>
  </section>
);

export default LinkPreviewTray;
