# FanzyX — Brand Assets

Generated from the supplied logo artwork. Everything in `logo/`, `mark/`, `icon/`,
`favicon/` and `social/` is production-ready.

## Structure

```
fanzyx-brand-assets/
├─ logo/        Full "FanzyX" wordmark
│  ├─ svg/      Scalable vectors — use these on the web wherever possible
│  └─ png/      Transparent PNGs, full res + 1600/800/400/200px wide
├─ mark/        Standalone "F" mark (leaf + stem), for tight spaces
│  ├─ svg/
│  └─ png/      Full res + 512/256/128px tall
├─ icon/        App icon (rounded square), 1024 → 16px
├─ favicon/     Web favicon set + manifest + copy-paste <head> snippet
├─ social/      OG image, Twitter/X card, banners, avatar, story
├─ brand/       palette.json, tokens.css, palette.png
└─ source/      Your original uploads, untouched
```

## Which file do I use?

| Situation | File |
|---|---|
| Website header, docs, anywhere vector works | `logo/svg/fanzyx-wordmark-gradient.svg` |
| Dark background, needs to be flat | `logo/png/fanzyx-wordmark-flat.png` |
| Light background | `logo/png/fanzyx-wordmark-black.png` |
| One-colour print, embroidery, stamps | `logo/svg/fanzyx-wordmark-white.svg` / `-black.svg` |
| Marketing hero with the glossy 3D treatment | `logo/png/fanzyx-wordmark-glossy.png` |
| Favicon / PWA | everything in `favicon/` |
| App Store / Play Store icon | `icon/fanzyx-icon-1024.png` |
| Social avatar | `social/fanzyx-avatar-1024.png` |
| Link previews | `social/fanzyx-og-image-1200x630.png` |

## Colours

| Token | Hex | Use |
|---|---|---|
| Violet | `#6929FC` | Primary brand colour, buttons, links |
| Magenta | `#FD23A7` | Accent, highlights, secondary CTA |
| Blue | `#4340FA` | Gradient start, depth |
| Pink | `#FD5CC9` | Gradient end, soft accent |
| Ink | `#0A0814` | Primary dark background |
| Surface | `#141026` | Cards and raised surfaces |
| Line | `#2A2140` | Borders and dividers |

Brand gradient: `linear-gradient(135deg, #4340FA 0%, #6929FC 45%, #FD23A7 100%)`

Drop `brand/tokens.css` into your stylesheet and use the `--fx-*` variables.

## Usage rules

- **Clear space:** keep a margin equal to the height of the leaf on all sides.
- **Minimum size:** wordmark 120px wide on screen, 25mm in print. Below that use
  the standalone mark from `mark/`.
- The wordmark is designed for dark backgrounds. On light backgrounds use the
  black variant — the white "anzy" letters disappear otherwise.
- Don't recolour, stretch, rotate, add drop shadows, or place the gradient
  variant on a busy photo.

## Notes

- The SVGs are traced from the flat artwork, so they're clean two-colour vectors.
  The gradient SVG uses a single `linearGradient` across the whole lockup, which
  is close to but not pixel-identical to the raster gradient artwork.
- The glossy variant is raster only — its highlights and inner glow don't
  vectorise cleanly.
- Two of your uploads had the transparency checkerboard baked into the pixels.
  Alpha was reconstructed for the assets here; the originals are in `source/`.
