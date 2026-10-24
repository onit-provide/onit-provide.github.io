/* ON.IT — Area clienti: I miei piani, Lavori in corso, Progetti completati */
import {
  doc, getDoc, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  db, ready, currentUser, isAdmin, isAdminEmail, logout, esc, dataIt, safeUrl, erroreIt,
  PIANI, STATI_PIANO, FASI, notConfiguredNotice
} from "./account.js";

const root = document.getElementById("areaRoot");

function progress(n) {
  const v = Math.max(0, Math.min(100, Number(n) || 0));
  return '<div class="progress-bar" role="progressbar" aria-valuenow="' + v + '" aria-valuemin="0" aria-valuemax="100" aria-label="Avanzamento">' +
    '<span style="width:' + v + '%"></span></div><div class="progress-label"><strong>' + v + "%</strong> completato</div>";
}

function fasi(fase) {
  const i = FASI.indexOf(fase);
  return '<ol class="phases">' + FASI.map((f, k) =>
    '<li class="' + (k < i ? "is-done" : k === i ? "is-current" : "") + '"' + (k === i ? ' aria-current="step"' : "") + "><span>" + esc(f) + "</span></li>"
  ).join("") + "</ol>";
}

function aggiornamenti(list) {
  if (!Array.isArray(list) || !list.length) return "";
  const items = list.slice().sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 5);
  return '<details class="updates"><summary>Ultimi aggiornamenti (' + list.length + ")</summary><ul>" +
    items.map((u) => "<li><time>" + dataIt(u.data) + "</time> " + esc(u.testo) + "</li>").join("") + "</ul></details>";
}

function renderPiani(piani) {
  if (!piani.length) return '<p class="empty-box">Non hai ancora piani attivi. <a href="index.html#piani">Scopri i piani</a> o <a href="index.html?tipo=acquisto#prenota">richiedi un preventivo</a>.</p>';
  return '<div class="plans">' + piani.map((p) => {
    const info = PIANI[p.piano] || { nome: p.piano, descrizione: "" };
    return '<article class="plan' + (p.stato === "attivo" ? " plan--featured" : "") + '">' +
      '<span class="plan-tag">' + esc(STATI_PIANO[p.stato] || p.stato || "–") + "</span>" +
      '<h3 class="plan-name">' + esc(info.nome) + "</h3>" +
      '<span class="plan-price">' + esc(info.descrizione) + "</span>" +
      "<ul>" +
        "<li>Attivo dal " + dataIt(p.inizio) + "</li>" +
        (p.rinnovo ? "<li>Rinnovo il " + dataIt(p.rinnovo) + "</li>" : "") +
        (p.note ? "<li>" + esc(p.note) + "</li>" : "") +
      "</ul>" +
      '<a class="btn btn--sm" href="index.html?tipo=assistenza#prenota">Chiedi assistenza</a>' +
    "</article>";
  }).join("") + "</div>";
}

function renderInCorso(list) {
  if (!list.length) return '<p class="empty-box">Nessun lavoro in corso al momento.</p>';
  return '<div class="project-list">' + list.map((p) =>
    '<article class="project">' +
      '<div class="project-head"><h3 class="h3">' + esc(p.titolo) + '</h3><span class="tag">' + esc((PIANI[p.piano] || {}).nome ? "Piano " + PIANI[p.piano].nome : "Progetto") + "</span></div>" +
      (p.descrizione ? "<p>" + esc(p.descrizione) + "</p>" : "") +
      fasi(p.fase) +
      progress(p.avanzamento) +
      '<dl class="project-meta"><div><dt>Fase attuale</dt><dd>' + esc(p.fase || "–") + "</dd></div>" +
        "<div><dt>Consegna prevista</dt><dd>" + dataIt(p.consegnaPrevista) + "</dd></div></dl>" +
      aggiornamenti(p.aggiornamenti) +
    "</article>"
  ).join("") + "</div>";
}

function renderCompletati(list) {
  if (!list.length) return '<p class="empty-box">Qui troverai i progetti consegnati.</p>';
  return '<div class="project-grid">' + list.map((p) => {
    const url = safeUrl(p.url);
    return '<article class="project project--done">' +
      '<span class="tag tag--solid">Completato</span>' +
      '<h3 class="h3">' + esc(p.titolo) + "</h3>" +
      (p.descrizione ? "<p>" + esc(p.descrizione) + "</p>" : "") +
      '<p class="project-date">Consegnato il ' + dataIt(p.completatoIl) + "</p>" +
      (url ? '<a class="btn btn--sm btn--ghost" href="' + esc(url) + '" target="_blank" rel="noopener">Visita il sito ↗</a>' : "") +
    "</article>";
  }).join("") + "</div>";
}

async function load(user) {
  const [cliente, pianiSnap, progSnap] = await Promise.all([
    getDoc(doc(db, "clienti", user.uid)),
    getDocs(collection(db, "clienti", user.uid, "piani")),
    getDocs(collection(db, "clienti", user.uid, "progetti"))
  ]);
  const c = cliente.exists() ? cliente.data() : {};
  const piani = pianiSnap.docs.map((d) => d.data()).sort((a, b) => String(b.inizio).localeCompare(String(a.inizio)));
  const progetti = progSnap.docs.map((d) => d.data());
  const inCorso = progetti.filter((p) => p.stato !== "completato").sort((a, b) => String(a.consegnaPrevista).localeCompare(String(b.consegnaPrevista)));
  const completati = progetti.filter((p) => p.stato === "completato").sort((a, b) => String(b.completatoIl).localeCompare(String(a.completatoIl)));

  document.getElementById("areaHello").textContent = "Ciao" + (c.nome ? ", " + c.nome : "") + ".";
  document.getElementById("areaSub").textContent = c.azienda ? "Area riservata di " + c.azienda : (user.email || "");
  document.getElementById("countPiani").textContent = piani.length;
  document.getElementById("countInCorso").textContent = inCorso.length;
  document.getElementById("countCompletati").textContent = completati.length;
  document.getElementById("pianiBody").innerHTML = renderPiani(piani);
  document.getElementById("inCorsoBody").innerHTML = renderInCorso(inCorso);
  document.getElementById("completatiBody").innerHTML = renderCompletati(completati);
  root.hidden = false;
  document.getElementById("areaLoading").hidden = true;
}

if (!ready) {
  document.getElementById("areaLoading").hidden = true;
  notConfiguredNotice(document.getElementById("areaGate"));
} else {
  currentUser().then((user) => {
    if (!user) { location.replace("accedi.html"); return; }
    // Admin con email non ancora verificata: va al pannello, che chiede la verifica
    if (isAdminEmail(user) && !user.emailVerified) { location.replace("admin.html"); return; }
    if (isAdmin(user)) document.getElementById("adminLink").hidden = false;
    document.querySelectorAll("[data-logout]").forEach((b) => b.addEventListener("click", logout));
    load(user).catch((err) => {
      document.getElementById("areaLoading").textContent = erroreIt(err);
    });
  });
}
