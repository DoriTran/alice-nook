import { type FC, useMemo, useState } from 'react';

import DetailMessagePreviewRow from '@/pages/diary/DetailPanel/components/DetailMessagePreviewRow';
import { resolveMessagePreview } from '@/store/diary/messagePreview.utils';

import { PREVIEW_CARD_FIXTURES } from './fixtures';
import styles from './index.module.css';

const MessagePreviewDev: FC = () => {
  const [showPin, setShowPin] = useState(true);
  const [narrow, setNarrow] = useState(false);

  const resolved = useMemo(
    () =>
      PREVIEW_CARD_FIXTURES.map((fixture) => ({
        fixture,
        preview: resolveMessagePreview(fixture.message),
      })),
    [],
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h2 className={styles.title}>Message Preview Cards</h2>
        <p className={styles.subtitle}>
          Gallery of every <code>resolveMessagePreview</code> priority path used
          by pinned / archived / tag dialogs. Open via{' '}
          <code>/dev?test=messagepreview</code>.
        </p>
      </header>

      <div className={styles.controls}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={showPin}
            onChange={(event) => setShowPin(event.currentTarget.checked)}
          />
          Show pin icon
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={narrow}
            onChange={(event) => setNarrow(event.currentTarget.checked)}
          />
          Narrow stage (detail-panel width)
        </label>
        <span className={styles.meta}>
          {PREVIEW_CARD_FIXTURES.length} fixtures
        </span>
      </div>

      <div className={styles.list}>
        {resolved.map(({ fixture, preview }) => (
          <section key={fixture.id} className={styles.case}>
            <div className={styles.caseHeader}>
              <span className={styles.caseLabel}>{fixture.label}</span>
              <span className={styles.caseDesc}>{fixture.description}</span>
            </div>
            <div className={styles.resolved}>
              <span>icon={preview.icon}</span>
              <span
                data-mismatch={
                  preview.icon !== fixture.expectedIcon ? 'true' : undefined
                }
              >
                expected={fixture.expectedIcon}
              </span>
              <span>source={preview.source}</span>
              <span>preview={preview.preview?.kind ?? 'null'}</span>
              <span>attachments={preview.attachmentCount}</span>
              {preview.attachmentType ? (
                <span>win={preview.attachmentType}</span>
              ) : null}
            </div>
            <div
              className={styles.cardStage}
              style={narrow ? { maxWidth: 340 } : undefined}
            >
              <DetailMessagePreviewRow
                message={fixture.message}
                showPin={showPin}
                onClick={() => undefined}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default MessagePreviewDev;
