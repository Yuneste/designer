# Craft: how a designer builds the image

Read this before every mock and every image. The goal is an image a client would pay a designer for, not something
that looks generated.

## 1. One idea first
Before any code, write one sentence: *"This image makes <who> <do what> because <the one reason>."* Everything on
the image serves that sentence. If an element doesn't, delete it. Good design is mostly leaving things out.

Pick **one hero**: the main words, one object, one photo or one number. It gets the most size, contrast and space.
Then at most **two** supporting levels (a short line, then the small details). Three levels of importance, never
more. If you squint at the render, you should see the hero first, then the second level, then the rest.

## 2. Type (the thing that makes it look designed)
- **Two families at most**, usually one display face for the hero and one plain face for the rest. One family in two
  weights is often better.
- Size jumps must be **big and clear**: hero at least 2.5x the next level. Timid size steps look amateur.
- Big headlines: tight line height (0.85-1.0), slightly tight tracking (-0.01 to -0.03em). Small caps labels: wide
  tracking (+0.08 to +0.2em). Body: line height 1.35-1.5, 45-75 characters per line.
- Real typographic details: proper quotes and apostrophes (’ “ ”), en dash for ranges (10–14), non-breaking space so
  a headline never ends on one lonely word (`&nbsp;` between the last two words), tabular numbers for prices
  (`font-variant-numeric: tabular-nums`).
- Good free pairings to start from (Google Fonts), each with a mood:
  - Strong and loud: **Anton** or **Bebas Neue** + **Inter**
  - Editorial, premium: **Fraunces** or **Playfair Display** + **Inter** or **Work Sans**
  - Friendly, rounded: **Bricolage Grotesque** or **Nunito** (heavy) + **Nunito Sans**
  - Modern tech: **Space Grotesk** + **JetBrains Mono** (labels)
  - Warm, handmade: **Caprasimo** or **DM Serif Display** + **DM Sans**
  - Classic, calm: **Cormorant Garamond** + **Montserrat** (light labels)
  - Swiss, clean: **Archivo** (one family, 400 + 800 + condensed width)
  Pick by the niche's mood, not by habit. Never reach for the same pairing twice in a row for different niches.
- Load with `<link href="https://fonts.googleapis.com/css2?family=...&display=block" rel="stylesheet">` so the
  render waits for the font.

## 3. Layout
- **Margins**: at least 6% of the short side on every edge (thumbnails 4%). Nothing important touches an edge unless
  it deliberately bleeds off it.
- **One grid**: decide columns (often 4, 6 or 12) and align everything to it. Use CSS grid. Every edge of every
  element should line up with something else.
- **Alignment**: left-aligned layouts look more designed than everything centred. Centre only for short,
  symmetric, formal things (a logo lockup, an invitation).
- **White space is a material**: give the hero room. Crowded = cheap.
- **Scale contrast and cropping**: a huge word cropped by the edge, or one big object next to small text, is more
  striking than many medium things.
- Group related info tight, separate groups wide (proximity).

## 4. Colour
- **At most 4**: background, text, one accent, one support. The accent is for the one thing to notice (the offer,
  the price, the button) and covers under 10% of the area.
- Build from the niche's real world (the food, the material, the brand's site) instead of default "tech" colours.
- Text contrast: at least 4.5:1 for small text, 3:1 for big text. Check it.
- Dark designs: not pure #000; use a coloured near-black (#14110f, #0f1720). Bright designs: off-white paper tones
  (#f6f1e7, #faf7f2) look warmer than #fff.
- Gradients: only subtle, between two close colours, or none. No rainbow, no purple-to-blue glow.

## 5. Depth, texture, imagery (made with code)
You have the whole browser as your design software:
- **Paper grain / noise** (kills the flat digital look): an SVG `feTurbulence` filter as a background layer at 4-10%
  opacity, `mix-blend-mode: multiply`.
- **Print looks**: halftone dots (`radial-gradient` repeated), risograph overprint (two colours with
  `mix-blend-mode: multiply`, slightly offset), duotone photos (`filter: grayscale(1)` + coloured overlay with
  `mix-blend-mode`).
- **Soft 3D / clay**: layered `box-shadow` (one tight dark, one wide soft), inner highlight, rounded forms, one light
  direction for the whole image.
- **True 3D** (when check.mjs says WebGL works): three.js from a CDN
  (`https://unpkg.com/three@0.160.0/build/three.module.js`), simple shapes and extruded text, one key light + soft
  fill, `preserveDrawingBuffer: true`, render once at the end of the script (the renderer waits for it). Keep scenes simple: a few strong
  objects beat a busy scene.
- **Illustration**: SVG built from simple geometric shapes, a limited palette, one consistent stroke width or none.
  Flat, bold and simple is a style; a detailed realistic drawing in SVG is not (it will look wrong).
- **Photos (the user's own)**: `object-fit: cover` with a deliberate crop, consistent treatment (same tint, same
  contrast) across one image. A person's cut-out needs a transparent PNG from the user; don't fake one.
- Icons: draw simple SVG ones in the image's own style, or none. No emoji as design.

## 6. Words
Designers set copy, they don't decorate it. Short, specific, plain:
- "Fresh sourdough, every morning at 7" beats "Experience the Art of Artisan Baking".
- Never AI-copy words: elevate, unleash, unlock, experience the magic, journey, seamless, revolutionize, game-changer.
- The call to action is a real action with the real detail: "Order at sakura-sushi.de", "Sat 14 June, 10–4".

## 7. The slop tells (never let one through)
1. Garbled, fake or misspelled text, lorem ipsum, made-up words.
2. Purple/blue/teal glow gradients, lens flares, sparkles, bokeh dots, "magic" light rays.
3. Everything glossy, plastic, airbrushed; every surface the same sheen.
4. Everything centred, everything the same size, drop shadow on all text.
5. Too many elements: five fonts, eight colours, badges, ribbons, starbursts all at once.
6. Generic smiling stock person, a face that isn't real, hands or faces drawn wrong.
7. Light coming from different directions; objects floating with no ground or shadow.
8. Copy that says nothing ("Quality you can trust", "Your journey starts here").
9. Over-saturated HDR colours, neon on everything.
10. Details that make no sense on a second look (a menu item without a price, a date without a day).

## 8. Self-check before showing (step 6 of the skill)
Look at the PNG and answer each honestly. Any "no" means fix and render again.
- [ ] Cover the words: can a stranger still tell what business or topic this is from the picture alone?
- [ ] If it's for a named brand: its colours and feel, recognisably?
- [ ] In 1 second, is the hero the first thing I see? Is there a clear second level?
- [ ] Every word spelled right, real (no placeholders I forgot), and no line ending on a lonely word?
- [ ] Margins clear, everything aligned to the grid, nothing accidentally touching an edge or overlapping?
- [ ] Text contrast strong enough everywhere, including over photos?
- [ ] At most 2 font families and 4 colours? (Count.)
- [ ] None of the 10 slop tells?
- [ ] Matches the style file exactly (palette hex, fonts, layout rules), if there is one?
- [ ] For small formats: does the hero still read in the `--scale 0.25` preview?
- [ ] Would a real designer put their name on it? If it looks "fine but generic", push one thing further: bigger
      scale contrast, a bolder crop, a stronger colour decision.
