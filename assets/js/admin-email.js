/* ON.IT — Pannello admin, sezione Email: scrivi, guarda l'anteprima e invia dalla tua Gmail */
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, esc } from "./account.js";
import { creaEmail, creaTesto, MODELLI, MITTENTI } from "./email-template.js";
import { gmailConfigured, isConnected, connectedAccount, connect, disconnect, send, preload, EMAIL_RE } from "./gmail.js";

const MAX_DESTINATARI = 20;
const form = document.getElementById("emailForm");
const preview = document.getElementById("emailPreview");
const previewHead = document.getElementById("previewHead");
const gmailBox = document.getElementById("gmailStatus");
const statusEl = document.getElementById("emailStatus");
const logEl = document.getElementById("emailLog");
const el = (name) => form.elements[name];

let clienti = [];
let oggettoToccato = false;

function say(msg, isError) {
  statusEl.textContent = msg;
  statusEl.className = "form-status is-visible" + (isError ? " is-error" : "");
}

const mittente = () => MITTENTI[el("mittente").value] || MITTENTI.commerciale;

function dati() {
  return {
    modello: el("modello").value,
    mittente: el("mittente").value,
    referente: el("referente").value.trim(),
    azienda: el("azienda").value.trim(),
    oggetto: el("oggetto").value.trim(),
    titolo: el("titolo").value.trim(),
    messaggio: el("messaggio").value,
    bottoneTesto: el("bottoneTesto").value.trim(),
    bottoneLink: el("bottoneLink").value.trim(),
    firma: el("firma").value.trim()
  };
}

function destinatari() {
  return Array.from(new Set(el("destinatari").value.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)));
}

function oggettoPredefinito() {
  const az = el("azienda").value.trim();
  return el("modello").value === "presentazione"
    ? "Un sito web su misura per " + (az || "la vostra azienda") + " — ON.IT"
    : "Aggiornamento da ON.IT" + (az ? " per " + az : "");
}

/* ---- Anteprima ------------------------------------------------------------ */

let timer;
function aggiorna() {
  const personalizzata = el("modello").value === "personalizzata";
  form.querySelectorAll("[data-solo-personalizzata]").forEach((n) => { n.hidden = !personalizzata; });
  if (!oggettoToccato) el("oggetto").value = oggettoPredefinito();
  clearTimeout(timer);
  timer = setTimeout(() => {
    preview.srcdoc = creaEmail(dati());
    const to = destinatari();
    previewHead.innerHTML = "<strong>A:</strong> " + (to.length ? esc(to.slice(0, 3).join(", ")) + (to.length > 3 ? " e altri " + (to.length - 3) : "") : "<em>nessun destinatario</em>") +
      "<br><strong>Oggetto:</strong> " + esc(el("oggetto").value || "–");
  }, 150);
}

/* ---- Collegamento a Gmail ------------------------------------------------- */

function aggiornaGmail() {
  const sendBtns = form.querySelectorAll("[data-invio]");
  if (!gmailConfigured) {
    gmailBox.innerHTML = "<strong>Invio automatico non ancora attivo.</strong> Serve collegare il sito a Gmail con un ID client Google (vedi la guida nel README). Nel frattempo puoi scaricare l'email o copiarla.";
    sendBtns.forEach((b) => { b.disabled = true; });
    return;
  }
  const da = mittente().email;
  const account = mittente().account;
  if (isConnected(account)) {
    gmailBox.innerHTML = '<span class="dot dot--on" aria-hidden="true"></span> Collegato tramite ' + esc(account) + ': le email partono da <strong>' + esc(da) + '</strong>. <button type="button" class="link-btn" id="gmailOff">Scollega</button>';
    document.getElementById("gmailOff").addEventListener("click", () => { disconnect(); aggiornaGmail(); });
  } else {
    const altro = connectedAccount();
    gmailBox.innerHTML = '<span class="dot" aria-hidden="true"></span> ' +
      (altro ? "Sei collegato come " + esc(altro) + ": per inviare da <strong>" + esc(da) + "</strong> collega " + esc(account) + ". " : "Gmail non collegata. ") +
      '<button type="button" class="btn btn--sm" id="gmailOn">Collega ' + esc(account) + "</button>" +
      '<span class="gmail-hint">Nella finestra di Google scegli l\'account ' + esc(account) + ": le email partiranno da " + esc(da) + ".</span>";
    document.getElementById("gmailOn").addEventListener("click", async () => {
      try { await connect(account); say("Gmail collegata ✓"); } catch (err) { say(err.message, true); }
      aggiornaGmail();
    });
  }
  sendBtns.forEach((b) => { b.disabled = false; });
}

/* ---- Invio ---------------------------------------------------------------- */

function controlla(to) {
  const d = dati();
  if (!to.length) return "Inserisci almeno un destinatario.";
  const errati = to.filter((x) => !EMAIL_RE.test(x));
  if (errati.length) return "Indirizzi non validi: " + errati.join(", ");
  if (to.length > MAX_DESTINATARI) return "Puoi inviare al massimo " + MAX_DESTINATARI + " email per volta, per non finire nello spam.";
  if (!d.oggetto) return "Scrivi l'oggetto.";
  if (!d.firma) return "Scrivi la firma.";
  if (d.modello === "personalizzata" && !d.messaggio.trim()) return "Scrivi il messaggio.";
  if (d.bottoneTesto && !/^https?:\/\//i.test(d.bottoneLink)) return "Il link del pulsante deve iniziare con https://";
  return "";
}

function registra(to, oggetto, esito, ok) {
  const li = document.createElement("li");
  li.className = ok ? "" : "is-error";
  li.innerHTML = "<time>" + new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) + "</time> <strong>" + esc(to) + "</strong> — " + esc(oggetto) + " <span>" + esc(esito) + "</span>";
  logEl.prepend(li);
  logEl.closest(".admin-card").hidden = false;
}

async function invia(to) {
  const m = mittente();
  if (!isConnected(m.account)) { aggiornaGmail(); throw new Error("Prima clicca \"Collega " + m.account + "\" qui sopra."); }
  const d = dati();
  const html = creaEmail(d), text = creaTesto(d);
  let ok = 0;
  for (let i = 0; i < to.length; i++) {
    say("Invio in corso… " + (i + 1) + " di " + to.length);
    try {
      await send({ to: to[i], subject: d.oggetto, html, text, from: m.email, fromName: m.nome });
      registra(to[i], d.oggetto, "inviata ✓", true);
      ok++;
    } catch (err) {
      registra(to[i], d.oggetto, err.message, false);
      if (/Collega|scaduto|limite/.test(err.message)) { aggiornaGmail(); say(err.message, true); return; }
    }
    if (i < to.length - 1) await new Promise((r) => setTimeout(r, 1200)); // pausa tra un invio e l'altro
  }
  say(ok === to.length ? "Email inviata ✓ La trovi anche nella cartella Inviati di Gmail." : "Inviate " + ok + " su " + to.length + ": controlla l'elenco qui sotto.", ok !== to.length);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const to = destinatari();
  const errore = controlla(to);
  if (errore) { say(errore, true); return; }
  if (!confirm("Inviare l'email \"" + el("oggetto").value + "\" a " + to.length + (to.length === 1 ? " destinatario" : " destinatari") + "?")) return;
  const btns = form.querySelectorAll("[data-invio]");
  btns.forEach((b) => { b.disabled = true; });
  try { await invia(to); } catch (err) { say(err.message, true); }
  btns.forEach((b) => { b.disabled = false; });
});

// La prova arriva all'indirizzo da cui si sta inviando
document.getElementById("sendTest").addEventListener("click", async () => {
  const me = mittente().email;
  const errore = controlla([me]);
  if (errore) { say(errore, true); return; }
  try { await invia([me]); } catch (err) { say(err.message, true); }
});

document.getElementById("downloadHtml").addEventListener("click", () => {
  const blob = new Blob([creaEmail(dati())], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "email-onit" + (el("azienda").value.trim() ? "-" + el("azienda").value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : "") + ".html";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

document.getElementById("copyHtml").addEventListener("click", async () => {
  const html = creaEmail(dati());
  try {
    await navigator.clipboard.write([new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([creaTesto(dati())], { type: "text/plain" })
    })]);
    say("Email copiata ✓ Incollala nel corpo di un nuovo messaggio in Gmail.");
  } catch (err) { say("Copia non riuscita in questo browser: usa \"Scarica HTML\".", true); }
});

/* ---- Avvio ---------------------------------------------------------------- */

el("mittente").innerHTML = Object.keys(MITTENTI).map((k) => '<option value="' + k + '">' + esc(MITTENTI[k].etichetta) + "</option>").join("");
el("mittente").addEventListener("change", aggiornaGmail);
el("modello").innerHTML = Object.keys(MODELLI).map((k) => '<option value="' + k + '">' + esc(MODELLI[k]) + "</option>").join("");
el("oggetto").addEventListener("input", () => { oggettoToccato = el("oggetto").value.trim() !== ""; });
el("modello").addEventListener("change", () => { if (!oggettoToccato) el("oggetto").value = ""; });
form.addEventListener("input", aggiorna);
form.addEventListener("change", aggiorna);

try { el("firma").value = localStorage.getItem("onit-email-firma") || ""; } catch (e) {}
el("firma").addEventListener("change", () => { try { localStorage.setItem("onit-email-firma", el("firma").value.trim()); } catch (e) {} });

el("cliente").addEventListener("change", () => {
  const c = clienti.find((x) => x.id === el("cliente").value);
  if (!c) return;
  el("destinatari").value = c.email || "";
  el("referente").value = c.nome || "";
  el("azienda").value = c.azienda || "";
  aggiorna();
});

export async function initEmail() {
  preload(); // la finestra di Google deve aprirsi subito al clic su "Collega Gmail"
  aggiornaGmail();
  aggiorna();
  try {
    const snap = await getDocs(collection(db, "clienti"));
    clienti = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.azienda || a.nome).localeCompare(String(b.azienda || b.nome)));
    el("cliente").innerHTML = '<option value="">— Nuovo contatto (scrivi i dati qui sotto) —</option>' +
      clienti.map((c) => '<option value="' + esc(c.id) + '">' + esc((c.azienda || c.nome) + " · " + c.email) + "</option>").join("");
  } catch (e) { /* l'elenco clienti è solo una comodità */ }
}
