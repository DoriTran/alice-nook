import { faBookOpen, faClapperboard } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { RotateCcw } from 'lucide-react';
import {
  type CSSProperties,
  type FC,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { AdColorPicker, AdDivider, AdIcon } from '@/packages/base';
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
import { type AppMode, useSettingsStore } from '@/store';

import styles from './index.module.css';

type GlowShape = 'circle' | 'ellipse';

type SidebarBackgroundConfig = {
  backgroundTop: string;
  backgroundMid: string;
  backgroundBottom: string;
  glowColor: string;
  glowOpacity: number;
  text: string;
  textMuted: string;
  border: string;
  gradientAngle: number;
  topStop: number;
  midStop: number;
  bottomStop: number;
  glowShape: GlowShape;
  glowX: number;
  glowY: number;
  glowStart: number;
  glowEnd: number;
};

const LIGHT_BACKGROUND_CONFIG: SidebarBackgroundConfig = {
  backgroundTop: '#f8ccd8',
  backgroundMid: '#fbe0e5',
  backgroundBottom: '#fff0e8',
  glowColor: '#ffffff',
  glowOpacity: 30,
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
  border: 'var(--border)',
  gradientAngle: 180,
  topStop: 0,
  midStop: 45,
  bottomStop: 100,
  glowShape: 'ellipse',
  glowX: 50,
  glowY: 0,
  glowStart: 20,
  glowEnd: 60,
};

const DARK_BACKGROUND_CONFIG: SidebarBackgroundConfig = {
  backgroundTop: '#824052',
  backgroundMid: '#713a4c',
  backgroundBottom: '#5a3640',
  glowColor: '#c86682',
  glowOpacity: 30,
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
  border: 'var(--border)',
  gradientAngle: 180,
  topStop: 0,
  midStop: 48,
  bottomStop: 100,
  glowShape: 'ellipse',
  glowX: 50,
  glowY: 0,
  glowStart: 20,
  glowEnd: 60,
};

const createInitialBackgroundConfigs = (): Record<
  AppMode,
  SidebarBackgroundConfig
> => ({
  light: { ...LIGHT_BACKGROUND_CONFIG },
  dark: { ...DARK_BACKGROUND_CONFIG },
});

const MOCK_STORY = [
  { id: 'story-1', name: 'Personal', icon: faBookOpen, active: false },
  { id: 'story-2', name: 'Journal', icon: faBookOpen, active: true },
  { id: 'story-3', name: 'Media', icon: faClapperboard, active: false },
] as const;

type FieldHeadingProps = {
  isDefault: boolean;
  label: string;
  onRevert: () => void;
};

const FieldHeading: FC<FieldHeadingProps> = ({
  isDefault,
  label,
  onRevert,
}) => (
  <span className={styles.fieldHeading}>
    <span>{label}</span>
    <button
      aria-label={`Revert ${label} to default`}
      className={styles.revertButton}
      disabled={isDefault}
      onClick={onRevert}
      title={isDefault ? 'Already at default' : `Revert ${label} to default`}
      type="button"
    >
      <AdIcon icon={RotateCcw} size={13} source="lucide" strokeWidth={2} />
    </button>
  </span>
);

type ColorValueFieldProps = {
  defaultValue: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRevert: () => void;
};

const ColorValueField: FC<ColorValueFieldProps> = ({
  defaultValue,
  label,
  value,
  onChange,
  onRevert,
}) => (
  <div className={styles.field}>
    <FieldHeading
      isDefault={value === defaultValue}
      label={label}
      onRevert={onRevert}
    />
    <AdColorPicker onChange={onChange} value={value} />
  </div>
);

type CssValueFieldProps = {
  defaultValue: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onRevert: () => void;
};

const CssValueField: FC<CssValueFieldProps> = ({
  defaultValue,
  label,
  value,
  onChange,
  onRevert,
}) => (
  <div className={styles.field}>
    <FieldHeading
      isDefault={value === defaultValue}
      label={label}
      onRevert={onRevert}
    />
    <span className={styles.cssValueControl}>
      <span
        aria-hidden="true"
        className={styles.colorSwatch}
        style={{ background: value }}
      />
      <input
        aria-label={label}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        type="text"
        value={value}
      />
    </span>
  </div>
);

type RangeFieldProps = {
  defaultValue: number;
  label: string;
  max: number;
  min: number;
  unit: 'deg' | '%';
  value: number;
  onChange: (value: number) => void;
  onRevert: () => void;
};

const RangeField: FC<RangeFieldProps> = ({
  defaultValue,
  label,
  max,
  min,
  unit,
  value,
  onChange,
  onRevert,
}) => (
  <div className={styles.field}>
    <FieldHeading
      isDefault={value === defaultValue}
      label={label}
      onRevert={onRevert}
    />
    <input
      aria-label={label}
      max={max}
      min={min}
      onChange={(event) => onChange(Number(event.target.value))}
      type="range"
      value={value}
    />
    <span className={styles.rangeValue}>
      {value}
      {unit}
    </span>
  </div>
);

function buildModeVariables(
  mode: AppMode,
  config: SidebarBackgroundConfig,
): string {
  return `:global([data-mode='${mode}']) .panel {
  --sidebar-bg-top: ${config.backgroundTop};
  --sidebar-bg-mid: ${config.backgroundMid};
  --sidebar-bg-bottom: ${config.backgroundBottom};
  --sidebar-bg-glow-color: ${config.glowColor};
  --sidebar-bg-glow-opacity: ${config.glowOpacity}%;
  --sidebar-bg-glow: color-mix(
    in srgb,
    var(--sidebar-bg-glow-color) var(--sidebar-bg-glow-opacity),
    transparent
  );
  --sidebar-text: ${config.text};
  --sidebar-text-muted: ${config.textMuted};
  --sidebar-border: ${config.border};
  --sidebar-bg-gradient-angle: ${config.gradientAngle}deg;
  --sidebar-bg-top-stop: ${config.topStop}%;
  --sidebar-bg-mid-stop: ${config.midStop}%;
  --sidebar-bg-bottom-stop: ${config.bottomStop}%;
  --sidebar-bg-glow-shape: ${config.glowShape};
  --sidebar-bg-glow-position: ${config.glowX}% ${config.glowY}%;
  --sidebar-bg-glow-start: ${config.glowStart}%;
  --sidebar-bg-glow-end: ${config.glowEnd}%;
}`;
}

function buildCssOutput(
  configs: Record<AppMode, SidebarBackgroundConfig>,
): string {
  return `/* Generated from /dev?test=sidebarbg - paste into LeftPanel.module.css */

${buildModeVariables('light', configs.light)}

${buildModeVariables('dark', configs.dark)}

.panel {
  background:
    radial-gradient(
      var(--sidebar-bg-glow-shape, ellipse) at var(--sidebar-bg-glow-position, 50% 0%),
      var(--sidebar-bg-glow, transparent) var(--sidebar-bg-glow-start, 0%),
      transparent var(--sidebar-bg-glow-end, 34%)
    ),
    linear-gradient(
      var(--sidebar-bg-gradient-angle, 180deg),
      var(--sidebar-bg-top, var(--surface)) var(--sidebar-bg-top-stop, 0%),
      var(--sidebar-bg-mid, var(--surface)) var(--sidebar-bg-mid-stop, 45%),
      var(--sidebar-bg-bottom, var(--surface)) var(--sidebar-bg-bottom-stop, 100%)
    );
  border-color: var(--sidebar-border, var(--border-soft));
  color: var(--sidebar-text, var(--text));
}

.groupLabel {
  color: var(--sidebar-text-muted, var(--text-muted));
}
`;
}

const SidebarBgDev: FC = () => {
  const { mode, setMode } = useSettingsStore(['mode', 'setMode']);
  const [backgroundConfigs, setBackgroundConfigs] = useState(
    createInitialBackgroundConfigs,
  );
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const activeConfig = backgroundConfigs[mode];
  const defaultConfig =
    mode === 'light' ? LIGHT_BACKGROUND_CONFIG : DARK_BACKGROUND_CONFIG;

  const updateActiveConfig = useCallback(
    (patch: Partial<SidebarBackgroundConfig>) => {
      setBackgroundConfigs((current) => ({
        ...current,
        [mode]: { ...current[mode], ...patch },
      }));
    },
    [mode],
  );

  const revertActiveField = useCallback(
    (field: keyof SidebarBackgroundConfig) => {
      const defaults =
        mode === 'light' ? LIGHT_BACKGROUND_CONFIG : DARK_BACKGROUND_CONFIG;

      setBackgroundConfigs((current) => ({
        ...current,
        [mode]: {
          ...current[mode],
          [field]: defaults[field],
        },
      }));
    },
    [mode],
  );

  const previewStyle = {
    '--sidebar-bg-top': activeConfig.backgroundTop,
    '--sidebar-bg-mid': activeConfig.backgroundMid,
    '--sidebar-bg-bottom': activeConfig.backgroundBottom,
    '--sidebar-bg-glow-color': activeConfig.glowColor,
    '--sidebar-bg-glow-opacity': `${activeConfig.glowOpacity}%`,
    '--sidebar-bg-glow': `color-mix(in srgb, ${activeConfig.glowColor} ${activeConfig.glowOpacity}%, transparent)`,
    '--sidebar-text': activeConfig.text,
    '--sidebar-text-muted': activeConfig.textMuted,
    '--sidebar-border': activeConfig.border,
    '--sidebar-bg-gradient-angle': `${activeConfig.gradientAngle}deg`,
    '--sidebar-bg-top-stop': `${activeConfig.topStop}%`,
    '--sidebar-bg-mid-stop': `${activeConfig.midStop}%`,
    '--sidebar-bg-bottom-stop': `${activeConfig.bottomStop}%`,
    '--sidebar-bg-glow-shape': activeConfig.glowShape,
    '--sidebar-bg-glow-position': `${activeConfig.glowX}% ${activeConfig.glowY}%`,
    '--sidebar-bg-glow-start': `${activeConfig.glowStart}%`,
    '--sidebar-bg-glow-end': `${activeConfig.glowEnd}%`,
  } as CSSProperties;

  const cssOutput = useMemo(
    () => buildCssOutput(backgroundConfigs),
    [backgroundConfigs],
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
          Configure the real sidebar background variables and layered gradient.
          Light and dark recipes are independent.
        </p>

        <div className={styles.modeToolbar}>
          <div>
            <span className={styles.modeEyebrow}>Editing background</span>
            <strong className={styles.modeTitle}>
              {mode === 'light' ? 'Light mode' : 'Dark mode'}
            </strong>
          </div>
          <div className={styles.toolbarActions}>
            <label className={styles.previewOption}>
              <input
                checked={collapsed}
                onChange={(event) => setCollapsed(event.target.checked)}
                type="checkbox"
              />
              Collapsed preview
            </label>
            <div
              aria-label="Background mode"
              className={styles.modeToggle}
              role="group"
            >
              {(['light', 'dark'] as const).map((option) => (
                <button
                  aria-pressed={mode === option}
                  className={styles.modeButton}
                  data-active={mode === option || undefined}
                  key={option}
                  onClick={() => setMode(option)}
                  type="button"
                >
                  {option === 'light' ? 'Light' : 'Dark'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <section className={styles.controlSection}>
            <div className={styles.sectionHeader}>
              <h2>Background colors</h2>
              <p>Three linear-gradient stops plus the radial glow color.</p>
            </div>
            <div className={styles.fieldsGrid}>
              <ColorValueField
                defaultValue={defaultConfig.backgroundTop}
                label="--sidebar-bg-top"
                onRevert={() => revertActiveField('backgroundTop')}
                value={activeConfig.backgroundTop}
                onChange={(backgroundTop) =>
                  updateActiveConfig({ backgroundTop })
                }
              />
              <ColorValueField
                defaultValue={defaultConfig.backgroundMid}
                label="--sidebar-bg-mid"
                onRevert={() => revertActiveField('backgroundMid')}
                value={activeConfig.backgroundMid}
                onChange={(backgroundMid) =>
                  updateActiveConfig({ backgroundMid })
                }
              />
              <ColorValueField
                defaultValue={defaultConfig.backgroundBottom}
                label="--sidebar-bg-bottom"
                onRevert={() => revertActiveField('backgroundBottom')}
                value={activeConfig.backgroundBottom}
                onChange={(backgroundBottom) =>
                  updateActiveConfig({ backgroundBottom })
                }
              />
              <ColorValueField
                defaultValue={defaultConfig.glowColor}
                label="--sidebar-bg-glow-color"
                onRevert={() => revertActiveField('glowColor')}
                value={activeConfig.glowColor}
                onChange={(glowColor) => updateActiveConfig({ glowColor })}
              />
              <RangeField
                defaultValue={defaultConfig.glowOpacity}
                label="Glow opacity"
                max={100}
                min={0}
                onChange={(glowOpacity) => updateActiveConfig({ glowOpacity })}
                onRevert={() => revertActiveField('glowOpacity')}
                unit="%"
                value={activeConfig.glowOpacity}
              />
            </div>
          </section>

          <section className={styles.controlSection}>
            <div className={styles.sectionHeader}>
              <h2>Linear gradient</h2>
              <p>Angle and position of the top, middle, and bottom colors.</p>
            </div>
            <div className={styles.fieldsGrid}>
              <RangeField
                defaultValue={defaultConfig.gradientAngle}
                label="Gradient angle"
                min={0}
                max={360}
                unit="deg"
                value={activeConfig.gradientAngle}
                onChange={(gradientAngle) =>
                  updateActiveConfig({ gradientAngle })
                }
                onRevert={() => revertActiveField('gradientAngle')}
              />
              <RangeField
                defaultValue={defaultConfig.topStop}
                label="Top color stop"
                min={0}
                max={100}
                unit="%"
                value={activeConfig.topStop}
                onChange={(topStop) => updateActiveConfig({ topStop })}
                onRevert={() => revertActiveField('topStop')}
              />
              <RangeField
                defaultValue={defaultConfig.midStop}
                label="Middle color stop"
                min={0}
                max={100}
                unit="%"
                value={activeConfig.midStop}
                onChange={(midStop) => updateActiveConfig({ midStop })}
                onRevert={() => revertActiveField('midStop')}
              />
              <RangeField
                defaultValue={defaultConfig.bottomStop}
                label="Bottom color stop"
                min={0}
                max={100}
                unit="%"
                value={activeConfig.bottomStop}
                onChange={(bottomStop) => updateActiveConfig({ bottomStop })}
                onRevert={() => revertActiveField('bottomStop')}
              />
            </div>
          </section>

          <section className={styles.controlSection}>
            <div className={styles.sectionHeader}>
              <h2>Radial glow</h2>
              <p>The glow is painted above the three-color gradient.</p>
            </div>
            <div className={styles.fieldsGrid}>
              <div className={styles.field}>
                <FieldHeading
                  isDefault={activeConfig.glowShape === defaultConfig.glowShape}
                  label="Glow shape"
                  onRevert={() => revertActiveField('glowShape')}
                />
                <select
                  aria-label="Glow shape"
                  value={activeConfig.glowShape}
                  onChange={(event) =>
                    updateActiveConfig({
                      glowShape: event.target.value as GlowShape,
                    })
                  }
                >
                  <option value="ellipse">Ellipse</option>
                  <option value="circle">Circle</option>
                </select>
              </div>
              <RangeField
                defaultValue={defaultConfig.glowX}
                label="Horizontal position"
                min={-50}
                max={150}
                unit="%"
                value={activeConfig.glowX}
                onChange={(glowX) => updateActiveConfig({ glowX })}
                onRevert={() => revertActiveField('glowX')}
              />
              <RangeField
                defaultValue={defaultConfig.glowY}
                label="Vertical position"
                min={-50}
                max={150}
                unit="%"
                value={activeConfig.glowY}
                onChange={(glowY) => updateActiveConfig({ glowY })}
                onRevert={() => revertActiveField('glowY')}
              />
              <RangeField
                defaultValue={defaultConfig.glowStart}
                label="Glow start"
                min={0}
                max={100}
                unit="%"
                value={activeConfig.glowStart}
                onChange={(glowStart) => updateActiveConfig({ glowStart })}
                onRevert={() => revertActiveField('glowStart')}
              />
              <RangeField
                defaultValue={defaultConfig.glowEnd}
                label="Glow fade end"
                min={1}
                max={150}
                unit="%"
                value={activeConfig.glowEnd}
                onChange={(glowEnd) => updateActiveConfig({ glowEnd })}
                onRevert={() => revertActiveField('glowEnd')}
              />
            </div>
          </section>

          <section className={styles.controlSection}>
            <div className={styles.sectionHeader}>
              <h2>Foreground and border</h2>
              <p>CSS values used by text and the sidebar outline.</p>
            </div>
            <div className={styles.fieldsGrid}>
              <CssValueField
                defaultValue={defaultConfig.text}
                label="--sidebar-text"
                onRevert={() => revertActiveField('text')}
                value={activeConfig.text}
                onChange={(text) => updateActiveConfig({ text })}
              />
              <CssValueField
                defaultValue={defaultConfig.textMuted}
                label="--sidebar-text-muted"
                onRevert={() => revertActiveField('textMuted')}
                value={activeConfig.textMuted}
                onChange={(textMuted) => updateActiveConfig({ textMuted })}
              />
              <CssValueField
                defaultValue={defaultConfig.border}
                label="--sidebar-border"
                onRevert={() => revertActiveField('border')}
                value={activeConfig.border}
                onChange={(border) => updateActiveConfig({ border })}
              />
            </div>
          </section>
        </div>

        <div className={styles.outputColumn}>
          <div className={styles.outputHeader}>
            <span className={styles.previewLabel}>Generated CSS</span>
            <button
              className={styles.copyButton}
              onClick={() => void handleCopy()}
              type="button"
            >
              {copied ? 'Copied' : 'Copy CSS'}
            </button>
          </div>
          <pre className={styles.output}>{cssOutput}</pre>
        </div>
      </div>

      <aside
        aria-label="Live sidebar preview"
        className={clsx(panelStyles.panel, styles.previewSidebar)}
        data-collapsed={collapsed || undefined}
        style={previewStyle}
      >
        <header className={panelStyles.header}>
          <Logo
            className={panelStyles.headerLogo}
            variant={collapsed ? 'stacked' : 'expanded'}
          />
        </header>

        <nav
          aria-label="Sidebar preview"
          className={`${panelStyles.nav} scrollbar-hidden`}
        >
          <section className={panelStyles.navGroup}>
            <h2 className={clsx(panelStyles.groupLabel, styles.previewMuted)}>
              Main
            </h2>
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
            <h2 className={clsx(panelStyles.groupLabel, styles.previewMuted)}>
              Story
            </h2>
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
            <h2 className={clsx(panelStyles.groupLabel, styles.previewMuted)}>
              Tools
            </h2>
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
          onToggleCollapse={() => setCollapsed((current) => !current)}
        />
      </aside>
    </div>
  );
};

export default SidebarBgDev;
