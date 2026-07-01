/* Dependency-free vehicle photo carousel.
   Prev/next, dots, keyboard arrows, touch-swipe, lazy images, gentle autoplay
   that pauses on hover/focus/tab-hidden and respects prefers-reduced-motion. */
(function () {
  function init(root) {
    var track = root.querySelector('.gallery__track');
    var viewport = root.querySelector('.gallery__viewport');
    var slides = Array.prototype.slice.call(root.querySelectorAll('.gallery__slide'));
    var prev = root.querySelector('.gallery__nav--prev');
    var next = root.querySelector('.gallery__nav--next');
    var dotsWrap = root.querySelector('.gallery__dots');
    var countEl = root.querySelector('.gallery__count');
    var n = slides.length;
    if (!track || n === 0) return;
    if (n === 1) { root.setAttribute('data-single', ''); return; }

    var i = 0;
    var autoMs = parseInt(root.getAttribute('data-autoplay') || '0', 10);
    var timer = null;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var dots = [];
    for (var k = 0; k < n; k++) {
      var d = document.createElement('button');
      d.type = 'button';
      d.className = 'gallery__dot';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Photo ' + (k + 1) + ' of ' + n);
      (function (idx) { d.addEventListener('click', function () { go(idx); restart(); }); })(k);
      dotsWrap.appendChild(d);
      dots.push(d);
    }

    function update() {
      track.style.transform = 'translateX(-' + (i * 100) + '%)';
      for (var k = 0; k < n; k++) {
        dots[k].setAttribute('aria-selected', k === i ? 'true' : 'false');
        slides[k].setAttribute('aria-hidden', k === i ? 'false' : 'true');
      }
      if (countEl) countEl.textContent = (i + 1) + ' / ' + n;
    }
    function go(idx) { i = (idx + n) % n; update(); }
    function nextS() { go(i + 1); }
    function prevS() { go(i - 1); }

    next.addEventListener('click', function () { nextS(); restart(); });
    prev.addEventListener('click', function () { prevS(); restart(); });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { nextS(); restart(); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { prevS(); restart(); e.preventDefault(); }
    });

    // touch / pointer swipe
    var x0 = null, dx = 0;
    viewport.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; dx = 0; stop(); }, { passive: true });
    viewport.addEventListener('touchmove', function (e) { if (x0 !== null) dx = e.touches[0].clientX - x0; }, { passive: true });
    viewport.addEventListener('touchend', function () {
      if (x0 !== null) { if (Math.abs(dx) > 40) { dx < 0 ? nextS() : prevS(); } x0 = null; restart(); }
    });

    function start() { if (autoMs > 0 && !reduce) { stop(); timer = setInterval(nextS, autoMs); } }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    update();
    start();
  }

  function boot() {
    var list = document.querySelectorAll('[data-gallery]');
    for (var j = 0; j < list.length; j++) init(list[j]);
  }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
