/* Shared testimonial carousel markup (real Google reviews). */
const A = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M8 7h9v9"/></svg>';
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
          <div class="testi__media reveal" aria-hidden="true"><span class="testi__media-icon">"</span><div class="testi__media-mark"><span>Trusted by</span>160+ Sydney clients</div></div>
          <article class="testi__card reveal" aria-live="polite" aria-atomic="true">
            <div class="testi__quote-mark" aria-hidden="true">"</div>
            <div class="testi__slides" id="testiSlides">
${slides}
            </div>
            <div class="testi__nav">
              <button class="testi__nav-btn" id="testiPrev" aria-label="Previous testimonial"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
              <button class="testi__nav-btn" id="testiNext" aria-label="Next testimonial"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></button>
              <span class="testi__counter"><strong id="testiCur">01</strong> / 05</span>
            </div>
          </article>
        </div>
        <a href="https://www.google.com/search?q=Show+Limousines+Sydney+reviews" target="_blank" rel="noopener noreferrer" class="testi__viewall">All Google Reviews <span class="arrow" aria-hidden="true">${A}</span></a>
      </div>
    </section>`;
