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

        // -------- Hero 3D car (Three.js) --------
        // Ground tuned matte/dark so it never reads purple under the warm
        // env panels — previously a metallic floor + warm key + cool fill
        // mixed in reflection to a mauve cast. Now low-metalness, dark,
        // no warm point bounce.
        (function initHero3D() {
          var canvas = document.getElementById('heroCanvas');
          var heroEl = document.getElementById('hero');
          if (!canvas || !heroEl || typeof THREE === 'undefined') {
            if (heroEl) heroEl.classList.add('is-no-webgl');
            return;
          }

          var renderer;
          try {
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
            if (!renderer.getContext()) throw new Error('no context');
          } catch (e) {
            console.warn('[hero] WebGL unavailable — fallback to text-only.', e);
            heroEl.classList.add('is-no-webgl');
            return;
          }
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          renderer.outputEncoding = THREE.sRGBEncoding;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.0;
          renderer.shadowMap.enabled = true;
          renderer.shadowMap.type = THREE.PCFSoftShadowMap;

          var scene = new THREE.Scene();
          scene.background = new THREE.Color(0x0a0a0c);

          var camera = new THREE.PerspectiveCamera(38, heroEl.clientWidth / heroEl.clientHeight, 0.1, 100);
          var camStart = { x: 6.5, y: 1.8, z: 5.5, tx: 1.5, ty: 0.6, tz: 0 };
          camera.position.set(camStart.x, camStart.y, camStart.z);
          camera.lookAt(camStart.tx, camStart.ty, camStart.tz);

          // ---- Procedural studio environment (PMREM) — warm only ----
          var pmrem = new THREE.PMREMGenerator(renderer);
          pmrem.compileEquirectangularShader();
          var envScene = new THREE.Scene();
          envScene.background = new THREE.Color(0x05050a);
          function addEnvPanel(color, intensity, pos, size) {
            var m = new THREE.Mesh(
              new THREE.PlaneGeometry(size[0], size[1]),
              new THREE.MeshBasicMaterial({
                color: new THREE.Color(color).multiplyScalar(intensity),
                side: THREE.DoubleSide
              })
            );
            m.position.set(pos[0], pos[1], pos[2]);
            m.lookAt(0, 0.5, 0);
            envScene.add(m);
          }
          // Gold key panels
          addEnvPanel(0xffc878, 9.0, [ 4,  5,  3], [6, 4]);
          addEnvPanel(0xffae5e, 5.0, [ 3,  1,  4], [4, 2.5]);
          // Warm rim from behind for edge separation
          addEnvPanel(0xffb060, 5.0, [-2,  4, -6], [6, 3]);
          // Soft warm top bounce
          addEnvPanel(0x665544, 1.2, [ 0,  7,  0], [10, 10]);
          var envRT = pmrem.fromScene(envScene, 0.035);
          scene.environment = envRT.texture;
          pmrem.dispose();

          // ---- Cinematic studio lighting ----
          scene.add(new THREE.AmbientLight(0x1a1a22, 0.35));

          var dirLight = new THREE.DirectionalLight(0xffd58c, 3.2);
          dirLight.position.set(5, 8, 4);
          dirLight.castShadow = true;
          dirLight.shadow.mapSize.set(2048, 2048);
          dirLight.shadow.camera.near = 0.5;
          dirLight.shadow.camera.far = 30;
          dirLight.shadow.camera.left = -8;
          dirLight.shadow.camera.right = 8;
          dirLight.shadow.camera.top = 8;
          dirLight.shadow.camera.bottom = -8;
          dirLight.shadow.bias = -0.0005;
          dirLight.shadow.radius = 4;
          scene.add(dirLight);

          var rimLight = new THREE.DirectionalLight(0xffae5e, 1.8);
          rimLight.position.set(-3, 4, -6);
          scene.add(rimLight);

          // Dark, near-matte ground — kills the purple cast.
          var groundMat = new THREE.MeshStandardMaterial({
            color: 0x07070a,
            roughness: 0.78,
            metalness: 0.15,
            envMapIntensity: 0.25
          });
          var ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), groundMat);
          ground.rotation.x = -Math.PI / 2;
          ground.position.y = -0.5;
          ground.receiveShadow = true;
          scene.add(ground);

          function resize() {
            var w = heroEl.clientWidth, h = heroEl.clientHeight;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
          }
          resize();
          window.addEventListener('resize', resize);

          var car = null;
          var carInitial = { rotY: 0, posZ: 0 };

          (function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
          })();

          // ============================================================
          // Procedural stretch limousine — built from primitives so the
          // hero reads as a genuine black stretch limo (not a generic
          // sedan), needs no external .glb, and picks up the gold studio
          // env-map + rim lighting for a premium cinematic finish.
          // ============================================================
          function buildLimousine() {
            var limo = new THREE.Group();

            // ---- Shared materials ----
            // Big flat box faces mirror-reflect the bright studio env, so
            // keep metalness moderate + roughness higher → the dark base
            // colour dominates and the body reads as glossy black paint
            // rather than flat light panels, while edges still catch gold.
            var bodyMat = new THREE.MeshStandardMaterial({
              color: 0x09090b, metalness: 0.35, roughness: 0.52, envMapIntensity: 0.5
            });
            var glassMat = new THREE.MeshStandardMaterial({
              color: 0x05060a, metalness: 0.3, roughness: 0.14, envMapIntensity: 0.7
            });
            var tireMat = new THREE.MeshStandardMaterial({
              color: 0x080809, metalness: 0.1, roughness: 0.85, envMapIntensity: 0.4
            });
            var goldMat = new THREE.MeshStandardMaterial({
              color: 0xC9A84C, metalness: 0.95, roughness: 0.30, envMapIntensity: 1.25
            });
            var headMat = new THREE.MeshStandardMaterial({
              color: 0xfff1d0, emissive: 0xffd58c, emissiveIntensity: 1.3, roughness: 0.3
            });
            var tailMat = new THREE.MeshStandardMaterial({
              color: 0x2a0402, emissive: 0xff2a1a, emissiveIntensity: 1.5, roughness: 0.4
            });

            function box(w, h, d, x, y, z, mat) {
              var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
              m.position.set(x, y, z);
              limo.add(m);
              return m;
            }

            // ---- Lower body (long three-box chassis) ----
            box(5.0, 0.50, 1.12, 0.0, 0.58, 0.0, bodyMat);
            // Subtle rocker / sill for depth
            box(4.6, 0.16, 1.18, 0.0, 0.40, 0.0, bodyMat);
            // Gold beltline accent strips down each flank
            box(4.7, 0.035, 1.15, 0.0, 0.80, 0.0, goldMat);

            // ---- Greenhouse: long dark-glass passenger cabin ----
            // Offset slightly rearward — the long rear is the limo signature.
            box(4.0, 0.40, 0.96, -0.10, 1.03, 0.0, glassMat);
            // Body-colour roof cap on top of the glass
            box(3.4, 0.10, 0.90, -0.10, 1.28, 0.0, bodyMat);
            // Pillars (A / B / C) breaking up the glass band
            box(0.10, 0.40, 0.98, 1.75, 1.03, 0.0, bodyMat);
            box(0.10, 0.40, 0.98, 0.10, 1.03, 0.0, bodyMat);
            box(0.10, 0.40, 0.98, -1.95, 1.03, 0.0, bodyMat);

            // ---- Front detailing ----
            box(0.06, 0.22, 0.90, 2.53, 0.55, 0.0, goldMat);          // grille
            box(0.06, 0.13, 0.20, 2.52, 0.62, 0.40, headMat);         // headlight R
            box(0.06, 0.13, 0.20, 2.52, 0.62, -0.40, headMat);        // headlight L
            // ---- Rear detailing ----
            box(0.06, 0.11, 0.24, -2.53, 0.62, 0.38, tailMat);        // taillight R
            box(0.06, 0.11, 0.24, -2.53, 0.62, -0.38, tailMat);       // taillight L

            // ---- Wheels (gold-rimmed) ----
            function wheel(x, z) {
              var hub = new THREE.Group();
              var tire = new THREE.Mesh(
                new THREE.CylinderGeometry(0.40, 0.40, 0.28, 28), tireMat
              );
              tire.rotation.x = Math.PI / 2;   // lay axle along Z
              hub.add(tire);
              var rim = new THREE.Mesh(
                new THREE.CylinderGeometry(0.24, 0.24, 0.30, 20), goldMat
              );
              rim.rotation.x = Math.PI / 2;
              hub.add(rim);
              hub.position.set(x, 0.40, z);
              limo.add(hub);
            }
            wheel(2.25, 0.66);  wheel(2.25, -0.66);
            wheel(-2.25, 0.66); wheel(-2.25, -0.66);

            return limo;
          }

          (function initLimo() {
            var model = buildLimousine();
            var rawBox = new THREE.Box3().setFromObject(model);
            var rawSize = rawBox.getSize(new THREE.Vector3());
            var rawCenter = rawBox.getCenter(new THREE.Vector3());
            model.position.x = -rawCenter.x;
            model.position.y = -rawBox.min.y;
            model.position.z = -rawCenter.z;

            car = new THREE.Group();
            car.add(model);

            var maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
            var target = 3.2;
            car.scale.setScalar(target / maxDim);

            car.position.set(1.5, -0.5, 0);
            car.rotation.y = -0.5;

            model.traverse(function (n) {
              if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }
            });
            scene.add(car);
            carInitial.rotY = car.rotation.y;
            carInitial.posZ = car.position.z;

            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
              var camPos = { x: camStart.x, y: camStart.y, z: camStart.z };
              var camTgt = { x: camStart.tx, y: camStart.ty, z: camStart.tz };

              var tl = gsap.timeline({
                scrollTrigger: {
                  trigger: '.hero',
                  start: 'top top',
                  end: '+=200%',
                  pin: true,
                  scrub: 1.0,
                  anticipatePin: 1,
                  invalidateOnRefresh: true
                },
                defaults: { ease: 'none' }
              });

              tl.to(car.rotation, { y: carInitial.rotY + 0.65, duration: 0.3 }, 0);

              tl.to(camPos, {
                x: 0, y: 2.4, z: 7.5, duration: 0.3,
                onUpdate: function () {
                  camera.position.set(camPos.x, camPos.y, camPos.z);
                  camera.lookAt(camTgt.x, camTgt.y, camTgt.z);
                }
              }, 0.3);
              tl.to(camTgt, { x: 0, y: 0.4, z: 0, duration: 0.3 }, 0.3);

              tl.to(car.position, { z: carInitial.posZ + 3.5, duration: 0.4 }, 0.6);
              tl.to('.hero__text', { opacity: 0, y: -40, duration: 0.4 }, 0.6);
              tl.to('.hero__hint', { opacity: 0, duration: 0.2 }, 0.6);

              ScrollTrigger.refresh();
            }
          })();
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
            form.addEventListener('submit', function (e) {
              // Web3Forms handles delivery + redirect to /thank-you/ server-side.
              // While the access key is still the placeholder, intercept so we
              // don't POST to a dead key — show a friendly note instead.
              var keyEl = form.querySelector('input[name="access_key"]');
              var key = keyEl ? keyEl.value : '';
              if (!key || /ACCESS_KEY_HERE/.test(key)) {
                e.preventDefault();
                window.alert("Thanks! (Demo mode — add your Web3Forms key to enable live delivery.) We'll be in touch.");
                form.reset();
                if (pickupSel) pickupSel.selectedIndex = 0;
                if (dropSel) dropSel.selectedIndex = 0;
              }
              // else: let the form POST natively to Web3Forms.
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
  