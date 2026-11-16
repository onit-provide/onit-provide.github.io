/* ==========================================================================
   ON.IT — modelli 3D interattivi (caricati solo quando servono)
   - "keys": logo 3D e tasti dell'animazione d'entrata (in fx3d-keys.js).
   - "devices": portatile, tablet e smartphone con il sito che scorre sugli
     schermi. Si ruotano trascinando; un clic apre, gira o ruota il dispositivo.
   ========================================================================== */
import * as THREE from "../vendor/three/three.module.min.js";

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

export function init(FX) {
  // una scena per volta, così il caricamento non blocca la pagina
  [...document.querySelectorAll("[data-3d]")].forEach((el, i) => {
    setTimeout(() => {
      try {
        const kind = el.getAttribute("data-3d");
        if (kind === "keys") {
          // stesso numero di versione di questo file, così i due moduli restano allineati
          import("./fx3d-keys.js" + new URL(import.meta.url).search)
            .then((m) => m.Keys(el, FX, { stage, damp }))
            .catch(() => { el.classList.add("is-unsupported"); FX.keysFallback(); });
        } else if (kind === "devices") Devices(el, FX);
      } catch (err) {
        el.classList.add("is-unsupported");
      }
    }, i * 120);
  });
}

/* Base comune: renderer, dimensioni e pausa quando non è visibile */
function stage(el, { antialias = true, maxDpr = 2 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  el.appendChild(renderer.domElement);
  const state = { renderer, w: 1, h: 1, visible: true, onResize: null };
  const resize = () => {
    const r = el.getBoundingClientRect();
    state.w = Math.max(1, Math.round(r.width));
    state.h = Math.max(1, Math.round(r.height));
    renderer.setSize(state.w, state.h, false);
    if (state.onResize) state.onResize(state.w, state.h);
  };
  new ResizeObserver(resize).observe(el);
  new IntersectionObserver((en) => { state.visible = en[0].isIntersecting; }, { rootMargin: "100px" }).observe(el);
  renderer.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); el.classList.add("is-unsupported"); state.lost = true; });
  resize();
  return state;
}

function ndc(el, x, y) {
  const r = el.getBoundingClientRect();
  return { x: ((x - r.left) / r.width) * 2 - 1, y: -((y - r.top) / r.height) * 2 + 1, inside: x >= r.left && x <= r.right && y >= r.top && y <= r.bottom };
}

/* ------------------------------------------------------------------------
   Dispositivi: portatile, tablet e smartphone
   ------------------------------------------------------------------------ */
function roundedBox(w, h, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 3, curveSegments: 10 });
  g.center();
  return g;
}

function roundedPlane(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 8);
  // coordinate UV da 0 a 1 sull'intero rettangolo
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x) / w, (p.getY(i) - y) / h);
  return g;
}

// Disegna una pagina del sito ON.IT in miniatura (per gli schermi)
function drawSite(ctx, W, H, mode, logo) {
  const u = W / 100;
  const phone = mode === "phone", desk = mode === "desk";
  const F = (wt, px) => `${wt} ${Math.round(px)}px Montserrat, "Helvetica Neue", Arial, sans-serif`;
  const bar = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
  let y = 0;

  // intestazione
  const hh = phone ? 14 * u : 7 * u;
  bar(0, 0, W, hh, "#000");
  if (logo && logo.naturalWidth) {
    const lh = phone ? 4.6 * u : 2.4 * u;
    ctx.drawImage(logo, 5 * u, (hh - lh) / 2, lh * logo.naturalWidth / logo.naturalHeight, lh);
  }
  if (phone) {
    bar(W - 13 * u, hh / 2 - 2.4 * u, 8 * u, 0.9 * u, "#fff");
    bar(W - 13 * u, hh / 2 + 0.8 * u, 8 * u, 0.9 * u, "#fff");
  } else {
    for (let i = 0; i < 4; i++) bar(W * 0.42 + i * 9 * u, hh / 2 - 0.4 * u, 6 * u, 0.8 * u, "#9a9a9a");
    bar(W - 15 * u, hh / 2 - 1.6 * u, 10 * u, 3.2 * u, "#fff");
  }
  y = hh;

  // titolo principale
  const fs = phone ? 13.5 * u : desk ? 8.4 * u : 10.5 * u;
  y += phone ? 26 * u : 12 * u;
  bar(5 * u, y - fs * 1.35, 14 * u, 0.6 * u, "#bdbdbd");
  ctx.font = F(900, fs);
  ctx.textBaseline = "alphabetic";
  const lines = ["IL TUO SITO.", "FATTO BENE.", "SUBITO ONLINE."];
  lines.forEach((l, i) => {
    const ly = y + i * fs * 0.95 + fs * 0.4;
    if (i === 1) { ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1, fs * 0.03); ctx.strokeText(l, 5 * u, ly); }
    else { ctx.fillStyle = "#fff"; ctx.fillText(l, 5 * u, ly); }
  });
  y += fs * 3.3;
  bar(5 * u, y, W - 10 * u, Math.max(1, 0.15 * u), "#333");
  y += 4 * u;
  for (let i = 0; i < 3; i++) bar(5 * u, y + i * 2.6 * u, (phone ? 80 : 40) * u - i * 6 * u, 1.2 * u, "#8a8a8a");
  y += 10 * u;
  const bw = phone ? 90 * u : 22 * u, bh = phone ? 9 * u : 5 * u;
  bar(5 * u, y, bw, bh, "#fff");
  ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1, 0.3 * u);
  if (phone) ctx.strokeRect(5 * u, y + bh + 2.5 * u, bw, bh); else ctx.strokeRect(5 * u + bw + 2 * u, y, bw * 0.8, bh);
  y += (phone ? bh * 2 + 12 * u : bh + 10 * u);

  // nastro
  bar(0, y, W, Math.max(1, 0.15 * u), "#333");
  ctx.font = F(900, phone ? 6 * u : 3.4 * u);
  ctx.fillStyle = "#fff";
  ctx.fillText("SITI VETRINA  •  DESIGN SU MISURA  •  MOBILE FIRST", 3 * u, y + (phone ? 9 * u : 5.4 * u));
  y += phone ? 14 * u : 8.5 * u;

  // sezione chiara con tre schede
  const lightH = phone ? 120 * u : 46 * u;
  bar(0, y, W, lightH, "#fff");
  ctx.fillStyle = "#000";
  ctx.font = F(900, phone ? 10 * u : 5.4 * u);
  ctx.fillText("SCEGLI COSA", 5 * u, y + (phone ? 18 * u : 10 * u));
  ctx.fillText("TI SERVE.", 5 * u, y + (phone ? 28 * u : 15.6 * u));
  const cy = y + (phone ? 36 * u : 21 * u);
  for (let i = 0; i < 3; i++) {
    const cx = phone ? 5 * u : 5 * u + i * 30.5 * u, cyy = phone ? cy + i * 27 * u : cy;
    const cw = phone ? 90 * u : 28.5 * u, ch = phone ? 24 * u : 21 * u;
    ctx.strokeStyle = "#000"; ctx.lineWidth = Math.max(1, 0.25 * u); ctx.strokeRect(cx, cyy, cw, ch);
    bar(cx + 2 * u, cyy + 2.5 * u, 4 * u, 0.9 * u, "#8a8a8a");
    bar(cx + 2 * u, cyy + 5.5 * u, cw * 0.6, phone ? 2.4 * u : 1.8 * u, "#000");
    bar(cx + 2 * u, cyy + (phone ? 10 : 9) * u, cw * 0.82, 0.9 * u, "#777");
    bar(cx + 2 * u, cyy + (phone ? 13 : 11.5) * u, cw * 0.7, 0.9 * u, "#777");
  }
  y += lightH;

  // sezione scura con griglia
  const darkH = phone ? 110 * u : 40 * u;
  ctx.fillStyle = "#fff";
  ctx.font = F(900, phone ? 10 * u : 5.4 * u);
  ctx.fillText("SITI WEB", 5 * u, y + (phone ? 18 * u : 10 * u));
  ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1, 0.2 * u);
  ctx.strokeText("SU RICHIESTA.", 5 * u, y + (phone ? 28 * u : 15.6 * u));
  const gy = y + (phone ? 36 * u : 21 * u);
  for (let i = 0; i < 4; i++) {
    const cols = phone ? 2 : 4;
    const gw = phone ? 44 * u : 21.5 * u, gh = phone ? 32 * u : 16 * u;
    const gx = 5 * u + (i % cols) * (gw + (phone ? 2 : 1.3) * u), gyy = gy + Math.floor(i / cols) * (gh + 2 * u);
    ctx.strokeStyle = "#333"; ctx.strokeRect(gx, gyy, gw, gh);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1, 0.25 * u); ctx.strokeRect(gx + 2 * u, gyy + 2 * u, 4 * u, 4 * u);
    bar(gx + 2 * u, gyy + 8.5 * u, gw * 0.6, 1.3 * u, "#fff");
    bar(gx + 2 * u, gyy + 11 * u, gw * 0.75, 0.8 * u, "#8a8a8a");
  }
  y += darkH;

  // piani
  const planH = phone ? 150 * u : 46 * u;
  bar(0, y, W, planH, "#fff");
  ctx.fillStyle = "#000";
  ctx.font = F(900, phone ? 10 * u : 5.4 * u);
  ctx.fillText("SCEGLI IL", 5 * u, y + (phone ? 18 * u : 10 * u));
  ctx.fillText("TUO PIANO.", 5 * u, y + (phone ? 28 * u : 15.6 * u));
  const prices = ["80 €", "200 €", "500 €"], names = ["START", "BUSINESS", "PREMIUM"];
  for (let i = 0; i < 3; i++) {
    const px = phone ? 5 * u : 5 * u + i * 30.5 * u, py = phone ? y + 36 * u + i * 37 * u : y + 21 * u;
    const pw = phone ? 90 * u : 28.5 * u, ph = phone ? 34 * u : 22 * u;
    const feat = i === 1;
    bar(px, py, pw, ph, feat ? "#000" : "#fff");
    ctx.strokeStyle = "#000"; ctx.lineWidth = Math.max(1, 0.3 * u); ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = feat ? "#fff" : "#000";
    ctx.font = F(800, phone ? 4.2 * u : 2.2 * u); ctx.fillText(names[i], px + 2.5 * u, py + (phone ? 7 * u : 4.5 * u));
    ctx.font = F(900, phone ? 10 * u : 5.6 * u); ctx.fillText(prices[i], px + 2.5 * u, py + (phone ? 19 * u : 11.5 * u));
    bar(px + 2.5 * u, py + ph - (phone ? 8 : 5.5) * u, pw - 5 * u, phone ? 5 * u : 3.2 * u, feat ? "#fff" : "#000");
  }
  y += planH;

  // piè di pagina
  ctx.fillStyle = "#fff";
  if (logo && logo.naturalWidth) {
    const lh = phone ? 9 * u : 5 * u;
    ctx.drawImage(logo, 5 * u, y + 8 * u, lh * logo.naturalWidth / logo.naturalHeight, lh);
  }
  for (let i = 0; i < 4; i++) bar(5 * u, y + (phone ? 22 : 16) * u + i * 3 * u, (30 - i * 4) * u, 0.9 * u, "#8a8a8a");
}

function Devices(el, FX) {
  const mobile = window.innerWidth < 760;
  const st = stage(el, { antialias: true, maxDpr: 2 });
  const { renderer } = st;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  const lookAt = new THREE.Vector3(0, mobile ? 1.0 : 0.85, 0);
  let camDist = 10;
  st.onResize = (w, h) => {
    camera.aspect = w / h;
    camDist = Math.max(8.4, (mobile ? 6.5 : 7.2) / (2 * Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect));
    camera.updateProjectionMatrix();
  };
  st.onResize(st.w, st.h);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.8); rim.position.set(-5, 3, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(0, 1, 7); scene.add(fill);

  const world = new THREE.Group();
  scene.add(world);

  const silver = new THREE.MeshStandardMaterial({ color: 0xd6d6d6, metalness: 0.55, roughness: 0.32 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x1b1b1b, metalness: 0.5, roughness: 0.38 });
  const black = new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.2, roughness: 0.5 });

  // schermi: una pagina lunga che scorre
  const logo = new Image();
  logo.src = "assets/img/logo-white.png";
  const screens = [];
  function screen(mode, w, h, visW, visH, totalH) {
    // su computer le pagine sugli schermi sono disegnate più grandi, per testi nitidi
    const f = mobile ? 1 : Math.min(1.3, 4096 / totalH);
    const c = document.createElement("canvas");
    c.width = Math.round(visW * f); c.height = Math.round(totalH * f);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.repeat.set(1, visH / totalH);
    tex.offset.set(0, 1 - visH / totalH);
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    const mesh = new THREE.Mesh(roundedPlane(w, h, Math.min(w, h) * 0.04), mat);
    const s = { c, tex, mat, mode, rep: visH / totalH, phase: Math.random() * 6, bright: 1 };
    screens.push(s);
    const paint = () => { drawSite(c.getContext("2d"), c.width, c.height, mode, logo); tex.needsUpdate = true; };
    paint();
    logo.addEventListener("load", paint);
    if (document.fonts && document.fonts.load) document.fonts.load('900 40px "Montserrat"').then(paint).catch(() => {});
    return { mesh, s };
  }

  // Schermo che ruota come su un dispositivo vero: dopo la rotazione il
  // contenuto gira di 90° e passa alla versione orizzontale del sito
  function rotScreen(inner, W, H, z, portrait, landscape) {
    const p = screen(portrait[0], W, H, portrait[1], portrait[2], portrait[3]);
    const l = screen(landscape[0], H, W, landscape[1], landscape[2], landscape[3]);
    const pp = new THREE.Group(), pl = new THREE.Group();
    pp.position.z = z; pl.position.z = z + 0.002;
    pp.add(p.mesh); pl.add(l.mesh);
    [p, l].forEach((x) => { x.s.mat.transparent = true; x.s.mat.depthWrite = false; });
    l.s.mat.opacity = 0; l.mesh.visible = false;
    inner.add(pp, pl);
    return { W, H, pp, pl, p: p.s, l: l.s, pm: p.mesh, lm: l.mesh, c: 0 };
  }
  // scala che tiene un rettangolo w×h, ruotato di a, dentro lo schermo W×H
  function fit(w, h, W, H, a) {
    const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    return Math.min(1, W / (w * c + h * s), H / (w * s + h * c));
  }
  function turnScreen(rs, land, landT, dt) {
    // il contenuto parte quando il dispositivo ha quasi finito di ruotare
    if (Math.abs(land - landT) < 0.3) rs.c = damp(rs.c, landT, 6, dt);
    const a = rs.c * Math.PI / 2;
    rs.pp.rotation.z = -a; rs.pl.rotation.z = -a;
    rs.pp.scale.setScalar(fit(rs.W, rs.H, rs.W, rs.H, a));
    rs.pl.scale.setScalar(fit(rs.H, rs.W, rs.W, rs.H, a));
    const k = Math.min(1, Math.max(0, (rs.c - 0.3) / 0.4));
    rs.p.mat.opacity = 1 - k; rs.l.mat.opacity = k;
    rs.pm.visible = k < 1; rs.lm.visible = k > 0;
  }

  const shadowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  function glow(w, d) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.002;
    return m;
  }

  const devices = {};

  // Portatile
  {
    const g = new THREE.Group();
    const base = new THREE.Mesh(roundedBox(3.2, 2.1, 0.09, 0.1), silver);
    base.rotation.x = -Math.PI / 2; base.position.y = 0.06;
    g.add(base);
    const kb = document.createElement("canvas"); kb.width = 512; kb.height = 336;
    const k = kb.getContext("2d");
    k.fillStyle = "#c9c9c9"; k.fillRect(0, 0, 512, 336);
    k.fillStyle = "#1a1a1a";
    for (let r = 0; r < 5; r++) for (let c = 0; c < 13; c++) k.fillRect(28 + c * 35.5, 26 + r * 33, 30, 27);
    k.fillStyle = "#bdbdbd"; k.fillRect(176, 206, 160, 104);
    k.strokeStyle = "#a8a8a8"; k.lineWidth = 2; k.strokeRect(176, 206, 160, 104);
    const kbTex = new THREE.CanvasTexture(kb); kbTex.colorSpace = THREE.SRGBColorSpace;
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.95), new THREE.MeshStandardMaterial({ map: kbTex, metalness: 0.3, roughness: 0.5 }));
    deck.rotation.x = -Math.PI / 2; deck.position.y = 0.122;
    g.add(deck);
    const lid = new THREE.Group();
    lid.position.set(0, 0.15, -1.04);
    const shell = new THREE.Mesh(roundedBox(3.2, 2.1, 0.06, 0.1), silver);
    shell.position.set(0, 1.05, -0.03);
    lid.add(shell);
    const bezel = new THREE.Mesh(roundedPlane(3.1, 2.0, 0.08), black);
    bezel.position.set(0, 1.05, 0.016);
    lid.add(bezel);
    const scr = screen("desk", 2.9, 1.81, 1024, 640, 2240);
    scr.mesh.position.set(0, 1.07, 0.02);
    lid.add(scr.mesh);
    g.add(lid);
    g.add(glow(4.4, 3.2));
    g.position.set(0, 0, -0.5);
    world.add(g);
    devices.laptop = { g, lid, open: 1, openT: 1, lift: 0, liftT: 0, screens: [scr.s] };
  }

  // Tablet
  {
    const g = new THREE.Group();
    const inner = new THREE.Group();
    const body = new THREE.Mesh(roundedBox(1.55, 2.1, 0.07, 0.12), graphite);
    inner.add(body);
    const rs = rotScreen(inner, 1.42, 1.96, 0.05, ["tab", 768, 1060, 2900], ["desk", 1060, 768, 2400]);
    inner.position.y = 1.08;
    inner.rotation.x = -0.12;
    g.add(inner);
    g.add(glow(2.2, 1.4));
    g.position.set(mobile ? -2.05 : -2.55, 0, mobile ? 1.2 : 0.75);
    g.rotation.y = 0.5;
    world.add(g);
    devices.tablet = { g, inner, rs, homeX: g.position.x, land: 0, landT: 0, lift: 0, liftT: 0, screens: [rs.p, rs.l] };
  }

  // Smartphone
  {
    const g = new THREE.Group();
    const inner = new THREE.Group();
    const body = new THREE.Mesh(roundedBox(0.78, 1.6, 0.08, 0.13), black);
    inner.add(body);
    const frame = new THREE.Mesh(roundedBox(0.8, 1.62, 0.05, 0.13), silver);
    inner.add(frame);
    const rs = rotScreen(inner, 0.7, 1.5, 0.056, ["phone", 400, 866, 3600], ["desk", 866, 404, 2300]);
    const cam = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    cam.position.set(0, 0.69, 0.058);
    inner.add(cam);
    inner.position.y = 0.84;
    inner.rotation.x = -0.1;
    g.add(inner);
    g.add(glow(1.3, 0.9));
    g.position.set(mobile ? 1.95 : 2.45, 0, mobile ? 1.5 : 0.95);
    g.rotation.y = -0.5;
    world.add(g);
    devices.phone = { g, inner, rs, land: 0, landT: 0, lift: 0, liftT: 0, screens: [rs.p, rs.l] };
  }

  Object.keys(devices).forEach((name) => devices[name].g.traverse((o) => { o.userData.device = name; }));

  function act(name) {
    const d = devices[name];
    if (!d) return;
    if (name === "laptop") d.openT = d.openT > 0.5 ? 0 : 1;
    if (name === "tablet" || name === "phone") d.landT = d.landT > 0.5 ? 0 : 1;
    d.screens.forEach((s) => { s.bright = 1.6; });
    d.hop = 1;
    FX.pulse(0.2);
    syncButtons();
  }

  const buttons = document.querySelectorAll("[data-device]");
  function syncButtons() {
    buttons.forEach((b) => {
      const n = b.getAttribute("data-device");
      if (n === "laptop") b.textContent = devices.laptop.openT > 0.5 ? "Chiudi il portatile" : "Apri il portatile";
      if (n === "tablet") b.textContent = devices.tablet.landT > 0.5 ? "Raddrizza il tablet" : "Ruota il tablet";
      if (n === "phone") b.textContent = devices.phone.landT > 0.5 ? "Raddrizza lo smartphone" : "Ruota lo smartphone";
    });
  }
  buttons.forEach((b) => b.addEventListener("click", () => act(b.getAttribute("data-device"))));
  const controls = document.querySelector(".showcase-controls");
  if (controls) controls.hidden = false;

  // trascinamento e clic
  const ray = new THREE.Raycaster();
  const v2 = new THREE.Vector2();
  let rotY = 0, rotVel = 0, drag = null, hovered = null;
  function pickDevice(cx, cy) {
    const p = ndc(el, cx, cy);
    if (!p.inside) return null;
    v2.set(p.x, p.y);
    ray.setFromCamera(v2, camera);
    const hits = ray.intersectObjects(world.children, true);
    for (const h of hits) if (h.object.userData.device) return h.object.userData.device;
    return null;
  }
  el.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, type: e.pointerType };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = e.clientX; drag.y = e.clientY;
    if (drag.type === "mouse" || Math.abs(dx) > Math.abs(dy)) { rotVel = dx * 0.006; rotY += dx * 0.006; }
  });
  window.addEventListener("pointerup", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved < 8) {
      const n = pickDevice(e.clientX, e.clientY);
      if (n) { act(n); FX.ripple(e.clientX, e.clientY, 0.9); }
    }
    drag = null;
  });
  window.addEventListener("pointercancel", () => { drag = null; });

  // ingresso: i dispositivi salgono uno dopo l'altro quando la sezione compare
  let entered = FX.reduce ? 1 : 0, enterStart = -1;
  if (!FX.reduce) Object.values(devices).forEach((d) => { d.g.scale.setScalar(0.001); });
  if (!FX.reduce) { devices.laptop.open = 0; devices.laptop.openT = 0; }

  let first = true;
  FX.addTick((t, dt) => {
    if (st.lost || (!st.visible && !first)) return;
    first = false;
    if (!entered) {
      if (enterStart < 0) enterStart = t;
      const e = t - enterStart;
      ["laptop", "tablet", "phone"].forEach((n, i) => {
        const k = Math.min(1, Math.max(0, (e - i * 0.18) / 0.9));
        const s = k === 0 ? 0.001 : 1 + Math.sin(k * Math.PI) * 0.06 * (1 - k) - Math.pow(1 - k, 3);
        devices[n].g.scale.setScalar(Math.max(0.001, s));
        devices[n].g.position.y = (1 - k) * -0.8;
      });
      if (e > 0.6) devices.laptop.openT = 1;
      if (e > 1.4) { entered = 1; syncButtons(); }
    }

    // rotazione del gruppo: trascinamento + lieve oscillazione
    if (!drag) { rotVel *= Math.pow(0.05, dt); rotY += rotVel; rotY = damp(rotY, Math.max(-1.1, Math.min(1.1, rotY)), 6, dt); }
    const sway = FX.reduce ? 0 : Math.sin(t * 0.35) * 0.12;
    world.rotation.y = rotY + sway;

    // passaggio del mouse sopra un dispositivo
    const ptr = FX.pointer;
    hovered = ptr.active && !drag ? pickDevice(ptr.x, ptr.y) : null;
    el.classList.toggle("is-hover", !!hovered);
    const p = ptr.active ? ndc(el, ptr.x, ptr.y) : { x: 0, y: 0 };
    const px = Math.max(-1, Math.min(1, p.x)), py = Math.max(-1, Math.min(1, p.y));
    camera.position.x = damp(camera.position.x, px * 0.6, 3, dt);
    camera.position.y = damp(camera.position.y, 2.1 + py * 0.4, 3, dt);
    camera.position.z = camDist;
    camera.lookAt(lookAt);

    Object.keys(devices).forEach((n, i) => {
      const d = devices[n];
      d.liftT = hovered === n ? 0.18 : 0;
      d.lift = damp(d.lift, d.liftT, 8, dt);
      d.hop = damp(d.hop || 0, 0, 3.5, dt);
      const bob = FX.reduce ? 0 : Math.sin(t * 1.1 + i * 1.7) * 0.045;
      if (entered) d.g.position.y = d.lift + bob + Math.sin((1 - d.hop) * Math.PI) * d.hop * 0.4;
      // la pagina scorre lentamente sugli schermi
      d.screens.forEach((sc) => {
        if (!FX.reduce) {
          sc.phase += dt * 0.09;
          const k = 0.5 - 0.5 * Math.cos(sc.phase);
          sc.tex.offset.y = (1 - sc.rep) * (1 - k);
        }
        sc.bright = damp(sc.bright, 1, 3, dt);
        sc.mat.color.setScalar(Math.min(1, 0.82 + (sc.bright - 1) * 0.5 + (hovered === n ? 0.18 : 0)));
      });
    });

    const L = devices.laptop;
    L.open = damp(L.open, L.openT, 4.5, dt);
    L.lid.rotation.x = (1 - L.open) * (Math.PI / 2 - 0.02) - L.open * 0.26;

    const T = devices.tablet;
    T.land = damp(T.land, T.landT, 5, dt);
    T.inner.rotation.z = T.land * Math.PI / 2;
    T.inner.position.y = 1.08 - T.land * 0.3;
    T.g.position.x = T.homeX + T.land * 0.4;   // in orizzontale è più largo: si avvicina al centro
    turnScreen(T.rs, T.land, T.landT, dt);

    const P = devices.phone;
    P.land = damp(P.land, P.landT, 5, dt);
    P.inner.rotation.z = P.land * Math.PI / 2;
    P.inner.position.y = 0.84 - P.land * 0.36;
    turnScreen(P.rs, P.land, P.landT, dt);

    renderer.render(scene, camera);
  });
  el.classList.add("is-ready");
}
