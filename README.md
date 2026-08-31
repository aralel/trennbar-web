# Website

The site behind `cyrus-cylinder.aralel.com`. It is one Jekyll site covering both
the marketing pages and the dictionary explorer.

| URL | File | What it is |
| --- | --- | --- |
| `/` | `index.html` | Marketing landing page |
| `/privacy.html` | `privacy.html` | Privacy policy |
| `/terms.html` | `terms.html` | Terms of use (EULA) |
| `/explorer/` | `explorer.html` | All 3,383 dictionary words, filterable by prefix and suffix |
| `/prefixes/` | `prefixes.html` | Every prefix ranked by how many words it builds |
| `/suffixes/` | `suffixes.html` | The same for suffixes |

`privacy.html` and `terms.html` keep their exact original URLs — they are linked
from the App Store and Play Console listings, so those must not move.

Shared pieces live in `_layouts/default.html` and `_includes/`; every page uses
one header, one footer and one `styles.css`.

## The dictionary explorer

`/explorer/` lists every word in the app's dictionary, split into the three
segments the cylinders turn. Click a prefix or a suffix to filter — the *other*
panel recounts itself against your selection, so you can read off how many words
any pairing builds. Search matches words and stems and folds diacritics (`uber`
finds `überaktiv`, `gross` finds `Großdeutschland`).

Filter state lives in the URL — `/explorer/?prefix=ver&suffix=ung&q=zieh` — so
any view is a shareable link, and the ranking pages link straight into it.

Everything is rendered by Liquid at build time, so the pages read fine with
JavaScript off; `explorer.js` only narrows what is already on screen.

### Its data is generated — do not edit it

`_data/dictionary.json` is compiled from `data.csv` in the **app** repository
(`trennbars`), which is the parent directory of this checkout. Regenerate it
from there:

```bash
cd ..                            # the app repo
npm run generate:explorer        # rewrites website/_data/dictionary.json
npm run generate:explorer:check  # fails if it is stale
```

`npm run site` and `npm run site:build` in the app repo regenerate it and then
serve or build this site, which is the easiest way to work on it.

## Running it locally

From the app repo (regenerates the data first):

```bash
npm run site        # http://localhost:4000 with live reload
npm run site:build  # build into website/_site
```

Or directly, if the data is already current:

```bash
jekyll serve --livereload
```

Either needs Jekyll on the PATH (`gem install jekyll`, or `bundle install` here
to use the pinned `Gemfile`). `_site/` is gitignored.

## Publishing

GitHub Pages builds this repository with Jekyll natively, so pushing to `main`
publishes it. The site uses **no plugins** for that reason — keep it that way,
since Pages will not load them.

Before pushing a change that touches the dictionary, regenerate `_data/` from
the app repo so the published counts match the shipped app.

## Store links

`_config.yml` holds `app_store_url`, `google_play_url` and `support_email`;
every page reads them from there. `app-links.js` picks the store that fits the
visitor's device for any `[data-store-link="smart-store"]` link, fills in
`[data-current-year]`, and publishes the sticky header's height as
`--site-header-height` for the explorer's sticky table header to anchor to.
