# AssetWise Home Design QA

final result: passed

## Source And Prototype

- Reference: `.design-qa/reference-home.png`
- Desktop prototype capture: `.design-qa/prototype-home-desktop.png`
- Mobile prototype capture: `.design-qa/prototype-home-mobile.png`
- Local verification URL: `http://127.0.0.1:3002/`

## Checked Points

- Top-level IA matches the reference direction: left icon rail, centered AssetWise brand, right-side date/local/search/settings tools.
- Desktop brand center is aligned to the viewport center: measured offset `0px` at `1536x1024`.
- Mobile brand center is aligned to the viewport center: measured offset `0px` at `390x900`.
- Left rail matches the reference structure with icon-only navigation and active/hover tooltip behavior; measured width `80px`.
- Home content follows the reference hierarchy: greeting, portfolio total, 30-day trend, discipline score, priority tasks, risk reminders, plan execution, review insight.
- The reference mountain motif was extracted into `public/assets/assetwise-dashboard-mountain.png` and loaded in the hero area.
- Desktop and mobile had no horizontal overflow in Playwright checks.
- Mobile navigation opens correctly and exposes `6` navigation links.

## Intentional Differences

- The implementation uses live local AssetWise data instead of copying the reference image's exact demo numbers.
- The mountain asset is cropped from the supplied reference and softly integrated; it is not a separately regenerated illustration.
- Recharts is client-mounted to avoid static-build measurement warnings, so SSR uses a lightweight placeholder until hydration.

## Tooling Note

- `view_image` could not open local screenshots because the Windows sandbox helper returned `helper_unknown_error`. Visual QA was completed with Playwright screenshots plus DOM geometry checks, and the source/prototype image files are saved for manual inspection.

## Compact Density Pass - 2026-06-19

Result: passed

- User feedback: the GPT-image structure was restored well, but the implemented page felt too loose and should show more content in one screen.
- Reference inspected with `view_image`: `.design-qa/reference-home.png`.
- Final desktop viewport capture: `.design-qa/compact-home-viewport-final.png` at `1536x1024`.
- Final desktop full-page capture: `.design-qa/compact-home-desktop-final.png`.
- Final mobile capture: `.design-qa/compact-home-mobile-final.png` at `390x900`.
- Desktop checks: header height `65px`, first card row top `358px`, first card row bottom `620px`, second card row bottom `907px`, no horizontal overflow.
- Main compression changes: reduced top padding, hero/chart height, section gaps, card padding, card min heights, action row spacing, metric icon sizes, ring chart size, and large numeric type scale.
- Preserved structure: left icon rail, centered AssetWise logo, right utility tools, hero summary, three-card middle row, two-card lower row, and bottom quote.
- Verification: `tsc --noEmit --pretty false` passed, `next build` passed, primary routes returned `200`.

## Multi-Page Compact System Pass - 2026-06-19

Result: passed

- Goal: continue the homepage style and compact density across the other AssetWise pages.
- Shared compact primitives updated: `PageShell`, `PageHeader`, `MetricCard`, `SectionPanel`, `FilterToolbar`, `EmptyState`, `ResponsiveDataView`, and table cell/header density.
- Core pages aligned: `/assets`, `/transactions`, `/plans`, `/reviews`, `/analysis`, `/settings`.
- Legacy/secondary pages lightly aligned: `/portfolio`, `/fund-portfolio`, `/assets/hs300`.
- Visual direction preserved: pale command-center background, centered AssetWise shell, left icon rail, glass-like compact cards, smaller numeric scale, tighter list rows, tighter filter bars.
- Mobile density improved by switching top metric grids to `2` columns before desktop `4` columns on the core pages.
- Final screenshots saved under `.design-qa/compact-pages-final/` for desktop and mobile route checks.
- Desktop QA at `1440x1000`: all checked core pages had no horizontal overflow and reported `mainTop` `65px`.
- Mobile QA at `390x900`: all checked core pages had no horizontal overflow.
- Final route smoke: `/`, `/assets`, `/assets/hs300`, `/transactions`, `/plans`, `/reviews`, `/analysis`, `/settings`, `/portfolio`, and `/fund-portfolio` returned `200`.
- Verification: `tsc --noEmit --pretty false` passed and `next build` passed.
