    /* ============================================================
       Core init — Lenis, scroll reveals, cursor, magnetic, hero 3D,
       testimonials, how-it-works accordion, FAQ accordion, nav,
       quote form, time-dropdown population.
       ============================================================ */
    (function () {
      'use strict';
      function ready(fn){ if(document.readyState!=='loading'){fn()} else {document.addEventListener('DOMContentLoaded',fn)} }

      ready(function () {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
          gsap.registerPlugin(ScrollTrigger);
        }

        // -------- Lenis smooth scroll (GSAP ticker as the SOLE driver) --------
        var lenis = null;
        if (typeof Lenis !== 'undefined') {
          lenis = new Lenis({
            duration: 1.1,
            easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
            smoothTouch: false,
            lerp: 0.1
          });
          if (typeof ScrollTrigger !== 'undefined') {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
            gsap.ticker.lagSmoothing(0);
          } else {
            (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })();
          }
          window.__lenis = lenis;
        }

        // -------- Scroll reveals --------
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
          gsap.utils.toArray('.reveal').forEach(function (el) {
            gsap.fromTo(el, { y: 50, opacity: 0 }, {
              y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none none' }
            });
          });
        }

        // -------- Custom cursor (desktop only) --------
        (function initCursor() {
          if (window.matchMedia('(hover: none)').matches) return;
          var dot = document.createElement('div');
          var ring = document.createElement('div');
          dot.id = 'c-dot'; ring.id = 'c-ring';
          document.body.appendChild(dot); document.body.appendChild(ring);
          var mx = 0, my = 0, rx = 0, ry = 0;
          document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; });
          (function tick() {
            dot.style.transform = 'translate(' + (mx - 4) + 'px,' + (my - 4) + 'px)';
            rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
            ring.style.transform = 'translate(' + (rx - 20) + 'px,' + (ry - 20) + 'px)';
            requestAnimationFrame(tick);
          })();
          document.querySelectorAll('a,button,[data-hover]').forEach(function (el) {
            el.addEventListener('mouseenter', function () { dot.classList.add('is-hover'); ring.classList.add('is-hover'); });
            el.addEventListener('mouseleave', function () { dot.classList.remove('is-hover'); ring.classList.remove('is-hover'); });
          });
        })();

        // -------- Magnetic buttons --------
        if (typeof gsap !== 'undefined') {
          document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
            btn.addEventListener('mousemove', function (e) {
              var r = btn.getBoundingClientRect();
              gsap.to(btn, {
                x: (e.clientX - r.left - r.width / 2) * 0.28,
                y: (e.clientY - r.top - r.height / 2) * 0.28,
                duration: 0.35, ease: 'power2.out'
              });
            });
            btn.addEventListener('mouseleave', function () {
              gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' });
            });
          });
        }

        // -------- Hero heading split animation --------
        (function initHeroHeading() {
          var h = document.getElementById('heroHeading');
          if (!h) return;
          var text = h.textContent.trim();
          var words = text.split(/\s+/);
          h.innerHTML = words.map(function (w) {
            return '<span class="w"><span>' + w + '</span></span>';
          }).join(' ');
          requestAnimationFrame(function () { h.classList.add('is-in'); });
        })();

        // -------- Keep --header-height in sync with the fixed nav --------
        (function syncHeaderHeight() {
          var nav = document.querySelector('.nav-wrap');
          if (!nav) return;
          function set() {
            document.documentElement.style.setProperty('--header-height', nav.offsetHeight + 'px');
          }
          set();
          window.addEventListener('resize', set, { passive: true });
          window.addEventListener('load', set);
        })();

        // -------- Hero background video (autoplay/loop; respects reduced motion) --------
        (function initHeroVideo() {
          var video = document.getElementById('heroVideo');
          if (!video) return;
          var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (reduce) {
            // Show the poster instead of playing the video
            video.removeAttribute('autoplay');
            video.removeAttribute('loop');
            try { video.pause(); video.currentTime = 0; } catch (e) {}
            return;
          }
          video.muted = true;
          var play = video.play && video.play();
          if (play && play.catch) play.catch(function () {});
        })();

        // -------- Footer subscribe --------
        (function initFootSub() {
          var form = document.getElementById('footSubForm');
          var note = document.getElementById('footSubNote');
          var input = document.getElementById('footEmail');
          if (!form || !note || !input) return;
          form.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = (input.value || '').trim();
            var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            if (!ok) {
              note.textContent = 'Please enter a valid email address.';
              note.style.color = '#ff8c7a';
              input.focus();
              return;
            }
            note.textContent = "Thanks — we'll be in touch with offers soon.";
            note.style.color = '#C9A84C';
            input.value = '';
          });
        })();

        // -------- Testimonial cycler --------
        (function initTestimonials() {
          var slides = document.querySelectorAll('.testi__slide');
          var prev = document.getElementById('testiPrev');
          var next = document.getElementById('testiNext');
          var cur = document.getElementById('testiCur');
          if (!slides.length) return;
          var i = 0;
          var auto = null;
          function show(n) {
            i = (n + slides.length) % slides.length;
            slides.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
            if (cur) cur.textContent = String(i + 1).padStart(2, '0');
          }
          function step(d) { show(i + d); reset(); }
          function reset() { if (auto) clearInterval(auto); auto = setInterval(function () { show(i + 1); }, 7000); }
          if (prev) prev.addEventListener('click', function () { step(-1); });
          if (next) next.addEventListener('click', function () { step(1); });
          reset();
        })();

        // -------- Wedding vehicle showcase slider --------
        (function initVehicleShowcase() {
          var root = document.querySelector('.wvshow');
          if (!root) return;
          var slides = root.querySelectorAll('.wvshow__slide');
          if (!slides.length) return;
          var dotsWrap = root.querySelector('.wvshow__dots');
          var prevBtn = root.querySelector('.wvshow__btn--prev');
          var nextBtn = root.querySelector('.wvshow__btn--next');
          var i = 0, auto = null, dots = [];
          slides.forEach(function (s, idx) {
            var d = document.createElement('button');
            d.type = 'button';
            d.className = 'wvshow__dot' + (idx === 0 ? ' is-active' : '');
            var img = s.querySelector('img');
            d.setAttribute('aria-label', img ? img.getAttribute('alt') : ('Vehicle ' + (idx + 1)));
            d.addEventListener('click', function () { show(idx); resetTimer(); });
            if (dotsWrap) dotsWrap.appendChild(d);
            dots.push(d);
          });
          function show(n) {
            i = (n + slides.length) % slides.length;
            slides.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
            dots.forEach(function (d, idx) { d.classList.toggle('is-active', idx === i); });
          }
          function step(d) { show(i + d); resetTimer(); }
          function resetTimer() { if (auto) clearInterval(auto); auto = setInterval(function () { show(i + 1); }, 4500); }
          if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
          if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });
          show(0);
          resetTimer();
        })();

        // -------- Fleet carousel (shows 3 vehicles, slides through all) --------
        (function initFleetCarousel() {
          var root = document.querySelector('.fleetcar');
          if (!root) return;
          var viewport = root.querySelector('.fleetcar__viewport');
          var track = root.querySelector('.fleetcar__track');
          var cards = track ? track.querySelectorAll('.fleet-card') : [];
          if (!cards.length) return;
          var prevBtn = root.querySelector('.fleetcar__btn--prev');
          var nextBtn = root.querySelector('.fleetcar__btn--next');
          var i = 0, auto = null;
          function step() {
            var gap = parseFloat(getComputedStyle(track).columnGap) || 24;
            return cards[0].getBoundingClientRect().width + gap;
          }
          function perView() { return Math.max(1, Math.round(viewport.clientWidth / step())); }
          function maxIndex() { return Math.max(0, cards.length - perView()); }
          function go(n) {
            var mx = maxIndex();
            i = n > mx ? 0 : (n < 0 ? mx : n);
            track.style.transform = 'translateX(' + (-i * step()) + 'px)';
          }
          function resetTimer() { if (auto) clearInterval(auto); auto = setInterval(function () { go(i + 1); }, 4500); }
          if (prevBtn) prevBtn.addEventListener('click', function () { go(i - 1); resetTimer(); });
          if (nextBtn) nextBtn.addEventListener('click', function () { go(i + 1); resetTimer(); });
          window.addEventListener('resize', function () { go(Math.min(i, maxIndex())); });
          go(0);
          resetTimer();
        })();

        // -------- Photo gallery carousel(s): manual arrows + swipe --------
        (function initGalleryCarousels() {
          document.querySelectorAll('.galcar').forEach(function (root) {
            var viewport = root.querySelector('.galcar__viewport');
            var track = root.querySelector('.galcar__track');
            var slides = track ? track.querySelectorAll('.galcar__slide') : [];
            if (!slides.length) return;
            var prevBtn = root.querySelector('.galcar__btn--prev');
            var nextBtn = root.querySelector('.galcar__btn--next');
            var i = 0;
            function step() {
              var gap = parseFloat(getComputedStyle(track).columnGap) || 20;
              return slides[0].getBoundingClientRect().width + gap;
            }
            function perView() { return Math.max(1, Math.round(viewport.clientWidth / step())); }
            function maxIndex() { return Math.max(0, slides.length - perView()); }
            function go(n) {
              var mx = maxIndex();
              i = n > mx ? 0 : (n < 0 ? mx : n);
              track.style.transform = 'translateX(' + (-i * step()) + 'px)';
            }
            if (prevBtn) prevBtn.addEventListener('click', function () { go(i - 1); });
            if (nextBtn) nextBtn.addEventListener('click', function () { go(i + 1); });
            window.addEventListener('resize', function () { go(Math.min(i, maxIndex())); });
            // Touch / swipe support
            var x0 = null;
            viewport.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
            viewport.addEventListener('touchend', function (e) {
              if (x0 === null) return;
              var dx = e.changedTouches[0].clientX - x0;
              if (Math.abs(dx) > 40) { go(dx < 0 ? i + 1 : i - 1); }
              x0 = null;
            });
            go(0);
          });
        })();

        // -------- Review cards: per-card "Read more" toggle --------
        (function initReviewCards() {
          var cards = document.querySelectorAll('.wrev-card');
          if (!cards.length) return;
          function evaluate() {
            cards.forEach(function (card) {
              var text = card.querySelector('.wrev-card__text');
              var btn = card.querySelector('.wrev-card__more');
              if (!text || !btn) return;
              if (!text.classList.contains('is-clamped')) return; // already expanded by user
              btn.hidden = (text.scrollHeight - text.clientHeight <= 4);
            });
          }
          cards.forEach(function (card) {
            var text = card.querySelector('.wrev-card__text');
            var btn = card.querySelector('.wrev-card__more');
            if (!text || !btn) return;
            btn.addEventListener('click', function () {
              var clamped = text.classList.toggle('is-clamped');
              btn.textContent = clamped ? 'Read more' : 'Read less';
              btn.setAttribute('aria-expanded', String(!clamped));
            });
          });
          evaluate();
          window.addEventListener('load', evaluate);
        })();

        // -------- How-it-works accordion --------
        (function initHowAccordion() {
          var rows = document.querySelectorAll('.how-row');
          if (!rows.length) return;
          function toggle(row) {
            var willOpen = !row.classList.contains('is-open');
            rows.forEach(function (r) {
              r.classList.remove('is-open');
              var top = r.querySelector('.how-row__top');
              if (top) top.setAttribute('aria-expanded', 'false');
            });
            if (willOpen) {
              row.classList.add('is-open');
              var top = row.querySelector('.how-row__top');
              if (top) top.setAttribute('aria-expanded', 'true');
            }
          }
          rows.forEach(function (row) {
            var top = row.querySelector('.how-row__top');
            if (!top) return;
            top.addEventListener('click', function () { toggle(row); });
            top.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(row); }
            });
          });
        })();

        // -------- FAQ accordion --------
        (function initFAQ() {
          var items = document.querySelectorAll('.faq-item');
          if (!items.length) return;
          function toggle(item) {
            var willOpen = !item.classList.contains('is-open');
            items.forEach(function (i) {
              i.classList.remove('is-open');
              var top = i.querySelector('.faq-item__top');
              if (top) top.setAttribute('aria-expanded', 'false');
            });
            if (willOpen) {
              item.classList.add('is-open');
              var top = item.querySelector('.faq-item__top');
              if (top) top.setAttribute('aria-expanded', 'true');
            }
          }
          items.forEach(function (item) {
            var top = item.querySelector('.faq-item__top');
            if (!top) return;
            top.addEventListener('click', function () { toggle(item); });
            top.addEventListener('keydown', function (e) {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(item); }
            });
          });
        })();

        // -------- Quote form: populate time dropdowns + alert on submit --------
        (function initQuoteForm() {
          var pickupSel = document.getElementById('qPickupTime');
          var dropSel = document.getElementById('qDropoffTime');
          var form = document.getElementById('quoteForm');
          // 15-min intervals from 06:00 → 05:45 next day (24-hr cycle).
          function buildTimes() {
            var list = [];
            // 6am → 11:45pm
            for (var h = 6; h < 24; h++) {
              for (var m = 0; m < 60; m += 15) list.push({ h: h, m: m });
            }
            // 12am → 5:45am
            for (var h2 = 0; h2 < 6; h2++) {
              for (var m2 = 0; m2 < 60; m2 += 15) list.push({ h: h2, m: m2 });
            }
            return list;
          }
          function fmt(t) {
            var h = t.h;
            var mm = t.m < 10 ? '0' + t.m : String(t.m);
            var period = h >= 12 ? 'PM' : 'AM';
            var h12 = h % 12; if (h12 === 0) h12 = 12;
            return h12 + ':' + mm + ' ' + period;
          }
          function populate(sel) {
            if (!sel) return;
            var opt0 = document.createElement('option');
            opt0.value = '';
            opt0.textContent = 'Select a time';
            sel.appendChild(opt0);
            buildTimes().forEach(function (t) {
              var o = document.createElement('option');
              o.value = fmt(t);
              o.textContent = fmt(t);
              sel.appendChild(o);
            });
          }
          populate(pickupSel);
          populate(dropSel);

          if (form) {
            var submitBtn = form.querySelector('button[type="submit"]');
            var btnHTML = submitBtn ? submitBtn.innerHTML : '';

            // Show an inline message in place of the form (success) or above the
            // button (error), styled to match the surrounding dark form.
            function showConfirmation(msg) {
              var box = document.createElement('div');
              box.className = 'quote-confirm';
              box.setAttribute('role', 'status');
              box.setAttribute('aria-live', 'polite');
              box.style.cssText = 'padding:28px 24px;text-align:center;border:1px solid rgba(201,168,76,0.35);border-radius:14px;background:rgba(201,168,76,0.06);color:#fff;font:500 16px/1.55 "DM Sans",sans-serif;';
              box.innerHTML = '<div style="font-size:26px;line-height:1;margin-bottom:10px;color:#C9A84C;">✓</div>' + msg;
              form.replaceWith(box);
            }
            function showError() {
              var existing = form.querySelector('.quote-error');
              if (!existing) {
                existing = document.createElement('div');
                existing.className = 'quote-error';
                existing.setAttribute('role', 'alert');
                existing.style.cssText = 'margin:0 0 4px;padding:12px 14px;border:1px solid rgba(220,80,80,0.5);border-radius:10px;background:rgba(220,80,80,0.08);color:#ffd7d7;font:500 14px/1.5 "DM Sans",sans-serif;';
                var submitWrap = form.querySelector('.quote-submit');
                if (submitWrap) form.insertBefore(existing, submitWrap);
                else form.appendChild(existing);
              }
              existing.innerHTML = 'Sorry — something went wrong sending your request. Please try again, or call us on <a href="tel:0422023413" style="color:#C9A84C;font-weight:700;">0422 023 413</a>.';
            }

            form.addEventListener('submit', function (e) {
              e.preventDefault();
              // Keep the existing required-field validation.
              if (typeof form.reportValidity === 'function' && !form.reportValidity()) return;

              var oldErr = form.querySelector('.quote-error');
              if (oldErr) oldErr.remove();

              if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending…'; }

              fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(form)
              })
                .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
                .then(function (r) {
                  if (r.ok && r.data && r.data.success) {
                    form.reset();
                    if (pickupSel) pickupSel.selectedIndex = 0;
                    if (dropSel) dropSel.selectedIndex = 0;
                    showConfirmation("Thanks! We've received your request and will be in touch shortly.");
                  } else {
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = btnHTML; }
                    showError();
                  }
                })
                .catch(function () {
                  if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = btnHTML; }
                  showError();
                });
            });
          }
        })();

        // -------- Navigation --------
        (function initNav() {
          var navWrap = document.getElementById('navWrap');
          var burger = document.getElementById('navBurger');
          var mobile = document.getElementById('navMobile');
          if (!navWrap) return;

          setTimeout(function () { navWrap.classList.add('is-loaded'); }, 300);

          var lastY = window.scrollY;
          var ticking = false;
          function onScroll() {
            var y = window.scrollY;
            // Keep the nav pinned and always visible while scrolling for easy access
            navWrap.classList.remove('is-hidden');
            lastY = y;
            ticking = false;
          }
          window.addEventListener('scroll', function () {
            if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
          }, { passive: true });

          if (burger && mobile) {
            function close() {
              burger.classList.remove('is-open');
              mobile.classList.remove('is-open');
              mobile.setAttribute('aria-hidden', 'true');
              burger.setAttribute('aria-expanded', 'false');
              burger.setAttribute('aria-label', 'Open menu');
              document.body.style.overflow = '';
            }
            burger.addEventListener('click', function () {
              var open = !burger.classList.contains('is-open');
              if (open) {
                burger.classList.add('is-open');
                mobile.classList.add('is-open');
                mobile.setAttribute('aria-hidden', 'false');
                burger.setAttribute('aria-expanded', 'true');
                burger.setAttribute('aria-label', 'Close menu');
                document.body.style.overflow = 'hidden';
              } else { close(); }
            });
            mobile.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
          }

          // -------- Mobile submenu groups (progressive enhancement) --------
          if (mobile) {
            mobile.querySelectorAll('.nav-mobile__group').forEach(function (group) {
              var caret = group.querySelector('.nav-mobile__caret');
              if (!caret) return;
              group.classList.add('js-ready');
              caret.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var open = group.classList.toggle('is-open');
                caret.setAttribute('aria-expanded', open ? 'true' : 'false');
              });
            });
          }
        })();
      });
    })();
  