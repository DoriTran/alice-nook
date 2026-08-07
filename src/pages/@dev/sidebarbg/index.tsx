import { faBookOpen, faClapperboard } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import {
  type CSSProperties,
  type FC,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { AdDivider, AdIcon } from '@/packages/base';
import Logo from '@/packages/ui/Logo/Logo';
import panelStyles from '@/packages/ui/Outlet/LeftPanel/LeftPanel.module.css';
import {
  mainNavigationPages,
  navigationIcons,
  navigationLabels,
  toolsNav,
} from '@/packages/ui/Outlet/LeftPanel/nav.constants';
import ProfileInfo from '@/packages/ui/Outlet/LeftPanel/ProfileInfo/ProfileInfo';
import ThemeSelection from '@/packages/ui/ThemeSelection/ThemeSelection';

import styles from './index.module.css';
import {
  type DecorationShape,
  maskImageForShape,
  maskUriForShape,
} from './shapes';

type BgToken =
  | '--background'
  | '--background-soft'
  | '--surface'
  | '--primary'
  | '--primary-light'
  | '--secondary'
  | '--secondary-light';
type DotColorToken = '--text' | '--primary' | '--accent-purple';
type GradientDir =
  | '0deg'
  | '45deg'
  | '90deg'
  | '135deg'
  | '160deg'
  | '180deg'
  | '225deg'
  | '270deg'
  | '315deg'
  | 'to bottom right'
  | 'to bottom left';
type GradientTarget = BgToken | 'none';

const BG_TOKENS: readonly BgToken[] = [
  '--background',
  '--background-soft',
  '--surface',
  '--primary',
  '--primary-light',
  '--secondary',
  '--secondary-light',
];

const DOT_COLOR_TOKENS: readonly DotColorToken[] = [
  '--text',
  '--primary',
  '--accent-purple',
];

const GRADIENT_DIRS: readonly { value: GradientDir; label: string }[] = [
  { value: '0deg', label: 'Bottom → top (0deg)' },
  { value: '45deg', label: 'To top right (45deg)' },
  { value: '90deg', label: 'Left → right (90deg)' },
  { value: '135deg', label: 'To bottom right (135deg)' },
  { value: '160deg', label: 'Slight diagonal (160deg)' },
  { value: '180deg', label: 'Top → bottom (180deg)' },
  { value: '225deg', label: 'To bottom left (225deg)' },
  { value: '270deg', label: 'Right → left (270deg)' },
  { value: '315deg', label: 'To top left (315deg)' },
  { value: 'to bottom right', label: 'To bottom right' },
  { value: 'to bottom left', label: 'To bottom left' },
];

const SHAPES: readonly { value: DecorationShape; label: string }[] = [
  { value: 'sparkle', label: 'Sparkle (4-point)' },
  { value: 'dot', label: 'Dot' },
  { value: 'flower', label: 'Flower (4-petal)' },
];

/** Static story rows so the preview matches the real sidebar without diary store. */
const MOCK_STORY = [
  { id: 'story-1', name: 'Personal', icon: faBookOpen, active: false },
  { id: 'story-2', name: 'Journal', icon: faBookOpen, active: true },
  { id: 'story-3', name: 'Media', icon: faClapperboard, active: false },
] as const;

function buildCssOutput(opts: {
  base: BgToken;
  gradientTarget: GradientTarget;
  gradientDir: GradientDir;
  gradientPct: number;
  towardPrimary: number;
  shape: DecorationShape;
  dotColor: DotColorToken;
  dotOpacity: number;
  size: number;
  spacing: number;
  honeycomb: boolean;
}): string {
  const {
    base,
    gradientTarget,
    gradientDir,
    gradientPct,
    towardPrimary,
    shape,
    dotColor,
    dotOpacity,
    size,
    spacing,
    honeycomb,
  } = opts;

  const offset = honeycomb ? spacing / 2 : 0;
  const uri = maskUriForShape(shape, size, spacing);

  const tintColor =
    towardPrimary > 0
      ? `color-mix(in srgb, var(--primary) ${towardPrimary}%, var(${gradientTarget}))`
      : `var(${gradientTarget})`;

  const gradientBlock =
    gradientTarget === 'none'
      ? `/* gradient disabled */`
      : `.panel::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: linear-gradient(
    ${gradientDir},
    transparent 0%,
    color-mix(in srgb, ${tintColor} ${gradientPct}%, transparent) 100%
  );
}`;

  return `/* Generated from /dev?test=sidebarbg — paste into LeftPanel.module.css */

.panel {
  position: relative;
  isolation: isolate;
  background: var(${base});
  /* …keep existing layout props… */
  overflow: hidden;
}

${gradientBlock}

.panel::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-color: color-mix(in srgb, var(${dotColor}) ${dotOpacity}%, transparent);
  mask-image:
    ${uri},
    ${uri};
  mask-repeat: repeat;
  mask-size: ${spacing}px ${spacing}px;
  mask-position: 0 0, ${offset}px ${offset}px;
  -webkit-mask-image:
    ${uri},
    ${uri};
  -webkit-mask-repeat: repeat;
  -webkit-mask-size: ${spacing}px ${spacing}px;
  -webkit-mask-position: 0 0, ${offset}px ${offset}px;
}
`;
}

const SidebarBgDev: FC = () => {
  /* Defaults match the live LeftPanel variant */
  const [base, setBase] = useState<BgToken>('--surface');
  const [gradientTarget, setGradientTarget] =
    useState<GradientTarget>('--primary-light');
  const [gradientDir, setGradientDir] = useState<GradientDir>('0deg');
  const [gradientPct, setGradientPct] = useState(75);
  /** 0 = target as-is; 50 ≈ mid between primary-light and primary; 100 = full --primary */
  const [towardPrimary, setTowardPrimary] = useState(80);
  const [shape, setShape] = useState<DecorationShape>('flower');
  const [dotColor, setDotColor] = useState<DotColorToken>('--text');
  const [dotOpacity, setDotOpacity] = useState(5);
  const [size, setSize] = useState(6);
  const [spacing, setSpacing] = useState(22);
  const [honeycomb, setHoneycomb] = useState(true);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const maskImage = useMemo(
    () => maskImageForShape(shape, size, spacing),
    [shape, size, spacing],
  );

  const offsetPx = honeycomb ? spacing / 2 : 0;

  const previewStyle = {
    '--sb-base': `var(${base})`,
    '--sb-gradient-target':
      gradientTarget === 'none' ? 'transparent' : `var(${gradientTarget})`,
    '--sb-gradient-dir': gradientDir,
    '--sb-gradient-pct': `${gradientPct}%`,
    '--sb-toward-primary': `${towardPrimary}%`,
    '--sb-dot-color': `var(${dotColor})`,
    '--sb-dot-opacity': `${dotOpacity}%`,
    '--sb-mask-image': maskImage,
    '--sb-spacing': `${spacing}px`,
    '--sb-offset': `${offsetPx}px`,
  } as CSSProperties;

  const cssOutput = useMemo(
    () =>
      buildCssOutput({
        base,
        gradientTarget,
        gradientDir,
        gradientPct,
        towardPrimary,
        shape,
        dotColor,
        dotOpacity,
        size,
        spacing,
        honeycomb,
      }),
    [
      base,
      gradientTarget,
      gradientDir,
      gradientPct,
      towardPrimary,
      shape,
      dotColor,
      dotOpacity,
      size,
      spacing,
      honeycomb,
    ],
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssOutput);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [cssOutput]);

  return (
    <div className={styles.root}>
      <div className={styles.workspace}>
        <p className={styles.note}>
          Theme switches in the main app. Copy CSS when you like a variant.
        </p>

        <div className={styles.controls}>
          <div className={styles.controlsRow}>
            <label className={styles.field}>
              Base color (level 1)
              <select
                value={base}
                onChange={(e) => setBase(e.target.value as BgToken)}
              >
                {BG_TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              Gradient target (level 2)
              <select
                value={gradientTarget}
                onChange={(e) =>
                  setGradientTarget(e.target.value as GradientTarget)
                }
              >
                {BG_TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
                <option value="none">none</option>
              </select>
            </label>

            <label className={styles.field}>
              Gradient direction
              <select
                value={gradientDir}
                onChange={(e) => setGradientDir(e.target.value as GradientDir)}
              >
                {GRADIENT_DIRS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              Gradient strength
              <input
                type="range"
                min={0}
                max={100}
                value={gradientPct}
                disabled={gradientTarget === 'none'}
                onChange={(e) => setGradientPct(Number(e.target.value))}
              />
              <span className={styles.rangeValue}>{gradientPct}%</span>
            </label>

            <label className={styles.field}>
              Toward primary (darken)
              <input
                type="range"
                min={0}
                max={100}
                value={towardPrimary}
                disabled={gradientTarget === 'none'}
                onChange={(e) => setTowardPrimary(Number(e.target.value))}
              />
              <span className={styles.rangeValue}>{towardPrimary}%</span>
            </label>
          </div>

          <div className={styles.controlsRow}>
            <label className={styles.field}>
              Decoration shape
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as DecorationShape)}
              >
                {SHAPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              Decoration color (level 3)
              <select
                value={dotColor}
                onChange={(e) => setDotColor(e.target.value as DotColorToken)}
              >
                {DOT_COLOR_TOKENS.map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              Decoration opacity
              <input
                type="range"
                min={2}
                max={15}
                value={dotOpacity}
                onChange={(e) => setDotOpacity(Number(e.target.value))}
              />
              <span className={styles.rangeValue}>{dotOpacity}%</span>
            </label>

            <label className={styles.field}>
              Decoration size
              <input
                type="range"
                min={4}
                max={10}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
              <span className={styles.rangeValue}>{size}px</span>
            </label>

            <label className={styles.field}>
              Grid spacing
              <input
                type="range"
                min={16}
                max={32}
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
              />
              <span className={styles.rangeValue}>{spacing}px</span>
            </label>

            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={honeycomb}
                onChange={(e) => setHoneycomb(e.target.checked)}
              />
              Honeycomb offset
            </label>

            <label className={styles.checkboxField}>
              <input
                type="checkbox"
                checked={collapsed}
                onChange={(e) => setCollapsed(e.target.checked)}
              />
              Collapsed (like current sidebar)
            </label>
          </div>
        </div>

        <div className={styles.outputColumn}>
          <div className={styles.outputHeader}>
            <span className={styles.previewLabel}>Generated CSS</span>
            <button
              type="button"
              className={styles.copyButton}
              onClick={() => void handleCopy()}
            >
              {copied ? 'Copied' : 'Copy CSS'}
            </button>
          </div>
          <pre className={styles.output}>{cssOutput}</pre>
        </div>
      </div>

      {/* Sibling of workspace so help/controls never push it down — top matches LeftPanel (12px). */}
      <aside
        className={clsx(panelStyles.panel, styles.previewSidebar)}
        data-collapsed={collapsed || undefined}
        data-no-gradient={gradientTarget === 'none' ? true : undefined}
        style={previewStyle}
        aria-label="Live sidebar preview"
      >
        <header className={panelStyles.header}>
          <Logo
            className={panelStyles.headerLogo}
            image
            size={collapsed ? 64 : 100}
          />
          <Logo className={panelStyles.headerTextLogo} height={84} text />
        </header>

        <nav
          aria-label="Sidebar preview"
          className={`${panelStyles.nav} scrollbar-hidden`}
        >
          <section className={panelStyles.navGroup}>
            <h2 className={panelStyles.groupLabel}>Main</h2>
            <ul className={panelStyles.navList}>
              {mainNavigationPages.map((page) => (
                <li key={page}>
                  <button
                    className={panelStyles.navItem}
                    data-active={page === 'diary' || undefined}
                    data-module={page}
                    type="button"
                  >
                    <AdIcon icon={navigationIcons[page]} size={16} />
                    <span className={panelStyles.navItemLabel}>
                      {navigationLabels[page]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={panelStyles.navGroup}>
            <AdDivider
              aria-hidden={!collapsed}
              className={panelStyles.groupDivider}
            />
            <h2 className={panelStyles.groupLabel}>Story</h2>
            <ul className={panelStyles.navList}>
              {MOCK_STORY.map((item) => (
                <li key={item.id}>
                  <button
                    className={panelStyles.navItem}
                    data-active={item.active || undefined}
                    data-module="diary"
                    type="button"
                  >
                    <AdIcon icon={item.icon} size={16} />
                    <span className={panelStyles.navItemLabel}>
                      {item.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={panelStyles.navGroup}>
            <AdDivider
              aria-hidden={!collapsed}
              className={panelStyles.groupDivider}
            />
            <h2 className={panelStyles.groupLabel}>Tools</h2>
            <ul className={panelStyles.navList}>
              {toolsNav.slice(0, 2).map((item) => (
                <li key={item.id}>
                  <button
                    className={panelStyles.navItem}
                    data-module={item.type}
                    type="button"
                  >
                    <AdIcon icon={item.icon} size={16} />
                    <span className={panelStyles.navItemLabel}>
                      {item.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </nav>

        <section aria-label="Appearance" className={panelStyles.themeSection}>
          <ThemeSelection collapsed={collapsed} />
        </section>

        <ProfileInfo
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>
    </div>
  );
};

export default SidebarBgDev;
