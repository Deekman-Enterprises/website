/* Website-bouwer: keuzes maken, live voorbeeld, wensen versturen */
(function () {
  var state = {
    naam: '',
    type: 'Bedrijfswebsite',
    kleur: 'navy',
    stijl: 'Strak',
    paginas: { 'Home': true, 'Over ons': true, 'Diensten': true, 'Contact': true, 'Blog': false, 'Webshop': false },
    extras: { 'SEO': true, 'Google Ads': false, 'Teksten schrijven': false, 'Onderhoud': true },
    stap: 'kiezen'
  };

  var KLEUREN = [
    { id: 'navy', label: 'Donkerblauw', bg: '#1E2A5A', accent: '#F2C230', accentText: '#12172B', tint: '#E8EBF5' },
    { id: 'groen', label: 'Bosgroen', bg: '#1F5C45', accent: '#E9D8A6', accentText: '#1F2A22', tint: '#E4EFE9' },
    { id: 'terra', label: 'Terracotta', bg: '#9C4422', accent: '#FCE9D9', accentText: '#5A2410', tint: '#F7E7DE' },
    { id: 'zwart', label: 'Zwart-wit', bg: '#1A1A1A', accent: '#FFFFFF', accentText: '#1A1A1A', tint: '#EDEDED' }
  ];
  var STIJLEN = {
    'Strak': { r: 6, font: 'Inter, system-ui, sans-serif', weight: 700 },
    'Speels': { r: 20, font: "'Bricolage Grotesque', sans-serif", weight: 800 },
    'Zakelijk': { r: 0, font: 'Georgia, serif', weight: 700 }
  };

  function pill(on) {
    return 'font: inherit; font-size: 15px; font-weight: 500; padding: 11px 16px; min-height: 44px; border-radius: 99px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; '
      + (on ? 'background: #12172B; color: #F6F5F1; border: 1px solid #12172B;' : 'background: #FFFFFF; color: #12172B; border: 1px solid #C9C6BB;');
  }

  function set(patch) {
    Object.keys(patch).forEach(function (k) { state[k] = patch[k]; });
    render();
  }

  function knop(label, on, onclick, extra) {
    return DE.h('button', { type: 'button', 'aria-pressed': on ? 'true' : 'false', style: pill(on), onclick: onclick }, extra || null, label);
  }

  function kleurInfo() {
    return KLEUREN.filter(function (x) { return x.id === state.kleur; })[0] || KLEUREN[0];
  }

  function gekozen(obj) {
    return Object.keys(obj).filter(function (n) { return obj[n]; });
  }

  function samenvatting() {
    var k = kleurInfo();
    var p = gekozen(state.paginas);
    var x = gekozen(state.extras);
    return state.type + ' in ' + k.label.toLowerCase() + ', stijl ' + state.stijl.toLowerCase() + ', met ' + p.length + " pagina's"
      + (x.length ? '. Hulp bij: ' + x.join(', ').toLowerCase() + '.' : '.');
  }

  function render() {
    var k = kleurInfo();
    var st = STIJLEN[state.stijl];
    var naam = state.naam.trim();
    var toonNaam = naam || 'Jouw bedrijf';
    var slug = (naam || 'jouwbedrijf').toLowerCase().replace(/[^a-z0-9]+/g, '') || 'jouwbedrijf';
    var titels = {
      'Bedrijfswebsite': 'Welkom bij ' + toonNaam,
      'Webshop': 'Shop online bij ' + toonNaam,
      'Portfolio': 'Het werk van ' + toonNaam,
      'Landingspagina': toonNaam + ': jouw aanbod'
    };
    var knoppen = { 'Bedrijfswebsite': 'Neem contact op', 'Webshop': 'Bekijk de producten', 'Portfolio': 'Bekijk mijn werk', 'Landingspagina': 'Meld je aan' };
    var isShop = state.type === 'Webshop' || state.paginas['Webshop'];
    var blokken = isShop
      ? [['Product 1', '€ 0,00'], ['Product 2', '€ 0,00'], ['Product 3', '€ 0,00']]
      : state.type === 'Portfolio'
        ? [['Project 1', 'Korte omschrijving'], ['Project 2', 'Korte omschrijving'], ['Project 3', 'Korte omschrijving']]
        : [['Dienst 1', 'Korte uitleg'], ['Dienst 2', 'Korte uitleg'], ['Dienst 3', 'Korte uitleg']];
    var r = st.r;
    var p = {
      wrap: 'font-family: ' + st.font + ';',
      header: 'background: ' + k.bg + '; color: #FFFFFF; padding: 14px 24px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;',
      logo: 'font-weight: ' + st.weight + '; font-size: 17px;',
      hero: 'background: ' + k.bg + '; color: #FFFFFF; padding: 36px 24px 44px; border-top: 1px solid rgba(255,255,255,0.15);',
      title: 'margin: 0; font-size: 30px; line-height: 1.1; font-weight: ' + st.weight + ';',
      button: 'display: inline-block; margin-top: 20px; background: ' + k.accent + '; color: ' + k.accentText + '; font-family: Inter, system-ui, sans-serif; font-size: 13px; font-weight: 600; padding: 10px 16px; border-radius: ' + r + 'px;',
      card: 'background: ' + k.tint + '; border-radius: ' + r + 'px; padding: 12px;',
      cardImg: 'height: 64px; background: rgba(18,23,43,0.10); border-radius: ' + Math.max(0, r - 4) + 'px;',
      footer: 'background: ' + k.bg + '; color: rgba(255,255,255,0.8); font-size: 12px; padding: 12px 24px;'
    };

    DE.list('types', ['Bedrijfswebsite', 'Webshop', 'Portfolio', 'Landingspagina'], function (t) {
      return knop(t, t === state.type, function () { set({ type: t }); });
    });
    DE.list('stijlen', ['Strak', 'Speels', 'Zakelijk'], function (t) {
      return knop(t, t === state.stijl, function () { set({ stijl: t }); });
    });
    DE.list('kleuren', KLEUREN, function (c) {
      var swatch = DE.h('span', { 'aria-hidden': 'true', style: 'width: 18px; height: 18px; border-radius: 50%; background: ' + c.bg + '; box-shadow: inset 0 0 0 2px ' + c.accent + ';' });
      return knop(c.label, c.id === state.kleur, function () { set({ kleur: c.id }); }, swatch);
    });
    ['paginas', 'extras'].forEach(function (key) {
      DE.list(key, Object.keys(state[key]), function (label) {
        return knop(label, !!state[key][label], function () {
          var o = Object.assign({}, state[key]);
          o[label] = !o[label];
          var patch = {}; patch[key] = o;
          set(patch);
        });
      });
    });
    DE.list('gekozenPaginas', gekozen(state.paginas), function (g) { return DE.h('span', { text: g }); });
    DE.list('blokken', blokken, function (b) {
      return DE.h('div', { style: p.card },
        DE.h('div', { style: p.cardImg }),
        DE.h('p', { style: 'margin: 10px 0 0; font-size: 13px; font-weight: 600; color: #12172B', text: b[0] }),
        DE.h('p', { style: 'margin: 4px 0 0; font-size: 12px; color: #4A5068', text: b[1] }));
    });

    DE.bind({
      p: p,
      domein: 'www.' + slug + '.nl',
      toonNaam: toonNaam,
      heroTitel: titels[state.type],
      knopTekst: knoppen[state.type],
      samenvatting: samenvatting(),
      isKiezen: state.stap === 'kiezen',
      isVersturen: state.stap === 'versturen',
      isKlaar: state.stap === 'klaar'
    });
  }

  document.getElementById('wb-naam').addEventListener('input', function (e) {
    state.naam = e.target.value;
    render();
  });
  document.querySelectorAll('[data-action="naarVersturen"]').forEach(function (b) {
    b.addEventListener('click', function () {
      set({ stap: 'versturen' });
      var f = document.getElementById('wb-contact');
      if (f) f.focus();
    });
  });
  document.querySelectorAll('[data-action="terug"]').forEach(function (b) {
    b.addEventListener('click', function () { set({ stap: 'kiezen' }); });
  });

  var form = document.querySelector('form[data-submit="verstuur"]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    DE.clearError(form);
    var data = {
      bedrijf: state.naam.trim(),
      naam: document.getElementById('wb-contact').value.trim(),
      email: document.getElementById('wb-email').value.trim(),
      bericht: document.getElementById('wb-extra').value.trim(),
      keuzes: {
        type: state.type,
        kleur: kleurInfo().label,
        stijl: state.stijl,
        paginas: gekozen(state.paginas),
        hulp: gekozen(state.extras),
        samenvatting: samenvatting()
      },
      website: DE.honeypot(form)
    };
    DE.busy(form, true);
    DE.send('bouwer', data).then(function () {
      set({ stap: 'klaar' });
    }).catch(function () {
      DE.busy(form, false);
      DE.error(form);
    });
  });

  render();
})();
