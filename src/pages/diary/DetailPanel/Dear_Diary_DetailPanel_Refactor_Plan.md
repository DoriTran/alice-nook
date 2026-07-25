# Dear Diary --- Detail Panel Refactor Plan

## Decision

The Detail Panel UX is already shipping (Overview / Media / Category).
The next work is an **architecture refactor**, not a visual redesign.

Align `DetailPanel/` with the same principles already used by
`MessagePanel/`:

- Each UI feature owns its sub-components
- Cross-feature imports go through public barrels only
- Panel orchestration stays thin; data + navigation concerns are explicit
- Shared preview / formatting helpers live in one clear place

No TipTap / AdRichText work belongs in this milestone. Detail Panel only
*reads* message content for previews and stats.

------------------------------------------------------------------------

# Product Surface (current)

Fixed-width chatbox side panel (`--detail-panel-width: 340px`).

```text
Header
  icon · title · description
  search · edit · notifications

Tabs
  Overview | Media | Settings

Overview
  Statistics (total card + type cards + centered updated-at)
  Messages (Pinned / Archived progress bars → message list dialog)
  Tags (pills with edit / chatbox-local delete → message list dialog)

Media
  Equal-width filter pills (All / Images / Videos / Links / Files)
  Month-grouped thumbnail / file grid → jump to message in timeline

Settings
  Delete this chat (confirmation dialog)
```

Parent page (`pages/diary/index.tsx`) owns collapse, jump-to-message,
timeline search focus, and edit-chatbox modal open.

------------------------------------------------------------------------

# Current Code Status

## Folder structure (as of now)

Already feature-split by tab. Not a single mega JSX file.

```text
DetailPanel/
├── DetailPanel.tsx              # root: tabs + cross-tab navigation state
├── DetailPanel.module.css
├── useDetailPanelData.ts        # store → view-model
├── detailPanel.utils.ts         # types + stats / media / tags / pin-archive
│
├── Header/
│   ├── Header.tsx
│   └── Header.module.css
├── Tabs/
│   ├── Tabs.tsx
│   └── Tabs.module.css
├── OverviewTab/
│   ├── OverviewTab.tsx
│   ├── TagFill.tsx
│   └── OverviewTab.module.css
├── MediaTab/
│   ├── MediaTab.tsx
│   └── MediaTab.module.css
├── CategoryTab/
│   ├── CategoryTab.tsx
│   └── CategoryTab.module.css
└── components/                  # shared within DetailPanel
    ├── StatCard.*
    ├── ProgressBarRow.*
    ├── InfoCallout.*            # also deep-imported by WorkspaceExplorer
    └── DetailMessagePreviewRow.*
```

Missing relative to MessagePanel conventions:

- No `_architecture.md` (this plan is the first written target)
- No public `index.ts` barrel
- No `.hooks/` for panel orchestration
- Utils are one flat dump (`detailPanel.utils.ts`)

## Component hierarchy

```text
Diary (pages/diary/index.tsx)
├── ChatboxSidebar
├── MessagePanel
│   └── Header  ← toggles detailPanelCollapsed
└── DetailPanel
    ├── Header
    ├── Tabs
    └── scroll
        ├── OverviewTab
        │   ├── StatCard ×6
        │   ├── ProgressBarRow (Pinned / Archived)
        │   ├── TagFill (Top Tags)
        │   └── InfoCallout
        ├── MediaTab
        │   ├── filter chips
        │   ├── media grid cells
        │   └── InfoCallout
        └── CategoryTab
            ├── Pin & Archive accordions → DetailMessagePreviewRow
            ├── Tag pills (AdChip)
            ├── filtered list → DetailMessagePreviewRow
            └── InfoCallout
```

## Data flow

```text
useDiaryStore (chatboxes, messages, tags, orders, customPalettes)
useSettingsStore (mode)
        │
        ▼
useDetailPanelData(chatboxId)
        │  identity, stats, tags, topTags,
        │  mediaItems, pinned, archived, allMessages
        ▼
DetailPanel
  ├── local: activeTab
  ├── local: pinnedExpanded / archivedExpanded   ← lifted for Overview deep-link
  ├── local: selectedTagIds                      ← lifted for Top Tag → Category
  ├── Header actions → page callbacks / updateChatbox
  └── tab bodies → onJumpToMessage(messageId) → page → MessagePanel scroll
```

Reset on `chatboxId` change: tab back to Overview, expand defaults, clear tag filter.

## What already works well

| Area | Status |
| ---- | ------ |
| Tab shell + Header | Clean, presentational |
| Store → view-model hook | `useDetailPanelData` is the right seam |
| Overview deep-links | Bars / tags switch to Category with expand / filter |
| Media jump-to-message | Filter + grid + timeline scroll |
| Category OR tag filter | Multi-select pills + preview rows |
| Collapse | CSS width collapse from page state; MessagePanel Header toggles it |

## Pain points

1. **Root holds Category UI state**  
   Accordion expand + tag selection live in `DetailPanel.tsx` so Overview
   can deep-link. Shell orchestration and Category concerns are mixed.

2. **Inconsistent state ownership**  
   Media filter / expand is local to `MediaTab`. Category filter / expand
   is parent-owned. Same class of UI state, different rules.

3. **Utils dump**  
   `detailPanel.utils.ts` owns identity, stats, media collect/filter,
   tags, pin/archive, thumbnails, duration formatting. Hard to grow
   without becoming a junk drawer.

4. **Cross-feature deep imports**  
   `DetailMessagePreviewRow` reaches into:
   - `ChatboxSidebar/Chatbox/chatbox.utils` (`getMessagePreview`, time formatters)
   - `MessagePanel/messagePanel.utils` (`getMessagePreviewText`)  
   MessagePanel architecture already calls this out as an exception;
   DetailPanel is the main consumer.

5. **Duplicated accordion markup** in `CategoryTab` (pinned vs archived).

6. **No public barrel**  
   Workspace deep-imports `components/InfoCallout`. DetailPanel has no
   `index.ts` boundary.

7. **Collapse still mounts work**  
   Collapsed panel is `width: 0` + `aria-hidden`, but the tree still
   mounts and `useDetailPanelData` still recomputes.

8. **Preview text split across features**  
   Sidebar preview vs MessagePanel preview text are two helpers;
   DetailPanel combines both. Future rich-text content will hit this seam.

------------------------------------------------------------------------

# Design Principles (target)

Same spirit as MessagePanel:

```text
DetailPanel is a Chatbox Insight Shell.
It aggregates read-only views over one chatbox.
It does not own message mutation (except notification toggle on the chatbox).
```

Rules:

1. **Shell stays thin** --- tab switch + deep-link navigation API only.
2. **Each tab owns its local UI state** unless another tab must drive it.
3. **Deep-links are an explicit navigation command**, not shared mutable state.
4. **Cross-feature imports through barrels** (`MessagePanel` / shared diary
   preview helpers), never into sibling internals.
5. **Utils split by concern**, colocated with the feature that owns them.
6. **Presentational pieces stay dumb** --- StatCard, ProgressBarRow,
   InfoCallout, preview row take props only.

------------------------------------------------------------------------

# Target Architecture

```text
DetailPanel/
├── DetailPanel.tsx                 # shell: LayoutCard + Header + Tabs + active tab
├── DetailPanel.module.css
├── index.ts                        # PUBLIC API (default export + shared pieces)
├── _architecture.md                # keep in sync after refactor (optional rename of this plan)
│
├── .hooks/
│   ├── useDetailPanelData.ts       # store → view-model (moved)
│   └── useDetailPanelNavigation.ts # tab + deep-link commands (new)
│
├── detailPanel.types.ts            # identity / stats / media / tag view types
├── detailPanel.utils.ts            # thin re-exports or chatbox-level helpers only
│
├── Header/
│   ├── Header.tsx
│   └── Header.module.css
│
├── Tabs/
│   ├── Tabs.tsx
│   └── Tabs.module.css
│
├── OverviewTab/
│   ├── OverviewTab.tsx
│   ├── TagFill.tsx
│   ├── OverviewTab.module.css
│   └── overview.utils.ts           # optional: top-tag percent helpers
│
├── MediaTab/
│   ├── MediaTab.tsx
│   ├── MediaTab.module.css
│   ├── MediaGrid.tsx               # extract grid cell rendering
│   ├── MediaFilterBar.tsx          # extract chips
│   └── media.utils.ts              # filterMediaItems, formatVideoDuration
│
├── CategoryTab/
│   ├── CategoryTab.tsx
│   ├── CategoryTab.module.css
│   ├── MessageAccordion.tsx        # shared pinned / archived accordion
│   ├── TagFilterBar.tsx            # tag pills + OR filter list
│   └── category.utils.ts           # filterMessagesByTags, pin/archive lists
│
└── components/
    ├── StatCard.*
    ├── ProgressBarRow.*
    ├── InfoCallout.*
    └── DetailMessagePreviewRow.*
```

## Navigation model (replace lifted Category state)

Today Overview mutates parent state that Category reads.

Target: a small navigation command API owned by the shell hook:

```ts
type DetailPanelNavCommand =
  | { type: 'open-category'; section: 'pinned' | 'archived' }
  | { type: 'open-category'; tagId: string }
  | { type: 'set-tab'; tab: DetailPanelTab };

// useDetailPanelNavigation(chatboxId)
//   activeTab
//   categoryUi: { pinnedExpanded, archivedExpanded, selectedTagIds }
//   dispatch(command)
```

- Overview emits commands (`onPinnedClick` → `open-category/pinned`).
- Category owns applying those commands to its UI state.
- Shell still resets on `chatboxId` change.

This keeps deep-links without pretending Overview and Category share a form.

## Public API (`index.ts`)

```ts
export { default } from './DetailPanel';
export { default as InfoCallout } from './components/InfoCallout';
// only export what Workspace (or others) truly need
```

Consumers:

| Consumer | Import |
| -------- | ------ |
| `pages/diary/index.tsx` | `DetailPanel` default |
| `WorkspaceExplorer` | `InfoCallout` from barrel |
| Message jump / preview | prefer MessagePanel / shared diary utils, not DetailPanel internals |

## Preview text ownership

Short term (this refactor):

- Keep consuming `getMessagePreviewText` from MessagePanel’s public utils
- Prefer importing via MessagePanel’s documented export surface
- Stop deep-importing ChatboxSidebar utils from the preview row where possible
  (re-export time / preview helpers from a diary-level shared module, or from
  MessagePanel if that is already the canonical preview)

Long term (Rich Text Foundation --- Phase 3+):

- When `Message.content` becomes `RichTextDocument`, preview helpers change once
- DetailPanel only swaps the helper; no TipTap inside the panel

------------------------------------------------------------------------

# Refactor Roadmap

## Phase 0 --- Document (this file)

- Capture current status and target shape
- No behavior change

## Phase 1 --- Boundaries

Goals: barrels, import hygiene, no UX change.

- Add `DetailPanel/index.ts`
- Move Workspace `InfoCallout` import to the barrel
- Route preview-row imports through MessagePanel / agreed shared utils
- Extract `detailPanel.types.ts` from utils

Exit: same UI, cleaner dependency graph.

## Phase 2 --- Navigation hook

Goals: thin shell; Category owns its UI state again.

- Add `useDetailPanelNavigation`
- Overview emits deep-link commands
- Category applies expand + tag selection from commands / initial intent
- Reset still keyed on `chatboxId`

Exit: Overview → Category deep-links still work; `DetailPanel.tsx` only wires.

## Phase 3 --- Tab-local structure

Goals: match MessagePanel “feature owns sub-components”.

- Extract `MessageAccordion`, `TagFilterBar` in CategoryTab
- Extract `MediaFilterBar`, `MediaGrid` in MediaTab
- Split utils: `media.utils.ts`, `category.utils.ts`
- Move `useDetailPanelData` under `.hooks/`

Exit: each tab folder is self-explanatory; root utils are small.

## Phase 4 --- Performance polish (optional)

- Skip heavy data work while `collapsed` (or defer until first expand)
- Consider not mounting inactive tabs if needed (keep if remount cost is fine)
- Memo only where lists are large (media / tag-filtered messages)

Exit: collapsed / idle chatboxes cheaper; no UX regression.

------------------------------------------------------------------------

# Out of Scope

| Item | Why |
| ---- | --- |
| Visual redesign of Overview / Media / Category | UX already matches product |
| TipTap / AdRichText | Separate milestone (`Dear_Diary_RichText_Foundation_Plan.md`) |
| New mutations (pin/archive/tag from panel) | Panel stays read-oriented; actions stay in MessagePanel |
| Virtualized media grid | Only if real chatboxes hit scale pain |
| Moving collapse state into DetailPanel | Page coordinates MessagePanel + DetailPanel |

------------------------------------------------------------------------

# Relation to Other Plans

| Plan | Relationship |
| ---- | ------------ |
| MessagePanel `_architecture.md` | Pattern source; DetailPanel should mirror barrels / `.hooks/` / feature ownership |
| Rich Text Foundation plan | Indirect: preview helpers must later accept `RichTextDocument`; DetailPanel does not host the editor |

```text
Message (source of truth)
  ├── Type / Decorators / Attachments / Content
  │
  ├── MessagePanel     → compose + feed (writes)
  └── DetailPanel      → insights + jump (reads)
```

------------------------------------------------------------------------

# Suggested Milestone Checklist

**Detail Panel Architecture**

- [ ] Public `index.ts` barrel
- [ ] `useDetailPanelNavigation` (deep-link commands)
- [ ] Category owns expand + tag filter state
- [ ] Media / Category sub-components extracted
- [ ] Utils split by tab concern
- [ ] Preview-row import hygiene (no Sidebar deep imports)
- [ ] Optional: idle/collapsed compute skip
- [ ] Keep `_architecture.md` (or this plan) updated after Phase 3

------------------------------------------------------------------------

# Success Criteria

1. UI matches current Overview / Media / Category behavior (including deep-links).
2. `DetailPanel.tsx` is orchestration only (no Category form state).
3. External consumers import only from `DetailPanel/index.ts`.
4. No new coupling to AdRichText; preview path ready for a later content-model swap.
5. Folder shape is obvious to someone who already knows MessagePanel.
