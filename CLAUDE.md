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

- Single file: index.html (153KB, no build step needed)
- Three.js r128 for 3D car hero (./car.glb)
- GSAP 3 + ScrollTrigger for scroll animations
- Lenis for smooth scrolling
- Deploy: GitHub push to main = Vercel auto-deploys instantly

---

## What Is Already Built

The full site is complete with these sections:
1. Header — logo, phone, email, 7-item nav, GET A QUOTE button
2. Hero — Three.js 3D car, GSAP scroll-scrub, "Arrive in Style" heading, 3 CTAs
3. Trust Strip — 4 columns: Google Rating, Serving Sydney, Red Carpet, Available 365 Days
4. Services Grid — 8 cards, dark background, all link to #quote
5. About — company description, Google review badge (5.0 stars, 160+ reviews)
6. Fleet — 11 vehicles in single grid with AI-generated images
7. How It Works — 4 steps
8. Quote Form — full booking form, mailto:info@showlimousines.com.au
9. Testimonials — 5 real Google reviews in a carousel
10. Long-form SEO content — "Wedding, Party & Event Limousines"
11. Google Map — embedded iframe, 11 service locations
12. FAQ Accordion — 4 questions
13. Footer — socials, 8 services, 11 locations, AWL credit

---

## Fleet Vehicles (11 total, all have AI-generated images)

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

- Real fleet photos from client (to replace AI-generated images)
- Client review and approval of the full site
- 3D car model upgrade (current model is a low-poly generic sedan, not a limo)
- Mobile responsiveness verification on real devices
- Point showlimousines.com.au domain at Vercel once client approves

## Recently Completed

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
