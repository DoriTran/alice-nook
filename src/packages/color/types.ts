export type ColorPalette = {
  soft: string;
  main: string;
  strong: string;
};

export type PaletteShade = keyof ColorPalette;

export type ColorCategory = 'warm' | 'nature' | 'ocean' | 'dreamy' | 'neutral';

export type PresetColorId =
  | 'rose'
  | 'raspberry'
  | 'coral'
  | 'peach'
  | 'tangerine'
  | 'honey'
  | 'sage'
  | 'mint'
  | 'moss'
  | 'matcha'
  | 'sky'
  | 'cyan'
  | 'azure'
  | 'navy'
  | 'lavender'
  | 'violet'
  | 'plum'
  | 'lilac'
  | 'ivory'
  | 'cocoa';

export type CustomColorId = `custom:${string}`;

export type ColorId = PresetColorId | CustomColorId;

export type ColorDefinition = {
  id: PresetColorId;
  name: string;
  personality: string;
  category: ColorCategory;
  icon: string;
  light: ColorPalette;
  dark: ColorPalette;
};

export type CustomPalette = {
  id: string;
  name: string;
  description?: string;
  baseColor: string;
  light: ColorPalette;
  dark: ColorPalette;
  createdAt: string;
};

export type ResolvedPalette = ColorPalette & {
  colorId: ColorId;
  name: string;
};
