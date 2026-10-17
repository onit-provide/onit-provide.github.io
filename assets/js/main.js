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
      '<div class="container">' +
        '<a class="brand" href="' + homeHref + '" aria-label="ON.IT — Home"><img src="assets/img/logo-white.png" alt="ON.IT" width="586" height="170"></a>' +
        '<nav class="nav" id="nav" aria-label="Navigazione principale">' +
          '<a href="index.html"' + cur("home") + ">Home</a>" +
          '<a href="news.html"' + cur("news") + ">News</a>" +
          '<a href="recensioni.html"' + cur("recensioni") + ">Recensioni</a>" +
          '<a href="' + bookHref + '" class="nav-book">Contatti</a>' +
        "</nav>" +
        '<div class="header-tools">' +
          '<div class="lang notranslate" title="Traduci il sito">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>' +
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
        '<div class="footer-grid">' +
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
              '<li><a href="' + bookHref + '">Prenota un incontro</a></li>' +
            "</ul>" +
          "</div>" +
          "<div>" +
            '<div class="footer-title">Contatti</div>' +
            '<ul class="footer-links">' +
              '<li><a href="tel:' + C.telefonoLink + '">' + esc(C.telefono) + "</a></li>" +
              '<li><a href="mailto:' + C.email + '">' + esc(C.email) + "</a></li>" +
              "<li>" + esc(C.sede) + "</li>" +
            "</ul>" +
          "</div>" +
        "</div>" +
        '<div class="footer-bottom"><span>© ' + year + " ON.IT — Tutti i diritti riservati</span><span>Siti web su misura</span></div>" +
      "</div>" +
    "</footer>"
  );

  document.body.insertBefore(header, document.body.firstChild);
  document.body.insertBefore(el('<div class="progress" id="progress" aria-hidden="true"></div>'), document.body.firstChild);
  document.body.insertBefore(el('<div class="page-curtain" aria-hidden="true"><img src="assets/img/logo-black.png" alt=""></div>'), document.body.firstChild);
  document.body.appendChild(footer);
  if (page !== "home") {
    document.body.appendChild(el('<a class="btn fab" href="' + bookHref + '">Prenota un incontro</a>'));
  }

  /* Riempie i recapiti nelle pagine (elementi con data-contact) */
  document.querySelectorAll("[data-contact]").forEach(function (n) {
    var k = n.getAttribute("data-contact");
    if (k === "telefono") { n.textContent = C.telefono; if (n.tagName === "A") n.href = "tel:" + C.telefonoLink; }
    if (k === "email") { n.textContent = C.email; if (n.tagName === "A") n.href = "mailto:" + C.email; }
    if (k === "sede") n.textContent = C.sede;
  });
  document.querySelectorAll("[data-href]").forEach(function (n) {
    var k = n.getAttribute("data-href");
    if (k === "telefono") n.href = "tel:" + C.telefonoLink;
    if (k === "email") n.href = "mailto:" + C.email;
  });

  /* ------------------------------------------------------------------------
     Menu mobile, header allo scroll, barra di avanzamento
     ------------------------------------------------------------------------ */
  var toggle = document.getElementById("menuToggle");
  function closeMenu() {
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Apri il menu");
  }
  toggle.addEventListener("click", function () {
    var open = document.body.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
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
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    var host = location.hostname;
    var exp = "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "googtrans" + exp;
    document.cookie = "googtrans" + exp + "; domain=" + host;
    document.cookie = "googtrans" + exp + "; domain=." + host;
    location.reload();
  }
  var gt = document.createElement("script");
  gt.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  gt.async = true;
  document.body.appendChild(gt);

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

    // Mostra i campi della data solo per gli incontri
    var meetingFields = document.getElementById("meetingFields");
    function syncTipo() {
      var v = (form.querySelector('input[name="tipo"]:checked') || {}).value;
      if (meetingFields) meetingFields.hidden = v === "assistenza";
    }
    form.addEventListener("change", function (e) { if (e.target.name === "tipo") syncTipo(); });
    syncTipo();

    function showStatus(msg, isError) {
      status.textContent = msg;
      status.classList.add("is-visible");
      status.classList.toggle("is-error", !!isError);
    }

    function validate() {
      var ok = true;
      form.querySelectorAll(".field").forEach(function (f) { f.classList.remove("is-invalid"); });
      form.querySelectorAll("[required]").forEach(function (inp) {
        if (inp.closest("[hidden]")) return;
        if (!inp.checkValidity()) {
          ok = false;
          var f = inp.closest(".field");
          if (f) f.classList.add("is-invalid");
        }
      });
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.querySelector('input[name="_honey"]').value) return;
      if (!validate()) {
        showStatus("Controlla i campi evidenziati: alcuni dati mancano o non sono corretti.", true);
        var first = form.querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea");
        if (first) first.focus();
        return;
      }

      var fd = new FormData(form);
      var tipoLabel = { acquisto: "Acquisto del servizio", incontro: "Incontro", assistenza: "Assistenza" }[fd.get("tipo")] || fd.get("tipo");
      var payload = {
        _subject: "Nuova richiesta dal sito ON.IT — " + tipoLabel,
        _template: "table",
        _captcha: "false",
        "Motivo": tipoLabel,
        "Nome e cognome": fd.get("nome"),
        "Attività": fd.get("attivita") || "-",
        "Email": fd.get("email"),
        "Telefono": fd.get("telefono"),
        "Piano di interesse": fd.get("piano") || "-",
        "Data preferita": meetingFields && meetingFields.hidden ? "-" : (fd.get("data") || "-"),
        "Orario preferito": meetingFields && meetingFields.hidden ? "-" : (fd.get("orario") || "-"),
        "Modalità": meetingFields && meetingFields.hidden ? "-" : (fd.get("modalita") || "-"),
        "Messaggio": fd.get("messaggio") || "-",
        _replyto: fd.get("email")
      };

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      var label = btn.querySelector(".label");
      var old = label.textContent;
      label.textContent = "Invio in corso…";

      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (j) { if (!r.ok || String(j.success) === "false") throw new Error(j.message); }); })
        .then(function () {
          form.reset();
          syncTipo();
          showStatus("Grazie! Abbiamo ricevuto la tua richiesta. Ti ricontatteremo entro 24 ore lavorative per confermare.");
        })
        .catch(function () {
          // Se l'invio automatico non riesce, apre il programma di posta con i dati già compilati
          var body = Object.keys(payload).filter(function (k) { return k.charAt(0) !== "_"; })
            .map(function (k) { return k + ": " + payload[k]; }).join("\n");
          showStatus("Non è stato possibile inviare la richiesta automaticamente. Si aprirà la tua email con i dati già compilati: in alternativa chiamaci al " + C.telefono + ".", true);
          location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent(payload._subject) + "&body=" + encodeURIComponent(body);
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

  /* Ultima novità mostrata in Home */
  var latest = document.getElementById("latestNews");
  if (latest && D.news.length) {
    var n0 = D.news.slice().sort(function (a, b) { return parseDate(b.data) - parseDate(a.data); })[0];
    var d0 = parseDate(n0.data);
    latest.innerHTML = '<span class="tag">' + d0.getDate() + " " + MESI[d0.getMonth()] + " " + d0.getFullYear() + "</span> " + esc(n0.titolo);
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

    if (reviews.some(function (r) { return r.esempio; })) {
      document.getElementById("sampleNote").hidden = false;
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
            '<div class="review-author"><span class="avatar">' + esc(initials) + "</span><div><strong>" + esc(r.nome) + (r.esempio ? " (esempio)" : "") + "</strong><span>" + esc(r.attivita) + " · " + MESI[d.getMonth()] + " " + d.getFullYear() + "</span></div></div>" +
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

  observeReveals();
})();
