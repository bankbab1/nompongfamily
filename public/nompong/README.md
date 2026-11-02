# Nompong website mascot assets

Five standalone transparent illustrations derived with image generation from the owner's Nompong character reference sheet on 2026-11-01. These replace reference-sheet crops; the family logo remains unchanged.

- `mascot-greeting.webp`: seated with a raised greeting paw, homepage.
- `mascot-curious.webp`: seated with a curious head tilt, About.
- `mascot-studio.webp`: holding a yellow pencil, Studio.
- `mascot-sleep.webp`: sleeping, loading states.
- `mascot-success.webp`: raised paws, submission confirmation.

Each illustration was generated separately using the supplied reference for identity and style: fluffy white puppy, taupe floppy ears and tail, white oval nose, tiny black eyes, brown linework, four limbs, no clothes, text, background, or sticker rim. Exports preserve alpha at 1024 × 1024, encoded as quality-90 WebP.

Motion uses small CSS transforms of the complete artwork, including breathing, a tap reaction, and a short celebration. These are not independently rigged eyes, ears, or limbs. `NompongMascot` pauses animations outside the viewport and in background tabs; CSS disables them for reduced-motion preferences.

## Layered rig v1

`mascot-rig-v1.webp` is a transparent parts atlas created with the built-in image-generation tool from the greeting illustration. Prompt: preserve the original fluffy puppy identity; render a transparent 3×3 atlas with open-eye head, matching closed-eye head, headless seated body with two rear paws and one resting front paw, separate taupe left/right ears, one raised front arm and paw, and a taupe tail; last two cells empty; no labels, text, outlines or background. The export retains alpha and uses quality-94 WebP at 1280×1280.

`LayeredMascot.tsx` selects parts with SVG viewports and assembles four limbs, two ears and one tail. Homepage and About use this rig: independent blink, subtle head/ear movement, occasional tail wag and a tap-triggered paw wave. Studio pencil, sleeping and success poses retain their dedicated illustrations. Animations pause offscreen and in background tabs; reduced motion renders an open-eye static pose.
