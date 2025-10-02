# Visual Testing with Playwright

This setup allows Claude Code to see screenshots of the website during development.

## Quick Start

```bash
# Build and take screenshots of all pages
npm run test:screenshots

# Watch in headed mode (see browser)
npm run screenshots

# Interactive UI mode
npm run screenshots:ui
```

## What Gets Captured

The screenshot suite captures:

1. **All Pages** (full page + viewport):
   - Homepage
   - Playground
   - AIUS Staking (Dashboard + Gauge tabs)
   - LP Staking
   - Models
   - Team
   - Media
   - Upgrade

2. **Mobile Views** (375x667 - iPhone SE):
   - Homepage
   - Playground
   - AIUS
   - LP Staking

3. **Theme Variants**:
   - Light mode
   - Dark mode

4. **Interactive States**:
   - Navbar with wallet
   - Tabs (AIUS Dashboard/Gauge)
   - Homepage sections

## Screenshot Locations

All screenshots are saved to `screenshots/` directory:

```
screenshots/
├── homepage-full.png
├── homepage-viewport.png
├── homepage-mobile.png
├── playground-full.png
├── aius-dashboard-full.png
├── aius-gauge-full.png
├── navbar-light.png
├── navbar-dark.png
└── ...
```

## For Claude Code

To share screenshots with Claude Code:

1. Run tests: `npm run test:screenshots`
2. Screenshots are in `screenshots/` folder
3. Share specific screenshots for feedback:
   ```bash
   # Show Claude a specific page
   open screenshots/playground-full.png
   ```

## Updating Tests

Edit `tests/screenshots.spec.ts` to:
- Add new pages
- Capture specific UI states
- Test responsive breakpoints
- Screenshot specific components

## CI Integration

The Playwright config is set up for CI:
- Retries on failure
- HTML reporter
- Screenshots on failure
- Traces for debugging
