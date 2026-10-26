/* ==========================================================================
   ON.IT — contenuti modificabili
   Qui si aggiornano recapiti, piani, news e recensioni senza toccare l'HTML.
   ========================================================================== */

window.ONIT = {
  contatti: {
    /* Numero temporaneamente nascosto: lasciato vuoto, il telefono sparisce da tutto il sito.
       Per rimetterlo: telefono: "+39 351 418 5569", telefonoLink: "+393514185569" */
    telefono: "",
    telefonoLink: "",
    email: "info@onitweb.eu",
    /* Tutto ciò che riguarda l'assistenza (modulo, area clienti, firme) usa questo indirizzo */
    emailAssistenza: "help@onitweb.eu",
    sede: "Uffici in arrivo — per ora incontri in videochiamata o presso la tua attività"
  },

  /* Piani del servizio. "id" collega i piani alle recensioni. */
  piani: [
    { id: "start", nome: "Start", descrizione: "Sviluppo, assistenza e garanzia di 1 anno" },
    { id: "business", nome: "Business", descrizione: "Modifiche, assistenza sempre attiva, dominio e server" },
    { id: "premium", nome: "Premium", descrizione: "Garanzia 2 anni e mantenimento di dominio e server" }
  ],

  /* --------------------------------------------------------------------
     NEWS — bacheca delle modifiche al sito.
     Per aggiungere una novità, inserisci un nuovo oggetto IN CIMA alla lista.
     categoria: "lancio" | "nuova-sezione" | "aggiornamento" | "correzione"
     -------------------------------------------------------------------- */
  news: [
    {
      data: "2026-10-26",
      categoria: "nuova-sezione",
      titolo: "Nuova sezione Piani, con prezzi e dettagli",
      testo: "Nella Home trovi ora i tre piani ON.IT con il prezzo di partenza, cosa include ciascuno e una tabella per confrontarli a colpo d'occhio.",
      punti: [
        "Start da 80 €, Business da 200 €, Premium da 500 €, con pagamento unico",
        "Menu \"Cosa include\" con la spiegazione di ogni servizio e icone animate",
        "Garanzia di 1 anno per Start e Business (rinnovabile per Business) e di 2 anni per Premium",
        "Dominio e server, se li attiviamo noi, si pagano a parte ogni mese o ogni anno, secondo l'accordo",
        "Tabella di confronto tra i piani, comoda anche da smartphone"
      ]
    },
    {
      data: "2026-10-24",
      categoria: "aggiornamento",
      titolo: "Il nostro nuovo indirizzo: onitweb.eu",
      testo: "ON.IT ha ora un dominio tutto suo. Il sito è raggiungibile su onitweb.eu e abbiamo nuovi indirizzi email dedicati.",
      punti: [
        "Sito: onitweb.eu",
        "Contatti, preventivi e incontri: info@onitweb.eu",
        "Assistenza clienti: help@onitweb.eu"
      ]
    },
    {
      data: "2026-10-24",
      categoria: "aggiornamento",
      titolo: "Un indirizzo dedicato all'assistenza",
      testo: "Per modifiche, problemi o aggiornamenti sul tuo sito ora puoi scrivere direttamente ad help@onitweb.eu. Le richieste di assistenza inviate dal modulo e dall'Area clienti arrivano a questo indirizzo."
    },
    {
      data: "2026-10-24",
      categoria: "nuova-sezione",
      titolo: "Nasce l'Area clienti",
      testo: "I clienti ON.IT possono ora accedere a un'area riservata dal menu \"Area clienti\" e trovare in un unico posto tutto ciò che riguarda il proprio sito.",
      punti: [
        "I miei piani: piano attivo, data di inizio e di rinnovo",
        "Lavori in corso: fase del progetto, percentuale di avanzamento e ultimi aggiornamenti",
        "Progetti completati: storico dei siti consegnati con link diretto"
      ]
    },
    {
      data: "2026-10-18",
      categoria: "nuova-sezione",
      titolo: "Privacy, cookie e termini di servizio",
      testo: "Abbiamo pubblicato le pagine dedicate alla privacy policy, alla cookie policy e ai termini e condizioni, raggiungibili dal fondo di ogni pagina. Al primo accesso un banner ti permette di scegliere quali cookie attivare.",
      punti: [
        "Nuova pagina Privacy e cookie policy",
        "Nuova pagina Termini e condizioni",
        "Banner per il consenso ai cookie, modificabile in ogni momento"
      ]
    },
    {
      data: "2026-10-18",
      categoria: "aggiornamento",
      titolo: "Sito più veloce, sicuro e accessibile",
      testo: "Abbiamo migliorato le prestazioni e la leggibilità del sito su ogni dispositivo.",
      punti: [
        "Caratteri e immagini più leggeri, caricati direttamente dal nostro sito",
        "Connessione sicura HTTPS sempre attiva",
        "Contrasto dei colori migliorato e pulsanti più comodi su smartphone",
        "Anteprima curata quando condividi il sito sui social",
        "Nuova pagina di errore 404"
      ]
    },
    {
      data: "2026-10-17",
      categoria: "lancio",
      titolo: "Online il nuovo sito ON.IT",
      testo: "È nata la casa digitale di ON.IT. Da oggi puoi conoscere il nostro servizio, scegliere il piano più adatto e prenotare un incontro direttamente dal sito.",
      punti: [
        "Pagina Home con descrizione del servizio e recapiti",
        "Identità visiva in bianco e nero con il logo ON.IT",
        "Sito ottimizzato per smartphone, tablet e computer"
      ]
    },
    {
      data: "2026-10-17",
      categoria: "nuova-sezione",
      titolo: "Prenota un incontro in pochi secondi",
      testo: "Abbiamo aggiunto il modulo di contatto: scegli se vuoi acquistare il servizio, fissare un incontro o chiedere assistenza, indica data e orario preferiti e ti ricontattiamo noi."
    },
    {
      data: "2026-10-17",
      categoria: "nuova-sezione",
      titolo: "Recensioni divise per piano",
      testo: "Nella pagina Recensioni puoi filtrare le opinioni dei clienti in base al piano scelto: Start, Business o Premium."
    },
    {
      data: "2026-10-17",
      categoria: "aggiornamento",
      titolo: "Sito disponibile in tutte le lingue",
      testo: "Con il selettore lingua in alto puoi tradurre automaticamente ogni pagina. La lingua predefinita resta l'italiano."
    }
  ],

  /* --------------------------------------------------------------------
     RECENSIONI — solo recensioni reali dei clienti, una per oggetto.
     Finché la lista è vuota la pagina Recensioni mostra "Qui ci sarà la tua recensione";
     con la prima recensione quella schermata sparisce da sola.
     "piano" deve essere "start", "business" o "premium". Esempio di formato:
     { nome: "Mario Rossi", attivita: "Ristorante Da Mario", piano: "business", voto: 5, data: "2026-11-15",
       testo: "Il testo della recensione, come scritto dal cliente." }
     -------------------------------------------------------------------- */
  recensioni: [
  ]
};
