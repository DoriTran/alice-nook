export type {
  ColorCategory,
  ColorDefinition,
  ColorId,
  ColorPalette,
  CustomColorId,
  CustomPalette,
  PaletteShade,
  PresetColorId,
  ResolvedPalette,
} from './types';

export {
  COLOR_PRESETS,
  DEFAULT_COLOR_ID,
  PRESET_CATEGORIES,
  PRESET_COLOR_IDS,
  RECENT_COLOR_LIMIT,
} from './presets';

export {
  getColorDefinition,
  getColorName,
  getCustomPaletteId,
  getPreset,
  getPresetIds,
  getPresetsByCategory,
  isCustomColorId,
  isValidColorId,
} from './colorRegistry';

export {
  colorDistance,
  hexToHsl,
  hexToHsv,
  hexToRgb,
  hslToHex,
  hsvToHex,
  normalizeHex,
  rgbToHex,
} from './colorUtils';

export { generatePaletteFromBase } from './generatePalette';

export {
  buildSwatchBackground,
  normalizeShades,
} from './buildSwatchBackground';

export {
  migrateHexToColorId,
  normalizeColorId,
  toCustomColorId,
} from './migrateHexColor';

export { getAppMode, resolveColor, resolvePalette } from './resolvePalette';

export { useResolvedPalette } from './useResolvedPalette';

export {
  chatboxCssVars,
  groupLabelStyles,
  iconBackground,
  tagStyles,
} from './colorUsage';

export {
  default as ColorMainSwatch,
  type ColorMainSwatchProps,
} from './ColorMainSwatch';
