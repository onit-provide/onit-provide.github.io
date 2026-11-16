/* ==========================================================================
   ON.IT — animazione d'entrata: il logo 3D e i tasti di una tastiera
   I tasti arrivano in volo da tutto lo schermo, si chiudono a sfera attorno
   al logo cromato e poi si aprono in un anello che gli gira intorno.
   Si può interagire: trascinare per far girare l'anello, premere i tasti,
   cliccare il logo per richiuderli a sfera. Scorrendo la pagina si disperdono.
   Le funzioni in alto sono pure (niente browser): le prova _tests/tasti3d.test.mjs.
   ========================================================================== */
import * as THREE from "../vendor/three/three.module.min.js";
import { LOGO } from "./logo-shape.js";

export const N_KEYS = 60;
// Misure in unità di scena: il passo tra due tasti vicini è 1
export const KEY = { base: 0.9, top: 0.6, h: 0.62, logoWidth: 3.9 };

/* Simboli stampati sui tasti: 64 caselle in una griglia 8×8.
   Quelli che iniziano con ":" sono disegnati a tratto, gli altri sono testo. */
export const GLYPHS = [
  "O", "N", ".", "I", "T", "L", "U", "S", "F", "A", "B", "E", "Q", "W", "R", "Y",
  "P", "D", "G", "H", "J", "K", "Z", "X", "C", "V", "M", "0", "1", "2", "3", "4",
  "5", "6", "7", "8", "9", "@", "#", "&", "%", "€", "?", "!", "+", "=", "/", "<",
  ">", "{", "}", "*", ":left", ":right", ":up", ":down", ":enter", ":shift", ":back", "esc", "tab", "alt", "ctrl", "fn"
];

const TAU = Math.PI * 2;
const RING_TILT = -(Math.PI / 2 - 0.56);   // l'anello è visto da circa 32° sopra il suo piano

/* --------------------------------------------------------------------------
   Forma del tasto: tronco di piramide con spigoli arrotondati e conca in cima
   -------------------------------------------------------------------------- */
export function keycapGeometry() {
  const SEG = 4, M = 4 * (SEG + 1);
  // anelli dal basso verso l'alto: [altezza, mezzo lato, raggio dell'angolo]
  const rings = [
    [0.0, KEY.base / 2, 0.085],
    [0.05, KEY.base / 2, 0.085],
    [0.52, 0.345, 0.11],
    [0.585, 0.327, 0.115],
    [0.613, 0.3, 0.11],
    [KEY.h, 0.266, 0.1],
    [0.607, 0.17, 0.07],
    [0.6, 0.08, 0.035]
  ];
  const pos = [];
  const ring = (y, half, rad) => {
    const start = pos.length / 3;
    for (let c = 0; c < 4; c++) {
      const cx = (c === 0 || c === 3 ? 1 : -1) * (half - rad), cz = (c < 2 ? 1 : -1) * (half - rad);
      for (let s = 0; s <= SEG; s++) {
        const a = (c + s / SEG) * Math.PI / 2;
        pos.push(cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad);
      }
    }
    return start;
  };
  const starts = rings.map((r) => ring(r[0], r[1], r[2]));
  const idx = [];
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < M; i++) {
      const a = starts[j] + i, b = starts[j] + (i + 1) % M, c = starts[j + 1] + (i + 1) % M, d = starts[j + 1] + i;
      idx.push(a, c, b, a, d, c);
    }
  }
  // centro della conca
  const top = pos.length / 3;
  pos.push(0, 0.598, 0);
  const last = starts[rings.length - 1];
  for (let i = 0; i < M; i++) idx.push(last + i, top, last + (i + 1) % M);
  // fondo piatto, con vertici propri per tenere netto lo spigolo
  const bottomRing = ring(0, KEY.base / 2, 0.085), bottom = pos.length / 3;
  pos.push(0, 0, 0);
  for (let i = 0; i < M; i++) idx.push(bottomRing + i, bottomRing + (i + 1) % M, bottom);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* --------------------------------------------------------------------------
   Posti dei tasti: sfera e anello
   -------------------------------------------------------------------------- */
function basis(x, y, z) {
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

/* Sfera: file di tasti lungo i paralleli, tutti rivolti verso l'esterno,
   con la scritta dritta rispetto al polo nord. */
export function sphereSlots(n = N_KEYS, R = 2.25) {
  const rows = Math.round(Math.PI * R);
  const slots = [];
  for (let j = 0; j < rows; j++) {
    let lat = -Math.PI / 2 + (j + 0.5) * Math.PI / rows;
    let count = Math.max(1, Math.floor(TAU * R * Math.cos(lat)));
    // vicino ai poli i tasti si toccherebbero: la fila scende un po' verso l'equatore
    while (count > 1 && 2 * R * Math.cos(lat) * Math.sin(Math.PI / count) < KEY.base + 0.06) lat -= Math.sign(lat) * 0.01;
    for (let i = 0; i < count; i++) {
      const az = (i + (j % 2) * 0.5) / count * TAU;
      const out = new THREE.Vector3(Math.cos(lat) * Math.cos(az), Math.sin(lat), Math.cos(lat) * Math.sin(az));
      const east = new THREE.Vector3(-Math.sin(az), 0, Math.cos(az));
      const south = new THREE.Vector3().crossVectors(east, out);
      slots.push({ p: out.clone().multiplyScalar(R), q: basis(east, out, south) });
    }
  }
  // con R = 2.25 i posti sono esattamente 60: se cambia il raggio va ricontrollato
  if (slots.length !== n) throw new Error("sfera: " + slots.length + " posti invece di " + n);
  return slots;
}

/* Anello: tre file attorno al logo. 0 = battistrada (guarda fuori), 1 = faccia
   superiore (guarda lungo l'asse), 2 = fila interna (guarda il logo).
   Coordinate locali dell'anello: asse = Z. */
export function ringSlots() {
  const slots = [];
  const sep = [":enter", ":right", ":shift"];
  const rowsDef = [
    { n: 23, r: 3.75, z: 0, chars: (i) => (i % 6 < 5 ? "ON.IT"[i % 6] : sep[Math.floor(i / 6)]) },
    { n: 20, r: 3.25, z: 0.5, chars: (i) => ("ILTUOSITO" + "^" + "FATTOBENE" + "~")[i].replace("^", ":up").replace("~", ":enter") },
    { n: 17, r: 2.75, z: 0, chars: (i) => (i < 12 ? "SUBITOONLINE"[i] : ["@", "#", "?", "!", "€"][i - 12]) }
  ];
  rowsDef.forEach((def, row) => {
    for (let i = 0; i < def.n; i++) {
      // l'angolo cresce in senso antiorario: sul davanti dell'anello le lettere si leggono da sinistra a destra
      const a = i / def.n * TAU - Math.PI / 2;
      const rad = new THREE.Vector3(Math.cos(a), Math.sin(a), 0), tan = new THREE.Vector3(-Math.sin(a), Math.cos(a), 0);
      const axis = new THREE.Vector3(0, 0, 1);
      let q;
      if (row === 0) q = basis(tan, rad, axis.clone().negate());                                // scritta dritta verso l'asse
      else if (row === 1) q = basis(tan, axis, rad);                                             // scritta dritta verso il centro
      else q = basis(tan.clone().negate(), rad.clone().negate(), axis.clone().negate());         // guarda il logo
      const char = def.chars(i);
      const icon = char.length > 1;
      // tono: 0 scuro, 1 chiaro, 2 grigio
      const tone = row === 0 ? (icon ? 0 : 1) : row === 1 ? (icon ? 1 : 0) : (i < 12 ? 2 : 1);
      slots.push({ p: new THREE.Vector3(rad.x * def.r, rad.y * def.r, def.z), q, row, char, glyph: GLYPHS.indexOf(char), tone });
    }
  });
  return slots;
}

/* Abbina ogni posto della sfera a un posto dell'anello con direzione simile,
   così nell'apertura i tasti si spostano verso l'esterno senza incrociarsi. */
export function pairByAzimuth(sphere, ring) {
  const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), RING_TILT);
  const az = (v) => Math.atan2(v.z, v.x);
  const s = sphere.map((k, i) => [az(k.p), i]).sort((a, b) => a[0] - b[0]);
  const r = ring.map((k, i) => [az(k.p.clone().applyQuaternion(tilt)), i]).sort((a, b) => a[0] - b[0]);
  const map = new Array(sphere.length);
  s.forEach((e, n) => { map[e[1]] = r[n][1]; });
  return map;
}

/* Contorni del logo come forme di three.js, larghe "width" unità */
export function logoShapes(width = KEY.logoWidth) {
  const path = (pts, Type) => {
    const p = new Type();
    for (let i = 0; i < pts.length; i += 2) p[i ? "lineTo" : "moveTo"](pts[i] * width, pts[i + 1] * width);
    p.closePath();
    return p;
  };
  return LOGO.shapes.map((s) => {
    const shape = path(s.outer, THREE.Shape);
    s.holes.forEach((h) => shape.holes.push(path(h, THREE.Path)));
    return shape;
  });
}

/* --------------------------------------------------------------------------
   Scena
   -------------------------------------------------------------------------- */
// Riflessi da studio fotografico, calcolati: pannelli chiari su fondo scuro
const ENV = `
float env(vec3 r){
  float y=r.y;float a=atan(r.z,r.x);
  float c=.015+.03*smoothstep(-.2,.8,y);
  c+=smoothstep(.34,.37,y)*(.88+.12*smoothstep(.95,.55,y));
  c+=smoothstep(.025,.0,abs(y-.16))*.85;
  c+=smoothstep(.12,.08,abs(a-2.1))*smoothstep(-.32,-.28,y)*smoothstep(.3,.26,y)*.95;
  c+=smoothstep(.09,.06,abs(a+1.1))*smoothstep(-.5,-.46,y)*smoothstep(.1,.06,y)*.7;
  c+=smoothstep(-.18,-.15,y)*smoothstep(-.08,-.11,y)*.6;
  c+=smoothstep(-.62,-.66,y)*.22;
  return c;
}
vec3 turn(vec3 r,float k){float cs=cos(k),sn=sin(k);return vec3(cs*r.x+sn*r.z,r.y,-sn*r.x+cs*r.z);}`;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const NOT_HERE = "a, button, input, select, textarea, label, summary, [role='button'], .site-header, .cookie";

// Disegna le 64 caselle dei simboli: bianco su nero, il colore lo sceglie lo shader
function drawAtlas(canvas) {
  const S = canvas.width / 8, x = canvas.getContext("2d");
  x.fillStyle = "#000"; x.fillRect(0, 0, canvas.width, canvas.height);
  x.fillStyle = x.strokeStyle = "#fff";
  x.textAlign = "center"; x.textBaseline = "middle"; x.lineCap = x.lineJoin = "round";
  GLYPHS.forEach((g, i) => {
    const cx = (i % 8 + 0.5) * S, cy = (Math.floor(i / 8) + 0.5) * S, u = S / 128;
    if (g[0] !== ":") {
      x.font = (g.length > 1 ? "800 " + 34 * u : "900 " + 76 * u) + 'px "Montserrat", "Helvetica Neue", Arial, sans-serif';
      x.fillText(g, cx, cy + (g === "." ? -14 * u : 4 * u));
      return;
    }
    x.lineWidth = 10 * u;
    x.beginPath();
    const L = 26 * u, A = 13 * u;
    if (g === ":left" || g === ":right" || g === ":back") {
      const d = g === ":right" ? 1 : -1;
      x.moveTo(cx - d * L, cy); x.lineTo(cx + d * L, cy);
      x.moveTo(cx + d * (L - A), cy - A); x.lineTo(cx + d * L, cy); x.lineTo(cx + d * (L - A), cy + A);
      if (g === ":back") { x.moveTo(cx + L, cy - A); x.lineTo(cx + L, cy + A); }
    } else if (g === ":up" || g === ":down" || g === ":shift") {
      const d = g === ":down" ? 1 : -1;
      x.moveTo(cx, cy - d * L); x.lineTo(cx, cy + d * L);
      x.moveTo(cx - A, cy + d * (L - A)); x.lineTo(cx, cy + d * L); x.lineTo(cx + A, cy + d * (L - A));
      if (g === ":shift") { x.moveTo(cx - A, cy + L); x.lineTo(cx + A, cy + L); }
    } else if (g === ":enter") {
      x.moveTo(cx + L, cy - L * 0.8); x.lineTo(cx + L, cy + A * 0.6); x.lineTo(cx - L, cy + A * 0.6);
      x.moveTo(cx - L + A, cy + A * 0.6 - A); x.lineTo(cx - L, cy + A * 0.6); x.lineTo(cx - L + A, cy + A * 0.6 + A);
    }
    x.stroke();
  });
}

export function Keys(el, FX, { stage, damp }) {
  const stageEl = document.querySelector(".hero-stage");
  const hero = el.closest(".hero") || el;
  const st = stage(el, { antialias: true, maxDpr: 2 });
  const { renderer } = st;
  // se la scheda grafica si ferma, al posto della scena resta l'anello disegnato
  renderer.domElement.addEventListener("webglcontextlost", () => FX.keysFallback());
  const scene = new THREE.Scene();
  const FOV = 28;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 200);
  const view = { x0: -8, x1: 8, y0: -5, y1: 5, dist: 20 };

  // Inquadratura: l'origine della scena cade al centro del segnaposto .hero-stage
  // e l'anello (largo quasi 9 unità) ne riempie la larghezza
  function frame() {
    const hr = el.getBoundingClientRect(), sr = stageEl.getBoundingClientRect();
    const W = Math.max(1, hr.width), H = Math.max(1, hr.height);
    // da telefono l'anello resta dentro lo schermo, da computer supera di poco il segnaposto
    const ppu = Math.min(sr.width / (W < 700 ? 9.3 : 8.3), sr.height / 5.3);
    const dist = H / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * ppu);
    const cx = sr.left - hr.left + sr.width / 2, cy = sr.top - hr.top + sr.height / 2;
    camera.aspect = W / H;
    camera.position.set(0, 0, dist);
    camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    camera.updateProjectionMatrix();
    Object.assign(view, { x0: -cx / ppu, x1: (W - cx) / ppu, y0: -(H - cy) / ppu, y1: cy / ppu, dist });
    // tele grandi: meno pixel per punto, così anche gli schermi 4K restano fluidi
    const pr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.4e6 / (W * H)));
    if (Math.abs(pr - renderer.getPixelRatio()) > 0.05) { renderer.setPixelRatio(pr); renderer.setSize(W, H, false); }
  }
  st.onResize = () => { frame(); scatter(); };

  /* ---- tasti ---- */
  const sphere = sphereSlots(), ring = ringSlots(), pair = pairByAzimuth(sphere, ring);
  const TONES = [0.045, 0.88, 0.3];
  const keys = sphere.map((s, i) => {
    const r = ring[pair[i]];
    return {
      sP: s.p, sQ: s.q, rP: r.p, rQ: r.q, row: r.row, tone: TONES[r.tone], glyph: r.glyph,
      cP: new THREE.Vector3(), cQ: new THREE.Quaternion(), axis: new THREE.Vector3(), speed: 0,
      d1: Math.random(), d2: 0, lift: 0, pressAt: -9, pressAmp: 0, glow: 0
    };
  });
  // l'apertura parte dai poli della sfera
  keys.forEach((k) => { k.d2 = 1 - Math.abs(k.sP.y) / 2.25 + Math.random() * 0.15; });

  function scatter() {
    keys.forEach((k) => {
      const z = -7 + Math.random() * 9.5, s = (view.dist - z) / view.dist;
      k.cP.set((view.x0 + Math.random() * (view.x1 - view.x0)) * s * 1.06, (view.y0 + Math.random() * (view.y1 - view.y0)) * s * 1.06, z);
      k.cQ.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      k.axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      k.speed = 0.4 + Math.random() * 1.2;
    });
  }

  const geo = keycapGeometry();
  const aColor = new THREE.InstancedBufferAttribute(new Float32Array(N_KEYS * 3), 3);
  const aCell = new THREE.InstancedBufferAttribute(new Float32Array(N_KEYS * 2), 2);
  const aGlow = new THREE.InstancedBufferAttribute(new Float32Array(N_KEYS), 1);
  keys.forEach((k, i) => {
    aColor.setXYZ(i, k.tone, k.tone, k.tone);
    aCell.setXY(i, k.glyph % 8, Math.floor(k.glyph / 8));
  });
  geo.setAttribute("aColor", aColor);
  geo.setAttribute("aCell", aCell);
  geo.setAttribute("aGlow", aGlow);

  const atlasCanvas = document.createElement("canvas");
  atlasCanvas.width = atlasCanvas.height = 1024;
  const atlas = new THREE.CanvasTexture(atlasCanvas);
  atlas.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const paintAtlas = () => { drawAtlas(atlasCanvas); atlas.needsUpdate = true; };
  paintAtlas();
  if (document.fonts && document.fonts.load) document.fonts.load('900 76px "Montserrat"').then(paintAtlas).catch(() => {});

  const U = { uAtlas: { value: atlas }, uEnvRot: { value: 0 }, uFlash: { value: 0 } };
  const keyMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `
      attribute vec3 aColor;attribute vec2 aCell;attribute float aGlow;
      varying vec3 vN;varying vec3 vV;varying vec3 vLocal;varying vec3 vColor;varying vec2 vCell;varying float vGlow;
      void main(){
        vec4 mv=modelViewMatrix*(instanceMatrix*vec4(position,1.));
        vN=normalMatrix*(mat3(instanceMatrix)*normal);
        vV=mv.xyz;vLocal=position;vColor=aColor;vCell=aCell;vGlow=aGlow;
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      uniform sampler2D uAtlas;uniform float uEnvRot,uFlash;
      varying vec3 vN;varying vec3 vV;varying vec3 vLocal;varying vec3 vColor;varying vec2 vCell;varying float vGlow;
      ${ENV}
      void main(){
        vec3 N=normalize(vN),V=normalize(-vV);
        vec3 R=turn(reflect(-V,N),uEnvRot);
        float fr=pow(1.-max(dot(N,V),0.),4.);
        vec3 L=normalize(vec3(.45,.8,.55));
        float diff=.2+.66*max(dot(N,L),0.)+.2*max(dot(N,normalize(vec3(-.7,.1,.6))),0.);
        float spec=pow(max(dot(reflect(-L,N),V),0.),28.)*.35;
        // verso la base il tasto è più in ombra: dà spessore
        vec3 base=vColor*mix(.7,1.,smoothstep(0.,.5,vLocal.y));
        // simbolo stampato sulla faccia superiore: chiaro sui tasti scuri, scuro sui chiari
        float top=smoothstep(.565,.595,vLocal.y);
        vec2 uv=vLocal.xz/${KEY.top.toFixed(2)}+.5;
        float ink=0.;
        if(top>.01&&uv.x>0.&&uv.x<1.&&uv.y>0.&&uv.y<1.)ink=texture2D(uAtlas,vec2((vCell.x+uv.x)/8.,1.-(vCell.y+uv.y)/8.)).r*top;
        base=mix(base,vec3(dot(base,vec3(.333))>.5?.04:.96),ink);
        vec3 col=base*diff+vec3(env(R))*(.045+.5*fr)+spec+(vGlow*.2+uFlash*.12);
        gl_FragColor=vec4(col,1.);
      }`
  });
  const mesh = new THREE.InstancedMesh(geo, keyMat, N_KEYS);
  mesh.frustumCulled = false;
  scene.add(mesh);

  /* ---- logo cromato ---- */
  const logoGeo = new THREE.ExtrudeGeometry(logoShapes(), { depth: 0.5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 3, curveSegments: 4 });
  logoGeo.translate(0, 0, -0.25);
  const logo = new THREE.Mesh(logoGeo, new THREE.ShaderMaterial({
    uniforms: { uEnvRot: U.uEnvRot, uFlash: U.uFlash },
    vertexShader: `
      varying vec3 vN;varying vec3 vV;varying float vFront;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vV=mv.xyz;vN=normalMatrix*normal;vFront=smoothstep(.75,.98,normal.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `
      uniform float uEnvRot,uFlash;varying vec3 vN;varying vec3 vV;varying float vFront;
      ${ENV}
      void main(){
        vec3 N=normalize(vN),V=normalize(-vV);vec3 R=turn(reflect(-V,N),uEnvRot);
        float fr=pow(1.-max(dot(N,V),0.),3.);
        float chrome=clamp(env(R)*(.7+.3*fr)+fr*fr*.32,0.,1.);
        float face=.9+.1*env(R);
        gl_FragColor=vec4(vec3(mix(chrome,face,vFront)+uFlash*.2),1.);
      }`
  }));
  scene.add(logo);

  /* ---- polvere attorno all'anello ---- */
  const DUST = st.w < 760 ? 380 : 800;
  const dp = new Float32Array(DUST * 3), ds = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    const a = Math.random() * TAU, r = 4.7 + Math.pow(Math.random(), 0.7) * 3.2;
    dp[i * 3] = Math.cos(a) * r; dp[i * 3 + 1] = Math.sin(a) * r; dp[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
    ds[i] = Math.random();
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  dustGeo.setAttribute("aSeed", new THREE.BufferAttribute(ds, 1));
  const DU = { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uShow: { value: 0 } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: DU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime,uPR;attribute float aSeed;varying float vA;
      void main(){
        vec4 mv=modelViewMatrix*vec4(position,1.);
        gl_PointSize=(1.+aSeed*2.2)*uPR*(14./-mv.z);
        vA=.25+.5*fract(aSeed*7.13)+.25*sin(uTime*1.6+aSeed*40.);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      uniform float uShow;varying float vA;
      void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(1.),vA*(1.-d*2.)*.8*uShow);}`
  }));
  dust.frustumCulled = false;
  scene.add(dust);

  /* ---- stato ---- */
  const info = FX.keys = { state: "intro", count: N_KEYS, pressed: 0, intro: !FX.reduce };
  let clock = 0;            // secondi dall'avvio della scena
  let A = 0;                // 0 = tasti sparsi, 1 = raccolti
  let B = 0, bT = 0;        // 0 = sfera, 1 = anello
  let reopenAt = -1;        // dopo un clic sul logo: quando riaprire l'anello
  let spinS = 0, spinR = 0, spinVel = 0, tiltDrag = 0, px = 0, py = 0, scroll = 0, logoPop = 0, logoHover = 0;
  let hoverKey = -1, drag = null, nextType = 2.5, slow = 1 / 60, frames = 0;
  const full = FX.firstVisit && !FX.reduce;      // l'entrata completa si vede una volta per scheda
  if (FX.reduce) { A = 1; B = bT = 1; info.state = "wheel"; }
  else if (!full) { A = 1; }

  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  const qS = new THREE.Quaternion(), qR = new THREE.Quaternion(), qTilt = new THREE.Quaternion(), qYaw = new THREE.Quaternion();
  const pA = new THREE.Vector3(), pB = new THREE.Vector3(), oA = new THREE.Quaternion(), oB = new THREE.Quaternion(), qT = new THREE.Quaternion();
  const up = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), sc = new THREE.Vector3();
  const mats = keys.map(() => new THREE.Matrix4());

  function press(i, amp, t) {
    keys[i].pressAt = t; keys[i].pressAmp = amp;
  }
  // la pressione si propaga ai tasti vicini, come un'onda
  function pressWave(i, t) {
    const c = new THREE.Vector3().setFromMatrixPosition(mats[i]), p = new THREE.Vector3();
    keys.forEach((k, j) => {
      const d = p.setFromMatrixPosition(mats[j]).distanceTo(c);
      if (j === i) press(j, 1, t); else if (d < 2.4) press(j, 0.45 * (1 - d / 2.4), t + d * 0.06);
    });
  }
  // rientro elastico dopo la pressione
  function pressValue(k, t) {
    const d = t - k.pressAt;
    if (d < 0 || d > 1.2) return 0;
    return k.pressAmp * (d < 0.07 ? d / 0.07 : Math.exp(-(d - 0.07) * 8) * Math.cos((d - 0.07) * 20));
  }

  function layout(t, dt) {
    // verso l'alto l'anello si mette di taglio e coprirebbe il logo: lì si muove meno
    const tilt = RING_TILT + py * (py < 0 ? 0.05 : 0.14) + tiltDrag;
    qTilt.setFromAxisAngle(X, tilt);
    qYaw.setFromAxisAngle(Y, px * 0.2);
    qTilt.premultiply(qYaw);
    qS.setFromAxisAngle(Y, spinS);
    qR.setFromAxisAngle(Z, spinR);
    const lift = scroll * 1.6;
    for (let i = 0; i < N_KEYS; i++) {
      const k = keys[i];
      // sfera
      pA.copy(k.sP).applyQuaternion(qS);
      oA.copy(qS).multiply(k.sQ);
      // anello
      const e = B >= 1 ? 1 : ease(clamp01(B * 1.4 - k.d2 * 0.4));
      if (e > 0) {
        pB.copy(k.rP).applyQuaternion(qR).applyQuaternion(qTilt);
        oB.copy(qTilt).multiply(qR).multiply(k.rQ);
        pA.lerp(pB, e).multiplyScalar(1 + Math.sin(e * Math.PI) * 0.16);
        oA.slerp(oB, e);
      }
      // volo d'entrata e dispersione allo scorrimento
      const fly = A >= 1 ? 0 : 1 - ease(clamp01(A * 1.5 - k.d1 * 0.5));
      const gone = ease(clamp01(scroll * 1.5 - k.d1 * 0.5));
      const away = Math.max(fly, gone * 0.9);
      if (away > 0) {
        qT.setFromAxisAngle(k.axis, t * k.speed).multiply(k.cQ);
        pA.lerp(k.cP, away);
        oA.slerp(qT, away);
      }
      const pv = pressValue(k, t);
      k.lift = damp(k.lift, i === hoverKey ? 1 : 0, 12, dt);
      const bob = FX.reduce ? 0 : Math.sin(t * 1.3 + i * 1.7) * 0.035 * B;
      up.copy(Y).applyQuaternion(oA);
      pA.addScaledVector(up, k.lift * 0.2 - pv * 0.2 + bob);
      pA.y += lift;
      // comparsa: i tasti crescono da zero, uno dopo l'altro
      const pop = full ? ease(clamp01(clock * 3.2 - k.d1 * 1.1)) : ease(clamp01(clock * 2.6 - k.d1 * 0.6));
      // mentre si disperdono rimpiccioliscono, così non restano sopra il testo
      sc.copy(one).multiplyScalar(Math.max(0.0001, (FX.reduce ? 1 : pop) * (1 - gone * gone)));
      mats[i].compose(pA, oA, sc);
      mesh.setMatrixAt(i, mats[i]);
      k.glow = damp(k.glow, (i === hoverKey ? 0.8 : 0) + Math.max(0, pv) * 1.2, 14, dt);
      aGlow.array[i] = k.glow;
    }
    mesh.instanceMatrix.needsUpdate = true;
    aGlow.needsUpdate = true;
  }

  /* ---- puntatore ---- */
  const ray = new THREE.Raycaster(), ndcV = new THREE.Vector2(), inv = new THREE.Matrix4(), lray = new THREE.Ray();
  const box = new THREE.Box3(new THREE.Vector3(-KEY.base / 2, 0, -KEY.base / 2), new THREE.Vector3(KEY.base / 2, KEY.h, KEY.base / 2));
  const hitP = new THREE.Vector3(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  // cosa c'è sotto il puntatore: { key: indice } | { logo: true } | { ring: true } | null
  function pick(cx, cy) {
    const r = el.getBoundingClientRect();
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
    ndcV.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndcV, camera);
    let best = -1, bestD = Infinity;
    for (let i = 0; i < N_KEYS; i++) {
      inv.copy(mats[i]).invert();
      lray.copy(ray.ray).applyMatrix4(inv);
      if (lray.intersectBox(box, hitP)) {
        const d = hitP.applyMatrix4(mats[i]).distanceTo(ray.ray.origin);
        if (d < bestD) { bestD = d; best = i; }
      }
    }
    if (best >= 0) return { key: best };
    if (!ray.ray.intersectPlane(plane, hitP)) return null;
    const lx = hitP.x, ly = hitP.y - scroll * 1.6;
    if (Math.abs(lx) < KEY.logoWidth / 2 + 0.15 && Math.abs(ly) < KEY.logoWidth * LOGO.ratio / 2 + 0.15) return { logo: true };
    if ((lx * lx) / 22 + (ly * ly) / 9 < 1) return { ring: true };
    return null;
  }
  const html = document.documentElement;
  function clearHover() { hoverKey = -1; FX.hot = false; html.classList.remove("fx-key-hover"); }

  window.addEventListener("pointerdown", (e) => {
    if (!st.visible || (e.target.closest && e.target.closest(NOT_HERE))) return;
    const h = pick(e.clientX, e.clientY);
    if (!h) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId, logo: !!h.logo };
    if (h.key !== undefined && info.state !== "intro") {
      pressWave(h.key, clock);
      info.pressed++;
      FX.ripple(e.clientX, e.clientY, 0.9);
    }
    if (e.pointerType === "mouse") html.classList.add("fx-dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = e.clientX; drag.y = e.clientY;
    if (drag.moved > 8) {
      spinVel = -dx * 0.012; spinR += -dx * 0.012;
      tiltDrag = Math.max(-0.11, Math.min(0.5, tiltDrag + dy * 0.004));
    }
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    // clic sul logo: i tasti si richiudono a sfera e poi si riaprono
    if (e && drag.logo && drag.moved < 8 && info.state === "wheel" && !FX.reduce) {
      bT = 0; reopenAt = -1;
      logoPop = 1;
      FX.ripple(e.clientX, e.clientY, 1.1);
      FX.pulse(0.3);
    }
    drag = null;
    html.classList.remove("fx-dragging");
  }
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", () => endDrag(null));

  /* ---- ciclo ---- */
  frame();
  scatter();
  let first = true;
  FX.addTick((_, dt) => {
    if (st.lost || (!st.visible && !first)) { if (hoverKey >= 0 || FX.hot) clearHover(); return; }
    first = false;
    clock += dt;

    // tempi dell'entrata: volo verso la sfera, breve pausa, apertura ad anello
    if (info.state === "intro") {
      if (full) A = clamp01((clock - 0.35) / 1.5);
      if (A >= 1 && clock > (full ? 2.2 : 0.55)) { info.state = "sphere"; bT = 1; logoPop = 1; FX.pulse(0.22); }
    }
    B = clamp01(B + Math.sign(bT - B) * dt / (bT ? 1.15 : 0.8));
    if (B >= 1 && info.state !== "intro") info.state = "wheel";
    if (B <= 0 && info.state === "wheel") { info.state = "sphere"; reopenAt = clock + 0.55; }
    if (reopenAt > 0 && clock >= reopenAt) { reopenAt = -1; bT = 1; logoPop = 1; }

    // puntatore: inclinazione, tasto sotto il cursore
    const ptr = FX.pointer;
    const hr = hero.getBoundingClientRect();
    scroll = FX.reduce ? 0 : clamp01(-hr.top / Math.max(1, hr.height * 0.8));
    let tx = 0, ty = 0;
    if (ptr.active && !FX.reduce) {
      const sr = stageEl.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (ptr.x - sr.left - sr.width / 2) / (window.innerWidth / 2)));
      ty = Math.max(-1, Math.min(1, (ptr.y - sr.top - sr.height / 2) / (window.innerHeight / 2)));
    }
    px = damp(px, tx, 3, dt); py = damp(py, ty, 3, dt);
    if (ptr.active && !drag && info.state !== "intro") {
      const under = document.elementFromPoint(ptr.x, ptr.y);
      const h = under && under.closest(NOT_HERE) ? null : pick(ptr.x, ptr.y);
      hoverKey = h && h.key !== undefined ? h.key : -1;
      // con le animazioni ridotte il logo non si apre: niente invito al clic
      FX.hot = !!h && !!h.logo && !FX.reduce;
      html.classList.toggle("fx-key-hover", !!h && (h.key !== undefined || FX.hot));
    } else if (hoverKey >= 0 || FX.hot) clearHover();

    if (!FX.reduce) {
      spinS += dt * 0.55;
      if (!drag) { spinVel *= Math.pow(0.1, dt); tiltDrag = damp(tiltDrag, 0, 0.6, dt); }
      spinR += dt * 0.16 + (drag ? 0 : spinVel);
      // ogni tanto un tasto si preme da solo, come se qualcuno stesse scrivendo
      if (info.state === "wheel" && clock > nextType && !drag) {
        nextType = clock + 0.9 + Math.random() * 1.8;
        press(Math.floor(Math.random() * N_KEYS), 0.7, clock);
      }
    }
    layout(clock, dt);

    // logo: compare per primo, si rimpicciolisce dentro la sfera, torna grande con l'anello
    logoPop = damp(logoPop, 0, 3.2, dt);
    logoHover = damp(logoHover, FX.hot ? 1 : 0, 9, dt);     // sotto il puntatore il logo si ingrandisce appena: si può cliccare
    const appear = FX.reduce ? 1 : ease(clamp01(clock / 0.6));
    const s = appear * (0.84 + 0.16 * ease(B)) * (1 + Math.sin(logoPop * Math.PI) * 0.1 + logoHover * 0.035) * (1 - scroll * 0.25);
    logo.scale.setScalar(Math.max(0.0001, s));
    logo.rotation.set(-py * 0.16, px * 0.28 + (FX.reduce ? 0 : Math.sin(clock * 0.6) * 0.07), 0);
    logo.position.y = scroll * 1.6 + (FX.reduce ? 0 : Math.sin(clock * 0.9) * 0.05);

    dust.quaternion.copy(qTilt);
    dust.rotateZ(spinR * 0.35);
    dust.position.y = scroll * 1.6;
    DU.uTime.value = clock;
    DU.uShow.value = ease(B) * (1 - scroll);
    U.uEnvRot.value = px * 0.9 + spinR * 0.15;
    U.uFlash.value = FX.flash;

    renderer.render(scene, camera);

    // se il dispositivo fatica, la tela scende di risoluzione
    slow = slow * 0.95 + dt * 0.05;
    if (++frames > 200 && slow > 1 / 38 && renderer.getPixelRatio() > 1) {
      renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() * 0.8));
      renderer.setSize(st.w, st.h, false);
      DU.uPR.value = renderer.getPixelRatio();
      frames = 0; slow = 1 / 60;
    }
  });
  el.classList.add("is-ready");
}
