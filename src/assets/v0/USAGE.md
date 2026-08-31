# v0 asset usage

Legacy (pre-v1 / pre-v2) artwork archived here on 2026-08-31. Top-level `src/assets` is now only `v0`, `v1`, and `v2`.

Scanned: TS/TSX imports (`@/assets/...`), CSS `url()`, `import.meta.glob`, HTML, and scripts. Live favicons come from `public/favicon/`, not from `src/assets`.

| Status | Files | Notes |
| --- | --- | --- |
| Still in use | 12 | Keep until replaced by v1/v2 |
| Free to delete or reuse | 83 files + empty `sticker/` dirs | No remaining code references |
| Empty folders | `sticker/icon/`, `sticker/nikki/` | Archived empty; nothing to keep |

---

## Still in use (keep)

Safe to reuse as sources. **Not** safe to delete until the consumers below are switched to v1/v2.

### Logos — `v0/logo/`

| File | Consumers |
| --- | --- |
| `logo.png` | [`Logo.tsx`](../../packages/ui/Logo/Logo.tsx) default variant. Rendered in [`LeftPanel.tsx`](../../packages/ui/Outlet/LeftPanel/LeftPanel.tsx) and [`pages/@dev/sidebarbg`](../../pages/@dev/sidebarbg/index.tsx). |
| `logo_img.png` | `Logo` (`image` prop) in LeftPanel; also imported directly by [`ProfileInfo.tsx`](../../packages/ui/Outlet/LeftPanel/ProfileInfo/ProfileInfo.tsx). |
| `logo_text.png` | `Logo` (`text` prop) in LeftPanel and `@dev/sidebarbg`. |

### Custom diary emojis — `v0/emoji/`

All eight are registered in [`customEmojis.ts`](../../packages/base/AdEmojiPicker/customEmojis.ts) (`AD_CUSTOM_EMOJIS`) and used by the emoji picker plus rich-text shortcodes (`:Happy:`, `:Sad:`, …).

| File | Shortcode / id |
| --- | --- |
| `Angry.png` | `:Angry:` / `dd-angry` |
| `Brush.png` | `:Brush:` / `dd-brush` |
| `Flower.png` | `:Flower:` / `dd-flower` |
| `Happy.png` | `:Happy:` / `dd-happy` |
| `Hope.png` | `:Hope:` / `dd-hope` |
| `Sad.png` | `:Sad:` / `dd-sad` |
| `Star.png` | `:Star:` / `dd-star` |
| `Surprise.png` | `:Surprise:` / `dd-surprise` |

### Mood sticker — `v0/decoration/`

| File | Consumer |
| --- | --- |
| `Emoji 1.png` | [`AdEmojiPickerPanel.tsx`](../../packages/base/AdEmojiPicker/AdEmojiPickerPanel.tsx) picker header art (`moodSticker`) |

---

## Free to delete or reuse

No TS, CSS, HTML, or script references. After this archive they exist only as files on disk.

### `v0/background/` (14 files, ~3.2 MB)

All unused.

- `bg1.png`
- `bg2.png`
- `diamond.png`
- `fullNote.png`
- `goldsparkler.webp`
- `icon_bg.png`
- `note.png`
- `paper 2.webp`
- `paper 3.webp`
- `paper 4.webp`
- `paper bg.png`
- `paper.png`
- `teared.png`
- `white paper background.png`

### `v0/decoration/` except `Emoji 1.png` (~66 MB)

Unused. The `washi tape/` set is ~45 MB by itself.

- `1.png`, `2.png`, `3.png`, `4.png`
- `bg paper edge.png`, `bg paper.webp`, `bubble.png`
- `cardclip.png`, `noteclip.png`, `paperclip.png`, `paper insert.png`
- `Emoji 2.png`
- `ChatGPT Image 00_45_14 14 thg 1, 2026.png`
- `ChatGPT Image 23_43_31 12 thg 1, 2026.png`
- `ChatGPT Image 23_46_46 12 thg 1, 2026.png`
- `washi tape/1. Rose Dawn.png`
- `washi tape/2. Soft Coral.png`
- `washi tape/3. Coral Apricot.png`
- `washi tape/4. Apricot Glow.png`
- `washi tape/5. Apricot Butter.png`
- `washi tape/6. Butter Yellow.png`
- `washi tape/7. Caramel Latte.png`
- `washi tape/8. Honey Lime.png`
- `washi tape/9. Mint Foam.png`
- `washi tape/10. Mint Aqua.png`
- `washi tape/11. Aqua Breeze.png`
- `washi tape/12. Sky Aqua.png`
- `washi tape/13. Baby Blue.png`
- `washi tape/14. Periwinkle.png`
- `washi tape/15. Lavender Milk.png`
- `washi tape/16. Lilac Blush.png`
- `washi tape/17. Blush Pink.png`
- `washi tape/18. Cherry Bloom.png`
- `washi tape/A. Milk Paper.png`
- `washi tape/B. Soft Charcoal.png`

### `v0/logo/old/` (4 files)

- `icon.png`
- `logo.png`
- `old logo.png`
- `old logo 2.png`

### `v0/nikki/` (2 files)

- `happy.webp`
- `sad.webp`

### `v0/pages/diary/` (28 files, ~12 MB)

Old diary chrome. Includes hashed Vite leftovers (`frontBgx2.1a315fd7.*`) and an empty `Untitled` file.

- `background-nav.png`, `background.png`
- `body-decor.png`, `body-part.png`, `body-right-sidebar.png`
- `chat bg paper.webp`, `chat bg teared.png`
- `detail-bottom.png`, `detail-panel-sticker.png`
- `flag-ribbon.png`
- `frontBgx2.1a315fd7.png`, `frontBgx2.1a315fd7.webp`
- `header-decor.png`, `header-edge.png`, `header-part.png`
- `header-responsive.png`, `header-right-sidebar.png`
- `ib-pinned.png`, `ib-pinned-active.png`
- `ib-ticket.png`, `ib-ticket-active.png`
- `ib-timed.png`, `ib-time-active.png`
- `link.png`
- `notched body.png`, `notched header.png`
- `paper note.png`
- `Untitled` (0 bytes)

### `v0/sticker/`

Empty directories only (`icon/`, `nikki/`). Free to delete.

---

## Appendix — v1 / v2 / public (not moved)

### `src/assets/v1` — unused in app code (13 files)

No `@/assets/v1/` imports. Live favicons are served from [`public/favicon/`](../../../public/favicon) via [`index.html`](../../../index.html).

- `favicon/` — `android-chrome-192x192.png`, `android-chrome-512x512.png`, `apple-touch-icon.png`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico`, `site.webmanifest`
- `logo/compact.png`, `logo/long.png`
- `mascot/book.png`, `mascot/peek side.png`, `mascot/peek top right.png`, `mascot/peek up.png`

### Unused `src/assets/v2` runtime files

Keep as design sources unless you want them culled. Auth page loads from [`auth.assets.ts`](../../pages/auth/auth.assets.ts); glob imports skip `base.png`.

**Unused:**

- `background/auth.png`
- `decoration/auth/auth logo.png` (cropped copy lives at `decoration/text/alice-nook_auth-logo.png` and *is* used)
- `decoration/auth/divider.png`
- `decoration/auth/dividers/1.png`, `decoration/auth/dividers/base.png`
- `decoration/auth/decorations/base.png` (sheet; glob excludes it)
- `decoration/auth/flower pots/base.png` (sheet; glob excludes it)
- `decoration/text/panel_wellcome-back.png`
- `favicon/` entire set (live copy is `public/favicon/`) plus `favicon/base.png`
- `logo/logo_long-bg.png`, `logo/logo_long-nobg.png`, `logo/logo_stacked-bg.png`, `logo/logo_stacked-nobg.png` (app chrome still uses `v0/logo/`)
- `mascot/base.png`, `mascot/chibi_writing-2.png`, `mascot/chibi_writing-outline.png`

**Used by auth:** `background/auth-bg.png`, `auth-desk.png`, `card.png`; most `decoration/auth/*` props; `flower pots/1.png`–`10.png`; `decorations/charm-*`, `cloud-*`, `heart-*`, `note-*`, `note-frag-*`, `pedal-*`, `spark-*` (not `base.png`); `decoration/text/` except `panel_wellcome-back.png`; `mascot/chibi_peak-side-waving.png`, `chibi_peak-side.png`, `chibi_peak-up.png`, `chibi_writing.png`.

### Unused `public/` leftovers (out of `src/assets` scope)

Not referenced:

- `dear diary 1.ico`, `dear diary 1.png`
- `dear diary 2.ico`, `dear diary 2.png`
- `writting.png`, `writting 2.png`

`public/favicon/` and `public/twemoji/` **are** in use. Do not delete those.
