/* ==========================================================================
   ON.IT — modelli 3D interattivi (caricati solo quando servono)
   - "blob": goccia di metallo liquido nell'intestazione della Home, con una
     nube di particelle. Segue il puntatore, si trascina e schizza al clic.
   - "devices": portatile, tablet e smartphone con il sito che scorre sugli
     schermi. Si ruotano trascinando; un clic apre, gira o ruota il dispositivo.
   ========================================================================== */
import * as THREE from "../vendor/three/three.module.min.js";

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const INTERACTIVE = "a, button, input, select, textarea, label, summary, [role='button']";

export function init(FX) {
  // una scena per volta, così il caricamento non blocca la pagina
  [...document.querySelectorAll("[data-3d]")].forEach((el, i) => {
    setTimeout(() => {
      try {
        const kind = el.getAttribute("data-3d");
        if (kind === "blob") Blob(el, FX);
        else if (kind === "devices") Devices(el, FX);
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
   Goccia di metallo liquido
   ------------------------------------------------------------------------ */
function Blob(el, FX) {
  const mobile = window.innerWidth < 760;
  const st = stage(el, { antialias: !mobile, maxDpr: mobile ? 1.5 : 1.75 });
  const { renderer } = st;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);
  st.onResize = (w, h) => { camera.aspect = w / h; camera.updateProjectionMatrix(); };
  st.onResize(st.w, st.h);

  const group = new THREE.Group();
  scene.add(group);

  const U = {
    uTime: { value: 0 }, uAmp: { value: 0.15 }, uHover: { value: 0 },
    uMouse: { value: new THREE.Vector3(0, 0, 1) }, uHitDir: { value: new THREE.Vector3(0, 0, 1) },
    uHitAge: { value: 99 }, uEnvRot: { value: 0 }, uFlash: { value: 0 }
  };

  const blobMat = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: `
      uniform float uTime,uAmp,uHover,uHitAge;uniform vec3 uMouse,uHitDir;
      varying vec3 vN;varying vec3 vV;
      ${NOISE}
      float disp(vec3 n){
        float d=snoise(n*.95+vec3(0.,0.,uTime*.3))*uAmp;
        d+=snoise(n*1.9-vec3(uTime*.2))*uAmp*.28;
        d+=pow(max(dot(n,uMouse),0.),6.)*uHover*.15;
        float ang=acos(clamp(dot(n,uHitDir),-1.,1.));
        d+=sin(ang*9.-uHitAge*13.)*exp(-uHitAge*1.7)*exp(-ang*1.1)*.15;
        return d;
      }
      void main(){
        vec3 n=normalize(position);float R=length(position);
        vec3 t1=normalize(cross(n,abs(n.y)<.99?vec3(0.,1.,0.):vec3(1.,0.,0.)));
        vec3 t2=cross(n,t1);float e=.015;
        vec3 n1=normalize(n+t1*e),n2=normalize(n+t2*e);
        vec3 p0=n*(R+disp(n)),p1=n1*(R+disp(n1)),p2=n2*(R+disp(n2));
        vec3 nn=normalize(cross(p1-p0,p2-p0));if(dot(nn,n)<0.)nn=-nn;
        vec4 mv=modelViewMatrix*vec4(p0,1.);
        vV=mv.xyz;vN=normalize(normalMatrix*nn);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      uniform float uEnvRot,uFlash;varying vec3 vN;varying vec3 vV;
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
      void main(){
        vec3 N=normalize(vN),V=normalize(-vV);vec3 R=reflect(-V,N);
        float cs=cos(uEnvRot),sn=sin(uEnvRot);R=vec3(cs*R.x+sn*R.z,R.y,-sn*R.x+cs*R.z);
        float fr=pow(1.-max(dot(N,V),0.),3.);
        float c=env(R)*(.7+.3*fr)+pow(fr,2.)*.32+uFlash*.22;
        c=clamp(c,0.,1.);
        gl_FragColor=vec4(vec3(c),1.);
      }`
  });
  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, mobile ? 30 : 56), blobMat);
  group.add(blob);

  // Nube di particelle attorno alla goccia
  const N = mobile ? 900 : 2200;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const ring = Math.random() < 0.55;
    const a = Math.random() * Math.PI * 2;
    const r = ring ? 1.85 + Math.random() * 0.75 : 1.7 + Math.pow(Math.random(), 0.6) * 1.4;
    const y = ring ? (Math.random() - 0.5) * 0.18 : (Math.random() * 2 - 1);
    const rr = ring ? r : r * Math.sqrt(1 - y * y);
    pos[i * 3] = Math.cos(a) * rr;
    pos[i * 3 + 1] = ring ? y : y * r;
    pos[i * 3 + 2] = Math.sin(a) * rr;
    seed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const PU = { uTime: U.uTime, uBurst: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uEnergy: { value: 0 } };
  const pMat = new THREE.ShaderMaterial({
    uniforms: PU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime,uBurst,uPR,uEnergy;attribute float aSeed;varying float vA;
      void main(){
        vec3 p=position*(1.+uBurst*(.35+aSeed*.9));
        p.y+=sin(uTime*(.6+aSeed)+aSeed*20.)*.05;
        vec4 mv=modelViewMatrix*vec4(p,1.);
        gl_PointSize=(1.2+aSeed*2.4)*(1.+uEnergy*.6)*uPR*(6./-mv.z);
        vA=.25+.55*fract(aSeed*7.13+uTime*.05*(1.+aSeed));vA*=.6+.4*sin(uTime*2.+aSeed*40.);
        gl_Position=projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(1.),vA*(1.-d*2.)*.9);}`
  });
  const cloud = new THREE.Points(pGeo, pMat);
  cloud.rotation.x = 0.35;
  scene.add(cloud);

  // Interazione
  const ray = new THREE.Raycaster();
  const sphere = new THREE.Sphere(new THREE.Vector3(), 1.38);
  const hit = new THREE.Vector3();
  let hover = 0, hoverT = 0, spin = 0, spinVel = 0, drag = null, burst = 0, tiltX = 0, tiltY = 0;

  function pick(cx, cy) {
    const p = ndc(el, cx, cy);
    ray.setFromCamera(new THREE.Vector2(p.x, p.y), camera);
    sphere.center.copy(group.position);
    sphere.radius = 1.38 * group.scale.x;
    return { p, hit: ray.ray.intersectSphere(sphere, hit) };
  }
  function splash(cx, cy) {
    const r = pick(cx, cy);
    const dir = (r.hit ? group.worldToLocal(hit.clone()) : new THREE.Vector3(r.p.x, r.p.y, 1)).normalize();
    U.uHitDir.value.copy(dir);
    U.uHitAge.value = 0;
    burst = 1;
    FX.ripple(cx, cy, 1.1);
    FX.pulse(0.35);
  }

  window.addEventListener("pointerdown", (e) => {
    if (FX.reduce || e.target.closest(INTERACTIVE)) return;
    const r = pick(e.clientX, e.clientY);
    if (!r.hit) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0, type: e.pointerType };
    if (e.pointerType === "mouse") document.documentElement.classList.add("fx-dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || drag.type !== "mouse") return;
    const dx = e.clientX - drag.x;
    drag.moved += Math.abs(dx) + Math.abs(e.clientY - drag.y);
    drag.x = e.clientX; drag.y = e.clientY;
    spinVel = dx * 0.012;
    spin += dx * 0.012;
  });
  window.addEventListener("pointerup", (e) => {
    if (!drag) return;
    if (drag.moved < 8) splash(e.clientX, e.clientY);
    drag = null;
    document.documentElement.classList.remove("fx-dragging");
  });
  window.addEventListener("pointercancel", () => { drag = null; document.documentElement.classList.remove("fx-dragging"); });

  const hero = el.closest(".hero") || el;
  let first = true;
  FX.addTick((t, dt) => {
    if (st.lost || (!st.visible && !first)) return;
    first = false;
    const ptr = FX.pointer;
    let nx = 0, ny = 0, over = false;
    if (ptr.active) {
      const r = pick(ptr.x, ptr.y);
      nx = Math.max(-1.5, Math.min(1.5, r.p.x)); ny = Math.max(-1.5, Math.min(1.5, r.p.y));
      over = !!r.hit;
      if (over) U.uMouse.value.copy(group.worldToLocal(hit.clone()).normalize());
      else U.uMouse.value.lerp(new THREE.Vector3(nx, ny, 0.8).normalize(), 0.08);
    }
    el.classList.toggle("is-hover", over);
    FX.hot = over;
    hoverT = over ? 1 : ptr.active ? Math.max(0, 0.35 - Math.hypot(nx, ny) * 0.12) : 0;
    hover = damp(hover, hoverT, 5, dt);

    if (!FX.reduce) {
      U.uTime.value += dt * (1 + FX.energy * 0.6 + hover * 0.5);
      if (!drag) { spinVel *= Math.pow(0.08, dt); spin += spinVel + dt * 0.12; }
      tiltX = damp(tiltX, -ny * 0.32, 3, dt);
      tiltY = damp(tiltY, nx * 0.45, 3, dt);
    } else {
      U.uTime.value = 2.0;
    }
    U.uHover.value = hover;
    U.uHitAge.value += dt;
    U.uAmp.value = 0.13 + hover * 0.04 + FX.energy * 0.03 - FX.calm * 0.05;
    U.uEnvRot.value = spin * 0.5 + tiltY * 0.8;
    U.uFlash.value = FX.flash;
    burst = damp(burst, 0, 2.2, dt);
    PU.uBurst.value = burst;
    PU.uEnergy.value = FX.energy;

    group.rotation.set(tiltX, spin + tiltY, 0);
    cloud.rotation.y = U.uTime.value * 0.06 + spin * 0.3;
    cloud.rotation.z = Math.sin(U.uTime.value * 0.1) * 0.08;

    // Allontanandosi dall'intestazione la goccia sale e si rimpicciolisce
    const hr = hero.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, -hr.top / Math.max(1, hr.height)));
    group.position.y = k * 1.2;
    cloud.position.y = group.position.y;
    const s = 1 - k * 0.25;
    group.scale.setScalar(s);
    cloud.scale.setScalar(s);

    renderer.render(scene, camera);
  });
  el.classList.add("is-ready");
  document.documentElement.classList.add("fx-3d-hero");
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
  const st = stage(el, { antialias: true, maxDpr: mobile ? 1.75 : 2 });
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
    const c = document.createElement("canvas");
    c.width = visW; c.height = totalH;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
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
