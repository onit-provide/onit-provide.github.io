/* ==========================================================================
   ON.IT — configurazione Firebase per l'area clienti
   Incolla qui i valori del tuo progetto Firebase:
   Console Firebase → Impostazioni progetto (⚙) → Generali → Le tue app → App web → Configurazione SDK.
   Questi valori NON sono segreti: la sicurezza dei dati è garantita dalle regole in firestore.rules.
   ========================================================================== */

export const firebaseConfig = {
  apiKey: "AIzaSyCauCato8wbDxG0MGNaSpZF5K7MN-5PdOQ",
  authDomain: "onit-area-clienti.firebaseapp.com",
  projectId: "onit-area-clienti",
  storageBucket: "onit-area-clienti.firebasestorage.app",
  messagingSenderId: "968079086846",
  appId: "1:968079086846:web:c1a1786de368e67b62c1af"
};

/* Indirizzo email dell'amministratore: deve coincidere con quello in firestore.rules */
export const ADMIN_EMAIL = "onitproviderbusiness@gmail.com";
