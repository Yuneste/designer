# Attention: how people's eyes meet an image

A design only works if it is looked at. Before building, plan where the eye lands first, where it goes next, and why
anyone stops at all. These are the findings this plan rests on, then the plan itself.

## What decides where eyes go (the research, in plain words)
1. **First impressions take a blink.** People judge how appealing a visual is within about 50 milliseconds, and that
   first judgement sticks (Lindgaard et al., 2006). The image must work before anyone reads a word.
2. **Some things are seen before thinking starts ("pop-out").** Colour, size, contrast, orientation and an odd shape
   are picked up by the eye in parallel, before attention: one red item among grey ones is found instantly no
   matter how many grey ones there are (Treisman, feature integration). Only *one* thing can pop at a time:
   two pop-outs cancel each other.
3. **The different thing is remembered.** An item that differs from its neighbours is noticed and remembered better
   (the isolation or von Restorff effect, 1933). This works at two levels: inside the image (one accent) and
   *between* images (yours against the others in the feed, on the wall, on the shelf).
4. **Faces win.** Faces draw the first look more than almost anything, even when people are told to look elsewhere
   (Cerf et al., 2008). Eyes looking at the viewer hold attention; **eyes looking at something send the viewer's
   eyes there too** (gaze cueing, Friesen & Kingstone, 1998). Use a face's gaze to point at the words or the product.
   Strong, clear emotions read faster than neutral ones.
5. **Easy to see = believed and liked.** What is easy to process (clear contrast, simple shapes, few elements,
   readable type) feels more true, trustworthy and attractive: "processing fluency" (Reber, Schwarz &
   Winkielman, 2004). Clutter isn't just ugly, it reads as less credible.
6. **A gap makes people curious.** When people notice a gap between what they know and what they want to know, they
   want to close it (Loewenstein's information-gap theory, 1994). A thumbnail or ad can open a gap the title or the
   visit closes. Too big a gap, or a gap that isn't answered, feels like clickbait.
7. **Self-relevance cuts through.** People notice what is about them (their problem, their place, their name),
   even when attention is elsewhere (the "cocktail party" effect). Speak to the viewer's situation, not the brand.
8. **Concrete beats abstract.** A specific number, a real object, a real place is processed faster and remembered
   better than a general claim ("3 weeks" over "fast", the actual dish over "delicious food").
9. **Scanning follows a path.** With little text, eyes jump from the biggest/most contrasting element to the next
   (size = order). With a lot of text, people scan in an F shape, top and left first (Nielsen Norman Group eye
   tracking). Western readers enter top-left when nothing else pulls harder. **Menus** are mostly read in order,
   like a book, not in a "golden triangle" (Yang, 2012): put what you most want ordered first in its section and
   make it stand out once.
10. **Fewer choices, faster action.** Every extra element competes (Hick's law). One message, one action.

## The attention plan (write it before mocks and before every new image)
Five short lines in `designs/<niche>/brief.md` under "Attention plan":
1. **Where and how long**: where is it seen, next to what, and for how long? (Feed scroll: under 1 second. Poster
   on a street: 2-3 seconds while walking. Menu on the table: a minute, reading.) The shorter, the fewer the words.
2. **The neighbours**: what do the images around it look like (from the research)? Name their common colours,
   layouts and clichés. Your image must be *different from them*, not only good on its own.
3. **Entry point**: the one thing the eye hits first, and which lever makes it win (size, the only warm colour,
   a face, the only dark shape, an odd angle...).
4. **The path**: entry → second → action, max 3 stops. Use gaze, arrows of composition (lines, a pointing object)
   or size steps to move the eye along it.
5. **The hook**: why stop at all? Pick one: a curiosity gap, self-relevance (their problem), a concrete promise or
   number, an emotion on a face, a surprising object or contrast. One hook, done well.

## Levers by format
- **Thumbnail**: entry = a face with a clear emotion or one strong object, plus 1-4 huge words that *add* to the
  title (never repeat it). Stand out from the results grid: if they're all bright and busy, go dark and simple; if
  they all show faces, show the object. Readable at 240 px wide. Avoid the bottom-right corner (time stamp).
- **Social ad / post**: the hook in the top third (where the scroll stops), one face or product, the offer as the
  biggest words, the brand small. Must make sense with the sound off and in 1 second.
- **Poster / flyer**: readable from 3 m: what (biggest), when, where. One image or one huge word as the stopper.
- **Menu**: the eye reads in order: lead each section with what you most want sold, mark at most one item per
  section (a box, the accent colour, a small "house" label). Prices aligned and quiet; no dotted lines pulling the
  eye to the price.
- **Banner / header / card**: calm. The name is the entry point; nothing competes with it.

## Testing it (step 6 of the skill)
`node <skill>/scripts/attention.mjs <design.png> <test.png> [--among <neighbour images>] --open`, then look:
- **Squint**: in the blurred panel, is the entry point still the strongest blob? If two things compete, shrink or
  quiet one.
- **Value**: in grayscale, does the entry point still win? If it only wins by colour, add light/dark contrast.
- **Glance**: at real size, do the main words read and does the hook land?
- **In context**: among its neighbours, is yours the one you'd look at first? If not, change what makes it blend in
  (colour family, layout, the same cliché as the others).
