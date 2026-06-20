# AssetWise Development Memory

Last updated: 2026-06-19

This file is the project handoff memory for future AssetWise development and repair work. Read it before making layout, dashboard, visual QA, or build changes.

## Project Location

- Workspace root: `D:\Codex`
- Project root: `D:\Codex\assetwise-minimal`
- Main app source: `D:\Codex\assetwise-minimal\src`
- App routes: `D:\Codex\assetwise-minimal\src\app`
- Shared layout components: `D:\Codex\assetwise-minimal\src\components\layout`
- Global styles and design tokens: `D:\Codex\assetwise-minimal\src\app\globals.css`
- Design QA note: `D:\Codex\assetwise-minimal\design-qa.md`
- Design QA captures/reference folder: `D:\Codex\assetwise-minimal\.design-qa`
- Dashboard mountain asset: `D:\Codex\assetwise-minimal\public\assets\assetwise-dashboard-mountain.png`

## Runtime And Commands

- The repo is a Next.js 14, React 18, TypeScript, Tailwind/shadcn-style local MVP.
- Global `node`, `pnpm`, and `git` may not be available in PATH in the Codex desktop shell.
- Use bundled Node when commands fail due to missing PATH:

```powershell
& "C:\Users\ABC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\typescript\bin\tsc --noEmit --pretty false
```

```powershell
& "C:\Users\ABC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\next\dist\bin\next build
```

```powershell
& "C:\Users\ABC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\next\dist\bin\next dev -p 3000
```

```powershell
& "C:\Users\ABC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" .\node_modules\next\dist\bin\next start -p 3000
```

Main smoke-test routes:

- `/`
- `/assets`
- `/transactions`
- `/plans`
- `/reviews`
- `/analysis`
- `/settings`

Known verification results from the latest layout work:

- `tsc --noEmit --pretty false` passed.
- `next build` passed.
- Main routes returned `200`.
- Playwright geometry checks confirmed the centered header logo had `0px` viewport-center offset on desktop and mobile.

## Current Layout Direction

The product should feel like a premium local-first investment command center, not a traditional enterprise admin dashboard.

Core direction:

- Keep the AssetWise logo/brand in the exact top center.
- Put icon-only primary navigation on the top-left side of the header.
- Put utility controls on the top-right side: search, date, local mode, settings.
- Avoid bringing back a desktop left sidebar unless the product direction changes.
- Icons need clear active states plus hover/focus motion, not static backend-menu styling.
- Keep the homepage distinct from asset management. The homepage should synthesize portfolio health, discipline, risk, plans, and reviews instead of duplicating the assets page.

Taste direction:

- Premium, restrained, white or near-white, precise, local-first.
- Apple/Tesla/high-end-financial-terminal energy, but do not make it sci-fi.
- Avoid generic purple SaaS, dense card grids, and default enterprise backend layouts.
- Use thin borders, subtle shadows, tight typography, large intentional whitespace, and one restrained accent system.
- Prefer a strong image/mockup reference for the next visual redesign instead of endless small CSS tweaks.

## Key Implemented Files

### `src/components/layout/app-layout.tsx`

- Renders `ModernHeader`.
- Removed the desktop sidebar shell from the app layout.
- Main content uses full-width layout under the sticky top header.

### `src/components/layout/modern-header.tsx`

- Client component using `usePathname`, `useMemo`, and `useState`.
- Uses Lucide icons with `LucideIcon` typing.
- Header structure is a 3-column grid: left nav, centered brand, right tools.
- Desktop left nav includes `/`, `/assets`, `/transactions`, `/plans`, `/reviews`, `/analysis`.
- Right tools include search, date, local mode, and settings.
- Mobile uses a menu button and a grid nav drawer.
- Active nav state is a foreground-filled circular pill with a bottom slide indicator.
- Hover/focus state lifts the icon and reveals a tooltip-style label.
- The active tooltip is intentionally hidden until hover/focus so the header does not visually crowd the homepage.
- Chinese UI copy is stored as `\u` escaped strings inside a `COPY` object. This avoids Windows terminal mojibake when the file is read/written through PowerShell while preserving correct runtime Chinese display.

### `src/app/page.tsx`

- Homepage has been shifted away from an asset-management duplicate.
- Intended role: cross-module dashboard for discipline, priorities, risk, plan execution, review insight, and portfolio snapshot.
- If redesigned from an image reference, preserve the product role rather than turning it into another holdings table.

### `src/app/globals.css`

- Contains the project's visual primitives and utility classes.
- Existing useful classes include `stat-huge`, `label-tiny`, `metric-card`, and `section-panel`.
- Follow existing tokens before inventing new ad hoc styles.

## Visual QA Notes

- `view_image` previously failed on local screenshots because the Windows sandbox helper returned `helper_unknown_error`.
- Use Playwright or browser-driven DOM geometry checks when direct image viewing is unavailable.
- Useful checks:

```javascript
const logo = await page.locator('header > div > a[href="/"]').boundingBox()
const offset = Math.round(logo.x + logo.width / 2) - viewportWidth / 2
```

- Expected header logo offset is `0px` on desktop and mobile.
- For mobile navigation, expected visible links before menu open is `0`, after open is `6`.
- For desktop hover behavior, active tooltip opacity before hover should be `0`, hovered nav tooltip opacity should become `1`.

## Design QA Artifacts

- `design-qa.md` records a prior UI QA pass.
- `.design-qa/reference-home.png` was used as a reference in a prior dashboard iteration.
- `.design-qa/prototype-home-desktop.png` and `.design-qa/prototype-home-mobile.png` were captured for comparison.
- `public/assets/assetwise-dashboard-mountain.png` was extracted from a supplied reference and softly integrated into the dashboard hero area.

## Known Environment Friction

- `git` is not currently available in PATH in this shell. If diff/status is needed, either fix PATH or use an alternate Git executable path.
- Historical sandbox helper errors affected `apply_patch` and local image viewing in earlier sessions. If this reappears, prefer UTF-8-safe PowerShell writes only as a fallback, and re-run TypeScript immediately after.
- When using PowerShell to write files with Chinese text, avoid raw Chinese if encoding is uncertain. Either use `apply_patch` or store copy as Unicode escapes in source.
- Do not leave local Next servers running after QA. Check ports with:

```powershell
Get-NetTCPConnection -LocalPort 3000,3001,3002 -State Listen -ErrorAction SilentlyContinue
```

## Recommended Next Workflow For Homepage Redesign

The user is considering generating a high-quality GPT Image 2 UI mockup first. This is a good direction.

Suggested workflow:

- Ask the user to provide a desktop reference image, ideally `1440x1000`, and optionally a mobile reference, ideally `390x844` or `390x900`.
- Treat the image as the visual source of truth.
- First extract the design system: layout grid, typography, spacing, colors, elevation, icon treatment, and content hierarchy.
- Then implement the top header and homepage to match the image, preserving real code-native UI text and interactions.
- Verify with TypeScript, Next build, route smoke tests, and browser/Playwright visual checks.
- Keep the homepage's information architecture focused on portfolio command, discipline, risk, plan execution, and review insight.

## Do Not Regress

- Do not reintroduce the old desktop left sidebar unless explicitly requested.
- Do not make homepage cards look like the asset list page.
- Do not replace the centered logo with a normal left-aligned SaaS header.
- Do not allow active nav tooltips to stay permanently visible and crowd the header.
- Do not rely on global `node`, `pnpm`, or `git` being available.
- Do not overwrite unrelated user changes when the worktree is dirty.
