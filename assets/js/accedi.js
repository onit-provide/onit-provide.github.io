/* ON.IT — pagina Accedi */
import {
  signInWithEmailAndPassword, sendPasswordResetEmail, setPersistence,
  browserLocalPersistence, browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, ready, currentUser, isAdmin, erroreIt, notConfiguredNotice } from "./account.js";

const root = document.getElementById("authRoot");
const form = document.getElementById("loginForm");
const status = document.getElementById("loginStatus");

function show(msg, isError) {
  status.textContent = msg;
  status.classList.add("is-visible");
  status.classList.toggle("is-error", !!isError);
}

function goTo(user) {
  location.replace(isAdmin(user) ? "admin.html" : "area.html");
}

if (!ready) {
  notConfiguredNotice(root);
} else {
  // Chi ha già fatto l'accesso va direttamente alla propria area
  currentUser().then((u) => { if (u) goTo(u); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!email || !password) { show("Inserisci email e password.", true); return; }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await setPersistence(auth, form.ricordami.checked ? browserLocalPersistence : browserSessionPersistence);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      show("Accesso effettuato ✓");
      goTo(cred.user);
    } catch (err) {
      show(erroreIt(err), true);
      btn.disabled = false;
    }
  });

  document.getElementById("forgotBtn").addEventListener("click", async () => {
    const email = form.email.value.trim();
    if (!email) { show("Scrivi la tua email nel campo qui sopra, poi clicca di nuovo su \"Password dimenticata?\".", true); form.email.focus(); return; }
    try {
      await sendPasswordResetEmail(auth, email, { url: new URL("accedi.html", location.href).href });
    } catch (err) {
      // Per sicurezza non riveliamo se l'email è registrata, salvo errori di formato o di rete
      if (err.code === "auth/invalid-email" || err.code === "auth/network-request-failed" || err.code === "auth/too-many-requests") { show(erroreIt(err), true); return; }
    }
    show("Se l'indirizzo è registrato, riceverai a breve un'email con il link per impostare una nuova password. Controlla anche lo spam.");
  });
}
