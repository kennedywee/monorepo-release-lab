# Verification

What was checked, how, and what was not built or run. For setup and usage, see the [README](README.md).

## Checks

All commands ran on Linux x86_64 on 2026-10-14, from a clean commit.

| Check | Command | Result |
| --- | --- | --- |
| Rails API and contract specs | `cd apps/server && bin/rails db:test:prepare && bundle exec rspec` | `19 examples, 0 failures` |
| Generated types are current | `bun run contract:types && git diff --exit-code packages/api/src/schema.d.ts` | no difference |
| Type checks (api, web, store, mobile) | `bun run typecheck` | all 4 exit with code 0 |
| Web builds (web, store, marketing, docs, support) | `bun run build` | all exit with code 0 |
| Mobile bundles (iOS and Android Hermes bytecode) | `bun run --cwd apps/mobile build` | `entry-….hbc` for `ios` (2.5 MB) and `android` (2.9 MB) |
| Mobile project health | `cd apps/mobile && bunx expo-doctor` | `21/21 checks passed` |
| Mobile runtime version is stable across tags | `RELEASE_TAG=v1.0.0` and `v1.0.1` with `bunx expo-updates fingerprint:generate --platform android` | same hash for both tags |
| Desktop package (Linux) | `bun run --cwd apps/desktop pack` and `bunx electron-builder --linux AppImage` | `linux-unpacked/` and `release-lab-staff-<version>-linux-x86_64.AppImage` (125 MB) |
| Server container | `docker build -t release-lab-server:local apps/server` | built (445 MB) |
| Server container sequence | `db:migrate`, `db:seed`, then `rails server` on a fresh volume | `/up` 200; `/posts` returns 3 seeded posts; CORS allows only `CORS_ORIGINS` |
| Browser smoke test (Playwright, against Rails) | web: create (blank title rejected), edit, read comments. store: list, show, comment (blank comment rejected), deep-link reload, 404 page, API-down page | all passed, no page errors |
| Desktop smoke test | packaged app started headless with `API_URL=http://localhost:3300`, inspected over DevTools | loaded posts and comments from that API |
| Local release candidate | server image with `DB_PREPARE_ON_BOOT=true` on its own volume; released web and store tarballs served with a replaced `config.js` | API seeded; store deep link worked; staff app used the candidate API |
| Docker Compose | `docker compose up --build -d`, then a Playwright test (2026-10-15) | all 6 services up; API seeded; web created a post; store showed it and reloaded its deep link |
| Contract-break exercise | `bash exercises/contract-break/run.sh` | every step as expected (output below) |
| Hotfix demo | `bash exercises/hotfix/demo.sh` | v1.0.1 excludes the unreleased main commit; main contains the fix |
| Data-check rehearsal | see [RELEASE.md](RELEASE.md#manual-database-preparation) | migration blocked before repair, applied after |
| Release manifest | `scripts/release-manifest.ts` with real local artifacts for `v1.0.0-rc.1` | manifest and notes written; macOS and Windows desktop marked `missing`, exit code 1 |
| Workflow syntax | `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:latest` | no findings |

## Contract-break exercise

`bash exercises/contract-break/run.sh` applies the patches in `exercises/contract-break/`, runs each check, and restores the files afterward. It needs a clean `apps/` and `packages/`.

| Step | Change | Check | Result |
| --- | --- | --- | --- |
| 1 | None. Mobile shows `post.title`. | Rails contract specs, mobile typecheck | pass, pass |
| 2 | `01-response-drops-title.patch`: Rails stops sending `title`. The contract still requires it. | Rails contract specs | **fail**: `#/components/schemas/Post missing required parameters: title` |
| 3 | `02-contract-drops-title.patch`: remove `title` from the `Post` schema (and the spec expectations), then regenerate types. | Rails contract specs; mobile, web, store typecheck | pass; **fail**: `error TS2339: Property 'title' does not exist on type '{ id: number; body: string; ... }'` |
| 4 | `03-fix-mobile.patch`: mobile shows `Post #id` instead. | mobile typecheck | pass |
| 4b | `04-fix-web-and-store.patch`: the same fix for web and store. | web, store typecheck | pass |
| Extra | Compare the changed contract with the committed one using `oasdiff`. | `oasdiff breaking --fail-on ERR` | **fail**: 4 × `response-required-property-removed` |

Output:

```text
Step 1. Baseline: mobile reads post.title
         apps/mobile/app/index.tsx:24:            <Text style={{ fontSize: 18 }}>{post.title}</Text>
         apps/mobile/app/posts/[id].tsx:55:      <Stack.Screen options={{ title: post.data.title }} />
         apps/mobile/app/posts/[id].tsx:56:      <Text style={{ fontSize: 22, fontWeight: "bold" }}>{post.data.title}</Text>
  PASS Rails contract specs                             (as expected)
  PASS mobile typecheck                                 (as expected)
Step 2. Rails stops sending title, but the contract still requires it
  FAIL Rails contract specs                             (as expected)
         #/components/schemas/Post missing required parameters: title
Step 3. Remove title from the contract and regenerate types
  PASS Rails contract specs                             (as expected)
  FAIL mobile typecheck                                 (as expected)
         app/index.tsx(24,50): error TS2339: Property 'title' does not exist on type '{ id: number; body: string; created_at: string; updated_at: string; }'.
         app/posts/[id].tsx(55,49): error TS2339: Property 'title' does not exist on type '{ id: number; body: string; created_at: string; updated_at: string; }'.
         app/posts/[id].tsx(56,69): error TS2339: Property 'title' does not exist on type '{ id: number; body: string; created_at: string; updated_at: string; }'.
  FAIL web typecheck (desktop renderer)                 (as expected)
         src/router.tsx(141,37): error TS2339: Property 'title' does not exist on type '{ id: number; body: string; created_at: string; updated_at: string; }'.
         src/router.tsx(53,21): error TS2339: Property 'title' does not exist on type '{ id: number; body: string; created_at: string; updated_at: string; }'.
  FAIL store typecheck                                  (as expected)
         src/router.tsx(40,21): error TS2339: Property 'title' does not exist on type '{ id: number; body: string; created_at: string; updated_at: string; }'.
         src/router.tsx(98,22): error TS2339: Property 'title' does not exist on type '{ id: number; body: string; created_at: string; updated_at: string; }'.
Step 4. Fix the mobile consumer
  PASS mobile typecheck                                 (as expected)
  Web and store read title too. CI checks every consumer, so fix them as well:
  PASS web typecheck (desktop renderer)                 (as expected)
  PASS store typecheck                                  (as expected)
Extra. Compare the proposed contract with the last stable contract
  FAIL oasdiff breaking-change check                    (as expected)
         error	[response-required-property-removed] at /proposed.yaml

Every step behaved as expected. Restoring the original files.
```

## Not built or not verified

| Item | Status | Why |
| --- | --- | --- |
| GitHub Actions runs | **Not run.** Checked with `actionlint` only. | No push was allowed. The first real run may expose runner differences. |
| macOS `.dmg` and Windows `.exe` desktop installers | **Not built.** | They need macOS and Windows runners. The release workflow builds them there. |
| Desktop code signing and notarization | **Not configured.** Packages are unsigned. | No certificates. |
| Mobile app in a simulator or on a device | **Not run.** Type check, `expo-doctor`, and bundle export passed. | No simulator or device on this machine. |
| EAS Build, EAS Update, and store submission | **Not configured.** | Needs an Expo account (`EXPO_TOKEN`, `EAS_PROJECT_ID`) and store accounts. |
| Container push to GHCR | **Not run.** | It runs only inside the release workflow. |
| Hosted deployment (server, web sites) | **Not configured.** The deploy jobs stop with `NOT DEPLOYED`. | No host, SSH key, or domain. |
| Production approval gate | **Defined, not enforced.** | Required reviewers must be set on the `production` environment in GitHub settings. |
| PR preview workflow | **Not run.** Its steps were run locally. | Needs GitHub. |
