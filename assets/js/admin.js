/* ON.IT — Pannello admin: clienti, piani e progetti */
import {
  createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  auth, db, ready, currentUser, isAdmin, logout, secondaryAuth, esc, dataIt, oggi, safeUrl, erroreIt,
  PIANI, STATI_PIANO, FASI, ADMIN_EMAIL, notConfiguredNotice
} from "./account.js";

const gate = document.getElementById("adminGate");
const app = document.getElementById("adminApp");
const listEl = document.getElementById("clientList");
const detailEl = document.getElementById("clientDetail");
const toastEl = document.getElementById("adminToast");

let clienti = [];
let current = null; // { id, data, piani: [], progetti: [] }

function toast(msg, isError) {
  toastEl.textContent = msg;
  toastEl.className = "form-status is-visible" + (isError ? " is-error" : "");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { toastEl.className = "form-status"; }, 6000);
}

const options = (obj, sel) => Object.keys(obj).map((k) => '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + esc(obj[k].nome || obj[k]) + "</option>").join("");
const fasiOptions = (sel) => FASI.map((f) => "<option" + (f === sel ? " selected" : "") + ">" + esc(f) + "</option>").join("");
const resetUrl = () => new URL("accedi.html", location.href).href;

/* ---------------------------------------------------------------- Clienti */

async function loadClienti() {
  const snap = await getDocs(collection(db, "clienti"));
  clienti = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => String(a.azienda || a.nome).localeCompare(String(b.azienda || b.nome)));
  renderClienti();
}

function renderClienti() {
  document.getElementById("clientCount").textContent = clienti.length;
  if (!clienti.length) { listEl.innerHTML = '<p class="empty-box">Nessun cliente. Crea il primo con il modulo qui sopra.</p>'; return; }
  listEl.innerHTML = clienti.map((c) =>
    '<button type="button" class="client-row' + (current && current.id === c.id ? " is-active" : "") + '" data-open="' + esc(c.id) + '">' +
      "<strong>" + esc(c.azienda || c.nome || c.email) + "</strong>" +
      "<span>" + esc(c.nome || "") + (c.nome && c.email ? " · " : "") + esc(c.email || "") + "</span>" +
    "</button>"
  ).join("");
}

document.getElementById("newClientForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const nome = f.nome.value.trim(), azienda = f.azienda.value.trim(), email = f.email.value.trim().toLowerCase();
  if (!nome || !email) { toast("Inserisci almeno nome ed email del cliente.", true); return; }
  const btn = f.querySelector('button[type="submit"]'); btn.disabled = true;
  const second = secondaryAuth();
  try {
    // Password temporanea casuale: il cliente ne sceglie una sua tramite l'email ricevuta
    const tmp = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("") + "Aa1!";
    const cred = await createUserWithEmailAndPassword(second, email, tmp);
    await setDoc(doc(db, "clienti", cred.user.uid), { nome, azienda, email, creato: serverTimestamp() });
    await signOut(second);
    await sendPasswordResetEmail(auth, email, { url: resetUrl() });
    f.reset();
    toast("Cliente creato ✓ " + email + " riceverà un'email per impostare la password.");
    await loadClienti();
    openCliente(cred.user.uid);
  } catch (err) {
    toast(erroreIt(err), true);
  } finally {
    btn.disabled = false;
  }
});

/* ---------------------------------------------------------- Dettaglio */

async function openCliente(id) {
  detailEl.innerHTML = '<p class="empty-box">Caricamento…</p>';
  const [c, piani, progetti] = await Promise.all([
    getDoc(doc(db, "clienti", id)),
    getDocs(collection(db, "clienti", id, "piani")),
    getDocs(collection(db, "clienti", id, "progetti"))
  ]);
  current = {
    id,
    data: c.data() || {},
    piani: piani.docs.map((d) => ({ id: d.id, ...d.data() })),
    progetti: progetti.docs.map((d) => ({ id: d.id, ...d.data() }))
  };
  renderClienti();
  renderDetail();
  detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderDetail() {
  const c = current.data;
  const inCorso = current.progetti.filter((p) => p.stato !== "completato");
  const completati = current.progetti.filter((p) => p.stato === "completato");
  detailEl.innerHTML =
    '<div class="admin-card">' +
      '<div class="admin-card-head"><div><span class="eyebrow">Cliente</span><h2 class="h2 admin-title">' + esc(c.azienda || c.nome) + "</h2>" +
      "<p>" + esc(c.nome) + " · " + esc(c.email) + "</p></div>" +
      '<div class="admin-actions"><button type="button" class="btn btn--sm btn--ghost" data-act="reset">Reinvia email password</button>' +
      '<button type="button" class="btn btn--sm btn--ghost" data-act="del-cliente">Elimina dati cliente</button></div></div>' +
      '<form class="form admin-form" data-form="cliente"><div class="form-row">' +
        field("Nome referente", '<input name="nome" required value="' + esc(c.nome) + '">') +
        field("Azienda", '<input name="azienda" value="' + esc(c.azienda) + '">') +
      '</div><button class="btn btn--sm" type="submit">Salva dati cliente</button></form>' +
    "</div>" +

    '<div class="admin-card"><h3 class="h3">I suoi piani (' + current.piani.length + ")</h3>" +
      current.piani.map((p) =>
        '<form class="admin-item" data-form="piano" data-id="' + esc(p.id) + '"><div class="form-row form-row--4">' +
          field("Piano", '<select name="piano">' + options(PIANI, p.piano) + "</select>") +
          field("Stato", '<select name="stato">' + options(STATI_PIANO, p.stato) + "</select>") +
          field("Inizio", '<input type="date" name="inizio" value="' + esc(p.inizio) + '">') +
          field("Rinnovo", '<input type="date" name="rinnovo" value="' + esc(p.rinnovo) + '">') +
        "</div>" + field("Note per il cliente", '<input name="note" value="' + esc(p.note) + '">') +
        '<div class="admin-actions"><button class="btn btn--sm" type="submit">Salva</button><button class="btn btn--sm btn--ghost" type="button" data-act="del-piano" data-id="' + esc(p.id) + '">Elimina</button></div></form>'
      ).join("") +
      '<form class="admin-item admin-item--new" data-form="nuovo-piano"><div class="form-row form-row--4">' +
        field("Piano", '<select name="piano">' + options(PIANI, "business") + "</select>") +
        field("Stato", '<select name="stato">' + options(STATI_PIANO, "attivo") + "</select>") +
        field("Inizio", '<input type="date" name="inizio" value="' + oggi() + '">') +
        field("Rinnovo", '<input type="date" name="rinnovo">') +
      "</div>" + field("Note per il cliente", '<input name="note" placeholder="es. Include 2 revisioni">') +
      '<button class="btn btn--sm" type="submit">+ Aggiungi piano</button></form>' +
    "</div>" +

    '<div class="admin-card"><h3 class="h3">Lavori in corso (' + inCorso.length + ")</h3>" +
      inCorso.map(progettoForm).join("") +
      '<form class="admin-item admin-item--new" data-form="nuovo-progetto">' +
        '<div class="form-row">' + field("Titolo", '<input name="titolo" required placeholder="es. Nuovo sito aziendale">') +
        field("Piano", '<select name="piano"><option value="">–</option>' + options(PIANI, "") + "</select>") + "</div>" +
        field("Descrizione", '<textarea name="descrizione" rows="2"></textarea>') +
        '<div class="form-row form-row--3">' +
          field("Fase", '<select name="fase">' + fasiOptions("Incontro") + "</select>") +
          field("Avanzamento %", '<input type="number" name="avanzamento" min="0" max="100" value="0">') +
          field("Consegna prevista", '<input type="date" name="consegnaPrevista">') +
        "</div>" +
      '<button class="btn btn--sm" type="submit">+ Aggiungi lavoro</button></form>' +
    "</div>" +

    '<div class="admin-card"><h3 class="h3">Progetti completati (' + completati.length + ")</h3>" +
      (completati.length ? completati.map((p) =>
        '<div class="admin-item"><strong>' + esc(p.titolo) + "</strong> — consegnato il " + dataIt(p.completatoIl) +
        (safeUrl(p.url) ? ' · <a href="' + esc(safeUrl(p.url)) + '" target="_blank" rel="noopener">' + esc(p.url) + "</a>" : "") +
        '<div class="admin-actions"><button type="button" class="btn btn--sm btn--ghost" data-act="riapri" data-id="' + esc(p.id) + '">Riporta in corso</button>' +
        '<button type="button" class="btn btn--sm btn--ghost" data-act="del-progetto" data-id="' + esc(p.id) + '">Elimina</button></div></div>'
      ).join("") : '<p class="empty-box">Nessun progetto completato.</p>') +
    "</div>";
}

function field(label, control) {
  return '<label class="field"><span class="field-label">' + esc(label) + "</span>" + control + "</label>";
}

function progettoForm(p) {
  return '<form class="admin-item" data-form="progetto" data-id="' + esc(p.id) + '">' +
    '<div class="form-row">' + field("Titolo", '<input name="titolo" required value="' + esc(p.titolo) + '">') +
    field("Piano", '<select name="piano"><option value="">–</option>' + options(PIANI, p.piano) + "</select>") + "</div>" +
    field("Descrizione", '<textarea name="descrizione" rows="2">' + esc(p.descrizione) + "</textarea>") +
    '<div class="form-row form-row--3">' +
      field("Fase", '<select name="fase">' + fasiOptions(p.fase) + "</select>") +
      field("Avanzamento %", '<input type="number" name="avanzamento" min="0" max="100" value="' + esc(p.avanzamento || 0) + '">') +
      field("Consegna prevista", '<input type="date" name="consegnaPrevista" value="' + esc(p.consegnaPrevista) + '">') +
    "</div>" +
    field("Nuovo aggiornamento per il cliente (facoltativo)", '<input name="aggiornamento" placeholder="es. Completata la pagina Servizi, in attesa delle vostre foto">') +
    field("Indirizzo del sito, per quando sarà completato (facoltativo)", '<input name="url" type="url" placeholder="https://…" value="' + esc(p.url) + '">') +
    '<div class="admin-actions"><button class="btn btn--sm" type="submit">Salva</button>' +
    '<button class="btn btn--sm btn--ghost" type="button" data-act="completa" data-id="' + esc(p.id) + '">Segna come completato</button>' +
    '<button class="btn btn--sm btn--ghost" type="button" data-act="del-progetto" data-id="' + esc(p.id) + '">Elimina</button></div></form>';
}

const pct = (v) => Math.max(0, Math.min(100, parseInt(v, 10) || 0));
const sub = (name, id) => (id ? doc(db, "clienti", current.id, name, id) : collection(db, "clienti", current.id, name));

/* Salvataggi dei moduli del dettaglio */
detailEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, kind = f.dataset.form, id = f.dataset.id;
  const v = (n) => (f.elements[n] ? f.elements[n].value.trim() : "");
  try {
    if (kind === "cliente") {
      await updateDoc(doc(db, "clienti", current.id), { nome: v("nome"), azienda: v("azienda") });
      await loadClienti();
    } else if (kind === "piano" || kind === "nuovo-piano") {
      const data = { piano: v("piano"), stato: v("stato"), inizio: v("inizio"), rinnovo: v("rinnovo"), note: v("note") };
      if (id) await updateDoc(sub("piani", id), data); else await addDoc(sub("piani"), data);
    } else if (kind === "progetto" || kind === "nuovo-progetto") {
      if (!v("titolo")) { toast("Il progetto deve avere un titolo.", true); return; }
      const data = {
        titolo: v("titolo"), piano: v("piano"), descrizione: v("descrizione"), fase: v("fase"),
        avanzamento: pct(v("avanzamento")), consegnaPrevista: v("consegnaPrevista")
      };
      if (f.elements.url) data.url = safeUrl(v("url"));
      if (id) {
        if (v("aggiornamento")) data.aggiornamenti = arrayUnion({ data: oggi(), testo: v("aggiornamento") });
        await updateDoc(sub("progetti", id), data);
      } else {
        await addDoc(sub("progetti"), { ...data, stato: "in-corso", aggiornamenti: [], url: "" });
      }
    }
    toast("Salvato ✓");
    await openCliente(current.id);
  } catch (err) { toast(erroreIt(err), true); }
});

/* Pulsanti di azione del dettaglio */
detailEl.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const act = b.dataset.act, id = b.dataset.id;
  try {
    if (act === "reset") {
      await sendPasswordResetEmail(auth, current.data.email, { url: resetUrl() });
      toast("Email inviata a " + current.data.email + " ✓");
      return;
    }
    if (act === "del-piano" && confirm("Eliminare questo piano?")) await deleteDoc(sub("piani", id));
    else if (act === "del-progetto" && confirm("Eliminare questo progetto?")) await deleteDoc(sub("progetti", id));
    else if (act === "completa") {
      const form = b.closest("form");
      const url = form && form.elements.url ? safeUrl(form.elements.url.value.trim()) : "";
      await updateDoc(sub("progetti", id), { stato: "completato", completatoIl: oggi(), avanzamento: 100, fase: "Online", url });
    } else if (act === "riapri") {
      await updateDoc(sub("progetti", id), { stato: "in-corso" });
    } else if (act === "del-cliente") {
      if (!confirm("Eliminare tutti i dati di questo cliente (piani e progetti)? L'account di accesso va poi eliminato dalla console Firebase.")) return;
      await Promise.all([
        ...current.piani.map((p) => deleteDoc(sub("piani", p.id))),
        ...current.progetti.map((p) => deleteDoc(sub("progetti", p.id)))
      ]);
      await deleteDoc(doc(db, "clienti", current.id));
      current = null;
      detailEl.innerHTML = "";
      toast("Dati del cliente eliminati ✓");
      await loadClienti();
      return;
    } else return;
    toast("Fatto ✓");
    await openCliente(current.id);
  } catch (err) { toast(erroreIt(err), true); }
});

listEl.addEventListener("click", (e) => {
  const b = e.target.closest("[data-open]");
  if (b) openCliente(b.dataset.open).catch((err) => toast(erroreIt(err), true));
});

/* ---------------------------------------------------------------- Avvio */

if (!ready) {
  notConfiguredNotice(gate);
} else {
  currentUser().then(async (user) => {
    if (!user) { location.replace("accedi.html"); return; }
    document.querySelectorAll("[data-logout]").forEach((b) => b.addEventListener("click", logout));
    if (user.email && user.email.toLowerCase() === ADMIN_EMAIL && !user.emailVerified) {
      gate.innerHTML = '<div class="auth-card"><h2 class="h3">Verifica la tua email</h2><p>Per usare il pannello admin devi prima confermare l\'indirizzo ' + esc(user.email) + '.</p>' +
        '<div class="admin-actions"><button class="btn btn--sm" type="button" id="verifyBtn">Invia email di verifica</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" id="reloadBtn">Ho verificato, ricarica</button></div><div class="form-status" id="verifyStatus" role="status"></div></div>';
      document.getElementById("verifyBtn").addEventListener("click", () => sendEmailVerification(user, { url: location.href })
        .then(() => { const s = document.getElementById("verifyStatus"); s.textContent = "Email inviata ✓ Apri il link ricevuto, poi torna qui."; s.classList.add("is-visible"); })
        .catch((err) => toast(erroreIt(err), true)));
      document.getElementById("reloadBtn").addEventListener("click", () => user.reload().then(() => location.reload()));
      return;
    }
    if (!isAdmin(user)) { location.replace("area.html"); return; }
    gate.hidden = true;
    app.hidden = false;
    loadClienti().catch((err) => toast(erroreIt(err), true));
  });
}
