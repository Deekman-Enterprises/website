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
