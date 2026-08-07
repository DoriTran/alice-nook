import type { ResolvedChatboxTag } from '@/pages/diary/ChatboxSidebar/Chatbox/chatbox.utils';

import {
  calculateFittingTagCount,
  getOverflowProbeLabel,
} from '@/pages/diary/ChatboxSidebar/Chatbox/chatbox.utils';

export type ChatboxTagFixture = {
  id: string;
  name: string;
  description: string;
  tags: ResolvedChatboxTag[];
};

export const CHATBOX_TAG_FIXTURES: ChatboxTagFixture[] = [
  {
    id: 'few-fit',
    name: 'Few tags',
    description: 'Should usually show all tags with no +N.',
    tags: [
      { label: 'work', count: 4, colorId: 'lavender' },
      { label: 'ideas', count: 2, colorId: 'mint' },
    ],
  },
  {
    id: 'many-short',
    name: 'Many short tags',
    description: 'Several short chips — +N appears as width shrinks.',
    tags: [
      { label: 'a', count: 9, colorId: 'rose' },
      { label: 'b', count: 8, colorId: 'lavender' },
      { label: 'c', count: 7, colorId: 'mint' },
      { label: 'd', count: 6, colorId: 'sky' },
      { label: 'e', count: 5, colorId: 'peach' },
      { label: 'f', count: 4, colorId: 'honey' },
      { label: 'g', count: 3, colorId: 'lilac' },
      { label: 'h', count: 2, colorId: 'sage' },
    ],
  },
  {
    id: 'mixed-long',
    name: 'Mixed long labels',
    description: 'Long labels force overflow sooner.',
    tags: [
      { label: 'anniversary-planning', count: 12, colorId: 'rose' },
      { label: 'weekend-trip', count: 8, colorId: 'sky' },
      { label: 'recipes', count: 5, colorId: 'mint' },
      { label: 'budget', count: 3, colorId: 'honey' },
      { label: 'notes', count: 1, colorId: 'lavender' },
    ],
  },
  {
    id: 'single-long',
    name: 'Single long tag',
    description: 'One wide tag — may become +1 when the stage is very narrow.',
    tags: [
      {
        label: 'super-long-tag-label-that-barely-fits',
        count: 15,
        colorId: 'peach',
      },
    ],
  },
  {
    id: 'one-plus-many',
    name: 'One plus many',
    description: 'Highest-count tag should stay visible longest.',
    tags: [
      { label: 'pinned', count: 20, colorId: 'rose' },
      { label: 'alpha', count: 3, colorId: 'lavender' },
      { label: 'beta', count: 2, colorId: 'mint' },
      { label: 'gamma', count: 1, colorId: 'sky' },
    ],
  },
];

export type FitUtilCase = {
  id: string;
  label: string;
  tagWidths: number[];
  containerWidth: number;
  gap: number;
  overflowChipWidth: number;
  expected: { visibleCount: number; overflowCount: number };
};

export const FIT_UTIL_CASES: FitUtilCase[] = [
  {
    id: 'all-fit',
    label: 'All tags fit → no overflow',
    tagWidths: [40, 40, 40],
    containerWidth: 140,
    gap: 5,
    overflowChipWidth: 30,
    expected: { visibleCount: 3, overflowCount: 0 },
  },
  {
    id: 'last-overflows',
    label: 'Last tag overflows → reserve overflow probe → +1',
    tagWidths: [50, 50, 50],
    containerWidth: 140,
    gap: 5,
    overflowChipWidth: 30,
    // 50+5+50+5+30 = 140 → visible 2, +1
    expected: { visibleCount: 2, overflowCount: 1 },
  },
  {
    id: 'needs-plus-more',
    label: 'Tight width → fewer tags + larger +N',
    tagWidths: [50, 50, 50, 50],
    containerWidth: 90,
    gap: 5,
    overflowChipWidth: 30,
    // 50+5+30 = 85 ≤ 90 → visible 1, +3
    expected: { visibleCount: 1, overflowCount: 3 },
  },
  {
    id: 'overflow-only',
    label: 'Single oversize tag → only +N',
    tagWidths: [200],
    containerWidth: 80,
    gap: 5,
    overflowChipWidth: 30,
    expected: { visibleCount: 0, overflowCount: 1 },
  },
  {
    id: 'gap-before-overflow',
    label: 'k=1 includes gap before overflow chip',
    tagWidths: [40, 40],
    containerWidth: 74,
    gap: 5,
    overflowChipWidth: 30,
    // 40+5+30 = 75 > 74 → visible 0, +2
    expected: { visibleCount: 0, overflowCount: 2 },
  },
  {
    id: 'exact-one-plus-overflow',
    label: 'Exact fit for one tag + gap + overflow',
    tagWidths: [40, 40],
    containerWidth: 75,
    gap: 5,
    overflowChipWidth: 30,
    // 40+5+30 = 75 → visible 1, +1
    expected: { visibleCount: 1, overflowCount: 1 },
  },
  {
    id: 'empty-or-zero',
    label: 'Empty / zero container → zeros',
    tagWidths: [],
    containerWidth: 100,
    gap: 5,
    overflowChipWidth: 30,
    expected: { visibleCount: 0, overflowCount: 0 },
  },
  {
    id: 'zero-width',
    label: 'Zero available width → zeros',
    tagWidths: [40, 40],
    containerWidth: 0,
    gap: 5,
    overflowChipWidth: 30,
    expected: { visibleCount: 0, overflowCount: 0 },
  },
];

const PROBE_LABEL_CASES = [
  { total: 1, expected: '+9' },
  { total: 9, expected: '+9' },
  { total: 10, expected: '+99' },
  { total: 99, expected: '+99' },
  { total: 100, expected: '+999' },
] as const;

export const runFitUtilCases = () => {
  const fitResults = FIT_UTIL_CASES.map((testCase) => {
    const actual = calculateFittingTagCount(
      testCase.tagWidths,
      testCase.containerWidth,
      testCase.gap,
      testCase.overflowChipWidth,
    );
    const pass =
      actual.visibleCount === testCase.expected.visibleCount &&
      actual.overflowCount === testCase.expected.overflowCount;

    return {
      id: testCase.id,
      label: testCase.label,
      expected: `${testCase.expected.visibleCount}/${testCase.expected.overflowCount}`,
      actual: `${actual.visibleCount}/${actual.overflowCount}`,
      pass,
    };
  });

  const probeResults = PROBE_LABEL_CASES.map((testCase) => {
    const actual = getOverflowProbeLabel(testCase.total);

    return {
      id: `probe-${testCase.total}`,
      label: `Probe for ${testCase.total} tags → ${testCase.expected}`,
      expected: testCase.expected,
      actual,
      pass: actual === testCase.expected,
    };
  });

  return [...fitResults, ...probeResults];
};
