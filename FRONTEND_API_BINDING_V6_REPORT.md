# Frontend API Binding V6 Report

## Architecture

- `local` remains the default Diary source and continues to use the existing
  Zustand persist store, IndexedDB key `dear-diary`, migrations, and seed rules.
- `cloud` uses a separate memory-only Zustand store. It has no persistence key,
  offline cache, seed, merge, import, or background synchronization.
- The exported Diary hook is a facade over both stores. Components use the same
  domain state and async actions without knowing which repository handles them.
- The selected source is stored with the existing settings store under
  `dear-diary-settings` as `diaryDataSource`.

Local state is never replaced during a Cloud hydration or mutation. Switching
back to Local simply selects the still-hydrated Local store, so Cloud responses
cannot write to the Local IndexedDB namespace.

## Source switching and authentication

- Data & Sync contains the full source selector; Diary contains a compact,
  always-visible Local/Cloud selector.
- Cloud hydration uses an abort controller plus a request generation and user ID
  check. Responses from an old source or session are discarded.
- Diary is available without authentication in Local mode. Cloud mode renders a
  dedicated loading, retry, or sign-in state and never displays Local data under
  a Cloud label.
- Better Auth remains cookie-backed. Requests use `credentials: 'include'`; no
  access token is copied into Zustand, localStorage, or IndexedDB.

## API and mapping

- The shared JSON client uses `VITE_API_URL`, handles JSON and 204 responses, and
  normalizes HTTP/network failures into status-aware `ApiError` values.
- `GET /api/diary` maps backend arrays into frontend records, maps `palettes` to
  `customPalettes`, preserves all order maps and backend-derived Chatbox tag
  statistics, and initializes `notificationRinging` to `false`.
- Group, Chatbox, Tag, Custom Palette, Sidebar Order, Message CRUD/edit/tag, and
  remove-tag routes are bound to the current backend controller contract.
- Cross-entity mutations reconcile from a fresh Cloud snapshot. Simple updates
  apply the canonical server response. Sidebar drag/drop is optimistic and rolls
  back if its request fails.
- `notificationRinging` and `hasUnread` clearing remain Cloud runtime state only.
  Message Move is explicitly unavailable in Cloud because no backend route exists.

## Attachments, links, and seeds

- Composer Files and object URLs remain local until send. Existing `/dummy/...`
  materialization is preserved.
- The Cloud payload sanitizer removes transient File/status fields and rejects
  `blob:` and `data:` URLs. V6 adds no upload API, binary database storage, or R2.
- Link preview resolution now uses the same credentialed API client. Legacy link
  attachments are not migrated.
- Cloud state starts empty and never invokes the Local demo seed action. New IDs
  use `gr:`, `cb:`, `ms:`, `tag:`, and UUID v4 palette contracts.

## Failure behavior

- Create/edit forms and the composer await persistence and keep their input on
  failure. Cloud mutation failures use the existing notification system.
- 401 enters `auth-required`; 409 leaves the rejected entity intact; failed
  server-first mutations do not pre-delete frontend state.
- Deletes and other cross-entity effects refresh the backend snapshot rather than
  duplicating order and derivation algorithms in the frontend.

## Files and backend impact

- Frontend: API client/Diary transport modules, Diary store facade and Cloud
  lifecycle modules, settings source preference, source selector/gate UI, and
  async mutation consumers.
- Backend: no files changed. No Prisma migration was created or applied.

## Verification

- `npm.cmd run lint -- --quiet`: passed.
- `npm.cmd run build`: passed; only existing large-chunk/plugin timing warnings.
- Prettier on every changed TypeScript/TSX/CSS file: passed.
- `git diff --check`: recorded in final handoff after report creation.
- Production bundle URL scan: recorded in final handoff.
- Real authenticated CRUD smoke: pending because no test credentials were
  supplied. No credentials were invented and no remote data was changed.

## Known limitations and next work

- Cloud is online-only and has no offline replay or realtime updates.
- Message move/reorder and file upload remain unavailable in Cloud.
- Local-to-Cloud import, Cloud-to-Local copy, conflict resolution, and R2 remain
  future phases and were not started.
