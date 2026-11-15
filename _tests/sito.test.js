/* ==========================================================================
   ON.IT — prove di accettazione del sito
   Uso:  node --test _tests/sito.test.js
   Serve Playwright (npm i -g playwright). Con axe-core installato controlla
   anche l'accessibilità (WCAG AA).
   La cartella inizia con "_": GitHub Pages non la pubblica.
   ========================================================================== */
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { start, ROOT } = require("./server.js");

let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) { ({ chromium } = require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright")); }

let axePath = null;
try { axePath = require.resolve("axe-core/axe.min.js"); } catch (e) { /* facoltativo */ }

// Grafica software: senza ?fx=full il sito sceglie da solo la versione leggera
const GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"];
const PUBBLICHE = ["index.html", "faq.html", "news.html", "recensioni.html", "privacy.html", "termini.html", "accedi.html", "404.html"];
const INDICIZZATE = ["index.html", "faq.html", "news.html", "recensioni.html", "privacy.html", "termini.html"];
const CONSENSO = JSON.stringify({ v: 1, funzionali: false, data: new Date().toISOString() });

let srv, browser;
before(async () => { srv = await start(); browser = await chromium.launch({ args: GL }); });
after(async () => { await browser.close(); srv.close(); });

/* Apre una pagina. Il banner cookie è già chiuso, salvo opts.banner. */
async function apri(pagina, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1366, height: 850 },
    reducedMotion: opts.reducedMotion || "no-preference",
    hasTouch: !!opts.mobile, isMobile: !!opts.mobile
  });
  if (!opts.banner) await ctx.addInitScript((c) => { try { localStorage.setItem("onit-consenso-cookie", c); } catch (e) {} }, CONSENSO);
  if (opts.storage) await ctx.addInitScript((s) => { for (const k in s) localStorage.setItem(k, s[k]); }, opts.storage);
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  const errori = [];
  page.on("pageerror", (e) => errori.push(e.message));
  // Il modulo non deve mai partire davvero durante le prove
  await page.route("https://formsubmit.co/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"success":"true"}' }));
  await page.goto(srv.url + "/" + pagina, { waitUntil: "load" });
  await page.waitForTimeout(opts.attesa || 700);
  return { page, errori, chiudi: () => ctx.close() };
}
const leggi = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const parole = (s) => (s.match(/[\p{L}\p{N}]+/gu) || []).length;

/* -------------------------------------------------------------------------- */
describe("tutte le pagine", () => {
  for (const pagina of PUBBLICHE) {
    test(`${pagina}: nessun errore JavaScript`, async () => {
      const { errori, chiudi } = await apri(pagina, { attesa: 1500 });
      await chiudi();
      assert.deepEqual(errori, []);
    });

    test(`${pagina}: nessuno scorrimento orizzontale da 320 a 1366 px`, async () => {
      for (const w of [320, 390, 900, 1366]) {
        const { page, chiudi } = await apri(pagina, { viewport: { width: w, height: 800 } });
        const sw = await page.evaluate(() => document.documentElement.scrollWidth);
        await chiudi();
        assert.equal(sw, w, `larghezza ${w}`);
      }
    });

    test(`${pagina}: CSS e script hanno il numero di versione`, () => {
      const html = leggi(pagina);
      // i modulepreload restano senza versione: devono coincidere con gli import interni dei moduli
      const locali = [...html.matchAll(/<(?:link rel="stylesheet" href|script (?:type="module" )?src)="(\/?assets\/(?:css|js)\/[^"]+)"/g)].map((m) => m[1]);
      assert.ok(locali.length >= 3, "almeno CSS e due script");
      for (const u of locali) assert.match(u, /\?v=\d+$/, u);
    });

    test(`${pagina}: ha una navigazione di riserva senza JavaScript`, () => {
      assert.match(leggi(pagina), /<noscript>[\s\S]*href="\/?index\.html"[\s\S]*<\/noscript>/);
    });
  }

  for (const pagina of INDICIZZATE) {
    test(`${pagina}: titolo e descrizione hanno una lunghezza utile per Google`, () => {
      const html = leggi(pagina);
      const titolo = html.match(/<title>(.*?)<\/title>/)[1];
      const desc = html.match(/<meta name="description" content="([^"]*)"/)[1];
      assert.ok(titolo.length >= 25 && titolo.length <= 65, `titolo ${titolo.length}: ${titolo}`);
      assert.ok(desc.length >= 110 && desc.length <= 165, `descrizione ${desc.length}`);
    });
  }

  test("i collegamenti interni portano a pagine e ancore che esistono", async () => {
    const rotti = [];
    for (const pagina of PUBBLICHE) {
      const { page, chiudi } = await apri(pagina);
      const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
      await chiudi();
      for (const h of new Set(hrefs)) {
        if (/^(https?:|mailto:|tel:|#$)/.test(h)) continue;
        const [file, ancora] = h.split("#");
        const f = (file || pagina).split("?")[0].replace(/^\//, "");
        if (!fs.existsSync(path.join(ROOT, f))) { rotti.push(`${pagina} → ${h}`); continue; }
        if (ancora && !new RegExp(`id="${ancora}"`).test(leggi(f)) && !["top", "main"].includes(ancora)) {
          // le ancore create da script (es. domande) si controllano nella pagina aperta
          const { page: p2, chiudi: c2 } = await apri(f);
          const ok = await p2.evaluate((id) => !!document.getElementById(id), ancora);
          await c2();
          if (!ok) rotti.push(`${pagina} → ${h}`);
        }
      }
    }
    assert.deepEqual(rotti, []);
  });

  test("il menu e il piè di pagina portano alla pagina Domande", async () => {
    const { page, chiudi } = await apri("news.html");
    const nav = await page.$$eval("#nav > a", (as) => as.map((a) => a.textContent.trim() + "|" + a.getAttribute("href")));
    const footer = await page.$$eval(".site-footer a", (as) => as.map((a) => a.getAttribute("href")));
    await chiudi();
    assert.ok(nav.includes("Domande|faq.html"), nav.join(", "));
    assert.ok(footer.includes("faq.html"));
  });

  test("menu da telefono: a menu aperto il resto della pagina è inerte", async () => {
    const { page, chiudi } = await apri("index.html", { viewport: { width: 390, height: 844 }, mobile: true });
    assert.equal(await page.evaluate(() => document.querySelector("main").inert), false);
    await page.tap("#menuToggle");
    assert.equal(await page.evaluate(() => document.querySelector("main").inert), true);
    assert.equal(await page.evaluate(() => document.querySelector(".site-footer").inert), true);
    await page.tap("#menuToggle");
    assert.equal(await page.evaluate(() => document.querySelector("main").inert), false);
    await chiudi();
  });

  test("interruttore animazioni: la scelta «ridotte» resta dopo il ricaricamento", async () => {
    const { page, chiudi } = await apri("news.html");
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("fx-reduce")), false);
    await page.click("#fxToggle");
    await page.waitForLoadState("load");
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => localStorage.getItem("onit-animazioni")), "ridotte");
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("fx-reduce")), true);
    assert.equal(await page.evaluate(() => window.ONITFX.reduce), true);
    assert.match(await page.textContent("#fxToggle"), /ridotte/i);
    await chiudi();
  });

  test("accessibilità: nessuna violazione WCAG AA", { skip: !axePath && "axe-core non installato" }, async () => {
    const sorgente = fs.readFileSync(axePath, "utf8");
    for (const pagina of PUBBLICHE) {
      for (const w of [1366, 360]) {
        const { page, chiudi } = await apri(pagina, { viewport: { width: w, height: 800 }, attesa: 1200 });
        await page.evaluate(() => document.querySelectorAll(".reveal").forEach((n) => n.classList.add("is-visible")));
        await page.waitForTimeout(1300);
        await page.addScriptTag({ content: sorgente });
        const viol = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] })).violations.map((v) => v.id + ": " + v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")));
        await chiudi();
        assert.deepEqual(viol, [], `${pagina} a ${w}px`);
      }
    }
  });
});

/* -------------------------------------------------------------------------- */
describe("privacy e dettagli tecnici", () => {
  test("nessun numero di telefono nel codice pubblico", () => {
    assert.doesNotMatch(leggi("assets/js/data.js"), /\+39\s?3\d/);
  });

  test("robots.txt non indica pannello admin e area clienti", () => {
    const r = leggi("robots.txt");
    assert.doesNotMatch(r, /admin|area/);
  });

  test("la mappa del sito contiene la pagina Domande ed è aggiornata", () => {
    const s = leggi("sitemap.xml");
    assert.match(s, /https:\/\/onitweb\.eu\/faq\.html/);
    assert.doesNotMatch(s, /2026-10-18/);
  });

  test("gli screenshot di prova non sono più nel sito", () => {
    assert.equal(fs.existsSync(path.join(ROOT, "shots")), false);
  });

  test("il manifest ha un'icona adattiva che esiste", () => {
    const m = JSON.parse(leggi("site.webmanifest"));
    const mask = m.icons.find((i) => /maskable/.test(i.purpose || ""));
    assert.ok(mask, "icona maskable");
    assert.ok(fs.existsSync(path.join(ROOT, mask.src)));
  });

  test("consenso cookie: una scelta di oltre 6 mesi fa viene richiesta di nuovo", async () => {
    const vecchia = JSON.stringify({ v: 1, funzionali: false, data: new Date(Date.now() - 181 * 864e5).toISOString() });
    const a = await apri("news.html", { banner: true, storage: { "onit-consenso-cookie": vecchia } });
    assert.equal(await a.page.isVisible("#cookieBanner"), true, "scelta vecchia: il banner torna");
    await a.chiudi();
    const recente = JSON.stringify({ v: 1, funzionali: false, data: new Date(Date.now() - 170 * 864e5).toISOString() });
    const b = await apri("news.html", { banner: true, storage: { "onit-consenso-cookie": recente } });
    assert.equal(await b.page.isVisible("#cookieBanner"), false, "scelta recente: il banner resta chiuso");
    await b.chiudi();
  });

  test("la cookie policy elenca tutte le memorie tecniche", () => {
    const p = leggi("privacy.html");
    for (const k of ["onit-consenso-cookie", "onit-animazioni", "onit-nav", "onit-fx-intro"]) assert.ok(p.includes(k), k);
  });

  test("i Termini riportano garanzia, dominio e server e area clienti", () => {
    const t = leggi("termini.html");
    assert.match(t, /Garanzia/);
    assert.match(t, /1 anno/);
    assert.match(t, /2 anni/);
    assert.match(t, /Dominio e server/);
    assert.match(t, /Area clienti/);
    assert.match(t, /15 novembre 2026/);
  });

  test("la pagina Recensioni dice come vengono verificate", () => {
    assert.match(leggi("recensioni.html"), /solo recensioni di chi ha un progetto con ON\.IT/i);
  });

  test("le pagine riservate non si lasciano incorporare in altri siti", () => {
    for (const f of ["accedi.html", "area.html", "admin.html"]) assert.match(leggi(f), /top\s*!==\s*self/, f);
  });

  test("Accedi: il pulsante «Mostra password» rende leggibile la password", async () => {
    const { page, chiudi } = await apri("accedi.html", { attesa: 1500 });
    await page.fill("#password", "segreta123");
    assert.equal(await page.getAttribute("#password", "type"), "password");
    await page.click("#pwToggle");
    assert.equal(await page.getAttribute("#password", "type"), "text");
    assert.equal(await page.getAttribute("#pwToggle", "aria-pressed"), "true");
    await page.click("#pwToggle");
    assert.equal(await page.getAttribute("#password", "type"), "password");
    await chiudi();
  });

  test("pannello admin: c'è il pulsante per scaricare il backup", () => {
    assert.match(leggi("admin.html"), /id="backupBtn"/);
  });
});

/* -------------------------------------------------------------------------- */
describe("Home", () => {
  test("prima schermata: frasi iconiche, tre fatti e spazio per il 3D", async () => {
    const { page, chiudi } = await apri("index.html");
    const h1 = (await page.innerText(".hero h1")).replace(/\s+/g, " ").trim().toLowerCase();
    assert.equal(h1, "il tuo sito. fatto bene. subito online.");
    assert.equal(await page.locator(".hero-facts li").count(), 3);
    assert.equal(await page.locator('.hero [data-3d="keys"]').count(), 1);
    await chiudi();
  });

  test("le parole visibili scendono da 880 a non più di 620", async () => {
    const { page, chiudi } = await apri("index.html");
    const n = parole(await page.evaluate(() => document.querySelector("main").innerText));
    await chiudi();
    assert.ok(n <= 620, `parole visibili: ${n}`);
  });

  test("etichette uniformi", () => {
    const html = leggi("index.html");
    assert.doesNotMatch(html, /Scopri i piani/);
    assert.doesNotMatch(html, /SEO di base/);
    assert.doesNotMatch(html, /su richiesta\./);
    assert.doesNotMatch(html, /Acquista il servizio/);
  });

  test("il confronto tra i piani è chiuso e si apre a richiesta", async () => {
    const { page, chiudi } = await apri("index.html");
    assert.equal(await page.isVisible("table.cmp"), false);
    assert.equal(await page.getAttribute(".cmp-toggle", "aria-expanded"), "false");
    await page.click(".cmp-toggle");
    assert.equal(await page.getAttribute(".cmp-toggle", "aria-expanded"), "true");
    assert.equal(await page.isVisible("table.cmp"), true);
    await chiudi();
  });

  test("cinque domande frequenti in Home, apribili, con collegamento alla pagina completa", async () => {
    const { page, chiudi } = await apri("index.html");
    assert.equal(await page.locator("#domande .faq-item").count(), 5);
    const q = page.locator("#domande .faq-q").first();
    assert.equal(await q.getAttribute("aria-expanded"), "false");
    await q.click();
    assert.equal(await q.getAttribute("aria-expanded"), "true");
    assert.equal(await page.locator("#domande .faq-a").first().isVisible(), true);
    assert.equal(await page.locator('#domande a[href="faq.html"]').count(), 1);
    await chiudi();
  });

  test("metodo: i quattro passi hanno un tasto 3D numerato", async () => {
    const { page, chiudi } = await apri("index.html");
    const tasti = await page.$$eval("#metodo .step .k3d", (ks) => ks.map((k) => k.textContent.trim()));
    await chiudi();
    assert.deepEqual(tasti, ["1", "2", "3", "4"]);
  });
});

/* -------------------------------------------------------------------------- */
describe("modulo di contatto", () => {
  const visibili = (page) => page.$$eval("#bookingForm input:not([type=radio]):not([type=checkbox]):not(.hp), #bookingForm select, #bookingForm textarea",
    (els) => els.filter((e) => e.offsetParent !== null).map((e) => e.name));

  test("assistenza: restano solo nome, attività, email e messaggio", async () => {
    const { page, chiudi } = await apri("index.html");
    await page.locator('#bookingForm input[name="tipo"][value="assistenza"]').check({ force: true });
    assert.deepEqual((await visibili(page)).sort(), ["attivita", "email", "messaggio", "nome"]);
    await chiudi();
  });

  test("incontro: compaiono data, fascia oraria e modalità; il telefono è facoltativo", async () => {
    const { page, chiudi } = await apri("index.html");
    await page.locator('#bookingForm input[name="tipo"][value="incontro"]').check({ force: true });
    const v = await visibili(page);
    for (const n of ["nome", "email", "data", "orario", "modalita", "telefono", "messaggio"]) assert.ok(v.includes(n), n);
    assert.equal(await page.getAttribute("#telefono", "required"), null);
    await chiudi();
  });

  test("incontro per telefono: il numero diventa obbligatorio", async () => {
    const { page, chiudi } = await apri("index.html");
    await page.locator('#bookingForm input[name="tipo"][value="incontro"]').check({ force: true });
    await page.selectOption("#modalita", "Telefonata");
    assert.notEqual(await page.getAttribute("#telefono", "required"), null);
    await chiudi();
  });

  test("preventivo: compaiono attività e piano, non la data", async () => {
    const { page, chiudi } = await apri("index.html");
    await page.locator('#bookingForm input[name="tipo"][value="acquisto"]').check({ force: true });
    const v = await visibili(page);
    assert.ok(v.includes("piano") && v.includes("attivita"));
    assert.ok(!v.includes("data") && !v.includes("telefono"));
    await chiudi();
  });

  test("invio vuoto: ogni campo obbligatorio spiega l'errore e il primo riceve il fuoco", async () => {
    const { page, chiudi } = await apri("index.html");
    await page.locator('#bookingForm button[type="submit"]').click();
    for (const id of ["nome", "email", "privacy"]) {
      assert.equal(await page.getAttribute("#" + id, "aria-invalid"), "true", id);
      const descr = await page.getAttribute("#" + id, "aria-describedby");
      assert.ok(descr, id + " ha una descrizione");
      const testo = await page.textContent("#" + descr.split(" ")[0]);
      assert.ok(testo.trim().length > 8, id + ": " + testo);
    }
    assert.equal(await page.evaluate(() => document.activeElement.id), "nome");
    await chiudi();
  });

  test("email scritta male: messaggio specifico", async () => {
    const { page, chiudi } = await apri("index.html");
    await page.fill("#nome", "Mario Rossi");
    await page.fill("#email", "mario@");
    await page.locator('#bookingForm button[type="submit"]').click();
    assert.equal(await page.getAttribute("#nome", "aria-invalid"), null);
    assert.match(await page.textContent("#err-email"), /email/i);
    await chiudi();
  });

  test("invio corretto: conferma visibile e nessun campo nascosto nel messaggio", async () => {
    const { page, chiudi } = await apri("index.html");
    let corpo = null;
    await page.route("https://formsubmit.co/**", (r) => { corpo = JSON.parse(r.request().postData()); r.fulfill({ status: 200, contentType: "application/json", body: '{"success":"true"}' }); });
    await page.locator('#bookingForm input[name="tipo"][value="assistenza"]').check({ force: true });
    await page.fill("#nome", "Mario Rossi");
    await page.fill("#email", "mario@example.com");
    await page.fill("#messaggio", "Vorrei cambiare una foto.");
    await page.locator("#privacy").check({ force: true });
    await page.locator('#bookingForm button[type="submit"]').click();
    await page.waitForSelector("#formStatus.is-visible:not(.is-error)");
    assert.match(await page.textContent("#formStatus"), /ricevuto/i);
    assert.equal(corpo["Nome e cognome"], "Mario Rossi");
    assert.equal("Telefono" in corpo, false);
    assert.equal("Data preferita" in corpo, false);
    await chiudi();
  });
});

/* -------------------------------------------------------------------------- */
describe("pagina Domande", () => {
  test("almeno 30 risposte in 8 argomenti", async () => {
    const { page, chiudi } = await apri("faq.html");
    assert.ok(await page.locator("#faqList .faq-item").count() >= 30);
    assert.equal(await page.locator("#faqCats [data-cat]:not([data-cat='tutte'])").count(), 8);
    await chiudi();
  });

  test("la ricerca lascia solo le risposte che contengono la parola", async () => {
    const { page, chiudi } = await apri("faq.html");
    const tutte = await page.locator("#faqList .faq-item:visible").count();
    await page.fill("#faqSearch", "dominio");
    await page.waitForTimeout(250);
    const trovate = await page.locator("#faqList .faq-item:visible").count();
    assert.ok(trovate > 0 && trovate < tutte, `trovate ${trovate} su ${tutte}`);
    const testi = await page.$$eval("#faqList .faq-item", (els) => els.filter((e) => e.offsetParent !== null).map((e) => e.textContent.toLowerCase()));
    for (const t of testi) assert.ok(t.includes("domini"), t.slice(0, 60));
    assert.match(await page.textContent("#faqCount"), new RegExp(String(trovate)));
    await page.fill("#faqSearch", "");
    await page.waitForTimeout(250);
    assert.equal(await page.locator("#faqList .faq-item:visible").count(), tutte);
    await chiudi();
  });

  test("la ricerca ignora maiuscole e accenti", async () => {
    const { page, chiudi } = await apri("faq.html");
    await page.fill("#faqSearch", "GARANZÌA");
    await page.waitForTimeout(250);
    assert.ok(await page.locator("#faqList .faq-item:visible").count() > 0);
    await chiudi();
  });

  test("nessun risultato: compare l'invito a scrivere", async () => {
    const { page, chiudi } = await apri("faq.html");
    await page.fill("#faqSearch", "xyzzyqq");
    await page.waitForTimeout(250);
    assert.equal(await page.locator("#faqList .faq-item:visible").count(), 0);
    assert.equal(await page.isVisible("#faqEmpty"), true);
    assert.ok(await page.locator("#faqEmpty a").count() >= 1);
    await chiudi();
  });

  test("il filtro per argomento mostra solo quell'argomento", async () => {
    const { page, chiudi } = await apri("faq.html");
    const cat = await page.locator("#faqCats [data-cat]:not([data-cat='tutte'])").nth(2).getAttribute("data-cat");
    await page.click(`#faqCats [data-cat="${cat}"]`);
    const cats = await page.$$eval("#faqList .faq-item", (els) => els.filter((e) => e.offsetParent !== null).map((e) => e.getAttribute("data-cat")));
    assert.ok(cats.length > 0);
    assert.deepEqual([...new Set(cats)], [cat]);
    await chiudi();
  });

  test("un collegamento diretto apre la risposta giusta", async () => {
    const a = await apri("faq.html");
    const id = await a.page.locator("#faqList .faq-item").nth(12).getAttribute("id");
    await a.chiudi();
    const { page, chiudi } = await apri("faq.html#" + id, { attesa: 1400 });
    assert.equal(await page.getAttribute(`#${id} .faq-q`, "aria-expanded"), "true");
    assert.equal(await page.locator(`#${id} .faq-a`).isVisible(), true);
    const inVista = await page.evaluate((i) => { const r = document.getElementById(i).getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; }, id);
    assert.equal(inVista, true);
    await chiudi();
  });

  test("dati strutturati FAQPage con tutte le domande", async () => {
    const { page, chiudi } = await apri("faq.html");
    const n = await page.locator("#faqList .faq-item").count();
    const ld = await page.$$eval('script[type="application/ld+json"]', (ss) => ss.map((s) => JSON.parse(s.textContent)));
    await chiudi();
    const faq = ld.find((x) => x["@type"] === "FAQPage");
    assert.ok(faq, "FAQPage");
    assert.equal(faq.mainEntity.length, n);
    assert.ok(faq.mainEntity.every((q) => q.name && q.acceptedAnswer.text && !/<[a-z]/i.test(q.acceptedAnswer.text)));
  });
});

/* -------------------------------------------------------------------------- */
describe("tasti 3D nelle pagine", () => {
  const attesi = { "news.html": "NEWS", "faq.html": "FAQ?", "404.html": "404" };
  for (const pagina in attesi) {
    test(`${pagina}: tasti ${attesi[pagina]} nell'intestazione`, async () => {
      const { page, chiudi } = await apri(pagina);
      const lettere = await page.$$eval(".keys3d .k3d", (ks) => ks.map((k) => k.textContent.trim()).join(""));
      const nascosti = await page.getAttribute(".keys3d", "aria-hidden");
      await chiudi();
      assert.equal(lettere, attesi[pagina]);
      assert.equal(nascosti, "true");
    });
  }
});

/* -------------------------------------------------------------------------- */
describe("animazione d'entrata con i tasti", () => {
  test("grafica completa: i tasti si compongono ad anello attorno al logo", async () => {
    const { page, errori, chiudi } = await apri("index.html?fx=full", { attesa: 500 });
    await page.waitForFunction(() => window.ONITFX && window.ONITFX.keys && window.ONITFX.keys.state === "wheel", null, { timeout: 30000 });
    const k = await page.evaluate(() => ({ n: window.ONITFX.keys.count, pronto: document.querySelector('[data-3d="keys"]').classList.contains("is-ready"), tela: !!document.querySelector('[data-3d="keys"] canvas') }));
    await chiudi();
    assert.ok(k.n >= 40, "tasti: " + k.n);
    assert.equal(k.pronto, true);
    assert.equal(k.tela, true);
    assert.deepEqual(errori, []);
  });

  test("un clic sul logo richiude i tasti a sfera e poi li riapre", async () => {
    const { page, chiudi } = await apri("index.html?fx=full", { attesa: 500 });
    await page.waitForFunction(() => window.ONITFX.keys && window.ONITFX.keys.state === "wheel", null, { timeout: 30000 });
    const c = await page.evaluate(() => { const r = document.querySelector(".hero-stage").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(c.x, c.y);
    await page.mouse.down(); await page.mouse.up();
    await page.waitForFunction(() => window.ONITFX.keys.state === "sphere", null, { timeout: 15000 });
    await page.waitForFunction(() => window.ONITFX.keys.state === "wheel", null, { timeout: 30000 });
    await chiudi();
  });

  test("un clic su un tasto lo preme", async () => {
    const { page, chiudi } = await apri("index.html?fx=full", { attesa: 500 });
    await page.waitForFunction(() => window.ONITFX.keys && window.ONITFX.keys.state === "wheel", null, { timeout: 30000 });
    const s = await page.evaluate(() => { const r = document.querySelector(".hero-stage").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; });
    let premuti = 0;
    for (let a = 0; a < 16 && !premuti; a++) {
      const ang = a * 0.39;
      await page.mouse.move(s.x + Math.cos(ang) * s.w * 0.36, s.y + Math.sin(ang) * s.w * 0.36);
      await page.mouse.down(); await page.mouse.up();
      await page.waitForTimeout(120);
      premuti = await page.evaluate(() => window.ONITFX.keys.pressed);
    }
    await chiudi();
    assert.ok(premuti >= 1, "nessun tasto premuto");
  });

  test("movimento ridotto: anello già composto, senza animazione d'entrata", async () => {
    const { page, chiudi } = await apri("index.html?fx=full", { reducedMotion: "reduce", attesa: 500 });
    await page.waitForFunction(() => window.ONITFX.keys && window.ONITFX.keys.state === "wheel", null, { timeout: 30000 });
    assert.equal(await page.evaluate(() => window.ONITFX.keys.intro), false);
    await chiudi();
  });

  test("dispositivo senza scheda grafica: al posto del 3D c'è l'anello disegnato", async () => {
    const { page, chiudi } = await apri("index.html", { attesa: 1500 });
    assert.equal(await page.locator(".hero-stage .keys-fallback svg").count(), 1);
    assert.equal(await page.locator('[data-3d="keys"] canvas').count(), 0);
    await chiudi();
  });
});
