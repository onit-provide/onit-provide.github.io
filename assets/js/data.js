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
    email: "onitproviderbusiness@gmail.com",
    sede: "Uffici in arrivo — per ora incontri in videochiamata o presso la tua attività"
  },

  /* Piani del servizio. "id" collega i piani alle recensioni. */
  piani: [
    { id: "start", nome: "Start", descrizione: "Sito vetrina" },
    { id: "business", nome: "Business", descrizione: "Sito aziendale completo" },
    { id: "premium", nome: "Premium", descrizione: "Sito su misura con funzioni avanzate" }
  ],

  /* --------------------------------------------------------------------
     NEWS — bacheca delle modifiche al sito.
     Per aggiungere una novità, inserisci un nuovo oggetto IN CIMA alla lista.
     categoria: "lancio" | "nuova-sezione" | "aggiornamento" | "correzione"
     -------------------------------------------------------------------- */
  news: [
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
     RECENSIONI — una per oggetto. "piano" deve corrispondere a un id dei piani.
     ATTENZIONE: le recensioni con esempio: true sono SEGNAPOSTO dimostrativi.
     Sostituiscile con recensioni reali dei tuoi clienti prima della pubblicazione
     (oppure eliminale): finché ce ne sono, la pagina mostra un avviso.
     -------------------------------------------------------------------- */
  recensioni: [
    { esempio: true, nome: "Nome Cliente", attivita: "Ristorante", piano: "start", voto: 5, data: "2026-10-01",
      testo: "Esempio di recensione: sito vetrina pronto in tempi brevi, chiaro e facile da aggiornare." },
    { esempio: true, nome: "Nome Cliente", attivita: "Parrucchiere", piano: "start", voto: 4, data: "2026-09-20",
      testo: "Esempio di recensione: ottimo rapporto qualità-prezzo per chi vuole essere trovato online." },
    { esempio: true, nome: "Nome Cliente", attivita: "Studio professionale", piano: "business", voto: 5, data: "2026-09-12",
      testo: "Esempio di recensione: ci hanno seguito in ogni fase, dall'incontro iniziale alla pubblicazione." },
    { esempio: true, nome: "Nome Cliente", attivita: "Negozio di abbigliamento", piano: "business", voto: 5, data: "2026-08-30",
      testo: "Esempio di recensione: il modulo di contatto ci porta nuove richieste ogni settimana." },
    { esempio: true, nome: "Nome Cliente", attivita: "Agenzia", piano: "premium", voto: 5, data: "2026-08-15",
      testo: "Esempio di recensione: progetto su misura con funzioni avanzate, assistenza sempre disponibile." },
    { esempio: true, nome: "Nome Cliente", attivita: "Palestra", piano: "premium", voto: 4, data: "2026-07-28",
      testo: "Esempio di recensione: design professionale e prenotazioni online integrate." }
  ]
};
