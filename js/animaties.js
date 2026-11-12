/* Deekman Enterprises — bewegende animaties
   Alles is extra: zonder JavaScript, of als iemand "minder beweging" aan heeft staan
   op zijn telefoon of computer, blijft de website gewoon stilstaan en volledig zichtbaar. */
(function () {
  var stil = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (stil || !('IntersectionObserver' in window)) return;

  var main = document.querySelector('main');
  if (!main) return;
  document.documentElement.classList.add('anim');

  function alle(sel, binnen) { return Array.prototype.slice.call((binnen || main).querySelectorAll(sel)); }

  /* ---------- 1. Voortgangsbalk bovenaan tijdens het scrollen ---------- */
  var balk = document.createElement('div');
  balk.className = 'voortgang';
  balk.setAttribute('aria-hidden', 'true');
  document.body.appendChild(balk);
  var wacht = false;
  function updateBalk() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    balk.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
    wacht = false;
  }
  window.addEventListener('scroll', function () {
    if (!wacht) { wacht = true; requestAnimationFrame(updateBalk); }
  }, { passive: true });
  updateBalk();

  /* ---------- Hulp: elementen zacht laten verschijnen als je ernaartoe scrolt ---------- */
  var io = new IntersectionObserver(function (items) {
    items.forEach(function (it) {
      if (!it.isIntersecting) return;
      var el = it.target;
      io.unobserve(el);
      el.classList.add('in');
      // Na de animatie de klassen opruimen, zodat hover-effecten soepel blijven werken
      setTimeout(function () {
        el.classList.remove('reveal', 'in');
        el.style.removeProperty('--d');
      }, 1400 + parseFloat(el.style.getPropertyValue('--d') || 0) * 1000);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  function markeer(el, d, metHero) {
    if (!el || el.classList.contains('reveal')) return;
    if (!metHero && el.closest('.reveal')) return;
    if (el.closest('[data-if]') && getComputedStyle(el.closest('[data-if]')).display === 'none') return;
    el.classList.add('reveal');
    el.style.setProperty('--d', Math.min(d || 0, 0.6).toFixed(2) + 's');
    io.observe(el);
  }

  /* ---------- 2. Bovenste blok (hero): kop regel voor regel ---------- */
  var hero = main.querySelector('section');
  var h1 = hero && hero.querySelector('h1');
  if (h1) {
    var delen = h1.innerHTML.split(/<br\s*\/?>/i);
    h1.innerHTML = delen.map(function (d, i) {
      return '<span class="hero-regel" style="--d:' + (0.08 + i * 0.16).toFixed(2) + 's">' + d + '</span>';
    }).join('<br>');
    // Wat in de hero ná de kop komt, komt er netjes achteraan
    var na = alle('h1 ~ *', h1.parentElement);
    na.forEach(function (el, i) { markeer(el, 0.3 + i * 0.12, true); });
    var boven = alle(':scope > p', h1.parentElement).filter(function (p) {
      return p.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING;
    });
    boven.forEach(function (p) { markeer(p, 0, true); });
  }

  /* Kaarten rechts in de hero (homepage): schuiven in en zweven daarna zacht */
  if (hero) {
    alle('a[style*="border-radius: 14px"]', hero).forEach(function (kaart, i) {
      kaart.classList.add('van-rechts');
      kaart.style.setProperty('--d', (0.45 + i * 0.14).toFixed(2) + 's');
      kaart.addEventListener('animationend', function klaar(e) {
        if (e.animationName !== 'van-rechts') return;
        kaart.removeEventListener('animationend', klaar);
        kaart.classList.remove('van-rechts');
        kaart.style.setProperty('--d', (i * 0.9).toFixed(2) + 's');
        kaart.classList.add('zweef');
      });
    });
  }

  /* ---------- 3. Alles verschijnt zacht als je ernaartoe scrolt ---------- */
  var secties = alle(':scope > section');
  secties.forEach(function (sec, si) {
    if (si === 0 && h1) return; // hero is hierboven al geregeld
    // Grote blokken eerst, daarna wat erin zit (dubbel wordt overgeslagen)
    alle('article', sec).forEach(function (el, i) { markeer(el, i % 2 * 0.1); });
    alle('figure', sec).forEach(function (el, i) { markeer(el, i * 0.12); });
    alle('ol > li', sec).forEach(function (el, i) { markeer(el, i * 0.14); });
    alle('[style*="display: grid"] > *', sec).forEach(function (el) {
      var broers = Array.prototype.indexOf.call(el.parentElement.children, el);
      markeer(el, broers * 0.09);
    });
    alle('p[style*="text-transform: uppercase"]', sec).forEach(function (el) { markeer(el, 0); });
    alle('h1, h2', sec).forEach(function (el) { markeer(el, 0.06); });
    alle('h1 + p, h2 + p', sec).forEach(function (el) { markeer(el, 0.14); });
    alle('img', sec).forEach(function (el) { markeer(el, 0.1); });
    alle(':scope > div > a, :scope > div > div > a', sec).forEach(function (el) { markeer(el, 0.2); });
  });

  /* ---------- 4. Hartslag in het Paginapuls-icoon ---------- */
  alle('svg path[d^="M3 12h4"]').forEach(function (p) {
    var len = p.getTotalLength ? Math.ceil(p.getTotalLength()) : 48;
    p.style.setProperty('--len', len);
    p.classList.add('puls-lijn');
  });

  /* ---------- 5. "Live"-labels krijgen een kloppend stipje ---------- */
  alle('span').forEach(function (s) {
    if (s.children.length === 0 && s.textContent.trim() === 'Live') s.classList.add('live-stip');
  });

  /* ---------- 6. Grafiek bij Paginapuls (pagina Onze apps) groeit omhoog ---------- */
  alle('div[aria-hidden="true"]').forEach(function (groep) {
    var staven = alle(':scope > span[style*="height:"]', groep);
    if (staven.length < 3) return;
    staven.forEach(function (s, i) {
      s.classList.add('balk');
      s.style.setProperty('--d', (i * 0.08).toFixed(2) + 's');
    });
    var gio = new IntersectionObserver(function (items) {
      if (!items[0].isIntersecting) return;
      gio.disconnect();
      setTimeout(function () { staven.forEach(function (s) { s.classList.add('groei'); }); }, 250);
    }, { threshold: 0.5 });
    gio.observe(groep);
  });

  /* ---------- 7. Chatgesprek bij Leerpuls: berichtjes verschijnen na elkaar ---------- */
  alle('p').forEach(function (p) {
    if (p.textContent.trim().indexOf('Gesprek oefenen') !== 0) return;
    var vak = p.parentElement;
    var bubbels = alle(':scope > p', vak).slice(1);
    if (!bubbels.length) return;
    bubbels.forEach(function (b) { b.classList.add('bubbel'); });
    var tikt = document.createElement('span');
    tikt.className = 'typt';
    tikt.setAttribute('aria-hidden', 'true');
    tikt.innerHTML = '<i></i><i></i><i></i>';
    var cio = new IntersectionObserver(function (items) {
      if (!items[0].isIntersecting) return;
      cio.disconnect();
      setTimeout(function () { bubbels[0].classList.add('in'); }, 500);
      if (bubbels[1]) {
        setTimeout(function () { vak.insertBefore(tikt, bubbels[1]); }, 1100);
        setTimeout(function () { tikt.remove(); bubbels[1].classList.add('in'); }, 2300);
      }
    }, { threshold: 0.6 });
    cio.observe(vak);
  });

  /* ---------- 8. Kaarten en knoppen reageren als je eroverheen gaat ---------- */
  alle('[style*="display: grid"] > div[style*="background: #FFFFFF"], [style*="display: grid"] > article, [style*="display: grid"] > a, section > div > article').forEach(function (k) {
    k.classList.add('kaart-hover');
  });
})();

/* Deekman Enterprises — bewegende achtergronden voor de homepage-hero.
   Welke er draait, staat in data-hero op de hero-sectie: "netwerk" of "patroon".
   De logo-intro draait als de sectie ook data-intro heeft.
   Met "minder beweging" aan blijft alles stil. */
(function () {
  var stil = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hero = document.querySelector('[data-hero]');
  var DE = 'M92.32 337.20V174.80H163.31Q189.76 174.80 209.71 184.89Q229.66 194.98 240.80 213.31Q251.94 231.64 251.94 256.00Q251.94 280.36 240.80 298.68Q229.66 317.01 209.71 327.10Q189.76 337.20 163.31 337.20ZM122.48 311.68H161.92Q180.02 311.68 193.47 304.83Q206.93 297.99 214.24 285.46Q221.54 272.93 221.54 256.00Q221.54 239.06 214.24 226.53Q206.93 214.00 193.47 207.16Q180.02 200.32 161.92 200.32H122.48ZM297.87 337.20V174.80H416.42V200.08H328.03V242.31H406.45V267.13H328.03V311.91H419.67V337.20Z';

  function maakCanvas() {
    var c = document.createElement('canvas');
    c.className = 'hero-canvas';
    c.setAttribute('aria-hidden', 'true');
    hero.insertBefore(c, hero.firstChild);
    return c;
  }

  function start(teken) {
    var c = maakCanvas(), ctx = c.getContext('2d');
    var w = 0, h = 0, dpr = 1, muis = { x: -9999, y: -9999, actief: false };
    function maat() {
      var r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (teken.maat) teken.maat(w, h);
    }
    maat();
    window.addEventListener('resize', maat);
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      muis.x = e.clientX - r.left; muis.y = e.clientY - r.top; muis.actief = true;
    });
    hero.addEventListener('mouseleave', function () { muis.actief = false; muis.x = muis.y = -9999; });
    var zichtbaar = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (i) { zichtbaar = i[0].isIntersecting; }).observe(hero);
    }
    var t0 = performance.now();
    function frame(nu) {
      if (zichtbaar) {
        ctx.clearRect(0, 0, w, h);
        teken.frame(ctx, w, h, (nu - t0) / 1000, muis, stil);
      }
      if (!stil) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Variant: zwevende gouden puntjes die een netwerk vormen ---------- */
  function netwerk() {
    var punten = [];
    return {
      maat: function (w, h) {
        var n = Math.round(Math.min(110, (w * h) / 11000));
        punten = [];
        for (var i = 0; i < n; i++) {
          punten.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: 1 + Math.random() * 1.6 });
        }
      },
      frame: function (ctx, w, h, t, muis) {
        var max = 130, i, j, p, q, dx, dy, d;
        for (i = 0; i < punten.length; i++) {
          p = punten[i];
          if (muis.actief) {
            dx = p.x - muis.x; dy = p.y - muis.y; d = Math.sqrt(dx * dx + dy * dy);
            if (d < 140 && d > 0.1) { p.x += (dx / d) * (140 - d) * 0.02; p.y += (dy / d) * (140 - d) * 0.02; }
          }
          p.x += p.vx; p.y += p.vy;
          if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20;
        }
        ctx.lineWidth = 1;
        for (i = 0; i < punten.length; i++) {
          p = punten[i];
          for (j = i + 1; j < punten.length; j++) {
            q = punten[j]; dx = p.x - q.x; dy = p.y - q.y; d = dx * dx + dy * dy;
            if (d < max * max) {
              ctx.strokeStyle = 'rgba(242,194,48,' + (0.22 * (1 - Math.sqrt(d) / max)).toFixed(3) + ')';
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            }
          }
          if (muis.actief) {
            dx = p.x - muis.x; dy = p.y - muis.y; d = Math.sqrt(dx * dx + dy * dy);
            if (d < 200) {
              ctx.strokeStyle = 'rgba(246,245,241,' + (0.35 * (1 - d / 200)).toFixed(3) + ')';
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(muis.x, muis.y); ctx.stroke();
            }
          }
        }
        for (i = 0; i < punten.length; i++) {
          p = punten[i];
          ctx.fillStyle = 'rgba(242,194,48,' + (0.55 + 0.35 * Math.sin(t * 1.5 + i)).toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
    };
  }

  /* ---------- Variant: patroon van kleine DE-logo's dat oplicht ---------- */
  function patroon() {
    var pad = window.Path2D ? new Path2D(DE) : null, stap = 120, maat = 26;
    return {
      frame: function (ctx, w, h, t, muis) {
        if (!pad) return;
        var schuif = (t * 8) % stap;
        var golfX = ((t * 260) % (w + 900)) - 450; // lichtgolf die rustig van links naar rechts gaat
        for (var rij = -1; rij * stap < h + stap; rij++) {
          for (var kol = -1; kol * stap < w + stap; kol++) {
            var x = kol * stap + (rij % 2 ? stap / 2 : 0) + schuif;
            var y = rij * stap + schuif * 0.6;
            var cx = x + maat / 2, cy = y + maat / 2;
            var licht = 0;
            if (muis.actief) {
              var d = Math.sqrt((cx - muis.x) * (cx - muis.x) + (cy - muis.y) * (cy - muis.y));
              licht = Math.max(licht, 1 - d / 220);
            }
            var g = 1 - Math.abs(cx - golfX - (cy * 0.35)) / 260;
            licht = Math.max(licht, g * 0.35);
            licht = Math.max(0, licht);
            ctx.save();
            ctx.translate(x, y);
            var s = (maat / 330) * (1 + licht * 0.25);
            ctx.scale(s, s);
            ctx.translate(-92, -175);
            if (licht > 0.02) {
              ctx.fillStyle = 'rgba(242,194,48,' + (0.04 + licht * 0.45).toFixed(3) + ')';
            } else {
              ctx.fillStyle = 'rgba(246,245,241,0.04)';
            }
            ctx.fill(pad);
            ctx.restore();
          }
        }
      }
    };
  }

  if (hero) {
    var soort = hero.getAttribute('data-hero');
    if (soort === 'netwerk') start(netwerk());
    if (soort === 'patroon') start(patroon());
  }

  /* ---------- Variant: logo-intro bij het openen van de site ---------- */
  if (hero && hero.hasAttribute('data-intro') && !stil) {
    var gezien = false;
    try { gezien = sessionStorage.getItem('de-intro') === '1'; sessionStorage.setItem('de-intro', '1'); } catch (e) {}
    var doel = document.querySelector('header img');
    if (!gezien && doel) {
      var laag = document.createElement('div');
      laag.className = 'intro-laag';
      laag.setAttribute('aria-hidden', 'true');
      laag.innerHTML = '<img class="intro-logo" src="' + doel.getAttribute('src') + '" alt="">';
      document.body.appendChild(laag);
      document.documentElement.classList.add('intro-bezig');
      var logo = laag.firstChild;
      var klaar = false;
      function sluit() {
        if (klaar) return; klaar = true;
        logo.style.animation = 'none';
        var a = logo.getBoundingClientRect(), b = doel.getBoundingClientRect();
        var sx = b.width / a.width;
        var tx = (b.left + b.width / 2) - (a.left + a.width / 2);
        var ty = (b.top + b.height / 2) - (a.top + a.height / 2);
        logo.style.transition = 'transform 0.9s cubic-bezier(0.7, 0, 0.2, 1)';
        logo.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sx + ')';
        laag.classList.add('weg');
        setTimeout(function () {
          document.documentElement.classList.remove('intro-bezig');
          laag.parentNode && laag.parentNode.removeChild(laag);
        }, 1000);
      }
      laag.addEventListener('click', sluit);
      setTimeout(sluit, 2300);
    }
  }
})();
