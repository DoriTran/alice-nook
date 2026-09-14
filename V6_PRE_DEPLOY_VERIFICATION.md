# V6 Pre-deploy Verification

## Final verdict

**READY FOR DEPLOY.** No production-blocking V6 issue remains in the checks
available before deployment. Google OAuth and authenticated Diary CRUD will be
smoked manually by the user and are not treated as blockers for this verdict.
Nothing was deployed, migrated, committed, or pushed during this verification.

## Local / Account behavior

- Guest defaults to Local and may explicitly open the Cloud sign-in gate.
- An authenticated user without an explicit Local override defaults to Cloud.
- Choosing Local persists `diaryLocalExplicit: true`; choosing Cloud or resetting
  settings clears that override.
- Login, logout, source changes, and user-ID changes invalidate stale Cloud
  requests and clear only the memory-only Cloud snapshot. They never copy,
  upload, overwrite, or delete IndexedDB `dear-diary` data.
- The source lifecycle subscribes reactively to settings. Session-driven source
  transitions remain distinct from explicit user selection.

## Local / Server isolation

- The Local store still independently persists under IndexedDB key
  `dear-diary`; the Cloud store has no persistence adapter or seed.
- Headless Chromium previously compared raw Local state before Cloud selection,
  while the guest Cloud gate was open, and after returning to Local. All three
  snapshots were byte-identical: 10,904 bytes, SHA-256
  `0a8e7205f2bf337a0c8bd00f8ee03a6ac3794daffedf8b5f5082d3055ca7c39b`.
- Authenticated Cloud isolation and OAuth CRUD will be completed manually by the
  user after deployment; unavailable password credentials are not a blocker.

## Production frontend configuration

- `.env.production`: `VITE_API_URL=https://api.alicenook.me`.
- Better Auth and the shared JSON client use `VITE_API_URL`; API fetches use
  `credentials: 'include'` and do not persist access tokens.
- The rebuilt production bundle contains `https://api.alicenook.me` and contains
  no `http://localhost:3000` API URL.
- One generic `http://localhost` literal remains inside React Router's
  non-browser fallback. It is not used as an API endpoint.

## Production backend configuration

- Railway is linked to project `alice-nook`, environment `production`, service
  `alice-nook-backend`, at `https://api.alicenook.me`.
- Current Railway runtime values were read without exposing secrets:
  `NODE_ENV=production`, `FRONTEND_URL=https://alicenook.me`, and
  `BETTER_AUTH_URL=https://api.alicenook.me`.
- `DATABASE_URL` and `BETTER_AUTH_SECRET` are present. Their values were not
  printed.
- CORS uses the required `FRONTEND_URL` as its single origin and enables
  credentials. Better Auth uses the required API base URL and trusts the same
  frontend origin, which is suitable for credentialed same-site subdomain
  requests.

## Prisma migration status

The status check was run through the linked Railway production environment:

```text
4 migrations found in prisma/migrations
Database schema is up to date!
```

The configured database was `neondb.public` at the production Neon host
`ep-raspy-bird-azk0wn6e...neon.tech`. Diary v1, message link preview, and the
`notificationEnabled default=true` migration are now applied. No migration
command other than read-only status was run during this verification.

## Remaining reachable API gaps

- Current reachable Group, Chatbox, Tag, Palette create/delete, Sidebar Order,
  and Message create/edit/patch/tag/delete actions are bound to server routes.
- Message Move remains reachable in the menu but is explicitly disabled in
  Cloud with an explanatory notification. This accepted V6 limitation is not a
  deployment blocker.
- Message reorder is not exposed by the current message UI; its unused facade
  action rejects in Cloud. It is safe to defer.
- Sidebar group/chatbox drag-and-drop persists through
  `PUT /api/diary/orders/sidebar`.
- `notificationRinging` and clearing `hasUnread` are intentionally runtime-only
  in Cloud. They are not leaked into unsupported update payloads.
- Local reset/seed actions are explicitly Local or no-op in Cloud. Destructive
  settings copy states that Cloud data is unaffected.
- No reachable Cloud action was found that silently writes an expected durable
  mutation only to the Local store.

## Attachments before R2

Local File/Blob preview remains available before send. Cloud payload sanitation
removes transient file/status fields and rejects durable `blob:` or `data:` URLs,
so binary/base64 content is not written to Neon. Upload/R2 remains future work
and is not a V6 blocker.

## Verification results

### Frontend

- `npm.cmd run build`: passed; only existing chunk-size/plugin-timing warnings.
- `npm.cmd run lint -- --quiet`: passed.
- Prettier on V6 files: passed.
- `git diff --check`: passed.
- Production bundle URL scan: passed.

### Backend

- `npm.cmd run build`: passed, including Prisma Client generation.
- `npx.cmd eslint "src/**/*.ts" --quiet`: passed for production source.
- Full non-fixing ESLint reports 129 Prettier/CRLF-only findings in the existing
  `test/diary.e2e-spec.ts`; there are no source/runtime lint findings. This is
  test-file formatting debt, not a deployment blocker, and was not auto-fixed.
- `npm.cmd test -- --runInBand`: 15 suites and 129 tests passed.
- `npm.cmd run test:e2e -- --runInBand`: 2 suites and 28 tests passed. These use
  the repository's mocked Prisma/auth harness and do not replace the user's
  manual Google OAuth smoke.
- `git diff --check`: passed; backend worktree is clean.
- Railway production `prisma migrate status`: passed and up to date.

## Manual post-deploy smoke

The user will verify Google OAuth, the Better Auth cookie, Diary snapshot/CRUD,
derived Chatbox tags, reload persistence, and cleanup of temporary smoke data.
This manual smoke is the only remaining validation item and is not an identified
code, configuration, or migration blocker.
