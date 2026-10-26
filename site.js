/* Deekman Enterprises — gedeelde code voor alle pagina's */
(function () {
  var C = window.DE_CONFIG || {};

  function get(obj, path) {
    return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, obj);
  }

  var DE = {
    config: C,

    // Vult [data-bind], [data-style] en [data-if] in met waarden
    bind: function (vals) {
      document.querySelectorAll('[data-bind]').forEach(function (el) {
        var v = get(vals, el.dataset.bind);
        if (v !== undefined) el.textContent = v;
      });
      document.querySelectorAll('[data-style]').forEach(function (el) {
        var v = get(vals, el.dataset.style);
        if (v !== undefined) el.setAttribute('style', v);
      });
      document.querySelectorAll('[data-if]').forEach(function (el) {
        var v = get(vals, el.dataset.if);
        if (v !== undefined) el.style.display = v ? 'contents' : 'none';
      });
    },

    // Vervangt de inhoud van een [data-list] door nieuwe elementen
    list: function (name, items, make) {
      var el = document.querySelector('[data-list="' + name + '"]');
      if (!el) return;
      while (el.firstChild) el.removeChild(el.firstChild);
      items.forEach(function (it, i) { el.appendChild(make(it, i)); });
    },

    // Klein hulpje om elementen te maken
    h: function (tag, attrs) {
      var el = document.createElement(tag);
      Object.keys(attrs || {}).forEach(function (k) {
        var v = attrs[k];
        if (k === 'text') el.textContent = v;
        else if (k === 'onclick') el.addEventListener('click', v);
        else if (v !== false && v != null) el.setAttribute(k, v === true ? 'true' : v);
      });
      for (var i = 2; i < arguments.length; i++) {
        var c = arguments[i];
        if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
      return el;
    },

    // Verstuurt een formulier naar de Supabase Edge Function
    send: function (type, data) {
      if (!C.FORM_URL) return Promise.reject(new Error('no_url'));
      return fetch(C.FORM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ type: type }, data))
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || !j.ok) throw new Error(j.error || ('http_' + r.status));
          return j;
        });
      });
    },

    honeypot: function (form) {
      var f = form.querySelector('input[name="website"]');
      return f ? f.value : '';
    },

    // Knop op "bezig" zetten tijdens het versturen
    busy: function (form, on, label) {
      var b = form.querySelector('button[type="submit"]');
      if (!b) return;
      if (on) { b.dataset.label = b.textContent; b.textContent = label || 'Versturen…'; b.disabled = true; }
      else { b.textContent = b.dataset.label || b.textContent; b.disabled = false; }
    },

    // Foutmelding onder een formulier
    error: function (form, msg) {
      var p = form.querySelector('.form-error');
      if (!p) {
        p = DE.h('p', { class: 'form-error', role: 'alert' });
        form.appendChild(p);
      }
      p.textContent = msg || 'Versturen is niet gelukt. Probeer het opnieuw of mail ons via info@deekmanenterprises.com.';
    },

    clearError: function (form) {
      var p = form.querySelector('.form-error');
      if (p) p.remove();
    }
  };

  window.DE = DE;

  // Live teller: elementen met data-teller="checks" tonen het echte aantal uit de database.
  // Het blok (.teller-blok) blijft verborgen tot er een getal is, en tot het aantal minstens TELLER_MIN is.
  var TELLER_MIN = typeof C.TELLER_MIN === 'number' ? C.TELLER_MIN : 25;
  var tellerWaarde = null;

  function formatteer(n) {
    return Math.round(n).toLocaleString('nl-NL');
  }

  function tel(el, tot) {
    var stil = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var van = Number(el.dataset.getoond || 0);
    if (stil || van === tot) { el.textContent = formatteer(tot); el.dataset.getoond = tot; return; }
    var duur = van === 0 ? 1600 : 600, start = null;
    function stap(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / duur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = formatteer(van + (tot - van) * e);
      if (p < 1) requestAnimationFrame(stap); else el.dataset.getoond = tot;
    }
    requestAnimationFrame(stap);
  }

  function toonTeller(aantal) {
    tellerWaarde = aantal;
    var zichtbaar = aantal >= TELLER_MIN;
    document.querySelectorAll('.teller-blok').forEach(function (b) { b.classList.toggle('zichtbaar', zichtbaar); });
    if (!zichtbaar) return;
    document.querySelectorAll('[data-teller]').forEach(function (el) {
      if (!window.IntersectionObserver || el.dataset.getoond) { tel(el, aantal); return; }
      el.textContent = '0';
      var io = new IntersectionObserver(function (items) {
        if (items.some(function (i) { return i.isIntersecting; })) { io.disconnect(); tel(el, tellerWaarde); }
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  DE.tellerPlusEen = function () {
    if (tellerWaarde !== null) toonTeller(tellerWaarde + 1);
  };

  function laadTeller() {
    if (!C.FORM_URL || !document.querySelector('[data-teller]')) return;
    fetch(C.FORM_URL + '?teller=checks')
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok && typeof j.aantal === 'number') toonTeller(j.aantal); })
      .catch(function () { /* geen teller tonen */ });
  }

  // Inloggen: keuzevenster (zonder JavaScript gaat de knop gewoon naar inloggen.html)
  var INLOG = [
    { groep: 'Voor bedrijven', app: 'Paginapuls', tekst: 'Bekijk hoe je website presteert', url: 'https://paginapuls.deekmanenterprises.com/', kleur: '#2B3A8C', lijn: '#F6F5F1',
      icoon: '<path d="M3 12h4l3-8 4 16 3-8h4"></path>' },
    { groep: 'Voor studenten en docenten', app: 'Leerpuls', tekst: 'Leren met je eigen lesstof en AI', url: 'https://leerpuls.deekmanenterprises.com/', kleur: '#F2C230', lijn: '#12172B',
      icoon: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"></path><path d="M8 7h7"></path>' },
    { groep: 'Voor werknemers', app: 'Werknemersportaal', tekst: 'Je taken, websites en team', url: 'https://app.deekmanenterprises.com/', kleur: '#12172B', lijn: '#F2C230',
      icoon: '<rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>' }
  ];
  var inlogVenster = null, inlogKnop = null;

  function maakInlogVenster() {
    var d = document.createElement('dialog');
    d.className = 'inlog-venster';
    d.setAttribute('aria-labelledby', 'inlog-titel');
    var html = '<div class="inlog-kop"><div><p class="inlog-label">Inloggen</p>' +
      '<h2 id="inlog-titel">Waar wil je inloggen?</h2></div>' +
      '<button type="button" class="inlog-sluit" aria-label="Sluiten"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button></div>' +
      '<ul class="inlog-lijst">';
    INLOG.forEach(function (o) {
      html += '<li><a class="inlog-optie" href="' + o.url + '">' +
        '<span class="inlog-icoon" style="background:' + o.kleur + '"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + o.lijn + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + o.icoon + '</svg></span>' +
        '<span class="inlog-tekst"><span class="inlog-groep">' + o.groep + '</span><span class="inlog-app">' + o.app + '</span><span class="inlog-uitleg">' + o.tekst + '</span></span>' +
        '<span class="inlog-pijl" aria-hidden="true">→</span></a></li>';
    });
    html += '</ul><p class="inlog-voet">Nog geen account? <a href="contact.html">Neem contact op</a>.</p>';
    d.innerHTML = html;
    document.body.appendChild(d);
    d.querySelector('.inlog-sluit').addEventListener('click', function () { d.close(); });
    // Klik naast het venster sluit het
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.addEventListener('close', function () { if (inlogKnop) inlogKnop.focus(); });
    return d;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('a[href="inloggen.html"]').forEach(function (a) {
      if (!window.HTMLDialogElement) return;
      a.setAttribute('aria-haspopup', 'dialog');
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        inlogKnop = a;
        if (!inlogVenster) inlogVenster = maakInlogVenster();
        inlogVenster.showModal();
        var eerste = inlogVenster.querySelector('.inlog-optie');
        if (eerste) eerste.focus();
      });
    });
  });

  // Menuknop op de telefoon
  document.addEventListener('DOMContentLoaded', laadTeller);
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.menu-btn');
    var nav = document.getElementById('hoofdmenu');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Sluit' : 'Menu';
    });
  });
})();
