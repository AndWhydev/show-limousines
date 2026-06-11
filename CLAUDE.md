# Show Limousines — Project Brief
## All Webbed Labs client project

---

## Project Status: IN PROGRESS — awaiting client review

Live preview: https://show-limousines.vercel.app
GitHub repo: https://github.com/AndWhydev/show-limousines
Local preview: npx serve . -l 4200

---

## Client Details

- Business: Show Limousines
- Phone: 0422 023 413
- Email: info@showlimousines.com.au
- Service areas: Sydney and Wollongong
- Facebook: https://www.facebook.com/showlimousines/
- Instagram: https://www.instagram.com/showlimousines/
- Original site: https://www.showlimousines.com.au
- ABN: 51 149 228 357 (confirmed, live in footer)

---

## Design System

- Background: #0a0a0c
- Gold accent: #C9A84C
- White text: #ffffff
- Muted text: rgba(255,255,255,0.6)
- Headings font: Bebas Neue
- Body font: DM Sans
- Tone: Dark, cinematic, premium luxury

---

## Tech Stack

- Multi-page static site (6 HTML pages, no build step — Vercel serves them directly)
- Shared `styles.css` (all styling) and `main.js` (all behaviour) linked by every page
- Header + footer markup is duplicated into each page (no templating); edit all
  pages when changing nav/footer, or re-derive from one
- Three.js r128 for the 3D car hero — Home page only (`main.js` guards it so it
  no-ops on pages without `#heroCanvas`)
- GSAP 3 + ScrollTrigger for scroll animations; Lenis for smooth scrolling
- Deploy: GitHub push to main = Vercel auto-deploys instantly

---

## Pages (7) — nav mirrors the original showlimousines.com.au menu
## Home · Wedding Limousines · Services · Fleet · About Us · Locations · Contact

1. `index.html` — Home: 3D hero, trust strip (4 cols), CTA band
2. `wedding.html` — Wedding Limousines: feature copy + photo, testimonials, CTA
3. `services.html` — 9 service cards + "How It Works" (4 steps)
4. `fleet.html` — 11 vehicles with real client photos
5. `about.html` — company description, Google 5.0 badge, testimonials, Gallery link
6. `locations.html` — service-area map + 11 areas
7. `contact.html` — quote form (mailto) + FAQ accordion

Plus `gallery.html` — masonry of real photos (`gallery-01..11.jpg`); not in the
top nav, linked from the About page, the mobile menu and the footer (matches the
original site, where Gallery sits under About Us).

Every inner page opens with a `.page-hero` banner. Header is pinned/fixed and
always visible (no hide-on-scroll). Footer (socials, service/location/fleet
columns, AWL credit) is shared across all pages.

---

## Fleet Vehicles (11 total, all have real client photos)

1. Rolls Royce Phantom — 4 pax — fleet-rolls-royce-phantom-v2.jpg
2. White Chrysler Super Stretch — 10 pax — fleet-chrysler-white-v2.jpg
3. Black Chrysler Super Stretch — 10 pax — fleet-chrysler-black-v2.jpg
4. Chrysler Black Edition — 10 pax — fleet-chrysler-black-edition-v2.jpg
5. Chrysler Gullwing — 10 pax — fleet-chrysler-gullwing-v2.jpg
6. Hummer H2 14 pax — fleet-hummer-green-v2.jpg
7. Hummer H2 16 pax — fleet-hummer-white-v2.jpg
8. Mercedes S Class AMG — 4 pax — fleet-mercedes-s-class-v2.jpg
9. Mercedes Sprinter Limo Van — 14 pax — fleet-mercedes-sprinter-v2.jpg
10. Mercedes Valente — 7 pax — fleet-mercedes-valente-v2.jpg
11. VW Crafter Premium Minibus — 11 pax — fleet-vw-crafter-v2.jpg

---

## What Is Still Outstanding

- Client review and approval of the full site
- Black Chrysler Super Stretch: client asked to remove the white ribbons on
  the bonnet (source supplied with them still on) — not yet done
- 3D car model upgrade (current model is a low-poly generic sedan, not a limo)
- Mobile responsiveness verification on real devices
- Point showlimousines.com.au domain at Vercel once client approves

## Recently Completed

- Rebuilt as a 7-page site mirroring the original showlimousines.com.au menu
  (Home, Wedding Limousines, Services, Fleet, About Us, Locations, Contact);
  extracted shared styles.css + main.js; Gallery linked under About Us
- Gallery wedding tile now uses the couple-removed Black Edition photo
- Header pinned/always-visible (removed hide-on-scroll-down)
- Real client fleet photos swapped in for all 11 vehicles (replaced the
  AI-generated images); normalised to 1536x864 JPEGs
- Black Edition fleet photo: bride & groom removed and the full limousine
  reconstructed via AI edit (fal Nano Banana Pro)
- ABN confirmed and set in footer (51 149 228 357)
- Placeholder gallery section removed
- Wedding Limousines section removed; Occasions renamed to Services
- Logo + favicon added; cinematic hero background, logo-gold colour scheme

---

## Real Google Reviews Used in Testimonials

1. Daniel Keenahan — "Fantastic experience! Mick was great to deal with. The vehicle used on the day not only looked amazing, but the driver was on time and was friendly with the entire bridal party."
2. Elena Pace — "I recently used Show Limousine Hire and was thoroughly impressed by their service. Mick was highly professional and punctual, making the entire experience smooth and stress-free."
3. Kaelee — "We couldn't recommend Show Limousines more for wedding transport. They handled both our bridal party pick-up and our getaway car at the end of the night, and everything ran absolutely seamlessly."
4. Matikka Ismail — "I had Mick and his team provide the transport for my wedding and we were extremely happy with absolutely everything."
5. Theo Dechaufepie — "Hired a stretched Hummer for a surprise 70th. My grandkids aged 3 to 13 thought they were rockstars."

---

## Deploy Flow

1. Make changes using Claude Code
2. Claude Code commits and pushes to GitHub automatically
3. Vercel detects the push and auto-deploys in about 30 seconds
4. Check https://show-limousines.vercel.app to verify

Never manually edit files without using Claude Code.
Always check the live Vercel URL after deploying.
Always send the preview URL to Andy before sharing with the client.

---

## Standing Instructions for This Project

- Australian English always
- Never change client contact details without Andy confirming
- Never remove the "Powered by All Webbed Labs" footer credit
- Never add fake reviews or fabricated statistics
- The 3D car hero must remain functional — do not remove Three.js
- Match the dark cinematic aesthetic on any new sections added

---

All Webbed Labs · Sydney, NSW · aibusinesssolutions.au
Last updated: June 2026
