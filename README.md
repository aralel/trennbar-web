# Website

Static website for `Cyrus Cylinder`.

Files:
- `index.html`: marketing landing page
- `privacy.html`: privacy policy
- `terms.html`: terms of service
- `styles.css`: shared site styles
- `app-links.js`: shared Google Play / App Store links

## Before publishing

Update these values in `app-links.js`:

- `appStoreUrl`
- `supportEmail`

`googlePlayUrl` is already set to `com.aralel.trennbare`.

## Local preview

From the repo root:

```bash
cd /Users/maysam/Workspace/aralel/trennbars/website
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080/`
