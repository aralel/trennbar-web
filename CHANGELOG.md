# Changelog

## 2026-03-11

### Changed
- Replaced generic text buttons for Google Play and App Store with proper official badge images (SVGs in `images/`)
- Fixed App Store links being disabled — `app-links.js` had a placeholder URL (`YOUR_APP_STORE_ID`) that was overriding the real App Store URL and disabling the links
- Simplified `app-links.js` — removed store-link injection logic (URLs are now hardcoded in HTML); kept only dynamic copyright year and support email handling
- Added `store-badge-link` and `store-badge` CSS classes with hover transitions for badge images
