# Changelog

## Unreleased

### Added — the dictionary explorer, and the site is now Jekyll

The marketing site and the dictionary explorer are now one site rather than two.
`/explorer/`, `/prefixes/` and `/suffixes/` join the existing pages, all sharing
one header, one footer, one stylesheet and one palette.

- **New `/explorer/`** — all 3,383 words from the app's dictionary, filterable
  by prefix and suffix. Selecting a prefix recounts the *suffix* panel against
  it, so "how many words does `ver` + `-ung` build" reads straight off the page.
  Search matches words and stems and folds diacritics (`uber` finds `überaktiv`,
  `gross` finds `Großdeutschland`). Filter state lives in the URL, so any view is
  a shareable link.
- **New `/prefixes/` and `/suffixes/`** — every affix ranked by how many words it
  builds, with share, a bar and example words, each linking into the explorer
  filtered to it.
- **The site is a Jekyll site now.** `_layouts/default.html` and `_includes/`
  supply the chrome that used to be copy-pasted into all three pages; store URLs
  and the support address moved into `_config.yml`. No plugins are used, so
  GitHub Pages still builds it natively.
- **`privacy.html` and `terms.html` keep their exact URLs.** They are linked from
  the App Store and Play Console listings, so both pages pin an explicit
  `permalink` rather than taking Jekyll's default of `/privacy/`.
- **`_data/dictionary.json` is generated** from `data.csv` in the app repo — see
  README.md. Do not hand-edit it.

### Fixed

- **The sticky site header never actually stuck.** `.page-shell` used
  `overflow: hidden`, which makes an element a scroll container and therefore the
  sticky scrollport for everything inside it — and since `.page-shell` is as tall
  as the page, `.site-header` could never pin. It went unnoticed while every page
  was short; the explorer's 3,383-row table made it obvious. Now `overflow: clip`,
  which still clips without creating a scroll container. The `::before`/`::after`
  glows are `position: fixed`, so they were never what the clipping was for.

## 2026-04-21

### Changed
- Updated `README.md` publishing instructions to match current `app-links.js` constants
- Cleaned up `styles.css` by removing redundant `.terms-grid` flex selector to avoid conflicting display declarations

## 2026-03-11

### Changed
- Replaced generic text buttons for Google Play and App Store with proper official badge images (SVGs in `images/`)
- Fixed App Store links being disabled — `app-links.js` had a placeholder URL (`YOUR_APP_STORE_ID`) that was overriding the real App Store URL and disabling the links
- Simplified `app-links.js` — removed store-link injection logic (URLs are now hardcoded in HTML); kept only dynamic copyright year and support email handling
- Added `store-badge-link` and `store-badge` CSS classes with hover transitions for badge images
