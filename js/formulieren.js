/* Contactformulier (contact.html) en aanmelden voor updates (binnenkort.html) */
(function () {
  var form = document.querySelector('form[data-submit="submit"]');
  if (!form) return;
  var soort = form.dataset.soort; // 'contact' of 'updates'

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    DE.clearError(form);
    var data = soort === 'contact'
      ? { naam: val('c-naam'), bedrijf: val('c-bedrijf'), email: val('c-email'), onderwerp: val('c-onderwerp'), bericht: val('c-bericht') }
      : { email: val('nieuws-email') };
    data.website = DE.honeypot(form);
    DE.busy(form, true);
    DE.send(soort, data).then(function () {
      DE.bind({ sent: true, notSent: false });
    }).catch(function () {
      DE.busy(form, false);
      DE.error(form);
    });
  });
})();
