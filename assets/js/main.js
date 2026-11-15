/* ==========================================================================
   ON.IT — script principale
   Header/footer condivisi, animazioni, traduzione, modulo di contatto,
   bacheca news e recensioni.
   ========================================================================== */
(function () {
  "use strict";

  var D = window.ONIT;
  var C = D.contatti;

  /* Invio del modulo: FormSubmit inoltra le richieste via email senza server.
     Alla PRIMA richiesta arriva un'email di attivazione a questo indirizzo. */
  var FORM_ENDPOINT = "https://formsubmit.co/ajax/" + C.email;
  // Le richieste di assistenza vanno all'indirizzo dedicato (anche lui va attivato alla prima richiesta)
  var FORM_ENDPOINT_ASSISTENZA = "https://formsubmit.co/ajax/" + C.emailAssistenza;

  var MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  var page = document.body.getAttribute("data-page");

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function parseDate(s) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  /* ------------------------------------------------------------------------
     Header e footer condivisi
     ------------------------------------------------------------------------ */
  function cur(name) { return page === name ? ' aria-current="page"' : ""; }
  var homeHref = page === "home" ? "#top" : "index.html";
  var bookHref = page === "home" ? "#prenota" : "index.html#prenota";

  var header = el(
    '<header class="site-header" id="header">' +
      '<div class="container" data-nosnippet>' +
        '<a class="brand" href="' + homeHref + '" aria-label="ON.IT — Home"><img src="assets/img/logo-white.png" alt="ON.IT" width="586" height="170"></a>' +
        '<nav class="nav" id="nav" aria-label="Navigazione principale">' +
          '<a href="index.html"' + cur("home") + ">Home</a>" +
          '<a href="news.html"' + cur("news") + ">News</a>" +
          '<a href="recensioni.html"' + cur("recensioni") + ">Recensioni</a>" +
          '<a href="faq.html"' + cur("faq") + ">Domande</a>" +
          '<a href="' + bookHref + '" class="nav-book">Contatti</a>' +
          '<a href="accedi.html"' + (["accedi", "area", "admin"].indexOf(page) > -1 ? ' aria-current="page"' : "") + ">Area clienti</a>" +
          // parte bassa del menu da telefono: contatti e prenotazione
          '<div class="nav-extra">' +
            '<a class="nav-mail" data-href="email" href="#"><span data-contact="email"></span></a>' +
            '<a class="nav-mail" data-href="email-assistenza" href="#"><span data-contact="email-assistenza"></span></a>' +
            '<a class="btn nav-cta" href="' + bookHref + '">Prenota un incontro <span class="arrow">→</span></a>' +
          "</div>" +
        "</nav>" +
        '<div class="header-tools">' +
          '<div class="lang notranslate" title="Traduci il sito">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>' +
            '<button type="button" class="lang-btn" id="langBtn">Lingua</button>' +
            '<div id="google_translate_element"></div>' +
          "</div>" +
          '<a class="btn btn--sm" href="' + bookHref + '">Prenota</a>' +
          '<button class="menu-toggle" id="menuToggle" aria-label="Apri il menu" aria-expanded="false" aria-controls="nav"><span></span><span></span></button>' +
        "</div>" +
      "</div>" +
    "</header>"
  );

  var year = new Date().getFullYear();
  var footer = el(
    '<footer class="site-footer">' +
      '<div class="container">' +
        '<div class="footer-grid footer-grid--4">' +
          "<div>" +
            '<img class="footer-logo" src="assets/img/logo-white.png" alt="ON.IT" width="586" height="170">' +
            "<p>Realizziamo siti web su misura per le attività che vogliono farsi trovare, farsi scegliere e crescere online.</p>" +
          "</div>" +
          "<div>" +
            '<div class="footer-title">Pagine</div>' +
            '<ul class="footer-links">' +
              '<li><a href="index.html">Home</a></li>' +
              '<li><a href="news.html">News</a></li>' +
              '<li><a href="recensioni.html">Recensioni</a></li>' +
              '<li><a href="faq.html">Domande frequenti</a></li>' +
              '<li><a href="' + bookHref + '">Prenota un incontro</a></li>' +
              '<li><a href="accedi.html">Area clienti</a></li>' +
            "</ul>" +
          "</div>" +
          "<div>" +
            '<div class="footer-title">Contatti</div>' +
            '<ul class="footer-links">' +
              (C.telefono ? '<li><a href="tel:' + C.telefonoLink + '">' + esc(C.telefono) + "</a></li>" : "") +
              '<li><a href="mailto:' + C.email + '">' + esc(C.email) + "</a></li>" +
              '<li><a href="mailto:' + C.emailAssistenza + '">Assistenza: ' + esc(C.emailAssistenza) + "</a></li>" +
              "<li>" + esc(C.sede) + "</li>" +
            "</ul>" +
          "</div>" +
          "<div>" +
            '<div class="footer-title">Informazioni legali</div>' +
            '<ul class="footer-links">' +
              '<li><a href="privacy.html">Privacy policy</a></li>' +
              '<li><a href="privacy.html#cookie">Cookie policy</a></li>' +
              '<li><a href="termini.html">Termini e condizioni</a></li>' +
              '<li><button type="button" class="link-btn" data-cookie-open>Preferenze cookie</button></li>' +
              '<li><button type="button" class="link-btn" id="fxToggle"></button></li>' +
            "</ul>" +
          "</div>" +
        "</div>" +
        '<div class="footer-bottom"><span>© ' + year + " ON.IT — Tutti i diritti riservati</span><span>Siti web su misura</span></div>" +
      "</div>" +
    "</footer>"
  );

  document.body.insertBefore(header, document.body.firstChild);
  document.body.insertBefore(el('<div class="progress" id="progress" aria-hidden="true"></div>'), document.body.firstChild);
  // Il sipario compare solo passando da una pagina all'altra: alla prima visita il contenuto è subito visibile
  var fromInternal = false;
  try { fromInternal = sessionStorage.getItem("onit-nav") === "1"; sessionStorage.removeItem("onit-nav"); } catch (e) {}
  var curtain = el('<div data-nosnippet class="page-curtain' + (fromInternal ? "" : " is-skipped") + '" aria-hidden="true"><img src="assets/img/logo-black.png" alt="" width="586" height="170"></div>');
  document.body.insertBefore(curtain, document.body.firstChild);
  document.body.appendChild(footer);
  // Il collegamento "Vai al contenuto" deve restare il primo elemento raggiungibile con il tasto Tab
  var skip = document.querySelector(".skip-link");
  if (skip) document.body.insertBefore(skip.closest("[data-nosnippet]") || skip, document.body.firstChild);
  if (["home", "accedi", "area", "admin"].indexOf(page) === -1) {
    document.body.appendChild(el('<a class="btn fab" href="' + bookHref + '">Prenota un incontro</a>'));
    document.body.classList.add("has-fab");
  }

  /* Senza numero di telefono, rimuove gli elementi che lo riguardano */
  if (!C.telefono) {
    document.querySelectorAll("[data-requires-phone]").forEach(function (n) { n.remove(); });
  }

  /* Riempie i recapiti nelle pagine (elementi con data-contact) */
  document.querySelectorAll("[data-contact]").forEach(function (n) {
    var k = n.getAttribute("data-contact");
    if (k === "telefono") { n.textContent = C.telefono; if (n.tagName === "A") n.href = "tel:" + C.telefonoLink; }
    if (k === "email") { n.textContent = C.email; if (n.tagName === "A") n.href = "mailto:" + C.email; }
    if (k === "email-assistenza") { n.textContent = C.emailAssistenza; if (n.tagName === "A") n.href = "mailto:" + C.emailAssistenza; }
    if (k === "sede") n.textContent = C.sede;
  });
  document.querySelectorAll("[data-href]").forEach(function (n) {
    var k = n.getAttribute("data-href");
    if (k === "telefono") n.href = "tel:" + C.telefonoLink;
    if (k === "email") n.href = "mailto:" + C.email;
    if (k === "email-assistenza") n.href = "mailto:" + C.emailAssistenza;
  });

  /* ------------------------------------------------------------------------
     Menu mobile, header allo scroll, barra di avanzamento
     ------------------------------------------------------------------------ */
  var toggle = document.getElementById("menuToggle");
  // A menu aperto il resto della pagina non deve essere raggiungibile da tastiera o lettori di schermo
  function setInert(on) {
    document.querySelectorAll("main, .site-footer, .fab").forEach(function (n) { n.inert = on; });
  }
  function closeMenu() {
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Apri il menu");
    setInert(false);
  }
  toggle.addEventListener("click", function () {
    // il menu si apre come un cerchio che parte dal pulsante
    var r = toggle.getBoundingClientRect();
    var nav = document.getElementById("nav");
    nav.style.setProperty("--mx", Math.round(r.left + r.width / 2) + "px");
    nav.style.setProperty("--my", Math.round(r.top + r.height / 2) + "px");
    var open = document.body.classList.toggle("menu-open");
    if (window.ONITFX) { window.ONITFX.ripple(r.left + r.width / 2, r.top + r.height / 2, 1); window.ONITFX.pulse(.2); }
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    setInert(open);
  });
  document.querySelectorAll("#nav a").forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  var progress = document.getElementById("progress");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 20);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------------
     Transizioni: sipario d'ingresso/uscita e comparsa allo scroll
     ------------------------------------------------------------------------ */
  var FX_KEY = "onit-animazioni";
  var systemReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reduceMotion = systemReduce || document.documentElement.classList.contains("fx-reduce");

  // Interruttore nel piè di pagina: la scelta resta salvata nel browser
  var fxToggle = document.getElementById("fxToggle");
  fxToggle.textContent = "Animazioni: " + (reduceMotion ? "ridotte" : "attive");
  if (systemReduce) {
    fxToggle.disabled = true;
    fxToggle.title = "Il tuo dispositivo chiede già di ridurre le animazioni";
  }
  fxToggle.addEventListener("click", function () {
    try {
      if (reduceMotion) localStorage.removeItem(FX_KEY); else localStorage.setItem(FX_KEY, "ridotte");
    } catch (e) { return; }
    location.reload();
  });

  requestAnimationFrame(function () { document.body.classList.add("is-loaded"); });
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) document.body.classList.remove("is-leaving");
  });

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a || reduceMotion || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(mailto|tel|https?):/i.test(href)) return;
    var url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    try { sessionStorage.setItem("onit-nav", "1"); } catch (err) {}
    curtain.classList.remove("is-skipped");
    document.body.classList.add("is-leaving");
    setTimeout(function () { location.href = url.href; }, 520);
  });

  var revealObserver = "IntersectionObserver" in window && !reduceMotion
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-visible"); revealObserver.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    : null;
  function observeReveals(root) {
    (root || document).querySelectorAll(".reveal:not(.is-visible)").forEach(function (n) {
      if (revealObserver) revealObserver.observe(n); else n.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------------
     Traduzione automatica (Google Traduttore) — lingua predefinita: italiano
     ------------------------------------------------------------------------ */
  window.googleTranslateElementInit = function () {
    /* global google */
    new google.translate.TranslateElement({ pageLanguage: "it", autoDisplay: false }, "google_translate_element");
    // Rinomina la prima voce del menu a tendina e aggiunge "Italiano" per tornare alla lingua originale
    var tries = 0;
    var iv = setInterval(function () {
      var sel = document.querySelector(".goog-te-combo");
      if (sel && sel.options.length > 1) {
        clearInterval(iv);
        sel.setAttribute("aria-label", "Seleziona la lingua");
        if (sel.options[0]) sel.options[0].textContent = "Lingua";
        if (!sel.querySelector('option[value="it"]')) {
          var it = document.createElement("option");
          it.value = "it"; it.textContent = "Italiano";
          sel.insertBefore(it, sel.options[1]);
        }
        sel.addEventListener("change", function () {
          if (sel.value === "it") resetTranslation();
        });
      } else if (++tries > 50) clearInterval(iv);
    }, 200);
  };
  function resetTranslation() {
    clearTranslateCookies();
    location.reload();
  }
  // Google Traduttore è un servizio di terze parti: si carica solo dopo il consenso ai cookie funzionali
  var langBtn = document.getElementById("langBtn");
  var translateLoaded = false;
  function loadTranslate() {
    if (translateLoaded) return;
    translateLoaded = true;
    langBtn.hidden = true;
    var gt = document.createElement("script");
    gt.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    gt.async = true;
    document.body.appendChild(gt);
  }
  function clearTranslateCookies() {
    var host = location.hostname;
    var exp = "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "googtrans" + exp;
    document.cookie = "googtrans" + exp + "; domain=" + host;
    document.cookie = "googtrans" + exp + "; domain=." + host;
  }

  /* ------------------------------------------------------------------------
     Consenso cookie
     Necessari: sempre attivi (solo la memorizzazione della scelta, nel browser).
     Funzionali: traduzione automatica tramite Google Traduttore.
     ------------------------------------------------------------------------ */
  var CONSENT_KEY = "onit-consenso-cookie";
  var CONSENT_VERSION = 1;
  var CONSENT_DAYS = 180;   // dopo 6 mesi la scelta viene chiesta di nuovo

  function readConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(CONSENT_KEY));
      if (!c || c.v !== CONSENT_VERSION) return null;
      if (!c.data || Date.now() - new Date(c.data).getTime() > CONSENT_DAYS * 864e5) return null;
      return c;
    } catch (e) { return null; }
  }

  var banner = el(
    '<div class="cookie" id="cookieBanner" data-nosnippet role="dialog" aria-labelledby="cookieTitle" aria-describedby="cookieText" hidden>' +
      '<div class="container cookie-inner">' +
        '<div class="cookie-copy">' +
          '<strong class="cookie-title" id="cookieTitle">La tua privacy</strong>' +
          '<p id="cookieText">Usiamo solo cookie tecnici. Con il tuo consenso attiviamo anche la traduzione automatica di Google, che usa cookie di terze parti. Puoi cambiare scelta in ogni momento. <a href="privacy.html#cookie">Cookie policy</a></p>' +
          '<div class="cookie-prefs" id="cookiePrefs" hidden>' +
            '<label class="check"><input type="checkbox" checked disabled> <span><strong>Necessari</strong> — sempre attivi. Memorizzano la tua scelta sui cookie.</span></label>' +
            '<label class="check"><input type="checkbox" id="cookieFunc"> <span><strong>Funzionali</strong> — traduzione del sito in altre lingue (Google Traduttore).</span></label>' +
          "</div>" +
        "</div>" +
        '<div class="cookie-actions">' +
          '<button type="button" class="btn btn--sm" data-cookie="reject">Rifiuta</button>' +
          '<button type="button" class="btn btn--sm" data-cookie="accept">Accetta tutti</button>' +
          '<button type="button" class="btn btn--sm btn--ghost" data-cookie="custom">Personalizza</button>' +
        "</div>" +
        '<button type="button" class="cookie-close" data-cookie="reject" aria-label="Chiudi e rifiuta i cookie non necessari">×</button>' +
      "</div>" +
    "</div>"
  );
  document.body.appendChild(banner);
  var prefs = document.getElementById("cookiePrefs");
  var funcBox = document.getElementById("cookieFunc");
  var customBtn = banner.querySelector('[data-cookie="custom"]');

  function openBanner(showPrefs) {
    var c = readConsent();
    funcBox.checked = !!(c && c.funzionali);
    prefs.hidden = !showPrefs;
    customBtn.textContent = showPrefs ? "Salva scelte" : "Personalizza";
    banner.hidden = false;
    document.body.classList.add("cookie-open");
  }
  function closeBanner() {
    banner.hidden = true;
    document.body.classList.remove("cookie-open");
  }
  function saveConsent(funzionali) {
    var before = readConsent();
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, funzionali: funzionali, data: new Date().toISOString() }));
    } catch (e) { /* archiviazione non disponibile: la scelta vale solo per questa pagina */ }
    closeBanner();
    if (funzionali) loadTranslate();
    else if (translateLoaded || (before && before.funzionali)) {
      // Consenso revocato: rimuove i cookie della traduzione e ricarica la pagina in italiano
      clearTranslateCookies();
      location.reload();
    }
  }

  banner.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cookie]");
    if (!b) return;
    var a = b.getAttribute("data-cookie");
    if (a === "accept") saveConsent(true);
    else if (a === "reject") saveConsent(false);
    else if (a === "custom") {
      if (prefs.hidden) { prefs.hidden = false; customBtn.textContent = "Salva scelte"; funcBox.focus(); }
      else saveConsent(funcBox.checked);
    }
  });
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-cookie-open]")) openBanner(true);
  });
  langBtn.addEventListener("click", function () {
    openBanner(true);
    funcBox.checked = true;
  });

  var consent = readConsent();
  if (!consent) openBanner(false);
  else if (consent.funzionali) loadTranslate();

  /* ------------------------------------------------------------------------
     Pulsante "Mostra password" (pagina Accedi): utile quando il browser
     compila da solo una password vecchia
     ------------------------------------------------------------------------ */
  document.querySelectorAll(".pw-toggle").forEach(function (b) {
    var input = document.getElementById(b.getAttribute("aria-controls"));
    b.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      b.setAttribute("aria-pressed", String(show));
    });
  });

  /* ------------------------------------------------------------------------
     Modulo di prenotazione
     ------------------------------------------------------------------------ */
  var form = document.getElementById("bookingForm");
  if (form) {
    var status = document.getElementById("formStatus");
    var tipoParam = new URLSearchParams(location.search).get("tipo");
    var pianoParam = new URLSearchParams(location.search).get("piano");

    // Preseleziona il motivo della richiesta dalle schede o dai piani
    function setTipo(v) {
      var r = form.querySelector('input[name="tipo"][value="' + v + '"]');
      if (r) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); }
    }
    function setPiano(v) {
      var s = form.querySelector('select[name="piano"]');
      if (s && s.querySelector('option[value="' + v + '"]')) s.value = v;
    }
    if (tipoParam) setTipo(tipoParam);
    if (pianoParam) setPiano(pianoParam);
    document.querySelectorAll("[data-tipo]").forEach(function (a) {
      a.addEventListener("click", function () {
        setTipo(a.getAttribute("data-tipo"));
        if (a.hasAttribute("data-piano")) setPiano(a.getAttribute("data-piano"));
      });
    });

    // Il campo "data" non accetta giorni passati
    var dateInput = form.querySelector('input[name="data"]');
    if (dateInput) {
      var t = new Date();
      dateInput.min = t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
    }

    // Ogni motivo mostra solo i campi che servono: quelli nascosti vengono disattivati
    // e non finiscono nel messaggio. Il telefono serve solo se l'incontro è una telefonata.
    var tel = form.querySelector('input[name="telefono"]');
    var telNota = document.getElementById("telefonoNota");
    var modalita = form.querySelector('select[name="modalita"]');
    function syncTipo() {
      var v = (form.querySelector('input[name="tipo"]:checked') || {}).value;
      form.querySelectorAll("[data-for]").forEach(function (box) {
        box.hidden = box.getAttribute("data-for").split(" ").indexOf(v) === -1;
      });
      form.querySelectorAll("input, select, textarea").forEach(function (c) {
        if (c.name !== "tipo" && c.name !== "_honey") c.disabled = !!c.closest("[data-for][hidden]");
      });
      var perTelefono = v === "incontro" && modalita.value === "Telefonata";
      tel.required = perTelefono;
      telNota.textContent = perTelefono ? "*" : "(facoltativo)";
      telNota.className = perTelefono ? "req" : "opt";
    }
    form.addEventListener("change", function (e) {
      if (e.target.name === "tipo" || e.target.name === "modalita") syncTipo();
    });
    syncTipo();

    function showStatus(msg, isError) {
      status.textContent = msg;
      status.classList.add("is-visible");
      status.classList.toggle("is-error", !!isError);
    }

    // Messaggi d'errore campo per campo, letti anche dai lettori di schermo
    var ERRORI = {
      nome: { valueMissing: "Scrivi nome e cognome." },
      email: { valueMissing: "Scrivi la tua email.", typeMismatch: "Controlla l'email: deve essere come nome@email.it." },
      telefono: { valueMissing: "Scrivi il numero a cui chiamarti.", patternMismatch: "Controlla il numero: usa solo cifre, spazi e il segno +." },
      privacy: { valueMissing: "Per inviare la richiesta devi accettare l'informativa privacy." }
    };
    function setError(c, msg) {
      var box = document.getElementById("err-" + c.id);
      var f = c.closest(".field");
      if (f) f.classList.toggle("is-invalid", !!msg);
      if (msg) { c.setAttribute("aria-invalid", "true"); c.setAttribute("aria-describedby", box.id); }
      else { c.removeAttribute("aria-invalid"); c.removeAttribute("aria-describedby"); }
      box.textContent = msg || "";
      box.hidden = !msg;
    }
    function messageFor(c) {
      if (c.disabled || c.validity.valid) return "";
      var m = ERRORI[c.name] || {};
      for (var k in m) if (c.validity[k]) return m[k];
      return "Controlla questo campo.";
    }
    function validate() {
      var first = null;
      Object.keys(ERRORI).forEach(function (name) {
        var c = form.elements[name], msg = messageFor(c);
        setError(c, msg);
        if (msg && !first) first = c;
      });
      return first;
    }
    // L'errore sparisce appena il campo viene corretto
    form.addEventListener("input", function (e) {
      if (ERRORI[e.target.name] && e.target.hasAttribute("aria-invalid") && !messageFor(e.target)) setError(e.target, "");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector('input[name="_honey"]').value) return;
      var invalid = validate();
      if (invalid) {
        showStatus("Controlla i campi evidenziati: alcuni dati mancano o non sono corretti.", true);
        invalid.focus();
        return;
      }

      var fd = new FormData(form);
      var tipoLabel = { acquisto: "Richiesta di preventivo", incontro: "Incontro", assistenza: "Assistenza" }[fd.get("tipo")] || fd.get("tipo");
      var payload = {
        _subject: "Nuova richiesta dal sito ON.IT — " + tipoLabel,
        _template: "table",
        _captcha: "false",
        "Motivo": tipoLabel,
        _replyto: fd.get("email")
      };
      // Solo i campi visibili e compilati entrano nel messaggio
      [["Nome e cognome", "nome"], ["Email", "email"], ["Attività", "attivita"], ["Piano di interesse", "piano"],
       ["Data preferita", "data"], ["Orario preferito", "orario"], ["Modalità", "modalita"], ["Telefono", "telefono"],
       ["Messaggio", "messaggio"]].forEach(function (p) {
        var v = fd.get(p[1]);
        if (v) payload[p[0]] = v;
      });

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      var label = btn.querySelector(".label");
      var old = label.textContent;
      label.textContent = "Invio in corso…";

      var assistenza = fd.get("tipo") === "assistenza";
      var destinatario = assistenza ? C.emailAssistenza : C.email;
      fetch(assistenza ? FORM_ENDPOINT_ASSISTENZA : FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || String(j.success) === "false") throw new Error(j.message); }); })
        .then(function () {
          form.reset();
          syncTipo();
          document.dispatchEvent(new CustomEvent("onit:form-success", { detail: { button: btn } }));
          showStatus("Grazie! Abbiamo ricevuto la tua richiesta. Ti rispondiamo entro 24 ore lavorative.");
        })
        .catch(function () {
          // Se l'invio automatico non riesce, apre il programma di posta con i dati già compilati
          var body = Object.keys(payload).filter(function (k) { return k.charAt(0) !== "_"; })
            .map(function (k) { return k + ": " + payload[k]; }).join("\n");
          showStatus("Non è stato possibile inviare la richiesta automaticamente. Si aprirà la tua email con i dati già compilati" + (C.telefono ? ": in alternativa chiamaci al " + C.telefono : "") + ".", true);
          location.href = "mailto:" + destinatario + "?subject=" + encodeURIComponent(payload._subject) + "&body=" + encodeURIComponent(body);
        })
        .then(function () { btn.disabled = false; label.textContent = old; });
    });
  }

  /* ------------------------------------------------------------------------
     Bacheca News
     ------------------------------------------------------------------------ */
  var CATEGORIE = {
    "lancio": "Lancio",
    "nuova-sezione": "Nuova sezione",
    "aggiornamento": "Aggiornamento",
    "correzione": "Correzione"
  };

  var board = document.getElementById("newsBoard");
  if (board) {
    var news = D.news.slice().sort(function (a, b) { return parseDate(b.data) - parseDate(a.data); });
    var toolbar = document.getElementById("newsFilters");

    function renderNews(cat) {
      var list = cat === "tutte" ? news : news.filter(function (n) { return n.categoria === cat; });
      board.innerHTML = "";
      if (!list.length) { board.appendChild(el('<p class="empty">Nessuna novità in questa categoria.</p>')); return; }
      list.forEach(function (n, i) {
        var d = parseDate(n.data);
        var punti = n.punti ? "<ul>" + n.punti.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" : "";
        board.appendChild(el(
          '<article class="news-item reveal" data-delay="' + Math.min(i, 3) + '">' +
            '<time class="news-date" datetime="' + esc(n.data) + '"><span class="day">' + String(d.getDate()).padStart(2, "0") + '</span><span class="month">' + MESI[d.getMonth()] + " " + d.getFullYear() + "</span></time>" +
            '<div class="news-body">' +
              '<span class="tag' + (i === 0 && cat === "tutte" ? " tag--solid" : "") + '">' + esc(CATEGORIE[n.categoria] || n.categoria) + "</span>" +
              "<h3>" + esc(n.titolo) + "</h3>" +
              "<p>" + esc(n.testo) + "</p>" + punti +
            "</div>" +
          "</article>"
        ));
      });
      observeReveals(board);
    }

    var cats = ["tutte"].concat(Object.keys(CATEGORIE).filter(function (c) { return news.some(function (n) { return n.categoria === c; }); }));
    cats.forEach(function (c, i) {
      var b = el('<button type="button" class="filter-btn" aria-pressed="' + (i === 0) + '">' + (c === "tutte" ? "Tutte" : CATEGORIE[c]) + "</button>");
      b.addEventListener("click", function () {
        toolbar.querySelectorAll(".filter-btn").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        renderNews(c);
      });
      toolbar.appendChild(b);
    });
    var count = document.getElementById("newsCount");
    if (count) count.textContent = news.length;
    var last = document.getElementById("newsLast");
    if (last && news[0]) { var ld = parseDate(news[0].data); last.textContent = ld.getDate() + " " + MESI[ld.getMonth()] + " " + ld.getFullYear(); }
    renderNews("tutte");
  }

  /* ------------------------------------------------------------------------
     Recensioni per piano
     ------------------------------------------------------------------------ */
  var reviewsGrid = document.getElementById("reviewsGrid");
  if (reviewsGrid) {
    var reviews = D.recensioni.slice().sort(function (a, b) { return parseDate(b.data) - parseDate(a.data); });
    var piani = {};
    D.piani.forEach(function (p) { piani[p.id] = p; });
    var rToolbar = document.getElementById("reviewFilters");
    var star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 18.1 5.6 21.6 7 14.5 1.7 9.5l7.2-.9z"/></svg>';
    var starEmpty = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 18.1 5.6 21.6 7 14.5 1.7 9.5l7.2-.9z"/></svg>';

    function avg(list) {
      if (!list.length) return "–";
      return (list.reduce(function (s, r) { return s + r.voto; }, 0) / list.length).toFixed(1).replace(".", ",");
    }

    // Nessuna recensione ancora: mostra la schermata "la prima recensione" al posto di medie e filtri
    if (!reviews.length) {
      document.getElementById("firstReview").hidden = false;
      document.getElementById("reviewsSummary").hidden = true;
      rToolbar.hidden = true;
      reviewsGrid.hidden = true;
    }

    // Riepilogo: media generale e per ciascun piano
    var summary = document.getElementById("reviewsSummary");
    summary.appendChild(el('<div class="summary-cell"><small>Tutti i piani</small><strong>' + avg(reviews) + '</strong> <span>/ 5 · ' + reviews.length + " recensioni</span></div>"));
    D.piani.forEach(function (p) {
      var l = reviews.filter(function (r) { return r.piano === p.id; });
      summary.appendChild(el('<div class="summary-cell"><small>Piano ' + esc(p.nome) + "</small><strong>" + avg(l) + "</strong> <span>/ 5 · " + l.length + " recensioni</span></div>"));
    });

    function renderReviews(pid) {
      var list = pid === "tutti" ? reviews : reviews.filter(function (r) { return r.piano === pid; });
      reviewsGrid.innerHTML = "";
      if (!list.length) { reviewsGrid.appendChild(el('<p class="empty">Ancora nessuna recensione per questo piano.</p>')); return; }
      list.forEach(function (r, i) {
        var stars = "";
        for (var s = 1; s <= 5; s++) stars += s <= r.voto ? star : starEmpty;
        var initials = r.nome.split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
        var d = parseDate(r.data);
        var p = piani[r.piano] || { nome: r.piano };
        reviewsGrid.appendChild(el(
          '<article class="review reveal" data-delay="' + (i % 3) + '">' +
            '<div class="review-top"><span class="stars" role="img" aria-label="' + r.voto + ' stelle su 5">' + stars + '</span><span class="tag">Piano ' + esc(p.nome) + "</span></div>" +
            "<blockquote>" + esc(r.testo) + "</blockquote>" +
            '<div class="review-author"><span class="avatar">' + esc(initials) + "</span><div><strong>" + esc(r.nome) + "</strong><span>" + esc(r.attivita) + " · " + MESI[d.getMonth()] + " " + d.getFullYear() + "</span></div></div>" +
          "</article>"
        ));
      });
      observeReveals(reviewsGrid);
    }

    [{ id: "tutti", nome: "Tutti i piani" }].concat(D.piani).forEach(function (p, i) {
      var b = el('<button type="button" class="filter-btn" aria-pressed="' + (i === 0) + '">' + esc(p.id === "tutti" ? p.nome : "Piano " + p.nome) + "</button>");
      b.addEventListener("click", function () {
        rToolbar.querySelectorAll(".filter-btn").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        renderReviews(p.id);
      });
      rToolbar.appendChild(b);
    });
    renderReviews("tutti");
  }

  /* ------------------------------------------------------------------------
     Domande frequenti: blocco in Home e pagina con ricerca e filtri.
     I testi sono in data.js (ONIT.faq).
     ------------------------------------------------------------------------ */
  var F = D.faq;
  function faqAnswer(a) {
    return a.split("{email}").join('<a href="mailto:' + C.email + '">' + esc(C.email) + "</a>")
      .split("{assistenza}").join('<a href="mailto:' + C.emailAssistenza + '">' + esc(C.emailAssistenza) + "</a>");
  }
  function faqPlain(a) { return faqAnswer(a).replace(/<[^>]+>/g, ""); }
  function faqItem(v) {
    return '<article class="faq-item" id="faq-' + v.id + '" data-cat="' + v.cat + '">' +
      '<h3><button type="button" class="faq-q" aria-expanded="false" aria-controls="faq-a-' + v.id + '">' +
        "<span>" + esc(v.q) + '</span><span class="faq-plus" aria-hidden="true">+</span></button></h3>' +
      '<div class="faq-a" id="faq-a-' + v.id + '" hidden><p>' + faqAnswer(v.a) + "</p></div>" +
    "</article>";
  }
  function faqToggle(item, open) {
    item.querySelector(".faq-q").setAttribute("aria-expanded", String(open));
    item.querySelector(".faq-a").hidden = !open;
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".faq-q");
    if (!b) return;
    var item = b.closest(".faq-item"), open = b.getAttribute("aria-expanded") !== "true";
    faqToggle(item, open);
    // Nella pagina Domande l'indirizzo segue la risposta aperta: così il collegamento si può copiare
    if (open && page === "faq" && history.replaceState) history.replaceState(null, "", "#" + item.id);
  });

  var faqHome = document.getElementById("faqHome");
  if (faqHome) faqHome.innerHTML = F.voci.filter(function (v) { return v.home; }).map(faqItem).join("");

  var faqList = document.getElementById("faqList");
  if (faqList) {
    // La ricerca ignora maiuscole e accenti: "Garanzìa" trova "garanzia"
    var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var faqText = {};
    F.voci.forEach(function (v) { faqText[v.id] = norm(v.q + " " + faqPlain(v.a)); });

    faqList.innerHTML = F.categorie.map(function (c) {
      return '<section class="faq-group" data-cat="' + c.id + '"><h2 class="faq-cat">' + esc(c.nome) + "</h2>" +
        F.voci.filter(function (v) { return v.cat === c.id; }).map(faqItem).join("") + "</section>";
    }).join("");

    var faqCats = document.getElementById("faqCats");
    var faqSearch = document.getElementById("faqSearch");
    var faqCount = document.getElementById("faqCount");
    var faqEmpty = document.getElementById("faqEmpty");
    var faqCat = "tutte";
    faqCats.innerHTML = [{ id: "tutte", nome: "Tutte" }].concat(F.categorie).map(function (c) {
      return '<button type="button" class="filter-btn" data-cat="' + c.id + '" aria-pressed="' + (c.id === "tutte") + '">' + esc(c.nome) + "</button>";
    }).join("");

    function faqFilter() {
      var words = norm(faqSearch.value).split(/\s+/).filter(Boolean), n = 0;
      F.voci.forEach(function (v) {
        var ok = (faqCat === "tutte" || v.cat === faqCat) && words.every(function (w) { return faqText[v.id].indexOf(w) > -1; });
        document.getElementById("faq-" + v.id).hidden = !ok;
        if (ok) n++;
      });
      faqList.querySelectorAll(".faq-group").forEach(function (g) { g.hidden = !g.querySelector(".faq-item:not([hidden])"); });
      faqCount.textContent = n === 1 ? "1 risposta" : n + " risposte";
      faqEmpty.hidden = n > 0;
    }
    function faqSetCat(id) {
      faqCat = id;
      faqCats.querySelectorAll("[data-cat]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-cat") === id)); });
      faqFilter();
    }
    faqCats.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cat]");
      if (b) faqSetCat(b.getAttribute("data-cat"));
    });
    faqSearch.addEventListener("input", faqFilter);
    faqFilter();

    // Collegamento diretto (faq.html#faq-garanzia): apre la risposta e la porta in vista
    function faqFromHash() {
      var item = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
      if (!item || !item.classList.contains("faq-item")) return;
      faqSearch.value = "";
      faqSetCat("tutte");
      faqToggle(item, true);
      item.scrollIntoView({ block: "start", behavior: "auto" });
    }
    faqFromHash();
    window.addEventListener("hashchange", faqFromHash);

    // Dati strutturati per i motori di ricerca
    var faqLd = document.createElement("script");
    faqLd.type = "application/ld+json";
    faqLd.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: F.voci.map(function (v) {
        return { "@type": "Question", name: v.q, acceptedAnswer: { "@type": "Answer", text: faqPlain(v.a) } };
      })
    });
    document.head.appendChild(faqLd);
  }

  /* ------------------------------------------------------------------------
     Piani: menu "Cosa include", voci espandibili e prezzi animati
     ------------------------------------------------------------------------ */
  var pricing = document.querySelector(".pricing");
  if (pricing) {
    // ordine di entrata delle voci nei menu "Cosa include"
    pricing.querySelectorAll(".price-drop-inner").forEach(function (box) {
      box.querySelectorAll(".svc-group, .svc").forEach(function (n, i) { n.style.setProperty("--i", i); });
    });
    pricing.addEventListener("click", function (e) {
      var drop = e.target.closest(".price-drop-btn");
      if (drop) {
        var open = drop.getAttribute("aria-expanded") !== "true";
        drop.setAttribute("aria-expanded", String(open));
        document.getElementById(drop.getAttribute("aria-controls")).classList.toggle("is-open", open);
        return;
      }
      var svc = e.target.closest(".svc-btn");
      if (svc) {
        var item = svc.closest(".svc");
        var isOpen = !item.classList.contains("is-open");
        item.classList.toggle("is-open", isOpen);
        svc.setAttribute("aria-expanded", String(isOpen));
      }
    });

    // I prezzi sono già scritti nella pagina; quando la sezione compare "contano" fino al valore
    if (!reduceMotion && "IntersectionObserver" in window) {
      var countObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          countObs.unobserve(en.target);
          var el = en.target, to = +el.getAttribute("data-count"), t0 = performance.now();
          (function step(t) {
            var k = Math.min(1, (t - t0) / 900);
            el.textContent = Math.round(to * (0.5 + 0.5 * (1 - Math.pow(1 - k, 3)))) + "\u00a0€";
            if (k < 1) requestAnimationFrame(step);
          })(t0);
        });
      }, { threshold: 0.6 });
      pricing.querySelectorAll("[data-count]").forEach(function (n) { countObs.observe(n); });
    }
  }

  // Confronto tra i piani: chiuso finché non lo si chiede
  var cmpToggle = document.querySelector(".cmp-toggle");
  if (cmpToggle) {
    cmpToggle.addEventListener("click", function () {
      var open = cmpToggle.getAttribute("aria-expanded") !== "true";
      cmpToggle.setAttribute("aria-expanded", String(open));
      document.getElementById(cmpToggle.getAttribute("aria-controls")).hidden = !open;
    });
  }

  observeReveals();
})();
