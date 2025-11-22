# VOX Instagram Grid Exporter (Puppeteer)

Perfect quality exports that preserve ALL text, effects, and styling.

## What This Does

- Captures the full 1080×1080 grid in perfect quality
- Exports 9 individual Instagram posts (1080×1080 each)
- Preserves **all** text including "AI That Answers"
- Keeps glass effects, shadows, gradients, and backdrop filters
- Uses real Chromium browser rendering (Puppeteer)

## Setup

1. Install dependencies:
```bash
cd /home/user/dashboardv2
npm install --prefix . puppeteer sharp
```

2. Make sure you have `vox-grid.html` in the same directory

## Run Export

```bash
node vox-grid-export.js
```

## Output

All files will be saved to: `vox-grid-exports/`

- `vox-full-grid.png` - Full 2160×2160 grid (high quality)
- `vox-post-1.png` through `vox-post-9.png` - Individual 1080×1080 posts

## Instagram Upload Order

Upload in this order so the VOX logo appears top-left on your profile:

```
9 → 8 → 7 → 6 → 5 → 4 → 3 → 2 → 1
```

(Start bottom-right, end top-left)

## Why Puppeteer?

- html2canvas: ❌ Removes text, struggles with backdrop-filter
- dom-to-image: ❌ Inconsistent rendering, text issues
- Puppeteer: ✅ **Perfect** - renders exactly what you see in browser

## Troubleshooting

If you get errors about missing dependencies:
```bash
npm install puppeteer sharp
```

If fonts don't load, check internet connection (fonts loaded from Google Fonts)
