# My Halo Auto — Project Notes

Static website for **My Halo Auto**, a mobile mechanic service in the DMV area.
Karim is the developer; **Joseph** is the actual mechanic / business owner.

## Quick facts
- **Live site:** https://myhaloauto.com
- **Stack:** vanilla static HTML/CSS/JS (no framework, no build step)
- **Files:** `index.html` (~1400 lines), `css/styles.css`, `js/main.js`, `js/reviews.js`
- **Phone:** (571) 969-4256
- **Email:** myhaloauto@gmail.com
- **Response time copy:** "within 12 hours" (NOT 1 hour — Joseph wanted realistic)
- **Service area:** DC, MD, VA (DMV)
- **Branding:** ASE Certified, 5+ years experience, mobile-only operation
- **Hero accent color:** gold (`var(--primary)` ≈ `#c8a54e`)

## Hosting & deployment ⚠️ READ THIS FIRST

**Netlify is the live host.** DNS for `myhaloauto.com` points to Netlify load balancers.

- Netlify site ID: **`d9045774-7716-40d4-ad4e-92db8edff839`** (project name: `myhaloauto`)
- Custom domain `myhaloauto.com` is connected on Netlify with Let's Encrypt SSL
- **Netlify CLI is logged in as `info@roofroof.solutions`** — the myhaloauto site appears under the Roof Roof team. **DO NOT touch the Roof Roof site** (`resonant-croquembouche-deb5c5` / roofroof.solutions). Same login, separate projects.
- **No GitHub auto-deploy** — pushing to GitHub does NOT trigger Netlify. Deploys are manual CLI uploads.
- **Deploy command (always pass `--site` to be safe):**
  ```bash
  netlify deploy --prod --dir . --site d9045774-7716-40d4-ad4e-92db8edff839
  ```
- A `.vercel/` folder exists from an earlier parallel deploy at `myhaloauto.vercel.app`. Vercel does NOT host the custom domain. Keep changes in sync if you care, otherwise ignore.

## GitHub
- Repo: https://github.com/karimsangid/myhaloauto
- Branch: `main`
- **Push manually after changes.** Do `git add` + `git commit` + `git push` then `netlify deploy --prod --dir .` separately.
- Workflow: edit → commit → push → netlify deploy

## Reviews — current state

**Real Google reviews are statically embedded in `index.html`.** 6 reviews, all 5-star.
Reviewers: Jason Briggs, will funes, James C, David W, khisa khafafa, Fengrong Han (Bobb).

**The reviews appear in TWO places that must stay in sync:**
1. Visible review cards inside `<div class="reviews-track" id="reviewsTrack">` (HTML)
2. Schema.org `aggregateRating` + `review` array in the `<script type="application/ld+json">` AutoRepair block at the top of `<head>`

When updating reviews, edit BOTH.

### Reviews marquee
The reviews track uses a **CSS-only infinite horizontal scroll marquee**. JS just clones each card once for seamless looping (`setupReviewsMarquee()` in `js/main.js`). Pause-on-hover, fade masks on edges, respects `prefers-reduced-motion`. No prev/next buttons.

### Live Google Reviews API (built but DORMANT)
`js/reviews.js` has full Google Places API (New) integration (~280 lines) but the API key is the placeholder `YOUR_GOOGLE_MAPS_API_KEY`. Logs `[MHA Reviews] No API key configured — using static fallback.` and does nothing.

To activate later: paste a real API key into `REVIEWS_CONFIG.apiKey`. See file header for full Google Cloud setup. Cache TTL 6h, restricted by HTTP referrer to myhaloauto.com. ~$0/mo cost due to Google's $200 free credit.

**Karim explicitly chose manual updates over API for now (2026-04-10).**

## Truthfulness rules — DO NOT BREAK THESE

Joseph specifically called these out. **Never** add any of:
- ❌ "1,000+ clients" / fake client counts (use 4.8★ rating wording instead — and even that might shift, currently 5.0)
- ❌ Fake promos, discounts, "first oil change free", etc.
- ❌ Painting / bodywork services (Joseph does NOT do these)
- ❌ Performance upgrades / coilover installs (this is maintenance & repair, not enhancement)
- ❌ Engine swaps as MOBILE service (engine swaps need a real workspace — they have an asterisk + footnote)
- ❌ Exhaust & custom fabrication as a standalone service (requires a consultation — also asterisked)
- ❌ "Flywheel resurfacing" — it's "flywheel REPLACEMENT" (Joseph corrected this)

Active footnote at the bottom of the page (`.footnote-section`) explains the asterisks: mobile service requires adequate workspace, engine swaps not mobile, no painting/bodywork/performance, etc. Don't remove this disclaimer.

## Service categories on the site
1. Engine Repair & Diagnostics
2. Engine Swaps* (with asterisk → footnote)
3. Transmission & Clutch (incl. flywheel REPLACEMENT, not resurfacing)
4. Brake Service
5. Cooling & Radiator Service
6. Electrical & Diagnostics
7. Gaskets & Seals
8. Suspension & Steering (no coilover installs)
9. General Maintenance

## Social / external links (live)
- **Google Business / Reviews:** https://maps.app.goo.gl/rKe13m5ULv6c1C4z5?g_st=ic
- **Instagram:** https://instagram.com/myhalo.auto
- Linked from footer socials AND from `.review-ctas` button row right below the reviews marquee
- No Facebook / TikTok / YouTube — Joseph doesn't have those

## Google Business Profile (Joseph's setup)
- Set up as a **service-area business** (no public address)
- Primary category: **"Auto repair shop"** (Google rejects "Mobile auto repair")
- Recommended secondary categories: Mechanic, Brake shop, Auto electrical service
- "Mobile" goes in the description, not the category

## Photos & assets

### Live photos in `images/`
All in `images/` are real photos from Joseph's phone. Already EXIF-corrected and resized to ~800px max width.
- `logo-preloader.png` / `logo-nav.png` — generated from Joseph's logo (`~/Downloads/my halo logo/IMG_1492.JPG`)
- Favicons (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`) all generated from the same logo

### Unprocessed assets
- `new-assets/myhaloauto/` has ~600MB of iPhone photos/videos still waiting to be added
- This folder is in `.gitignore` and `.vercelignore`
- If adding new photos: rotate first (use `PIL ImageOps.exif_transpose`), resize to 800px max, save as JPEG quality 82

### Photo rotation gotcha
Some Joseph photos came in sideways even after EXIF auto-orient. If a photo on the live site is rotated wrong, just rotate it manually with PIL:
```python
img = Image.open('images/foo.jpeg')
img = img.rotate(-90, expand=True)  # or 90, or 180
img.save('images/foo.jpeg', 'JPEG', quality=82, optimize=True)
```

## Animations / UX
- Animated halo preloader (logo with two spinning rings, gold pulse glow)
- Scroll-triggered fade-in animations on service cards, why cards, gallery items, contact cards (staggered)
- Hero parallax on desktop
- Section header staggered fade-up
- Reviews marquee (see Reviews section above)
- Service icon pulse on card hover
- Gold accent on focus states throughout

## Known issues / TODOs
- Formspree contact form action is still `YOUR_FORM_ID` — form doesn't actually submit
- Google Analytics commented out (`GA_MEASUREMENT_ID` placeholder)
- Google Search Console verification commented out
- Map embed in service-area section uses a generic `pb` string, zoomed to NOVA/lower MD
- GBP Update Pack (mirror site content into Joseph's Google Business Profile) — not generated yet

## When Joseph asks for changes — typical workflow
1. Make the edit in `index.html` / `css/styles.css` / `js/main.js`
2. If photos: rotate + resize first
3. `git add . && git commit -m "..."` then `git push`
4. `netlify deploy --prod --dir . --site d9045774-7716-40d4-ad4e-92db8edff839`
5. Verify on https://myhaloauto.com
