# Nompong artwork

`character-sheet.jpg` is the original official 1536×1024 reference supplied by the character owner. Keep the original artwork unchanged.

The shared component in `src/features/nompong/art.tsx` crops seven poses with CSS for the home page, about page, and suggestion previews. The file uses Vite’s base URL so it loads both at the root of a custom domain and under `/nompongfamily/` on github.io.

The reference has a cream background; it is not a transparent sticker asset. The simple drawn fallback is used only if the original image cannot load.
