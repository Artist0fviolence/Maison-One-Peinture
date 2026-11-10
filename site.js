// Maison One Peinture — site behaviour: 10% offer pop-up + corner tab, cookie banner, Netlify forms.
(function () {
  var OFFER_MS = 10 * 3600 * 1000;               // offer lasts 10 hours from first visit
  var CYCLE_MS = OFFER_MS + 14 * 24 * 3600 * 1000; // then hidden 2 weeks, then a fresh 10 hours
  var POPUP_DELAY_MS = 5000;                     // pop-up appears 5 seconds after the page opens
  var fr = document.documentElement.lang === 'fr';

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  var st = { consent: get('mo_consent'), left: OFFER_MS / 1000, step: 'open', dismissed: false, ready: false };
  var start = Date.now(), done = false;
  try {
    var saved = JSON.parse(get('mo_offer') || 'null');
    if (saved && saved.start) {
      start = saved.start; done = !!saved.done;
      if (Date.now() - start >= CYCLE_MS) { start = Date.now(); done = false; }
    }
  } catch (e) {}
  set('mo_offer', JSON.stringify({ start: start, done: done }));
  if (done) { st.step = 'done'; st.dismissed = true; }

  function pad(n) { return String(n).padStart(2, '0'); }
  function timer() { var s = st.left; return Math.floor(s / 3600) + ':' + pad(Math.floor(s % 3600 / 60)) + ':' + pad(s % 60); }

  function render() {
    var v = {
      showBanner: st.consent === null,
      showOffer: st.ready && !st.dismissed && (st.left > 0 || st.step === 'done'),
      showTimer: st.step !== 'done',
      showForm: st.step === 'open',
      showDone: st.step === 'done',
      showMini: st.dismissed && st.left > 0 && st.step !== 'done'
    };
    document.querySelectorAll('[data-if]').forEach(function (el) { el.style.display = v[el.dataset.if] ? 'contents' : 'none'; });
    document.querySelectorAll('[data-bind="timer"]').forEach(function (el) { el.textContent = timer(); });
    var tab = document.querySelector('.mo-tab');
    if (tab) tab.style.bottom = (st.consent === null ? 200 : 16) + 'px';
  }

  var actions = {
    acceptCookies: function () { st.consent = 'accepted'; set('mo_consent', 'accepted'); },
    refuseCookies: function () { st.consent = 'refused'; set('mo_consent', 'refused'); },
    openCookies: function () { st.consent = null; },
    dismissOffer: function () { st.dismissed = true; },
    reopenOffer: function () { st.dismissed = false; st.ready = true; }
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]');
    if (!b || !actions[b.dataset.action]) return;
    actions[b.dataset.action]();
    render();
    if (b.dataset.goto) { var t = document.getElementById(b.dataset.goto); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
  });

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.dataset.submit) return;
    e.preventDefault();
    var btn = f.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(f)).toString()
    }).catch(function () {}).then(function () {
      if (f.dataset.submit === 'submitOffer') {
        set('mo_offer', JSON.stringify({ start: start, done: true }));
        st.step = 'done';
        render();
      } else {
        f.innerHTML = '<p style="grid-column:1/-1;margin:0;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:32px;line-height:1.2;color:#F7F3EC">' +
          (fr ? 'Merci! Nous avons bien reçu votre demande. Majd vous répond d’ici 15 minutes.'
              : 'Thank you! We got your request. Majd will reply within 15 minutes.') + '</p>';
      }
    });
  });

  function tick() {
    st.left = Math.max(0, Math.round((start + OFFER_MS - Date.now()) / 1000));
    render();
  }
  tick();
  setInterval(tick, 1000);
  setTimeout(function () { st.ready = true; render(); }, POPUP_DELAY_MS);
})();
