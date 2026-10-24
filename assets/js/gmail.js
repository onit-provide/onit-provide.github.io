/* ==========================================================================
   ON.IT — invio email dal Pannello admin tramite l'API di Gmail
   L'admin collega il proprio account Google (permesso: solo "inviare email
   per tuo conto"); le email partono dal suo indirizzo e restano in "Inviati".
   Nessuna password viene salvata: il permesso dura circa un'ora per sessione.
   ========================================================================== */

import { GOOGLE_CLIENT_ID, ADMIN_EMAIL } from "./firebase-config.js";

const SCOPE = "https://www.googleapis.com/auth/gmail.send";
const SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

export const gmailConfigured = Boolean(GOOGLE_CLIENT_ID);

let token = null;
let tokenExpiry = 0;
let account = null; // indirizzo per cui è stato chiesto il permesso
let gisPromise = null;

export const isConnected = (email) => Boolean(token) && Date.now() < tokenExpiry && (!email || email === account);
export const connectedAccount = () => account;

/* Carica Google Identity Services solo quando serve */
function loadGis() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { gisPromise = null; reject(new Error("Impossibile caricare il servizio di accesso Google.")); };
      document.head.appendChild(s);
    });
  }
  return gisPromise;
}

export const preload = () => (gmailConfigured ? loadGis().catch(() => {}) : null);

/* Chiede a Google il permesso di inviare email dall'account indicato (finestra di accesso Google) */
export async function connect(email = ADMIN_EMAIL) {
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      login_hint: email,
      callback: (resp) => {
        if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
        if (!window.google.accounts.oauth2.hasGrantedAllScopes(resp, SCOPE)) {
          reject(new Error("Serve il permesso \"Inviare email per tuo conto\": riprova e lascia spuntata la casella."));
          return;
        }
        token = resp.access_token;
        account = email;
        tokenExpiry = Date.now() + (Number(resp.expires_in) - 60) * 1000;
        resolve();
      },
      error_callback: (err) => reject(new Error(err && err.type === "popup_closed" ? "Finestra di Google chiusa prima di completare l'accesso." : "Accesso a Google non riuscito."))
    });
    client.requestAccessToken({ prompt: "select_account" });
  });
}

export function disconnect() {
  if (token && window.google && window.google.accounts) window.google.accounts.oauth2.revoke(token, () => {});
  token = null;
  tokenExpiry = 0;
  account = null;
}

/* ---- Costruzione del messaggio (MIME) ------------------------------------ */

export const EMAIL_RE = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function b64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
const wrap = (s) => s.replace(/.{1,76}/g, "$&\r\n").trimEnd();
const encodeHeader = (s) => "=?UTF-8?B?" + b64(s) + "?=";

export function buildMime({ to, subject, html, text, from = ADMIN_EMAIL, fromName = "ON.IT" }) {
  if (!EMAIL_RE.test(to)) throw new Error("Indirizzo non valido: " + to);
  if (!EMAIL_RE.test(from)) throw new Error("Mittente non valido: " + from);
  const boundary = "onit_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  return [
    'From: "' + fromName.replace(/["\r\n]/g, "") + '" <' + from + ">",
    "To: " + to,
    "Subject: " + encodeHeader(String(subject).replace(/[\r\n]+/g, " ")),
    // Pulsante "Annulla iscrizione" nei programmi di posta: risponde al mittente con oggetto CANCELLA
    "List-Unsubscribe: <mailto:" + from + "?subject=CANCELLA>",
    "MIME-Version: 1.0",
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    "",
    "--" + boundary,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap(b64(text)),
    "--" + boundary,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    wrap(b64(html)),
    "--" + boundary + "--",
    ""
  ].join("\r\n");
}

const toBase64Url = (ascii) => btoa(ascii).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

/* Invia un'email; restituisce l'id del messaggio in Gmail */
export async function send(message) {
  if (!isConnected()) throw new Error("Collega prima Gmail.");
  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ raw: toBase64Url(buildMime(message)) })
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error.message; } catch (e) {}
    if (res.status === 401) { token = null; throw new Error("Collegamento a Gmail scaduto: clicca di nuovo \"Collega Gmail\"."); }
    if (res.status === 429) throw new Error("Gmail ha raggiunto il limite di invii: riprova più tardi.");
    throw new Error("Invio non riuscito (" + res.status + ")" + (detail ? ": " + detail : ""));
  }
  return (await res.json()).id;
}
