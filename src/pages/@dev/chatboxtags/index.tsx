import { type FC, useMemo, useState } from 'react';

import ChatboxTagRow from '@/pages/diary/ChatboxSidebar/Chatbox/ChatboxTagRow';

import {
  CHATBOX_TAG_FIXTURES,
  runFitUtilCases,
} from './fixtures';
import styles from './index.module.css';

const WIDTH_MIN = 160;
const WIDTH_MAX = 420;
const WIDTH_DEFAULT = 300;
const WIDTH_PRESETS = [300, 380] as const;

const ChatboxTagsDev: FC = () => {
  const [width, setWidth] = useState(WIDTH_DEFAULT);
  const [useTagsIndent, setUseTagsIndent] = useState(true);

  const utilResults = useMemo(() => runFitUtilCases(), []);
  const utilPassCount = utilResults.filter((result) => result.pass).length;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h2 className={styles.title}>Chatbox Tag Overflow</h2>
        <p className={styles.subtitle}>
          Live <code>ChatboxTagRow</code> fit check. Drag the container width
          (sidebar-like) and watch tags collapse into <code>+N</code>. Open via{' '}
          <code>/dev?test=chatboxtags</code>.
        </p>
      </header>

      <div className={styles.controls}>
        <label className={styles.field}>
          Chatbox container width
          <input
            type="range"
            min={WIDTH_MIN}
            max={WIDTH_MAX}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
          <span className={styles.rangeValue}>{width}px</span>
        </label>

        <div className={styles.presets}>
          {WIDTH_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={styles.presetBtn}
              data-active={width === preset || undefined}
              onClick={() => setWidth(preset)}
            >
              {preset}px
            </button>
          ))}
        </div>

        <label className={styles.checkboxField}>
          <input
            type="checkbox"
            checked={useTagsIndent}
            onChange={(event) => setUseTagsIndent(event.currentTarget.checked)}
          />
          Apply chatbox tags indent (padding-left)
        </label>
      </div>

      <div className={styles.list}>
        {CHATBOX_TAG_FIXTURES.map((fixture) => (
          <section key={fixture.id} className={styles.case}>
            <div className={styles.caseHeader}>
              <span className={styles.caseLabel}>{fixture.name}</span>
              <span className={styles.caseDesc}>{fixture.description}</span>
            </div>
            <div className={styles.stage} style={{ width }}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>{fixture.name}</div>
                <ChatboxTagRow
                  tags={fixture.tags}
                  className={
                    useTagsIndent ? styles.tagsIndent : undefined
                  }
                />
              </div>
            </div>
            <div className={styles.meta}>
              {fixture.tags.length} tags · stage {width}px
              {useTagsIndent ? ' · indented' : ''}
            </div>
          </section>
        ))}
      </div>

      <section className={styles.utilSection}>
        <h3 className={styles.utilTitle}>
          Fit util checks ({utilPassCount}/{utilResults.length} pass)
        </h3>
        <ul className={styles.utilList}>
          {utilResults.map((result) => (
            <li key={result.id} className={styles.utilItem}>
              <span className={result.pass ? styles.utilPass : styles.utilFail}>
                {result.pass ? 'PASS' : 'FAIL'}
              </span>
              <span>{result.label}</span>
              <span className={styles.meta}>
                got {result.actual} · expected {result.expected}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ChatboxTagsDev;
