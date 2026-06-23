/* Shared testimonial carousel markup (real Google reviews). */
// Clickable Google source badge shown on the testimonial card (all reviews are Google reviews).
const G = '<a class="testi__google" href="https://www.google.com/search?q=Show+Limousines+Sydney+reviews" target="_blank" rel="noopener noreferrer" aria-label="Read our reviews on Google (opens in a new tab)" title="View our Google Reviews"><svg class="testi__google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg><span class="testi__google-text">Google Reviews</span></a>';
const R = [
  ['Fantastic experience! Mick was great to deal with. The vehicle used on the day not only looked amazing, but the driver was on time and was friendly with the entire bridal party.', 'Daniel Keenahan', 'Wedding · Google Review'],
  ['I recently used Show Limousine Hire and was thoroughly impressed by their service. Mick was highly professional and punctual, making the entire experience smooth and stress-free. The vehicle was immaculate, comfortable, and clearly well-maintained.', 'Elena Pace', 'Special Event · Google Review'],
  ["We couldn't recommend Show Limousines more for wedding transport. They handled both our bridal party pick-up and our getaway car at the end of the night, and everything ran absolutely seamlessly.", 'Kaelee', 'Wedding · Google Review'],
  ['I had Mick and his team provide the transport for my wedding and we were extremely happy with absolutely everything. From the time of booking up to the wedding day, Mick was always happy to help and always replied very quickly.', 'Matikka Ismail', 'Wedding · Google Review'],
  ['Hired a stretched Hummer for a surprise 70th. My grandkids aged 3 to 13 thought they were rockstars. Show Limousines are a very professional company and I have no hesitation in recommending them.', 'Theo Dechaufepie', 'Birthday · Google Review'],
];
const slides = R.map((r, i) => `              <div class="testi__slide${i === 0 ? ' is-active' : ''}" data-slide="${i}">
                <p class="testi__quote">${r[0]}</p>
                <div class="testi__attr"><div class="testi__name">${r[1]}</div><div class="testi__meta">${r[2]}</div><div class="testi__stars" aria-label="Rated 5 out of 5 stars">★★★★★</div></div>
              </div>`).join('\n');
module.exports = `    <section class="testi" id="testimonials" aria-labelledby="testiHeading">
      <div class="beam" aria-hidden="true"></div>
      <div class="testi__inner">
        <div class="testi__header reveal"><span class="label-bracket">Customer Testimonials</span><h2 class="testi__heading" id="testiHeading">Hear from Show Limousines' customers.</h2></div>
        <div class="testi__grid">
          <article class="testi__card reveal" aria-live="polite" aria-atomic="true">
            <div class="testi__quote-mark" aria-hidden="true">"</div>
            ${G}
            <div class="testi__slides" id="testiSlides">
${slides}
            </div>
            <div class="testi__nav">
              <div class="testi__trust"><span>Trusted by</span>160+ Five-Star reviews</div>
              <button class="testi__nav-btn" id="testiPrev" aria-label="Previous testimonial"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
              <button class="testi__nav-btn" id="testiNext" aria-label="Next testimonial"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
              <span class="testi__counter"><strong id="testiCur">01</strong> / 05</span>
            </div>
          </article>
        </div>
      </div>
    </section>`;
