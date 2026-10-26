/* ==========================================================================
   ON.IT — modelli delle email inviate dal Pannello admin
   Solo tabelle e stili in linea: è il formato che i programmi di posta
   (Gmail, Outlook, Apple Mail) mostrano correttamente.
   Il logo viene caricato dal sito pubblicato.
   ========================================================================== */

export const SITE = "https://onitweb.eu/";
/* Logo bianco su riquadro nero incluso nell'immagine: resta leggibile anche quando
   la modalità scura di Gmail inverte i colori dell'email (le immagini non vengono invertite) */
const LOGO = SITE + "assets/img/logo-email.png";
const EMAIL = "info@onitweb.eu";
export const EMAIL_ASSISTENZA = "help@onitweb.eu";

/* Indirizzi da cui il pannello può inviare.
   "email" è il mittente visibile (casella Aruba); "account" è la Gmail da collegare,
   dove l'indirizzo è configurato come "Invia messaggio come" tramite il server SMTP di Aruba. */
export const MITTENTI = {
  commerciale: { email: EMAIL, account: "onitproviderbusiness@gmail.com", nome: "ON.IT", etichetta: "ON.IT — " + EMAIL },
  assistenza: { email: EMAIL_ASSISTENZA, account: "assistenza.onit@gmail.com", nome: "ON.IT Help", etichetta: "Assistenza — " + EMAIL_ASSISTENZA }
};

export const MODELLI = {
  personalizzata: "Messaggio personalizzato",
  presentazione: "Presentazione ON.IT (servizi e piani)"
};

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function safeUrl(u) {
  try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:" ? x.href : ""; } catch (e) { return ""; }
}

const FONT = "font-family:Arial,Helvetica,sans-serif;";
const BLACK_FONT = "font-family:'Arial Black',Arial,Helvetica,sans-serif;";
const P = 'style="margin:0 0 18px 0;' + FONT + 'font-size:16px;line-height:26px;color:#1a1a1a;"';

/* Gmail trasforma "ON.IT" in un link (sembra un sito .it): un carattere invisibile tra "ON" e "." lo evita */
const nonLink = (html) => html.replace(/ON\.IT/g, "ON&#8204;.IT");

/* Testo libero → paragrafi HTML. Riga vuota = nuovo paragrafo, a capo = <br>, **testo** = grassetto */
export function testoInHtml(testo) {
  return String(testo || "").trim().split(/\n\s*\n/).filter(Boolean).map((par) =>
    "<p " + P + ">" + esc(par.trim()).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>") + "</p>"
  ).join("\n");
}

function bottone(testo, url) {
  const href = safeUrl(url);
  if (!testo || !href) return "";
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 6px 0;"><tr>' +
    '<td bgcolor="#000000" style="background-color:#000000;">' +
    '<a href="' + esc(href) + '" target="_blank" style="display:inline-block;padding:16px 30px;' + FONT + 'font-size:14px;line-height:18px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;text-decoration:none;border:2px solid #000000;">' + esc(testo) + " &rarr;</a>" +
    "</td></tr></table>";
}

function sezioneTitolo(eyebrow, titolo) {
  return '<p style="margin:0 0 6px 0;' + FONT + 'font-size:11px;line-height:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#595959;">' + esc(eyebrow) + "</p>" +
    '<h2 style="margin:0 0 20px 0;' + BLACK_FONT + 'font-size:24px;line-height:28px;font-weight:900;text-transform:uppercase;letter-spacing:-0.5px;color:#000000;">' + esc(titolo) + "</h2>";
}

/* Contenuto fisso del modello "Presentazione ON.IT" */
function corpoPresentazione(azienda) {
  const punto = (n, titolo, testo, last) =>
    '<tr><td width="44" valign="top" style="padding:0 0 ' + (last ? 8 : 22) + 'px 0;' + BLACK_FONT + 'font-size:15px;line-height:22px;font-weight:900;color:#000000;">' + n + "</td>" +
    '<td valign="top" style="padding:0 0 ' + (last ? 8 : 22) + 'px 0;' + FONT + 'font-size:15px;line-height:23px;color:#1a1a1a;"><strong style="color:#000000;">' + titolo + "</strong> " + testo + "</td></tr>";
  const piano = (nome, testo, dark) =>
    '<tr><td' + (dark ? ' bgcolor="#000000"' : "") + ' style="padding:18px 20px;border:2px solid #000000;' + (dark ? "background-color:#000000;" : "") + FONT + '">' +
    '<p style="margin:0;' + BLACK_FONT + 'font-size:18px;line-height:22px;font-weight:900;text-transform:uppercase;color:' + (dark ? "#ffffff" : "#000000") + ';">' + nome + "</p>" +
    '<p style="margin:6px 0 0 0;font-size:14px;line-height:21px;color:' + (dark ? "#e6e6e6" : "#1a1a1a") + ';">' + testo + "</p></td></tr>";
  const spazio = '<tr><td style="height:10px;line-height:10px;font-size:10px;">&nbsp;</td></tr>';
  const passo = (t, d, last) => '<tr><td style="padding:12px 0;border-top:1px solid #d0d0d0;' + (last ? "border-bottom:1px solid #d0d0d0;" : "") + 'font-size:15px;line-height:22px;color:#1a1a1a;"><strong style="color:#000000;">' + t + "</strong> &mdash; " + d + "</td></tr>";

  return '<p ' + P + '>Oggi la maggior parte dei clienti cerca online prima di scegliere a chi rivolgersi. Un sito chiaro, veloce e curato è spesso il primo contatto con ' + esc(azienda || "la vostra azienda") + ': per questo vorremmo proporvi un progetto costruito sulle vostre esigenze, senza modelli già pronti.</p>' +
    '</td></tr><tr><td style="padding:16px 40px 8px 40px;">' + sezioneTitolo("Cosa facciamo", "Un sito che lavora per voi") +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
      punto("01", "Design su misura.", "Studiamo la vostra attività, i vostri clienti e la vostra identità, e realizziamo un sito unico e coerente con il vostro marchio.") +
      punto("02", "Perfetto su ogni schermo.", "Veloce e leggibile su smartphone, tablet e computer, perché è soprattutto da telefono che i clienti vi cercano.") +
      punto("03", "Facile da trovare.", "Pagine e contenuti ottimizzati per i motori di ricerca, così chi cerca i vostri servizi trova voi.") +
      punto("04", "Assistenza continua.", "Dopo la pubblicazione restiamo al vostro fianco per aggiornamenti e supporto, con risposta entro 24 ore lavorative.", true) +
    "</table></td></tr>" +
    '<tr><td style="padding:24px 40px 8px 40px;">' + sezioneTitolo("I nostri piani", "Scegliete il vostro") +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
      piano("Start", "Da 80 €. Sviluppo integrale del sito, centro assistenza per qualsiasi problema e garanzia sul funzionamento. Dominio e server sono a carico del cliente.") + spazio +
      piano("Business", "Da 200 €. Tutto di Start, più modifiche incluse e assistenza sempre attiva. Su richiesta attiviamo dominio personalizzato e server, con un canone mensile concordato insieme.", true) + spazio +
      piano("Premium", "Da 500 €. Tutto di Business, con garanzia di 2 anni e mantenimento di dominio e server affidato a noi.") +
    "</table>" +
    '<p style="margin:14px 0 0 0;' + FONT + 'font-size:14px;line-height:21px;color:#4a4a4a;">Per ogni piano prepariamo un <strong style="color:#000000;">preventivo personalizzato entro 24 ore lavorative</strong>. Il pagamento avviene solo dopo l\'approvazione della proposta.</p>' +
    "</td></tr>" +
    '<tr><td style="padding:32px 40px 8px 40px;">' + sezioneTitolo("Come lavoriamo", "Dall'idea al sito online") +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="' + FONT + '">' +
      passo("1. Incontro", "ascoltiamo le vostre esigenze e definiamo insieme obiettivi e contenuti.") +
      passo("2. Proposta", "vi presentiamo il piano più adatto, con un preventivo chiaro e tempi definiti.") +
      passo("3. Realizzazione", "sviluppiamo il sito e vi mostriamo ogni avanzamento fino alla vostra approvazione.") +
      passo("4. Online e supporto", "pubblichiamo il sito e restiamo disponibili per assistenza e nuove funzioni.", true) +
    "</table></td></tr>" +
    '<tr><td style="padding:32px 40px 8px 40px;">' +
    '<p ' + P + '>Vi propongo un <strong>primo incontro gratuito e senza impegno</strong>, in videochiamata o presso la vostra sede, per capire di cosa avete bisogno.</p>';
}

/**
 * Costruisce l'email completa.
 * d = { modello, mittente, referente, azienda, titolo, messaggio, bottoneTesto, bottoneLink, firma }
 */
export function creaEmail(d) {
  const presentazione = d.modello === "presentazione";
  const assistenza = d.mittente === "assistenza";
  const daEmail = assistenza ? EMAIL_ASSISTENZA : EMAIL;
  const titolo = presentazione ? "Il vostro sito.<br>Fatto bene.<br>Subito online." : esc(d.titolo || "").replace(/\n/g, "<br>");
  const eyebrow = presentazione ? "Siti web su misura per le aziende" : "ON.IT · Siti web su misura";
  const saluto = "Gentile " + esc(d.referente || "Cliente") + ",";
  const intro = presentazione
    ? '<p ' + P + '>mi chiamo ' + esc(d.firma) + " e vi scrivo da <strong>ON.IT</strong>, una piccola realtà tecnica che progetta e realizza <strong>siti web su richiesta</strong> per attività, aziende e professionisti.</p>"
    : "";
  const messaggio = testoInHtml(d.messaggio);
  const cta = presentazione
    ? bottone("Prenota un incontro", SITE + "?tipo=incontro#prenota") +
      '<p style="margin:18px 0 0 0;' + FONT + 'font-size:14px;line-height:22px;color:#4a4a4a;">Oppure rispondete direttamente a questa email: vi ricontatto io per fissare giorno e orario.</p>'
    : bottone(d.bottoneTesto, d.bottoneLink);
  const piede = presentazione
    ? "Se non desiderate ricevere altre comunicazioni da ON.IT, rispondete con &laquo;CANCELLA&raquo; e non vi scriveremo più."
    : "Questa email vi è stata inviata da ON.IT in merito ai nostri servizi. Per non ricevere altre comunicazioni rispondete con &laquo;CANCELLA&raquo;.";

  return nonLink('<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="color-scheme" content="light only">\n<meta name="supported-color-schemes" content="light">\n<title>' + esc(d.oggetto || "ON.IT") + "</title>\n</head>\n" +
  '<body style="margin:0;padding:0;background-color:#e9e9e7;">\n' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#e9e9e7;"><tr><td align="center" style="padding:24px 12px;">' +
  '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-collapse:collapse;">' +

  // Intestazione con logo
  '<tr><td bgcolor="#000000" style="background-color:#000000;padding:36px 40px 32px 40px;">' +
    '<a href="' + SITE + '" target="_blank" style="text-decoration:none;"><img src="' + LOGO + '" width="172" height="66" alt="ON.IT" style="display:block;width:172px;height:auto;border:0;outline:none;color:#ffffff;' + FONT + 'font-size:32px;font-weight:900;"></a>' +
    '<p style="margin:' + (titolo ? "34px" : "24px") + ' 0 0 0;' + FONT + 'font-size:11px;line-height:16px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#bdbdbd;">' + eyebrow + "</p>" +
    (titolo ? '<h1 style="margin:12px 0 0 0;' + BLACK_FONT + 'font-size:34px;line-height:38px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;color:#ffffff;">' + titolo + "</h1>" : "") +
  "</td></tr>" +

  // Corpo
  '<tr><td style="padding:40px 40px 8px 40px;">' +
    "<p " + P + ">" + saluto + "</p>" + intro + messaggio +
    (presentazione ? corpoPresentazione(d.azienda) : "") +
    cta +
  "</td></tr>" +

  // Firma con logo
  '<tr><td style="padding:28px 40px 36px 40px;' + FONT + '">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid #000000;"><tr>' +
    '<td style="padding-top:22px;font-size:15px;line-height:23px;color:#1a1a1a;">Cordiali saluti,<br>' +
      '<strong style="font-size:16px;color:#000000;">' + esc(d.firma) + "</strong><br>" +
      '<span style="color:#4a4a4a;">' + (assistenza ? "ON.IT &mdash; Assistenza clienti" : "ON.IT &mdash; Siti web su misura") + "</span><br>" +
      '<a href="mailto:' + daEmail + '" style="color:#000000;text-decoration:underline;">' + daEmail + "</a><br>" +
      (assistenza ? "" : '<span style="color:#4a4a4a;">Assistenza: </span><a href="mailto:' + EMAIL_ASSISTENZA + '" style="color:#000000;text-decoration:underline;">' + EMAIL_ASSISTENZA + "</a><br>") +
      '<a href="' + SITE + '" target="_blank" style="color:#000000;text-decoration:underline;">onitweb.eu</a>' +
    "</td>" +
    '<td width="110" valign="bottom" align="right" style="padding-top:22px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td>' +
      '<img src="' + LOGO + '" width="104" height="40" alt="ON.IT" style="display:block;width:104px;height:auto;border:0;color:#ffffff;' + FONT + 'font-size:16px;font-weight:900;">' +
    "</td></tr></table></td>" +
    "</tr></table>" +
  "</td></tr>" +

  // Piè di pagina
  '<tr><td bgcolor="#000000" style="background-color:#000000;padding:24px 40px;' + FONT + 'font-size:12px;line-height:18px;color:#bdbdbd;">' +
    piede + ' Il trattamento dei dati è descritto nella nostra <a href="' + SITE + 'privacy.html" target="_blank" style="color:#ffffff;text-decoration:underline;">privacy policy</a>.' +
  "</td></tr>" +

  "</table></td></tr></table>\n</body>\n</html>\n");
}

/* Versione solo testo (per i programmi che non mostrano l'HTML e per i filtri antispam) */
export function creaTesto(d) {
  const righe = ["Gentile " + (d.referente || "Cliente") + ",", ""];
  if (d.modello === "presentazione") {
    righe.push("mi chiamo " + d.firma + " e vi scrivo da ON.IT, una piccola realtà tecnica che progetta e realizza siti web su richiesta per attività, aziende e professionisti.", "");
  }
  if (d.messaggio) righe.push(String(d.messaggio).replace(/\*\*(.+?)\*\*/g, "$1").trim(), "");
  if (d.modello === "presentazione") {
    righe.push("Realizziamo siti su misura, perfetti su ogni schermo, facili da trovare su Google e con assistenza continua.",
      "Piani: Start da 80 € (sviluppo, assistenza e garanzia), Business da 200 € (in più modifiche, assistenza sempre attiva, dominio e server con canone mensile), Premium da 500 € (in più garanzia di 2 anni e mantenimento di dominio e server).", "",
      "Prenota un incontro gratuito: " + SITE + "?tipo=incontro#prenota", "");
  } else if (d.bottoneTesto && safeUrl(d.bottoneLink)) {
    righe.push(d.bottoneTesto + ": " + safeUrl(d.bottoneLink), "");
  }
  const assistenza = d.mittente === "assistenza";
  righe.push("Cordiali saluti,", d.firma, assistenza ? "ON.IT — Assistenza clienti" : "ON.IT — Siti web su misura",
    assistenza ? EMAIL_ASSISTENZA : EMAIL);
  if (!assistenza) righe.push("Assistenza: " + EMAIL_ASSISTENZA);
  righe.push(SITE, "",
    "Per non ricevere altre comunicazioni rispondete con «CANCELLA».");
  return righe.join("\n");
}
