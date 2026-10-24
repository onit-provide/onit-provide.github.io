/* ==========================================================================
   ON.IT — configurazione Firebase per l'area clienti
   Incolla qui i valori del tuo progetto Firebase:
   Console Firebase → Impostazioni progetto (⚙) → Generali → Le tue app → App web → Configurazione SDK.
   Questi valori NON sono segreti: la sicurezza dei dati è garantita dalle regole in firestore.rules.
   ========================================================================== */

export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

/* Indirizzo email dell'amministratore: deve coincidere con quello in firestore.rules */
export const ADMIN_EMAIL = "onitproviderbusiness@gmail.com";
