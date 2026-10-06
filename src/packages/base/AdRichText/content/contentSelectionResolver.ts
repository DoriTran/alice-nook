import type { Mark } from '@tiptap/pm/model';

import { getMarkRange } from '@tiptap/core';
import { NodeSelection, type EditorState } from '@tiptap/pm/state';

export type ContentEntityKind =
  | 'tag'
  | 'reference'
  | 'link'
  | 'phone'
  | 'email';
export type ContentSpecialKind = 'copy' | 'secret';

export type ContentRange = {
  from: number;
  to: number;
};

export type ContentEntityRange = ContentRange & {
  kind: ContentEntityKind;
  atomic: boolean;
};

export type ContentSpecialRange = ContentRange & {
  kind: ContentSpecialKind;
  nodeType: string;
};

const ENTITY_NODE_KINDS: Record<string, ContentEntityKind | undefined> = {
  contentTag: 'tag',
  contentReference: 'reference',
};
const ENTITY_MARK_KINDS: Record<string, ContentEntityKind | undefined> = {
  link: 'link',
  contentPhone: 'phone',
  contentEmail: 'email',
};
const SPECIAL_NODE_KINDS: Record<string, ContentSpecialKind | undefined> = {
  contentCopyInline: 'copy',
  contentCopyBlock: 'copy',
  secretContentInline: 'secret',
  secretContentBlock: 'secret',
};

const keyOf = (range: ContentRange & { kind: string }) =>
  `${range.kind}:${range.from}:${range.to}`;

const markRangeAt = (state: EditorState, pos: number, mark: Mark) =>
  getMarkRange(
    state.doc.resolve(Math.min(pos + 1, state.doc.content.size)),
    mark.type,
    mark.attrs,
  );

export const collectContentEntities = (
  state: EditorState,
): ContentEntityRange[] => {
  const ranges = new Map<string, ContentEntityRange>();
  state.doc.descendants((node, pos) => {
    const nodeKind = ENTITY_NODE_KINDS[node.type.name];
    if (nodeKind) {
      const range = {
        kind: nodeKind,
        from: pos,
        to: pos + node.nodeSize,
        atomic: true,
      };
      ranges.set(keyOf(range), range);
      return false;
    }
    if (!node.isText) return;
    node.marks.forEach((mark) => {
      const kind = ENTITY_MARK_KINDS[mark.type.name];
      if (!kind) return;
      const found = markRangeAt(state, pos, mark);
      if (!found) return;
      const range = { kind, from: found.from, to: found.to, atomic: false };
      ranges.set(keyOf(range), range);
    });
  });
  return [...ranges.values()].sort((a, b) => a.from - b.from || b.to - a.to);
};

export const collectContentSpecials = (
  state: EditorState,
): ContentSpecialRange[] => {
  const ranges: ContentSpecialRange[] = [];
  state.doc.descendants((node, pos) => {
    const kind = SPECIAL_NODE_KINDS[node.type.name];
    if (kind)
      ranges.push({
        kind,
        nodeType: node.type.name,
        from: pos,
        to: pos + node.nodeSize,
      });
  });
  return ranges.sort((a, b) => a.from - b.from || b.to - a.to);
};

const intersects = (range: ContentRange, from: number, to: number) =>
  range.to > from && range.from < to;
const containsCaret = (range: ContentRange, pos: number) =>
  range.from < pos && range.to > pos;
const containsSpecialCaret = (range: ContentSpecialRange, pos: number) =>
  range.kind === 'copy' ? range.from + 1 < pos && range.to - 1 > pos : false;

export const resolveContentSelection = (state: EditorState) => {
  const { selection } = state;
  const { from, to, empty } = selection;
  const allEntities = collectContentEntities(state);
  const allSpecials = collectContentSpecials(state);
  const explicitEntity =
    selection instanceof NodeSelection
      ? allEntities.find((range) => range.from === from && range.to === to)
      : undefined;
  const explicitSpecial =
    selection instanceof NodeSelection
      ? allSpecials.find((range) => range.from === from && range.to === to)
      : undefined;
  const caretEntities = empty
    ? allEntities.filter((range) => containsCaret(range, from))
    : [];
  const entities = empty
    ? explicitEntity
      ? [explicitEntity]
      : caretEntities
    : allEntities.filter((range) => intersects(range, from, to));
  const exactEntity =
    entities.length === 1 && entities[0].from === from && entities[0].to === to
      ? entities[0]
      : explicitEntity;
  const partialEntities = empty
    ? []
    : entities.filter((range) => !(from <= range.from && to >= range.to));
  const specialAncestors = empty
    ? explicitSpecial
      ? [explicitSpecial]
      : allSpecials.filter((range) => containsSpecialCaret(range, from))
    : allSpecials.filter((range) => range.from <= from && range.to >= to);
  const intersectingSpecials = empty
    ? specialAncestors
    : allSpecials.filter((range) => intersects(range, from, to));
  const partialSpecials = empty
    ? []
    : intersectingSpecials.filter(
        (range) =>
          !(from <= range.from && to >= range.to) &&
          !(range.from <= from && range.to >= to),
      );
  const textSegments: Array<ContentRange & { entity: boolean }> = [];
  if (!empty)
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText) return;
      const segment = {
        from: Math.max(from, pos),
        to: Math.min(to, pos + node.nodeSize),
        entity: node.marks.some((mark) =>
          Boolean(ENTITY_MARK_KINDS[mark.type.name]),
        ),
      };
      if (segment.from < segment.to) textSegments.push(segment);
    });
  const eligibleFormattingSegments = textSegments.filter(
    (segment) => !segment.entity,
  );
  let containsLineBreak = false;
  if (!empty) {
    const start = state.doc.resolve(from);
    const end = state.doc.resolve(to);
    containsLineBreak = start.parent !== end.parent;
    state.doc.nodesBetween(from, to, (node) => {
      if (node.type.name === 'hardBreak') containsLineBreak = true;
    });
  }
  return {
    mode: empty
      ? explicitEntity
        ? ('entity-selection' as const)
        : ('caret' as const)
      : exactEntity
        ? ('entity-selection' as const)
        : ('text-selection' as const),
    rawRange: { from, to },
    textSegments,
    eligibleFormattingSegments,
    entities,
    exactEntity,
    partialEntities,
    specialAncestors,
    intersectingSpecials,
    partialSpecials,
    containsLineBreak,
    explicitSpecial,
  };
};

export type ContentSelectionResolution = ReturnType<
  typeof resolveContentSelection
>;

export const normalizeSpecialSelection = (state: EditorState) => {
  const resolved = resolveContentSelection(state);
  let { from, to } = resolved.rawRange;
  if (from === to) {
    const entity = resolved.exactEntity ?? resolved.entities[0];
    if (!entity) return { ...resolved, from, to };
    from = entity.from;
    to = entity.to;
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const range of collectContentEntities(state)) {
      if (!intersects(range, from, to)) continue;
      const contains = from <= range.from && to >= range.to;
      if (contains) continue;
      const nextFrom = Math.min(from, range.from);
      const nextTo = Math.max(to, range.to);
      changed ||= nextFrom !== from || nextTo !== to;
      from = nextFrom;
      to = nextTo;
    }
    for (const range of collectContentSpecials(state)) {
      if (!intersects(range, from, to)) continue;
      const contains = from <= range.from && to >= range.to;
      const containedBy = range.from <= from && range.to >= to;
      if (contains || containedBy) continue;
      const nextFrom = Math.min(from, range.from);
      const nextTo = Math.max(to, range.to);
      changed ||= nextFrom !== from || nextTo !== to;
      from = nextFrom;
      to = nextTo;
    }
  }
  return { ...resolved, from, to };
};
