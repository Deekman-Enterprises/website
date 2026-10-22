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

  // Menuknop op de telefoon
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
