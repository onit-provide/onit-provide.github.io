/* ==========================================================================
   ON.IT — collegamento a Firebase e funzioni comuni dell'area clienti
   Caricato solo nelle pagine Accedi, Area clienti e Admin.
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, connectFirestoreEmulator
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

export { ADMIN_EMAIL };

export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// Emulatori locali di Firebase: solo per le prove su localhost (aggiungi ?emulatori all'indirizzo)
function useEmulators() {
  if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return false;
  try {
    if (new URLSearchParams(location.search).has("emulatori")) sessionStorage.setItem("onit-emulatori", "1");
    return sessionStorage.getItem("onit-emulatori") === "1";
  } catch (e) { return false; }
}
const emulators = useEmulators();
const config = isConfigured ? firebaseConfig
  : emulators ? { apiKey: "demo-key", authDomain: "localhost", projectId: "demo-onit", appId: "demo" }
  : null;

export const app = config ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const ready = Boolean(app);

if (auth) {
  auth.languageCode = "it"; // email di Firebase (es. reimposta password) in italiano
  if (emulators) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
}

/* Seconda istanza usata solo dall'admin per creare gli account dei clienti
   senza uscire dal proprio accesso */
export function secondaryAuth() {
  const second = initializeApp(config, "creazione-clienti-" + Date.now());
  const a = getAuth(second);
  a.languageCode = "it";
  if (emulators) connectAuthEmulator(a, "http://127.0.0.1:9099", { disableWarnings: true });
  return a;
}

/* Account con l'email dell'amministratore (anche se non ancora verificata) */
export const isAdminEmail = (user) => Boolean(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL);
export const isAdmin = (user) => Boolean(user && user.email && user.email.toLowerCase() === ADMIN_EMAIL && user.emailVerified);

/* Attende lo stato dell'accesso (una sola volta) */
export function currentUser() {
  return new Promise((resolve) => {
    if (!auth) return resolve(null);
    const stop = onAuthStateChanged(auth, (u) => { stop(); resolve(u); });
  });
}

export function logout() {
  return signOut(auth).then(() => { location.href = "accedi.html"; });
}

/* ---- Utilità di presentazione -------------------------------------------- */

export const PIANI = {
  start: { nome: "Start", descrizione: "Sviluppo, assistenza e garanzia" },
  business: { nome: "Business", descrizione: "Modifiche, assistenza sempre attiva, dominio e server" },
  premium: { nome: "Premium", descrizione: "Garanzia 2 anni e mantenimento di dominio e server" }
};
export const STATI_PIANO = { attivo: "Attivo", "in-attivazione": "In attivazione", sospeso: "Sospeso", scaduto: "Scaduto" };
export const FASI = ["Incontro", "Proposta", "Realizzazione", "Revisione", "Online"];

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function dataIt(iso) {
  if (!iso) return "–";
  const p = String(iso).split("-");
  if (p.length !== 3) return esc(iso);
  return (+p[2]) + " " + MESI[+p[1] - 1] + " " + p[0];
}

export function oggi() {
  const t = new Date();
  return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0");
}

/* Link sicuri: accetta solo indirizzi http(s) */
export function safeUrl(u) {
  try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:" ? x.href : ""; } catch (e) { return ""; }
}

/* Messaggi d'errore di Firebase in italiano */
export function erroreIt(err) {
  const code = (err && err.code) || "";
  const map = {
    "auth/invalid-credential": "Email o password non corrette.",
    "auth/invalid-login-credentials": "Email o password non corrette.",
    "auth/wrong-password": "Email o password non corrette.",
    "auth/user-not-found": "Email o password non corrette.",
    "auth/invalid-email": "L'indirizzo email non è valido.",
    "auth/user-disabled": "Questo account è stato disattivato. Contatta ON.IT.",
    "auth/too-many-requests": "Troppi tentativi. Riprova tra qualche minuto.",
    "auth/network-request-failed": "Connessione assente. Controlla la rete e riprova.",
    "auth/email-already-in-use": "Esiste già un account con questa email.",
    "auth/weak-password": "La password deve avere almeno 6 caratteri.",
    "permission-denied": "Non hai i permessi per questa operazione.",
    "unavailable": "Servizio momentaneamente non raggiungibile. Riprova."
  };
  return map[code] || "Si è verificato un errore. Riprova." + (code ? " (" + code + ")" : "");
}

/* Mostra un avviso se Firebase non è ancora configurato */
export function notConfiguredNotice(container) {
  container.innerHTML =
    '<div class="auth-card"><h2 class="h3">Area clienti in arrivo</h2>' +
    "<p>L'area riservata ai clienti sarà disponibile a breve. Nel frattempo puoi scriverci a " +
    '<a href="mailto:info@onitweb.eu">info@onitweb.eu</a> o usare il ' +
    '<a href="index.html#prenota">modulo di contatto</a>.</p></div>';
}
