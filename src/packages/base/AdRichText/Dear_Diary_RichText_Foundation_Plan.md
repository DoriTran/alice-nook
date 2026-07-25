# Dear Diary --- Rich Text Migration Plan

## Decision

The current composer will remain based on a plain textarea until the
existing UX is complete.

The migration to a rich text editor is considered a future architectural
milestone rather than a UI improvement.

The chosen editor is **TipTap**.

------------------------------------------------------------------------

# Why TipTap

TipTap is a document engine built on top of ProseMirror.

Benefits:

-   Extension-based architecture
-   Excellent React integration
-   Custom nodes (Emoji, Mention, Tag, Sticker, AI, etc.)
-   Undo / Redo built in
-   Selection API
-   Clipboard handling
-   Future-proof ecosystem

------------------------------------------------------------------------

# Storage Strategy

Store **JSON**, not HTML.

``` ts
import type { JSONContent } from '@tiptap/core';
export type RichTextDocument = JSONContent;
```

Every place that currently stores plain text should eventually store
`RichTextDocument`.

Targets:

-   Message
-   Todo row
-   Comment
-   Workspace Notes

------------------------------------------------------------------------

# Architecture

    AdRichText
            │
            ▼
    AdRichTextEngine
            │
            ▼
    RichTextDocument (JSON)

## AdRichText

Reusable component.

``` tsx
<AdRichText
  variant="message"
  value={content}
  onChange={setContent}
/>
```

Variants:

-   message
-   todo
-   comment
-   workspace

Each variant controls:

-   placeholder
-   keyboard behavior
-   enabled extensions
-   toolbar visibility

## AdRichTextEngine

Single place that configures TipTap.

Extensions:

-   Emoji
-   Custom Emoji
-   Mention
-   Tag
-   Link
-   Color
-   Highlight
-   History
-   Placeholder

## RichTextDocument

Future message model:

``` ts
interface Message {
  type: MessageType;
  decorations: Decoration[];
  attachments: Attachment[];
  content: RichTextDocument;
}
```

------------------------------------------------------------------------

# Migration Roadmap

## Phase 1 (Current)

-   Textarea
-   Emoji picker
-   Custom emoji
-   Attachments
-   Decorations
-   Todo
-   Timer
-   Reply
-   Edit

Storage:

``` ts
content: string
```

Finish current UX.

## Phase 2

Performance.

-   Virtual emoji list
-   Lazy loading
-   Emoji virtualization
-   Reaction optimization

No data changes.

## Phase 3 --- Rich Text Foundation

-   Create AdRichText
-   Create AdRichTextEngine
-   Define RichTextDocument
-   JSON serialization
-   Migrate Message.content
-   Migrate Todo rows
-   Emoji node
-   Custom Emoji node
-   Mention node
-   Tag node

Storage becomes:

``` ts
content: RichTextDocument
```

## Phase 4

Gradually enable:

-   Emoji
-   Custom Emoji
-   Mention
-   Tags

Then:

-   Bold
-   Italic
-   Underline
-   Highlight
-   Color

Later:

-   Slash commands
-   Inline AI
-   Reference message
-   Date mention
-   Stickers

------------------------------------------------------------------------

# Design Principle

Rich text is an input engine, not the center of the application.

    Message
    ├── Type
    ├── Decoration
    ├── Attachment
    └── Content (RichTextDocument)

The editor plugs into this architecture instead of defining it.

------------------------------------------------------------------------

# Milestone

Create a milestone called **Rich Text Foundation** instead of simply
"Use TipTap".

Suggested tasks:

-   AdRichText
-   AdRichTextEngine
-   RichTextDocument
-   JSON serialization
-   Message migration
-   Todo migration
-   Custom nodes
-   Formatting marks
-   Migration utilities
