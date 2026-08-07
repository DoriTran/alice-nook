import type { ComponentType } from 'react';

import AdChipDev from './adchip';
import BrushHighlightDev from './brushhighlight';
import ChatboxTagsDev from './chatboxtags';
import DragDropSortableDev from './dragdropsortable';
import MessagePreviewDev from './messagepreview';
import SidebarBgDev from './sidebarbg';
import TicketShapeDev from './ticketshape';
import TicketShape2Dev from './ticketshape2';

export type DevTestEntry = {
  key: string;
  displayName: string;
  component: ComponentType;
};

export const devTests: readonly DevTestEntry[] = [
  {
    key: 'dragdropsortable',
    displayName: 'dragdropsortable (useScrollOffset)',
    component: DragDropSortableDev,
  },
  {
    key: 'brushhighlight',
    displayName: 'BrushHighlight',
    component: BrushHighlightDev,
  },
  {
    key: 'ticketshape',
    displayName: 'Ticket Shape',
    component: TicketShapeDev,
  },
  {
    key: 'ticketshape2',
    displayName: 'Ticket Shape 2 (ShapePath DSL)',
    component: TicketShape2Dev,
  },
  {
    key: 'adchip',
    displayName: 'AdChip',
    component: AdChipDev,
  },
  {
    key: 'messagepreview',
    displayName: 'Message Preview Cards',
    component: MessagePreviewDev,
  },
  {
    key: 'chatboxtags',
    displayName: 'Chatbox Tag Overflow',
    component: ChatboxTagsDev,
  },
  {
    key: 'sidebarbg',
    displayName: 'Sidebar Background',
    component: SidebarBgDev,
  },
] as const;

export type DevTestKey = (typeof devTests)[number]['key'];

export const getDevTestByKey = (key: string): DevTestEntry | undefined =>
  devTests.find((t) => t.key === key);

export const getDevTestByIndex = (id: number): DevTestEntry | undefined => {
  if (!Number.isFinite(id) || id < 1 || id > devTests.length) return undefined;
  return devTests[id - 1];
};

export const resolveActiveDevTest = (params: {
  test: string | null;
  id: string | null;
}): DevTestEntry | undefined => {
  const { test, id } = params;
  if (test) return getDevTestByKey(test);
  if (id) return getDevTestByIndex(Number(id));
  return undefined;
};
