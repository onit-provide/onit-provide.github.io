/* ==========================================================================
   ON.IT — prove delle forme 3D dell'animazione d'entrata (senza browser)
   Uso:  node --test _tests/tasti3d.test.mjs
   ========================================================================== */
import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "../assets/vendor/three/three.module.min.js";
import { N_KEYS, KEY, keycapGeometry, sphereSlots, ringSlots, logoShapes, pairByAzimuth } from "../assets/js/fx3d-keys.js";
import { LOGO } from "../assets/js/logo-shape.js";

const minDist = (pts) => {
  let m = Infinity;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) m = Math.min(m, pts[i].distanceTo(pts[j]));
  return m;
};

test("il tasto ha le misure previste: base 0,9, altezza 0,62, appoggiato sul piano y = 0", () => {
  const g = keycapGeometry();
  g.computeBoundingBox();
  const b = g.boundingBox;
  assert.ok(Math.abs(b.min.x + KEY.base / 2) < 1e-6 && Math.abs(b.max.x - KEY.base / 2) < 1e-6);
  assert.ok(Math.abs(b.min.z + KEY.base / 2) < 1e-6 && Math.abs(b.max.z - KEY.base / 2) < 1e-6);
  assert.ok(Math.abs(b.min.y) < 1e-6 && Math.abs(b.max.y - KEY.h) < 1e-6);
});

test("tutte le facce del tasto guardano verso l'esterno", () => {
  const g = keycapGeometry();
  const p = g.attributes.position, idx = g.index.array;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3(), o = new THREE.Vector3(0, KEY.h * 0.45, 0);
  assert.equal(idx.length % 3, 0);
  let sbagliate = 0;
  for (let i = 0; i < idx.length; i += 3) {
    a.fromBufferAttribute(p, idx[i]); b.fromBufferAttribute(p, idx[i + 1]); c.fromBufferAttribute(p, idx[i + 2]);
    n.subVectors(b, a).cross(c.clone().sub(a));
    if (n.lengthSq() < 1e-14) continue;                       // triangolo degenere
    const centro = a.clone().add(b).add(c).divideScalar(3).sub(o);
    if (n.dot(centro) <= 0) sbagliate++;
  }
  assert.equal(sbagliate, 0);
  for (const v of p.array) assert.ok(Number.isFinite(v));
});

test("le normali del tasto sono unitarie e la faccia superiore guarda in alto", () => {
  const g = keycapGeometry();
  const p = g.attributes.position, nrm = g.attributes.normal;
  const v = new THREE.Vector3();
  let alto = 0;
  for (let i = 0; i < nrm.count; i++) {
    v.fromBufferAttribute(nrm, i);
    assert.ok(Math.abs(v.length() - 1) < 1e-3);
    if (p.getY(i) > KEY.h - 0.03 && Math.abs(p.getX(i)) < 0.15 && Math.abs(p.getZ(i)) < 0.15) { assert.ok(v.y > 0.9); alto++; }
  }
  assert.ok(alto > 0);
});

test("la sfera ha un posto per ogni tasto, tutti rivolti verso l'esterno e senza sovrapposizioni", () => {
  const s = sphereSlots();
  assert.equal(s.length, N_KEYS);
  const R = s[0].p.length();
  const su = new THREE.Vector3();
  for (const k of s) {
    assert.ok(Math.abs(k.p.length() - R) < 1e-6);
    su.set(0, 1, 0).applyQuaternion(k.q);
    assert.ok(su.dot(k.p.clone().normalize()) > 0.999, "il tasto guarda fuori dalla sfera");
  }
  assert.ok(minDist(s.map((k) => k.p)) >= KEY.base, "distanza minima " + minDist(s.map((k) => k.p)).toFixed(3));
});

test("la sfera contiene il logo", () => {
  const R = sphereSlots()[0].p.length();
  const mezzaDiagonale = Math.hypot(KEY.logoWidth / 2, KEY.logoWidth * LOGO.ratio / 2);
  assert.ok(R > mezzaDiagonale + 0.05, `raggio ${R} contro ${mezzaDiagonale}`);
});

test("l'anello ha tre file, un posto per ogni tasto e nessuna sovrapposizione nella stessa fila", () => {
  const r = ringSlots();
  assert.equal(r.length, N_KEYS);
  for (const fila of [0, 1, 2]) {
    const f = r.filter((k) => k.row === fila);
    assert.ok(f.length >= 15, "fila " + fila);
    assert.ok(minDist(f.map((k) => k.p)) >= KEY.base, "fila " + fila + ": " + minDist(f.map((k) => k.p)).toFixed(3));
  }
});

test("l'anello lascia libero lo spazio del logo", () => {
  // la fila interna guarda verso il centro: la punta dei tasti non deve toccare il logo
  const interna = ringSlots().filter((k) => k.row === 2);
  const punta = interna[0].p.length() - KEY.h;
  assert.ok(punta > Math.hypot(KEY.logoWidth / 2, KEY.logoWidth * LOGO.ratio / 2), "punta dei tasti a " + punta.toFixed(2));
});

test("ogni tasto dell'anello ha un simbolo valido e la fila esterna scrive ON.IT", () => {
  const r = ringSlots();
  for (const k of r) assert.ok(Number.isInteger(k.glyph) && k.glyph >= 0 && k.glyph < 64);
  const esterna = r.filter((k) => k.row === 0).map((k) => k.char).join("");
  assert.ok(esterna.includes("ON.IT"), esterna);
});

test("l'abbinamento sfera-anello usa ogni posto una volta sola", () => {
  const coppie = pairByAzimuth(sphereSlots(), ringSlots());
  assert.equal(coppie.length, N_KEYS);
  assert.equal(new Set(coppie).size, N_KEYS);
});

test("il logo 3D ha cinque forme e la O ha il foro", () => {
  const forme = logoShapes(KEY.logoWidth);
  assert.equal(forme.length, 5);
  assert.equal(forme[0].holes.length, 1);
  const box = new THREE.Box2();
  for (const f of forme) for (const p of f.getPoints()) box.expandByPoint(p);
  assert.ok(Math.abs((box.max.x - box.min.x) - KEY.logoWidth) < 0.02);
});
