/* Gratis website-check: meet een website via Google PageSpeed Insights */
(function () {
  var form = document.querySelector('form[data-submit="check"]');
  var input = document.getElementById('wc-url');
  var bezig = false;

  function fase(f, extra) {
    DE.bind(Object.assign({
      isStart: f === 'start',
      isBezig: f === 'bezig',
      isKlaar: f === 'klaar',
      isFout: f === 'fout'
    }, extra || {}));
  }

  function normaliseer(u) {
    u = (u || '').trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try { return new URL(u).href; } catch (e) { return ''; }
  }

  function domeinVan(u) {
    return u.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  }

  var CHIP = {
    'Goed': 'flex: 0 0 auto; font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 99px; background: #DDF3E5; color: #145A32;',
    'Kan beter': 'flex: 0 0 auto; font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 99px; background: #FFF1CC; color: #6B4E00;',
    'Actie nodig': 'flex: 0 0 auto; font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 99px; background: #FBE2DC; color: #8A2A12;'
  };

  // Welke onderdelen we tonen, met uitleg in gewone taal
  var CONTROLES = [
    { id: 'is-on-https', titel: 'Beveiligde verbinding (https)',
      goed: 'Je site gebruikt een veilige verbinding.',
      slecht: 'Je site gebruikt (deels) geen beveiligde verbinding. Bezoekers en Google zien dat als onveilig.' },
    { id: 'viewport', titel: 'Werkt op mobiel',
      goed: 'De pagina past zich aan op een telefoonscherm.',
      slecht: 'De pagina is niet goed ingesteld voor telefoons.' },
    { id: 'largest-contentful-paint', titel: 'Laadsnelheid',
      goed: 'Het belangrijkste deel van je pagina staat snel in beeld ({tijd}).',
      slecht: 'Het duurt {tijd} voordat het belangrijkste deel van je pagina in beeld staat. Dat kan sneller.' },
    { id: 'document-title', titel: 'Paginatitel',
      goed: 'Je pagina heeft een titel die Google kan tonen.',
      slecht: 'Je pagina mist een titel voor Google.' },
    { id: 'meta-description', titel: 'Beschrijving voor Google',
      goed: 'Je pagina heeft een beschrijving die Google in de zoekresultaten kan tonen.',
      slecht: 'Je pagina mist een beschrijving die Google in de zoekresultaten toont.' },
    { id: 'image-alt', titel: 'Omschrijving bij afbeeldingen',
      goed: 'Je afbeeldingen hebben een omschrijving. Goed voor Google en voor bezoekers met een schermlezer.',
      slecht: 'Niet alle afbeeldingen hebben een omschrijving. Dat kost punten bij Google.' },
    { id: 'modern-image-formats', titel: 'Afbeeldingen',
      goed: 'Je afbeeldingen zijn goed geoptimaliseerd.',
      slecht: 'Je afbeeldingen kunnen kleiner, zodat je site sneller laadt.' }
  ];

  function status(score) {
    if (score >= 0.9) return 'Goed';
    if (score >= 0.5) return 'Kan beter';
    return 'Actie nodig';
  }

  function verwerk(j, domein) {
    var lh = j.lighthouseResult || {};
    var cats = lh.categories || {};
    var audits = lh.audits || {};
    function cat(id) { return cats[id] && typeof cats[id].score === 'number' ? Math.round(cats[id].score * 100) : null; }
    var snel = cat('performance'), seo = cat('seo'), bp = cat('best-practices'), toeg = cat('accessibility');
    var lijst = [snel, seo, bp, toeg].filter(function (x) { return x !== null; });
    var totaal = lijst.length ? Math.round(lijst.reduce(function (a, b) { return a + b; }, 0) / lijst.length) : 0;

    var punten = [];
    CONTROLES.forEach(function (c) {
      var a = audits[c.id];
      if (!a || typeof a.score !== 'number' || a.scoreDisplayMode === 'notApplicable') return;
      var s = status(a.score);
      var tekst = (s === 'Goed' ? c.goed : c.slecht).replace('{tijd}', a.displayValue || 'even');
      punten.push({ status: s, titel: c.titel, uitleg: tekst });
    });
    // Eerst wat aandacht nodig heeft
    var volgorde = { 'Actie nodig': 0, 'Kan beter': 1, 'Goed': 2 };
    punten.sort(function (x, y) { return volgorde[x.status] - volgorde[y.status]; });

    var samen = totaal >= 90 ? 'Je website doet het sterk. Er zijn nog een paar kleine kansen.'
      : totaal >= 60 ? 'Je site heeft een goede basis, maar er liggen kansen om beter gevonden te worden.'
        : 'Er valt veel te winnen: je site kan sneller en beter vindbaar worden.';
    var delen = [];
    if (snel !== null) delen.push('Snelheid ' + snel);
    if (seo !== null) delen.push('Vindbaarheid ' + seo);
    if (toeg !== null) delen.push('Toegankelijkheid ' + toeg);
    if (bp !== null) delen.push('Techniek ' + bp);

    DE.list('punten', punten, function (pt) {
      return DE.h('li', { style: 'background: #FFFFFF; border: 1px solid #E3E1D9; border-radius: 14px; padding: 20px 24px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center' },
        DE.h('span', { style: CHIP[pt.status], text: pt.status }),
        DE.h('div', { style: 'flex: 1 1 300px; min-width: 0' },
          DE.h('p', { style: 'margin: 0; font-weight: 600', text: pt.titel }),
          DE.h('p', { style: 'margin: 4px 0 0; color: #4A5068; font-size: 15px; line-height: 1.5', text: pt.uitleg })));
    });
    fase('klaar', { domein: domein, score: String(totaal), samenvatting: samen, categorieen: delen.join(' · ') + ' (van de 100, gemeten op mobiel)' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (bezig) return;
    var url = normaliseer(input.value);
    if (!url) {
      fase('fout', { foutTekst: 'Dit lijkt geen geldig websiteadres. Probeer bijvoorbeeld www.jouwwebsite.nl.' });
      return;
    }
    var domein = domeinVan(url);
    bezig = true;
    DE.busy(form, true, 'Bezig…');
    fase('bezig', { domein: domein });

    var api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=' + encodeURIComponent(url)
      + '&strategy=mobile&locale=nl&category=PERFORMANCE&category=SEO&category=BEST_PRACTICES&category=ACCESSIBILITY'
      + (DE.config.PSI_KEY ? '&key=' + encodeURIComponent(DE.config.PSI_KEY) : '');
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 120000);

    fetch(api, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 429) throw new Error('druk');
          if (!r.ok || !j.lighthouseResult) throw new Error('bereik');
          return j;
        });
      })
      .then(function (j) { verwerk(j, domein); })
      .catch(function (err) {
        var msg = err && err.message === 'druk'
          ? 'Het is even erg druk met checks. Probeer het over een minuut opnieuw.'
          : 'We konden ' + domein + ' niet meten. Klopt het adres en staat de site online?';
        fase('fout', { foutTekst: msg });
      })
      .then(function () {
        clearTimeout(timer);
        bezig = false;
        DE.busy(form, false);
      });
  });

  document.querySelectorAll('[data-action="opnieuw"]').forEach(function (b) {
    b.addEventListener('click', function () {
      input.value = '';
      fase('start');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      input.focus();
    });
  });

  // Adres meegeven via de link, bv. website-check.html?url=voorbeeld.nl
  var q = new URLSearchParams(location.search).get('url');
  if (q) { input.value = q; }
  fase('start');
})();
