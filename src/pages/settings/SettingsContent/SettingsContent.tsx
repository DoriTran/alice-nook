import { useEffect, useRef, type FC } from 'react';

import type { SettingsCategoryId } from '../settings.types';

import {
  AboutSection,
  AppearanceSection,
  ComposerSection,
  DataSyncSection,
  LibrarySection,
  MessagesSection,
  TagsSection,
} from '../sections';
import SearchResults from './SearchResults';
import styles from './SettingsContent.module.css';

export type SettingsContentProps = {
  activeCategory: SettingsCategoryId;
  query: string;
  scrollTarget: string | null;
  onNavigate: (category: SettingsCategoryId, subSectionId: string) => void;
};

const SECTION_BY_CATEGORY: Record<SettingsCategoryId, FC> = {
  appearance: AppearanceSection,
  composer: ComposerSection,
  messages: MessagesSection,
  tags: TagsSection,
  library: LibrarySection,
  data: DataSyncSection,
  about: AboutSection,
};

const SettingsContent: FC<SettingsContentProps> = ({
  activeCategory,
  query,
  scrollTarget,
  onNavigate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const searching = query.trim().length > 0;
  const ActiveSection = SECTION_BY_CATEGORY[activeCategory];

  useEffect(() => {
    if (searching || !scrollTarget) return;
    const timeout = window.setTimeout(() => {
      const element = document.getElementById(scrollTarget);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
    return () => window.clearTimeout(timeout);
  }, [scrollTarget, activeCategory, searching]);

  // Reset scroll position when switching categories.
  useEffect(() => {
    if (!scrollTarget) {
      containerRef.current?.scrollTo({ top: 0 });
    }
  }, [activeCategory, scrollTarget]);

  return (
    <div className={styles.content} ref={containerRef}>
      {searching ? (
        <SearchResults query={query} onNavigate={onNavigate} />
      ) : (
        <div className={styles.sections}>
          <ActiveSection />
        </div>
      )}
    </div>
  );
};

export default SettingsContent;
