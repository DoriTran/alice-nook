import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type SettingsCategoryId =
  | 'appearance'
  | 'composer'
  | 'messages'
  | 'tags'
  | 'library'
  | 'data'
  | 'about';

export type SettingsSubSection = {
  id: string;
  label: string;
};

export type SettingsCategory = {
  id: SettingsCategoryId;
  label: string;
  description: string;
  icon: IconDefinition;
  subSections: SettingsSubSection[];
};

export type SettingsSearchEntry = {
  category: SettingsCategoryId;
  subSection: string;
  title: string;
  description: string;
  keywords?: string[];
};
