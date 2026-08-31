import {
  Car,
  Cat,
  Clock,
  Flag,
  Heart,
  Music,
  Search,
  Shirt,
  Smile,
  Sparkles,
  Trophy,
  Utensils,
} from 'lucide-react';
import {
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react';

import moodSticker from '@/assets/v0/decoration/Emoji 1.png';
import { useAppStore } from '@/store';

import AdVirtualList, { type AdVirtualListHandle } from '../AdVirtualList';
import styles from './AdEmojiPicker.module.css';
import {
  AD_CUSTOM_EMOJIS,
  getCustomEmojiByShortcode,
  toCustomEmojiShortcode,
  type AdCustomEmoji,
} from './customEmojis';
import {
  EMOJI_CATEGORY_LABELS,
  EMOJI_CATEGORY_ORDER,
  FREQUENT_EMOJI_UNIFIED,
  applySkinTone,
  applySkinToneUnified,
  filterEmojisByQuery,
  getAllStandardEmojis,
  getEmojisByCategory,
  getStandardEmojiEntry,
  readStoredSkinTone,
  writeStoredSkinTone,
  type EmojiCategoryId,
  type EmojiEntry,
  type SkinToneId,
} from './data';
import EmojiTile from './EmojiTile';
import SkinTonePicker from './SkinTonePicker';
import { unifiedToTwemojiSrc } from './twemoji';

export type AdEmojiPickerPanelProps = {
  onSelect: (value: string) => void;
  width?: number;
  height?: number;
};

export const DEFAULT_PICKER_WIDTH = 360;
export const DEFAULT_PICKER_HEIGHT = 400;

/** Columns in the emoji grid (matches `.grid` CSS). */
const EMOJI_COLUMNS = 8;

/**
 * Fixed row height in px: square tile (~38px at default panel width) + 0.35rem gap.
 * Rows render at exactly this height so the virtualizer never remeasures them.
 */
const EMOJI_ROW_HEIGHT = 44;

/** Fixed height for virtualized section header rows. */
const HEADER_ROW_HEIGHT = 30;

/** Fixed height for the empty-favorites hint row. */
const FAVORITE_HINT_HEIGHT = 40;

type PrefTile =
  | { kind: 'native'; id: string; entry: EmojiEntry }
  | { kind: 'custom'; id: string; emoji: AdCustomEmoji };

const NAV_CATEGORIES: Array<{
  id: EmojiCategoryId;
  label: string;
  icon: ReactNode;
}> = [
  { id: 'suggested', label: 'Frequently Used', icon: <Clock size={16} /> },
  { id: 'custom', label: 'Custom Emojis', icon: <Sparkles size={16} /> },
  {
    id: 'smileys_people',
    label: 'Smileys & People',
    icon: <Smile size={16} />,
  },
  { id: 'animals_nature', label: 'Animals & Nature', icon: <Cat size={16} /> },
  { id: 'food_drink', label: 'Food & Drink', icon: <Utensils size={16} /> },
  { id: 'travel_places', label: 'Travel & Places', icon: <Car size={16} /> },
  { id: 'activities', label: 'Activities', icon: <Trophy size={16} /> },
  { id: 'objects', label: 'Objects', icon: <Shirt size={16} /> },
  { id: 'symbols', label: 'Symbols', icon: <Music size={16} /> },
  { id: 'flags', label: 'Flags', icon: <Flag size={16} /> },
];

const chunkIntoRows = <T,>(items: T[], columns = EMOJI_COLUMNS): T[][] => {
  if (items.length === 0) {
    return [];
  }

  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }
  return rows;
};

/**
 * Flattened row model for a SINGLE self-scrolling virtualizer.
 * Suggested/favorites/custom/standard all live in one list that owns its own
 * scroll container — never shares scroll with an outer `.body`. Sharing an
 * external scroll parent (via `scrollElementRef` + `scrollMargin`) was the
 * root cause of the auto-scroll-to-top bug.
 */
type FlatRow =
  | {
      type: 'header';
      key: string;
      label: string;
      /** Present when this header is a category-nav jump target. */
      categoryId?: EmojiCategoryId;
      showHeart?: boolean;
    }
  | { type: 'prefTiles'; key: string; tiles: PrefTile[] }
  | { type: 'favoriteHint'; key: string }
  | { type: 'customTiles'; key: string; tiles: AdCustomEmoji[] }
  | { type: 'nativeTiles'; key: string; tiles: EmojiEntry[] };

/** Static category rows (custom + standard) — prefs are prepended at render time. */
const buildStaticCategoryRows = (): FlatRow[] => {
  const rows: FlatRow[] = [];

  rows.push({
    type: 'header',
    key: 'header-custom',
    label: EMOJI_CATEGORY_LABELS.custom,
    categoryId: 'custom',
  });
  chunkIntoRows(AD_CUSTOM_EMOJIS).forEach((tiles, index) => {
    rows.push({ type: 'customTiles', key: `custom-row-${index}`, tiles });
  });

  for (const categoryId of EMOJI_CATEGORY_ORDER) {
    rows.push({
      type: 'header',
      key: `header-${categoryId}`,
      label: EMOJI_CATEGORY_LABELS[categoryId],
      categoryId,
    });
    chunkIntoRows(getEmojisByCategory(categoryId)).forEach((tiles, index) => {
      rows.push({
        type: 'nativeTiles',
        key: `${categoryId}-row-${index}`,
        tiles,
      });
    });
  }

  return rows;
};

const STATIC_CATEGORY_ROWS = buildStaticCategoryRows();

const estimateRowSize = (row: FlatRow | undefined): number => {
  if (!row) {
    return EMOJI_ROW_HEIGHT;
  }
  if (row.type === 'header') {
    return HEADER_ROW_HEIGHT;
  }
  if (row.type === 'favoriteHint') {
    return FAVORITE_HINT_HEIGHT;
  }
  return EMOJI_ROW_HEIGHT;
};

type NativeEmojiImgProps = {
  unified: string;
  native: string;
};

/** Renders a Twemoji SVG for a unified codepoint id, falling back to the native glyph on error. */
const NativeEmojiImg: FC<NativeEmojiImgProps> = ({ unified, native }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className={styles.emojiGlyph}>{native}</span>;
  }

  return (
    <img
      className={styles.emojiGlyph}
      src={unifiedToTwemojiSrc(unified)}
      alt={native}
      draggable={false}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
};

const resolvePrefId = (id: string): PrefTile | null => {
  const custom = getCustomEmojiByShortcode(id);
  if (custom) {
    return { kind: 'custom', id, emoji: custom };
  }

  const entry = getStandardEmojiEntry(id);
  if (entry) {
    return { kind: 'native', id, entry };
  }

  return null;
};

const resolvePrefIds = (ids: readonly string[]): PrefTile[] =>
  ids.map(resolvePrefId).filter((tile): tile is PrefTile => tile !== null);

const presetFrequentTiles = (): PrefTile[] =>
  resolvePrefIds(FREQUENT_EMOJI_UNIFIED);

const AdEmojiPickerPanel: FC<AdEmojiPickerPanelProps> = ({
  onSelect,
  width = DEFAULT_PICKER_WIDTH,
  height = DEFAULT_PICKER_HEIGHT,
}) => {
  const emojiPickerPrefs = useAppStore('emojiPickerPrefs');
  const addFrequentEmoji = useAppStore('addFrequentEmoji');
  const toggleFavoriteEmoji = useAppStore('toggleFavoriteEmoji');

  const [query, setQuery] = useState('');
  const [skinTone, setSkinTone] = useState<SkinToneId>(() =>
    readStoredSkinTone(),
  );
  const [activeCategory, setActiveCategory] =
    useState<EmojiCategoryId>('suggested');
  const deferredQuery = useDeferredValue(query);
  const listRef = useRef<AdVirtualListHandle>(null);

  const frequentTiles = useMemo(() => {
    if (emojiPickerPrefs.frequent.length === 0) {
      return presetFrequentTiles();
    }

    return resolvePrefIds(emojiPickerPrefs.frequent);
  }, [emojiPickerPrefs.frequent]);

  const favoriteTiles = useMemo(
    () => resolvePrefIds(emojiPickerPrefs.favorites),
    [emojiPickerPrefs.favorites],
  );

  const isSearching = deferredQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) {
      return null;
    }

    const standard = filterEmojisByQuery(getAllStandardEmojis(), deferredQuery);
    const custom = AD_CUSTOM_EMOJIS.filter((emoji) =>
      emoji.names.some((name) =>
        name.toLowerCase().includes(deferredQuery.trim().toLowerCase()),
      ),
    );

    return { standard, custom };
  }, [deferredQuery, isSearching]);

  /** Browse-mode flat list: suggested + favorites + static categories. */
  const browseRows = useMemo((): FlatRow[] => {
    const rows: FlatRow[] = [];

    rows.push({
      type: 'header',
      key: 'header-suggested',
      label: EMOJI_CATEGORY_LABELS.suggested,
      categoryId: 'suggested',
    });
    chunkIntoRows(frequentTiles).forEach((tiles, index) => {
      rows.push({ type: 'prefTiles', key: `suggested-row-${index}`, tiles });
    });

    rows.push({
      type: 'header',
      key: 'header-favorites',
      label: 'Favorites',
      showHeart: true,
    });
    if (favoriteTiles.length === 0) {
      rows.push({ type: 'favoriteHint', key: 'favorites-hint' });
    } else {
      chunkIntoRows(favoriteTiles).forEach((tiles, index) => {
        rows.push({ type: 'prefTiles', key: `favorites-row-${index}`, tiles });
      });
    }

    return [...rows, ...STATIC_CATEGORY_ROWS];
  }, [frequentTiles, favoriteTiles]);

  const browseHeaderIndex = useMemo(() => {
    const map: Partial<Record<EmojiCategoryId, number>> = {};
    browseRows.forEach((row, index) => {
      if (row.type === 'header' && row.categoryId !== undefined) {
        map[row.categoryId] = index;
      }
    });
    return map;
  }, [browseRows]);

  const searchRows = useMemo((): FlatRow[] => {
    if (!searchResults) {
      return [];
    }

    const rows: FlatRow[] = [];

    if (searchResults.custom.length > 0) {
      rows.push({
        type: 'header',
        key: 'search-header-custom',
        label: 'Custom Emojis',
      });
      chunkIntoRows(searchResults.custom).forEach((tiles, index) => {
        rows.push({
          type: 'customTiles',
          key: `search-custom-${index}`,
          tiles,
        });
      });
    }

    if (searchResults.standard.length > 0) {
      rows.push({
        type: 'header',
        key: 'search-header-results',
        label: 'Results',
      });
      chunkIntoRows(searchResults.standard).forEach((tiles, index) => {
        rows.push({
          type: 'nativeTiles',
          key: `search-native-${index}`,
          tiles,
        });
      });
    }

    return rows;
  }, [searchResults]);

  const activeRows = isSearching ? searchRows : browseRows;

  const handleSkinToneChange = (tone: SkinToneId) => {
    setSkinTone(tone);
    writeStoredSkinTone(tone);
  };

  const scrollToCategory = (categoryId: EmojiCategoryId) => {
    setActiveCategory(categoryId);
    const index = browseHeaderIndex[categoryId];
    if (index !== undefined) {
      listRef.current?.scrollToIndex(index, {
        align: 'start',
        behavior: 'smooth',
      });
    }
  };

  const handleNativeSelect = (entry: EmojiEntry) => {
    // Insert first, then update prefs — prefs updates re-render the panel and
    // must not run before the composer receives the emoji.
    onSelect(applySkinTone(entry, skinTone));
    addFrequentEmoji(entry.u);
  };

  const handleCustomSelect = (emoji: AdCustomEmoji) => {
    const shortcode = toCustomEmojiShortcode(emoji);
    onSelect(shortcode);
    addFrequentEmoji(shortcode);
  };

  const handleToggleNativeFavorite = (entry: EmojiEntry) => {
    toggleFavoriteEmoji(entry.u);
  };

  const handleToggleCustomFavorite = (emoji: AdCustomEmoji) => {
    toggleFavoriteEmoji(toCustomEmojiShortcode(emoji));
  };

  const handlePrefSelect = (tile: PrefTile) => {
    if (tile.kind === 'native') {
      handleNativeSelect(tile.entry);
      return;
    }

    handleCustomSelect(tile.emoji);
  };

  const handlePrefToggleFavorite = (tile: PrefTile) => {
    if (tile.kind === 'native') {
      handleToggleNativeFavorite(tile.entry);
      return;
    }

    handleToggleCustomFavorite(tile.emoji);
  };

  const renderPrefTile = (tile: PrefTile) => {
    if (tile.kind === 'native') {
      return (
        <EmojiTile
          key={tile.id}
          ariaLabel={tile.entry.n[tile.entry.n.length - 1] ?? tile.entry.u}
          onSelect={() => handlePrefSelect(tile)}
          onToggleFavorite={() => handlePrefToggleFavorite(tile)}
        >
          <NativeEmojiImg
            unified={applySkinToneUnified(tile.entry, skinTone)}
            native={applySkinTone(tile.entry, skinTone)}
          />
        </EmojiTile>
      );
    }

    return (
      <EmojiTile
        key={tile.id}
        ariaLabel={tile.emoji.names[0] ?? tile.emoji.id}
        onSelect={() => handlePrefSelect(tile)}
        onToggleFavorite={() => handlePrefToggleFavorite(tile)}
      >
        <img
          className={styles.customImg}
          src={tile.emoji.imgUrl}
          alt=""
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      </EmojiTile>
    );
  };

  const renderFlatRow = (index: number) => {
    const row = activeRows[index];
    if (!row) {
      return null;
    }

    if (row.type === 'header') {
      return (
        <div className={styles.virtualSectionHeader}>
          <p className={styles.sectionLabel}>{row.label}</p>
          {row.showHeart ? (
            <Heart size={12} className={styles.sectionHeart} aria-hidden />
          ) : null}
        </div>
      );
    }

    if (row.type === 'favoriteHint') {
      return (
        <p className={styles.favoriteHint}>
          Right-click an emoji to pin or unpin it here.
          <span className={styles.favoriteHintTouch}>
            On touch devices, press and hold.
          </span>
        </p>
      );
    }

    if (row.type === 'prefTiles') {
      return (
        <div className={styles.gridRow}>{row.tiles.map(renderPrefTile)}</div>
      );
    }

    if (row.type === 'customTiles') {
      return (
        <div className={styles.gridRow}>
          {row.tiles.map((emoji) => (
            <EmojiTile
              key={emoji.id}
              ariaLabel={emoji.names[0] ?? emoji.id}
              onSelect={() => handleCustomSelect(emoji)}
              onToggleFavorite={() => handleToggleCustomFavorite(emoji)}
            >
              <img
                className={styles.customImg}
                src={emoji.imgUrl}
                alt=""
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </EmojiTile>
          ))}
        </div>
      );
    }

    return (
      <div className={styles.gridRow}>
        {row.tiles.map((entry) => (
          <EmojiTile
            key={entry.u}
            ariaLabel={entry.n[entry.n.length - 1] ?? entry.u}
            onSelect={() => handleNativeSelect(entry)}
            onToggleFavorite={() => handleToggleNativeFavorite(entry)}
          >
            <NativeEmojiImg
              unified={applySkinToneUnified(entry, skinTone)}
              native={applySkinTone(entry, skinTone)}
            />
          </EmojiTile>
        ))}
      </div>
    );
  };

  return (
    <div
      className={styles.root}
      style={{
        width: `min(${width}px, calc(100vw - 1.5rem))`,
        maxHeight: height,
      }}
    >
      <div className={styles.header}>
        <div className={styles.searchRow}>
          <label className={styles.searchField}>
            <Search size={14} className={styles.searchIcon} aria-hidden />
            <input
              className={styles.searchInput}
              value={query}
              placeholder="Search emoji..."
              aria-label="Search emoji"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <SkinTonePicker value={skinTone} onChange={handleSkinToneChange} />
        </div>

        {!isSearching ? (
          <div
            className={styles.categoryNav}
            role="tablist"
            aria-label="Emoji categories"
          >
            {NAV_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.id}
                aria-label={category.label}
                className={styles.categoryBtn}
                data-active={activeCategory === category.id || undefined}
                onClick={() => scrollToCategory(category.id)}
              >
                {category.icon}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/*
        Body is NOT the scroll container. AdVirtualList fills it and owns scroll.
        This avoids scrollMargin / external-scroll corrections that snapped scrollTop.
      */}
      <div className={styles.body}>
        {isSearching && activeRows.length === 0 ? (
          <p className={styles.empty}>No emojis found</p>
        ) : (
          <AdVirtualList
            ref={listRef}
            className={styles.virtualBody}
            itemCount={activeRows.length}
            estimateSize={(index) => estimateRowSize(activeRows[index])}
            overscan={6}
            dynamicSize={false}
            getItemKey={(index) => activeRows[index]?.key ?? index}
            renderItem={renderFlatRow}
          />
        )}
      </div>

      <div className={styles.footer} aria-hidden>
        <img
          className={styles.footerSticker}
          src={moodSticker}
          alt=""
          draggable={false}
        />
        <p className={styles.footerLabel}>What&apos;s Your Mood?</p>
      </div>
    </div>
  );
};

export default AdEmojiPickerPanel;
