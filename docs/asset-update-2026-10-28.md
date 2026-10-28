# October 28, 2026 asset update

## Club branding

The user supplied `AI_Club_Logo_White_NoBG.png` from `AI_Club_Logos`.
Its exact source pixels are preserved in `public/images/ai-club-logo-white-original.png`.
`node scripts/prepare-club-logo.mjs` embeds this artwork into two self-contained SVGs:

- `ai-club-logo-white.svg`: full white logo with transparent outer margins trimmed by the viewport.
- `ai-club-brain.svg`: square brain-only viewport, transparent, black in light browser themes and white in dark themes.

These are wrappers around the original PNG, not vector traces or regenerated lettering.
The shared header and footer read the logo path from `src/data/site.json`.
The favicon is configured in `src/layouts/Layout.astro`.

## KathAI portraits

The user supplied the member names and roles and this [photo folder](https://drive.google.com/drive/folders/1HgjJ2iX7dOllE-XTBi_DwVo-P5hyT1WEyKmzZGzxnJry9ynEQtadciXV1m_gLWwOBxukgxUu).
Downloaded originals are in `public/images/team/`. Photo-to-member mapping follows the uploaded filenames.

| Member | Local file | Drive file ID |
| --- | --- | --- |
| Anirudh K | anirudh-k-kathai.jpg | 137iTLsFXrl0oBoDeEQqkexczi-xuWZwY |
| Nandish Kori | nandish-kori-kathai.jpg | 1sResGwFKYdP5mUJFcrfbepHfYhcDI8Bp |
| Jaiwanth Karthi M K | jaiwanth-karthi-kathai.jpg | 1NuH5CAfWrShivbnrwqsolMUeNLiZ-gjJ |
| Aparna Chowdary | aparna-chowdary-kathai.jpg | 1tmmcvFnNfWCwVBAMK4bZsOmQU-2NzFdk |
| Diyaansh | diyaansh-kathai.jpg | 1CTuoXmKAWxjsEmN1WOxReemfp250ZDlT |
| Krish | krish-shah.jpg | Reused existing coordinator portrait and profile link |

No personal email addresses or student identifiers from the roster screenshot are included.
