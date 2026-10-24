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
