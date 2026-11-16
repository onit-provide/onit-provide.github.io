/* ==========================================================================
   ON.IT — contenuti modificabili
   Qui si aggiornano recapiti, piani, news e recensioni senza toccare l'HTML.
   ========================================================================== */

window.ONIT = {
  contatti: {
    /* Numero temporaneamente nascosto: lasciato vuoto, il telefono sparisce da tutto il sito.
       Per rimetterlo scrivi qui il numero (telefono: come si legge, telefonoLink: solo + e cifre). */
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
     DOMANDE FREQUENTI — pagina Domande e blocco in Home.
     cat: uno degli id di "categorie". home: true = compare anche in Home (massimo 5).
     Nel testo "a" si possono usare link <a href="…"> e i segnaposto {email} e {assistenza}.
     -------------------------------------------------------------------- */
  faq: {
    categorie: [
      { id: "piani", nome: "Piani e prezzi" },
      { id: "pagamenti", nome: "Pagamenti" },
      { id: "tempi", nome: "Tempi e metodo" },
      { id: "dominio", nome: "Dominio e server" },
      { id: "assistenza", nome: "Assistenza e garanzia" },
      { id: "area", nome: "Area clienti" },
      { id: "privacy", nome: "Privacy e cookie" },
      { id: "sito", nome: "Uso del sito" }
    ],
    voci: [
      { id: "quanto-costa", cat: "piani", home: true, q: "Quanto costa un sito?",
        a: "Dipende dal piano: Start parte da 80 €, Business da 200 € e Premium da 500 €. Sono prezzi di partenza: il prezzo preciso è nel preventivo, che ricevi entro 24 ore lavorative." },
      { id: "differenza-piani", cat: "piani", q: "Che differenza c'è tra Start, Business e Premium?",
        a: "Start comprende il sito su misura, l'assistenza e 1 anno di garanzia. Business aggiunge modifiche incluse, assistenza sempre attiva e, se vuoi, dominio e server. Premium aggiunge 2 anni di garanzia e la gestione completa di dominio e server. <a href=\"index.html#piani\">Confronta i piani</a>." },
      { id: "quale-piano", cat: "piani", q: "Non so quale piano scegliere: come faccio?",
        a: "Prenota un incontro gratuito: ascoltiamo cosa ti serve e ti proponiamo il piano adatto." },
      { id: "cosa-include", cat: "piani", q: "Cosa è compreso in ogni piano?",
        a: "In tutti: sviluppo completo del sito, versione per telefono, tablet e computer, modulo di contatto, assistenza e garanzia. Il dettaglio è nel menu «Cosa include» di ogni <a href=\"index.html#piani\">piano</a>." },
      { id: "modelli", cat: "piani", q: "Usate modelli già pronti?",
        a: "No. Ogni sito viene progettato e sviluppato da zero, partendo dai tuoi obiettivi e dalla tua identità." },
      { id: "preventivo-vincola", cat: "piani", q: "Chiedere un preventivo mi impegna?",
        a: "No. La richiesta non è vincolante: il lavoro parte solo dopo che hai accettato il preventivo per iscritto. Il preventivo resta valido 30 giorni." },
      { id: "sito-esistente", cat: "piani", q: "Ho già un sito: potete rifarlo?",
        a: "Sì. Nel primo incontro guardiamo insieme il sito attuale e ti proponiamo il piano adatto per rifarlo su misura." },
      { id: "altro-tipo", cat: "piani", q: "Mi serve qualcosa di diverso da un sito vetrina o aziendale: potete aiutarmi?",
        a: "Scrivici cosa ti serve: ti diciamo subito se possiamo realizzarlo e con quale piano." },
      { id: "quando-pago", cat: "pagamenti", home: true, q: "Quando si paga?",
        a: "Solo dopo che hai approvato il preventivo. Salvo accordi diversi: un acconto all'accettazione e il saldo alla consegna del sito." },
      { id: "abbonamento", cat: "pagamenti", q: "È un abbonamento?",
        a: "No. Il sito si paga una volta sola. Solo dominio e server, se li attiviamo noi, hanno un canone mensile o annuale." },
      { id: "costi-extra", cat: "pagamenti", q: "Ci sono costi nascosti?",
        a: "No. Quello che paghi è scritto nel preventivo. Le richieste che cambiano il progetto concordato vengono quotate a parte, prima di essere realizzate." },
      { id: "come-pago", cat: "pagamenti", q: "Come posso pagare?",
        a: "Le modalità di pagamento sono indicate nel preventivo." },
      { id: "fattura", cat: "pagamenti", q: "Ricevo la fattura?",
        a: "Sì, per ogni pagamento viene emessa regolare fattura." },
      { id: "quanto-tempo", cat: "tempi", home: true, q: "Quanto tempo serve per avere il sito online?",
        a: "Dipende dal progetto. I tempi di consegna sono scritti nel preventivo e partono da quando riceviamo l'acconto e tutti i materiali: testi, immagini e logo." },
      { id: "come-funziona", cat: "tempi", q: "Come si svolge il lavoro?",
        a: "In quattro passi: incontro, proposta con preventivo, realizzazione e pubblicazione. <a href=\"index.html#metodo\">Guarda il metodo</a>." },
      { id: "incontro", cat: "tempi", q: "Come avviene il primo incontro?",
        a: "È gratuito e scegli tu come: videochiamata, telefonata oppure di persona presso la tua attività. Si prenota dal <a href=\"index.html#prenota\">modulo</a>." },
      { id: "cosa-serve", cat: "tempi", q: "Cosa devo preparare?",
        a: "Testi, immagini e logo della tua attività. Se non hai tutto, nel primo incontro vediamo insieme cosa serve." },
      { id: "revisioni", cat: "tempi", q: "Posso chiedere modifiche durante la realizzazione?",
        a: "Sì. Ti mostriamo ogni avanzamento e raccogliamo le tue osservazioni fino all'approvazione. Il numero di revisioni compreso è indicato nel preventivo." },
      { id: "avanzamento", cat: "tempi", q: "Come seguo l'avanzamento dei lavori?",
        a: "Dall'<a href=\"accedi.html\">Area clienti</a>: vedi la fase del progetto, la percentuale di avanzamento e gli ultimi aggiornamenti." },
      { id: "cosa-sono", cat: "dominio", q: "Cosa sono dominio e server?",
        a: "Il dominio è l'indirizzo del sito, ad esempio tuaattivita.it. Il server, o hosting, è lo spazio che tiene il sito online." },
      { id: "dominio-incluso", cat: "dominio", home: true, q: "Dominio e server sono compresi nel prezzo?",
        a: "Nel piano Start no: restano a tuo carico e noi colleghiamo il sito. Nei piani Business e Premium possiamo attivarli noi: si pagano a parte, con un canone mensile o annuale concordato insieme." },
      { id: "costo-dominio", cat: "dominio", q: "Quanto costano dominio e server?",
        a: "Dipende dal nome e dal server scelti: il costo è indicato nel preventivo. Se vuoi un nome di dominio preciso, senza alternative, il suo costo è a tuo carico." },
      { id: "ho-gia-dominio", cat: "dominio", q: "Ho già un dominio: posso usarlo?",
        a: "Sì. Colleghiamo il nuovo sito al dominio che hai già." },
      { id: "chi-rinnova", cat: "dominio", q: "Chi si occupa dei rinnovi di dominio e server?",
        a: "Nel piano Premium ce ne occupiamo noi: rinnovi, configurazione e controllo. Nel piano Business dipende dall'accordo scritto nel preventivo. Nel piano Start dominio e server li gestisci tu." },
      { id: "come-assistenza", cat: "assistenza", q: "Come chiedo assistenza?",
        a: "Scrivi a {assistenza}, usa il <a href=\"index.html?tipo=assistenza#prenota\">modulo</a> scegliendo «Assistenza» oppure il pulsante nell'Area clienti. Rispondiamo entro 24 ore lavorative." },
      { id: "garanzia", cat: "assistenza", home: true, q: "Cosa copre la garanzia?",
        a: "Se il sito non funziona come concordato, interveniamo senza costi aggiuntivi. Dura 1 anno per Start e Business e 2 anni per Premium, dalla consegna." },
      { id: "dopo-garanzia", cat: "assistenza", q: "Cosa succede quando la garanzia scade?",
        a: "Con il piano Business puoi rinnovarla con un pagamento a parte. In ogni caso puoi sempre chiederci un intervento: lo quotiamo prima di farlo." },
      { id: "modifiche", cat: "assistenza", q: "Posso far modificare il sito dopo la consegna?",
        a: "Sì. Nei piani Business e Premium le modifiche a testi, immagini e sezioni sono comprese. Nel piano Start vengono quotate a parte." },
      { id: "tempi-risposta", cat: "assistenza", q: "In quanto tempo rispondete?",
        a: "Entro 24 ore lavorative, per incontri, preventivi e assistenza." },
      { id: "cos-e-area", cat: "area", q: "Cos'è l'Area clienti?",
        a: "È la tua pagina riservata: trovi i tuoi piani, i lavori in corso con l'avanzamento e i progetti completati." },
      { id: "come-accedo", cat: "area", q: "Come ottengo l'accesso all'Area clienti?",
        a: "L'account lo creiamo noi quando attivi un piano: ricevi un'email per scegliere la tua password. Poi entri da <a href=\"accedi.html\">Area clienti</a>." },
      { id: "password", cat: "area", q: "Ho dimenticato la password: cosa faccio?",
        a: "Nella pagina <a href=\"accedi.html\">Accedi</a> scrivi la tua email e clicca «Password dimenticata?»: ricevi un link per sceglierne una nuova. Controlla anche lo spam." },
      { id: "non-entro", cat: "area", q: "Non riesco ad accedere: cosa controllo?",
        a: "Guarda la password con il pulsante «Mostra password»: il browser a volte ne inserisce una vecchia. Se non basta, scrivi a {assistenza}." },
      { id: "dati", cat: "privacy", q: "Come usate i miei dati?",
        a: "Solo per risponderti e per fornirti il servizio. Niente pubblicità e nessuna cessione a terzi. I dettagli sono nella <a href=\"privacy.html\">privacy policy</a>." },
      { id: "cookie", cat: "privacy", q: "Il sito usa cookie?",
        a: "Solo strumenti tecnici, come la memoria della tua scelta sui cookie. Nessuna statistica e nessuna pubblicità. Google Traduttore si attiva solo se lo accetti." },
      { id: "cambio-cookie", cat: "privacy", q: "Come cambio la mia scelta sui cookie?",
        a: "Con «Preferenze cookie», in fondo a ogni pagina." },
      { id: "cancellare-dati", cat: "privacy", q: "Posso far cancellare i miei dati?",
        a: "Sì, in qualsiasi momento: scrivi a {email}. Rispondiamo entro 30 giorni." },
      { id: "lingua", cat: "sito", q: "Posso leggere il sito in un'altra lingua?",
        a: "Sì: clicca «Lingua» in alto e accetta la traduzione automatica di Google. La lingua originale è l'italiano." },
      { id: "animazioni", cat: "sito", q: "Le animazioni mi danno fastidio: posso ridurle?",
        a: "Sì. In fondo alla pagina clicca «Animazioni: attive» per ridurle. Il sito rispetta anche l'impostazione «riduci movimento» del tuo dispositivo." },
      { id: "tasti", cat: "sito", q: "A cosa servono i tasti attorno al logo?",
        a: "Sono lì per giocare: trascina l'anello per farlo girare, premi i tasti, clicca il logo per richiuderli a sfera." },
      { id: "recensione", cat: "sito", q: "Come lascio una recensione?",
        a: "Dalla pagina <a href=\"recensioni.html\">Recensioni</a>: ci scrivi la tua opinione e la pubblichiamo dopo aver verificato che sei un nostro cliente." },
      { id: "novita", cat: "sito", q: "Dove trovo le novità del sito?",
        a: "Nella pagina <a href=\"news.html\">News</a>, in ordine di data." },
      { id: "contatti", cat: "sito", q: "Come vi contatto?",
        a: "Scrivi a {email} oppure usa il <a href=\"index.html#prenota\">modulo</a>. Per l'assistenza: {assistenza}." }
    ]
  },

  /* --------------------------------------------------------------------
     NEWS — bacheca delle modifiche al sito.
     Per aggiungere una novità, inserisci un nuovo oggetto IN CIMA alla lista.
     categoria: "lancio" | "nuova-sezione" | "aggiornamento" | "correzione"
     -------------------------------------------------------------------- */
  news: [
    {
      data: "2026-11-16",
      categoria: "nuova-sezione",
      titolo: "Domande frequenti, nuova entrata e una Home più semplice",
      testo: "Abbiamo riordinato il sito per farti trovare subito quello che cerchi: meno testo, una pagina con tutte le risposte e una nuova animazione d'apertura.",
      punti: [
        "Nuova pagina Domande: 43 risposte su piani, pagamenti, tempi, dominio, assistenza, Area clienti e privacy, con ricerca e filtri",
        "Nuova entrata nella Home: i tasti di una tastiera si compongono attorno al logo ON.IT. Puoi premerli, far girare l'anello o cliccare il logo",
        "Home più corta: testi più semplici e confronto tra i piani che si apre con un clic",
        "Modulo più veloce: vedi solo i campi che servono per la tua richiesta",
        "Animazioni a scelta: dal fondo di ogni pagina puoi ridurle o riattivarle quando vuoi",
        "Termini e Privacy aggiornati, ciascuno con un riassunto \"In breve\""
      ]
    },
    {
      data: "2026-11-09",
      categoria: "aggiornamento",
      titolo: "Un nuovo look, più dinamico",
      testo: "Abbiamo rinnovato l'aspetto del sito, sempre in bianco e nero: ora è più vivo e reagisce a quello che fai.",
      punti: [
        "Logo che si dissolve in particelle al passaggio del mouse e si ricompone subito dopo",
        "Sfondo liquido in movimento, che cambia tonalità quando scorri, clicchi o compili il modulo",
        "Modelli 3D interattivi: una goccia di metallo liquido nella Home e portatile, tablet e smartphone da ruotare",
        "Scritta ON.IT a particelle in fondo a ogni pagina, pulsanti magnetici e nuovi effetti di luce",
        "Versione leggera automatica per i dispositivi meno potenti e per chi preferisce meno animazioni"
      ]
    },
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
