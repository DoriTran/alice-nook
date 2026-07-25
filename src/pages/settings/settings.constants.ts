import {
  faBookmark,
  faComments,
  faDatabase,
  faInfoCircle,
  faKeyboard,
  faPalette,
  faTags,
} from '@fortawesome/free-solid-svg-icons';

import type {
  SettingsCategory,
  SettingsCategoryId,
  SettingsSearchEntry,
} from './settings.types';

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Customize how Dear Diary looks and feels.',
    icon: faPalette,
    subSections: [
      { id: 'theme', label: 'Theme & Colors' },
      { id: 'layout', label: 'Layout & Display' },
    ],
  },
  {
    id: 'composer',
    label: 'Composer',
    description: 'Configure how you write and send messages.',
    icon: faKeyboard,
    subSections: [
      { id: 'editor', label: 'Editor' },
      { id: 'attachments', label: 'Attachments' },
      { id: 'variants', label: 'Variants' },
      { id: 'decorations', label: 'Decorations' },
    ],
  },
  {
    id: 'messages',
    label: 'Messages & Features',
    description: 'General message and feed preferences.',
    icon: faComments,
    subSections: [{ id: 'general', label: 'General' }],
  },
  {
    id: 'tags',
    label: 'Tags',
    description: 'Create and manage tags used across your diary.',
    icon: faTags,
    subSections: [{ id: 'manage', label: 'Manage Tags' }],
  },
  {
    id: 'library',
    label: 'Library',
    description: 'Manage your reusable personal resources.',
    icon: faBookmark,
    subSections: [
      { id: 'icons', label: 'Icons' },
      { id: 'colors', label: 'Colors' },
      { id: 'palettes', label: 'Palettes' },
    ],
  },
  {
    id: 'data',
    label: 'Data & Sync',
    description: 'Backup, restore, and manage your storage.',
    icon: faDatabase,
    subSections: [
      { id: 'storage', label: 'Storage' },
      { id: 'backup', label: 'Backup & Export' },
      { id: 'danger', label: 'Danger Zone' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    description: 'Version, license and project information.',
    icon: faInfoCircle,
    subSections: [{ id: 'about', label: 'About Dear Diary' }],
  },
];

export const DEFAULT_CATEGORY: SettingsCategoryId = 'appearance';

/**
 * Flat index of every setting, used to power the search box. Clicking a result
 * navigates to the owning category and scrolls to its sub-section.
 */
export const SETTINGS_SEARCH_INDEX: SettingsSearchEntry[] = [
  // Appearance
  {
    category: 'appearance',
    subSection: 'theme',
    title: 'Theme',
    description: 'Choose your Dear Diary color theme.',
    keywords: ['wheat', 'blush', 'lavender', 'mint', 'palette'],
  },
  {
    category: 'appearance',
    subSection: 'theme',
    title: 'Light / Dark mode',
    description: 'Switch between light and dark appearance.',
    keywords: ['dark', 'light', 'mode'],
  },
  {
    category: 'appearance',
    subSection: 'layout',
    title: 'UI Density',
    description: 'Comfortable or compact spacing.',
  },
  {
    category: 'appearance',
    subSection: 'layout',
    title: 'Border Radius',
    description: 'How rounded corners appear.',
  },
  {
    category: 'appearance',
    subSection: 'layout',
    title: 'Font Size',
    description: 'Base text size across the app.',
  },
  {
    category: 'appearance',
    subSection: 'layout',
    title: 'Reduce Motion',
    description: 'Minimize animations and transitions.',
  },
  {
    category: 'appearance',
    subSection: 'layout',
    title: 'Accent Style',
    description: 'How accent colors are applied.',
  },
  // Composer
  {
    category: 'composer',
    subSection: 'editor',
    title: 'Enter Key Behavior',
    description: 'What Enter does in the composer.',
    keywords: ['enter', 'send', 'shift'],
  },
  {
    category: 'composer',
    subSection: 'editor',
    title: 'Auto Focus Composer',
    description: 'Focus the composer when opening a chat.',
  },
  {
    category: 'composer',
    subSection: 'editor',
    title: 'Restore Draft',
    description: 'Restore unfinished drafts when you reopen a chat.',
  },
  {
    category: 'composer',
    subSection: 'editor',
    title: 'Auto Expand Composer',
    description: 'Grow the composer as you type.',
  },
  {
    category: 'composer',
    subSection: 'editor',
    title: 'Spell Check',
    description: 'Check spelling while typing.',
  },
  {
    category: 'composer',
    subSection: 'editor',
    title: 'Markdown Shortcuts',
    description: 'Enable markdown shortcuts while typing.',
  },
  {
    category: 'composer',
    subSection: 'editor',
    title: 'Smart Quotes',
    description: 'Convert straight quotes to curly quotes.',
  },
  {
    category: 'composer',
    subSection: 'attachments',
    title: 'Paste Images Directly',
    description: 'Paste images from clipboard as attachments.',
  },
  {
    category: 'composer',
    subSection: 'attachments',
    title: 'Image Preview Size',
    description: 'How large image previews appear.',
  },
  {
    category: 'composer',
    subSection: 'variants',
    title: 'Todo Variant',
    description: 'Configure todo composer behavior.',
    keywords: ['todo', 'task', 'enter', 'send'],
  },
  {
    category: 'composer',
    subSection: 'variants',
    title: 'Todo Enter Key Behavior',
    description: 'What Enter does in the todo composer.',
    keywords: ['todo', 'enter', 'send', 'shift', 'newline'],
  },
  {
    category: 'composer',
    subSection: 'decorations',
    title: 'Ticket Decorator',
    description: 'Configure how ticket completion works.',
    keywords: ['ticket', 'tear', 'undo'],
  },
  {
    category: 'composer',
    subSection: 'decorations',
    title: 'Timer Decorator',
    description: 'Configure default timer behavior.',
    keywords: ['timer', 'countdown', 'countup'],
  },
  {
    category: 'composer',
    subSection: 'decorations',
    title: 'Reminder Decorator',
    description: 'Configure reminders.',
    keywords: ['reminder'],
  },
  // Messages
  {
    category: 'messages',
    subSection: 'general',
    title: 'Timestamp Format',
    description: '12-hour or 24-hour clock.',
  },
  {
    category: 'messages',
    subSection: 'general',
    title: 'Bubble Width',
    description: 'How wide message bubbles can grow.',
  },
  {
    category: 'messages',
    subSection: 'general',
    title: 'Link Previews',
    description: 'Show rich previews for links.',
  },
  // Tags
  {
    category: 'tags',
    subSection: 'manage',
    title: 'Manage Tags',
    description: 'Create, edit, and delete diary tags.',
    keywords: ['tag', 'label', 'hashtag', 'color'],
  },
  {
    category: 'tags',
    subSection: 'manage',
    title: 'Create Tag',
    description: 'Add a new tag to the global library.',
    keywords: ['create', 'new tag'],
  },
  // Library
  {
    category: 'library',
    subSection: 'icons',
    title: 'Recent Icons',
    description: 'Manage recently used icons.',
  },
  {
    category: 'library',
    subSection: 'icons',
    title: 'Favorite Icons',
    description: 'Manage your favorite icons.',
  },
  {
    category: 'library',
    subSection: 'colors',
    title: 'Recent Colors',
    description: 'Manage recently used colors.',
  },
  {
    category: 'library',
    subSection: 'palettes',
    title: 'Custom Palettes',
    description: 'Delete or export your custom palettes.',
  },
  // Data & Sync
  {
    category: 'data',
    subSection: 'storage',
    title: 'Storage Usage',
    description: 'View how much space Dear Diary is using.',
    keywords: ['indexeddb', 'storage', 'quota'],
  },
  {
    category: 'data',
    subSection: 'backup',
    title: 'Export Diary',
    description: 'Download a backup of your diary.',
  },
  {
    category: 'data',
    subSection: 'backup',
    title: 'Import Diary',
    description: 'Restore from a backup file.',
  },
  {
    category: 'data',
    subSection: 'danger',
    title: 'Reset Local Storage',
    description: 'Clear cached UI preferences.',
  },
  {
    category: 'data',
    subSection: 'danger',
    title: 'Clear All Data',
    description: 'Erase all local diary data.',
    keywords: ['reset', 'delete', 'wipe'],
  },
  // About
  {
    category: 'about',
    subSection: 'about',
    title: 'About Dear Diary',
    description: 'Version, license and links.',
    keywords: ['version', 'license', 'github'],
  },
];

export const APP_INFO = {
  name: 'Dear Diary',
  version: '0.1.0',
  license: 'MIT',
  repository: 'https://github.com/',
} as const;
