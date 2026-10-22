# Kimmiy's Rent — Project Context

## Business
- Name: Kimmiy's Rent
- Trade / industry: Luxury rent-a-car (premium executive sedans)
- Location: Surčin, Belgrade, Serbia — close to Belgrade Nikola Tesla Airport (BEG)
- Service area: Belgrade Nikola Tesla Airport, Surčin, Belgrade (TBC — confirm whether airport/hotel/address delivery is offered and how far)
- Phone: +381 65 2017 777 (placeholder, user to replace)
- Email: bookings@kimmiysrent.com (placeholder, user to replace)
- Website: none (new business)

## Services
- Luxury car rental — small, curated fleet of three flagship sedans:
  - Audi A7 (2017)
  - Mercedes-Benz S-Class (2017)
  - BMW 7 Series (2017)
- Airport pick-up / drop-off at Belgrade Nikola Tesla Airport (TBC — confirm)
- Rental terms (daily / weekly / long-term), deposit, mileage limits, chauffeur option, cross-border travel: TBC

## Brand
- Primary colour: TBC — pull from logo once uploaded
- Accent colour: TBC — pull from logo once uploaded
- Fonts: TBC — choose a premium pairing during build (e.g. refined serif headings + clean sans body)
- Logo: images/logo/ (PNG — user to upload)
- Tone: premium, discreet, confident

## Social Proof
- Reviews: none yet (new business)
- Years in business: new — 0
- Sister business: run by the same owner as Kimmy Garni Hotel in Surčin (listed on Booking.com as "KIMMIY Garni Attic Rooms near Belgrade Airport"). Guests there repeatedly praise cleanliness, comfort and service — can be used as an "established local hospitality name" trust signal, and as a hotel + car cross-sell. Confirm with owner whether to mention it on the site.
- Key differentiator: Flagship luxury sedans (A7, S-Class, 7 Series) available minutes from Belgrade Airport — land and drive away in a premium car.

## Images
- Job / product photos: images/cars/ (user to upload photos of the three cars)
- Team / headshots: none
- Reference images folder: images/reference/

## Target Audience
High-end clientele: business travellers, executives and VIP guests flying into Belgrade, diaspora visiting home, people who want a premium car for events, weddings and special occasions. Many arrive via the airport, so a large share will be foreign / English-speaking.

## Build Decisions (confirmed by user, 2026-10-19)
- Scope: homepage (index.html), About page (about.html), three car model pages (audi-a7.html, mercedes-s-class.html, bmw-7-series.html), privacy.html. English language
- Design: 1:1 clone of MetroRide Webflow template (metroride.webflow.io) — its CSS, icons, arrows, fonts, scroll/hover/blur effects are reused directly; our copy, structure and images
- Prices shown on site (placeholders): Audi A7 EUR 120/day, BMW 7 Series EUR 150/day, Mercedes S-Class EUR 180/day
- Terms shown (industry-standard placeholders): 23+ age, 2+ years licence, EUR 500 deposit, 300 km/day included, full insurance, 24/7 airport delivery
- Phone/email are invented placeholders, user will replace later
- Testimonials section (2026-10-20): four placeholder reviews written at the user's request because the business has not opened yet. MUST be replaced with real client reviews before launch.

## Site-Specific Rules
- Positioning must feel luxury and exclusive — no budget/discount language, no cheap-looking stock imagery.
- Airport proximity is a headline selling point — make it prominent.
- Show all three cars individually (model, year, key specs, photo) with a clear "Reserve / Enquire" CTA on each.
- Language: TBC — recommended bilingual Serbian + English given airport and international clientele.
- Pricing on site: TBC — confirm whether to show prices or "price on request".
- Booking flow: enquiry form (Skill 03) — capture car, pick-up/return dates, pick-up location, name, phone, email.

## Pages added 2026-10-22
- about.html: clone of metroride.webflow.io/about. "Meet our team" replaced by "The fleet" (no team photos), blog section dropped, CTA + footer reused. Five-step process (added "Return With Ease" so the pyramid layout matches the template).
- Car model pages: clone of metroride.webflow.io/cars/<slug>. Weekly price = 6 x daily, monthly = 20 x daily (PLACEHOLDERS, confirm with owner). Equipment lists are typical 2017 spec, NOT verified against the actual cars; seats 5 / baggage 3 assumed.
- Fleet tabs on the homepage link to the model pages ("View Details" button + car name); About fleet cards link too.
- contact.html: clone of metroride.webflow.io/contact. Heading, 3 info cards (email / phone / WhatsApp-Viber), booking WIZARD (skill 02, step 8) in the white card, Google map of Surčin.
  - Wizard steps: 1 car (Audi A7 / Mercedes-Benz S-Class / BMW 7 Series / Not sure yet), 2 pick-up date + time, 3 duration (1-3 days / 4-7 days / 1-2 weeks / A month or longer), 4 meeting point (Belgrade Airport arrivals / Kimmiy Hotel, Surcin / Hotel or address in Belgrade / Somewhere else), 5 details.
  - Field names for Skill 03: car, pickup_date, pickup_time, duration, pickup_location, first_name, last_name, phone, email, flight, message, page. Required: car, pickup_date, duration, pickup_location, first_name, phone, email.
  - `ENDPOINT` constant lives at the top of the wizard block in js/main.js and is EMPTY. While empty, submit opens the visitor's mail client with the request addressed to bookings@kimmiysrent.com and shows the success panel. Run Skill 03, then paste the /exec URL there (GET + no-cors, same as B-Steel).
- Nav on every page is Home / About / Cars / Contact (per Pavle, 22.10.2026). Footer menu keeps the longer list with section anchors.
- cars.html: clone of metroride.webflow.io/car-categories/all. Heading, brand filter pills (All / Audi / Mercedes-Benz / BMW, client-side), 2-column cards. Nav item "Cars" on every page replaces the old "Fleet" anchor; footer has both Cars and Fleet.

## Technical rules
- Never use CSS `scroll-behavior: smooth` on this site: it breaks ScrollTrigger.refresh() while scrolled (fleet opened on the wrong car, thumbnail jumps landed off-section). Smooth anchor scrolling is done in js/main.js.
- MetroRide Webflow interactions (IX2 JSON) can be extracted from their webflow.schunk.*.js bundle; see the teardown notes in the build chat (events keyed by data-w-id, page-prefixed ids).

## Phone layout (2026-10-22)
- Phone/tablet layout mirrors the MetroRide template exactly. Two blocks at the end of css/kimmys.css do it: "Phone parity" (the template's per-breakpoint type scale: h1 56/56/42, h2 42/36/32, h3 36/32/28, h4 28/26/24, h5 24/22/22, h6 22/20/18, paragraph 16/14/14, section padding 80) and "Template responsive deltas" (407 rules generated from the template's computed styles at 900/600/390 px; only what changes versus the next wider breakpoint).
- Generator: scratch script gen_responsive.py (probes metroride.webflow.io over CDP for every class our pages use). Regenerate rather than hand-edit if the template changes.
- Kept on purpose where we differ from the template: "View Details" buttons in the fleet tabs, the booking wizard, our footer marquee.
