# ON.IT — sito web

Sito statico (HTML, CSS, JavaScript) di ON.IT, senza dipendenze da installare.

## Pagine

| File | Contenuto |
| --- | --- |
| `index.html` | Home: servizio, azioni rapide (acquisto / incontro / assistenza), piani, recapiti e modulo di prenotazione |
| `news.html` | Bacheca con le modifiche recenti al sito, filtrabile per categoria |
| `recensioni.html` | Recensioni dei clienti con media e filtro per piano |
| `privacy.html` | Privacy policy e cookie policy (GDPR) |
| `termini.html` | Termini e condizioni del servizio |
| `404.html` | Pagina di errore personalizzata |

## Modificare i contenuti

Quasi tutto si aggiorna da **`assets/js/data.js`**:

- **Recapiti**: telefono, email e sede (vengono mostrati in tutte le pagine).
- **News**: aggiungi un nuovo oggetto in cima alla lista `news` a ogni modifica del sito.
- **Recensioni**: aggiungi un oggetto a `recensioni` con `piano` uguale a `start`, `business` o `premium`.
  Le recensioni con `esempio: true` sono segnaposto: sostituiscile con recensioni reali (o eliminale) prima della pubblicazione.

Header e footer sono generati da `assets/js/main.js`, lo stile è in `assets/css/style.css`.

## Modulo di contatto

Il modulo invia le richieste tramite [FormSubmit](https://formsubmit.co) all'indirizzo email indicato in `data.js`.
Alla **prima richiesta** FormSubmit invia un'email di attivazione a quell'indirizzo: va confermata una sola volta.
Se l'invio non riesce, il modulo apre il programma di posta del visitatore con i dati già compilati.

## Traduzione e cookie

Il selettore lingua nell'header usa Google Traduttore e permette di tradurre il sito in tutte le lingue disponibili.
La lingua predefinita è l'italiano.

Google Traduttore è un servizio di terze parti, quindi viene caricato **solo dopo il consenso** dato nel banner cookie
(cookie funzionali). La scelta si può cambiare da "Preferenze cookie" nel footer. I caratteri sono ospitati in `assets/fonts/`,
quindi senza consenso il sito non contatta nessun servizio esterno.

## Prima della pubblicazione

- **Testi legali**: in `privacy.html` e `termini.html` completa i campi evidenziati `[...]` (ragione sociale, sede, P. IVA,
  hosting, foro). I testi sono un modello: falli verificare da un consulente legale.
- **Indirizzo del sito**: i tag per l'anteprima social, `sitemap.xml` e `robots.txt` usano
  `https://onit-provide.github.io/`. Se usi un dominio diverso, sostituisci questo indirizzo in tutti i file.
- **HTTPS**: ogni pagina reindirizza automaticamente a HTTPS. Sull'hosting attiva anche il certificato:
  GitHub Pages → Settings → Pages → *Enforce HTTPS*; Netlify lo fa da solo (`netlify.toml`);
  sugli hosting Apache è incluso un `.htaccess` con redirect, intestazioni di sicurezza, compressione e cache.

## Anteprima in locale

```bash
python3 -m http.server 8000
# poi apri http://localhost:8000
```

Per pubblicarlo basta caricare la cartella su un hosting statico (GitHub Pages, Netlify, Vercel…).
