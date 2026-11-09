/* ==========================================================================
   ON.IT — effetti visivi
   Sfondo liquido (WebGL), logo che si dissolve in particelle, scritta finale
   a particelle, cursore che inverte i colori, pulsanti magnetici, schede che
   seguono il puntatore e caricamento dei modelli 3D.
   Tutto è decorativo: se WebGL non c'è o il visitatore preferisce meno
   movimento, il sito resta leggibile e funziona come prima.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  // ?fx=full forza gli effetti completi (utile per le prove)
  var forceFull = /[?&]fx=full\b/.test(location.search);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function now() { return performance.now() / 1000; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ------------------------------------------------------------------------
     Stato condiviso: energia e tonalità cambiano con le azioni del visitatore
     ------------------------------------------------------------------------ */
  var FX = window.ONITFX = {
    reduce: reduce,
    lite: reduce,   // versione leggera: liquido fermo e niente 3D (movimento ridotto o grafica senza GPU)
    finePointer: finePointer,
    pointer: { x: -9999, y: -9999, active: false },
    energy: 0,      // sale passando su link e pulsanti o scorrendo veloce
    calm: 0,        // sale mentre si compila il modulo
    flash: 0,       // impulso breve (clic sul modello 3D, invio del modulo)
    phase: 0,       // tempo del liquido, accelera con l'energia
    ripples: [],    // onde partite da un clic, in coordinate di pagina
    ticks: [],
    addTick: function (fn) { FX.ticks.push(fn); },
    ripple: function (cx, cy, strength) {
      if (reduce) return;
      FX.ripples.push({ x: cx + window.scrollX, y: cy + window.scrollY, t: now(), s: strength || .6 });
      if (FX.ripples.length > 4) FX.ripples.shift();
    },
    pulse: function (amount) { if (!reduce) FX.flash = Math.min(1, FX.flash + amount); }
  };

  var hoverEnergy = 0, scrollEnergy = 0, calmTarget = 0, lastScroll = window.scrollY;
  var INTERACTIVE = "a, button, input, select, textarea, label, summary, [role='button'], [data-3d]";

  doc.addEventListener("pointermove", function (e) {
    FX.pointer.x = e.clientX; FX.pointer.y = e.clientY;
    FX.pointer.active = e.pointerType === "mouse" || e.pointerType === "pen";
  }, { passive: true });
  doc.addEventListener("pointerleave", function () { FX.pointer.active = false; });
  doc.documentElement.addEventListener("mouseleave", function () { FX.pointer.active = false; });

  doc.addEventListener("pointerover", function (e) {
    hoverEnergy = e.target.closest && e.target.closest(INTERACTIVE) ? 1 : 0;
  }, { passive: true });

  doc.addEventListener("pointerdown", function (e) {
    var btn = e.target.closest && e.target.closest(".btn, .price-drop-btn, .svc-btn, .filter-btn, .chip");
    FX.ripple(e.clientX, e.clientY, btn ? 1 : .55);
    if (btn) FX.pulse(.18);
  }, { passive: true });

  doc.addEventListener("focusin", function (e) {
    calmTarget = e.target.matches && e.target.matches("input, select, textarea") ? 1 : 0;
  });
  doc.addEventListener("focusout", function () { calmTarget = 0; });

  doc.addEventListener("onit:form-success", function (e) {
    var b = e.detail && e.detail.button, r = b ? b.getBoundingClientRect() : null;
    FX.pulse(.75);
    if (r) FX.ripple(r.left + r.width / 2, r.top + r.height / 2, 1.2);
  });

  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    scrollEnergy = Math.min(1, scrollEnergy + Math.abs(y - lastScroll) / 900);
    lastScroll = y;
  }, { passive: true });

  var lastT = now(), mood = "";
  function loop() {
    var t = now(), dt = Math.min(.05, t - lastT);
    lastT = t;
    scrollEnergy *= Math.pow(.04, dt);
    var target = Math.max(hoverEnergy * .85, scrollEnergy);
    FX.energy += (target - FX.energy) * Math.min(1, dt * 4);
    FX.calm += (calmTarget - FX.calm) * Math.min(1, dt * 2.5);
    FX.flash *= Math.pow(.12, dt);
    if (!reduce) FX.phase += dt * .05 * (1 + FX.energy * 1.8) * (1 - FX.calm * .65);
    while (FX.ripples.length && t - FX.ripples[0].t > 2.4) FX.ripples.shift();

    var m = FX.calm > .5 ? "calm" : FX.energy > .45 ? "energy" : "";
    if (m !== mood) { mood = m; if (m) root.setAttribute("data-fx-mood", m); else root.removeAttribute("data-fx-mood"); }

    for (var i = 0; i < FX.ticks.length; i++) FX.ticks[i](t, dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ------------------------------------------------------------------------
     1. Sfondo liquido
     Un solo contesto WebGL disegna il liquido per ogni sezione visibile e lo
     copia nella tela della sezione: così scorre insieme ai contenuti. Tra una
     sezione scura e una chiara il confine è un'onda di liquido.
     ------------------------------------------------------------------------ */
  var LIQUID_VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var LIQUID_FS = [
    "precision highp float;",
    "uniform vec2 uRes;uniform vec2 uOrigin;uniform float uScale;uniform float uPhase;",
    "uniform vec3 uMouse;uniform float uEnergy;uniform float uFlash;",
    "uniform vec4 uRip[4];uniform float uB;uniform vec2 uTone;uniform vec2 uInt;",
    "float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);",
    " return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}",
    "float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);",
    " for(int i=0;i<4;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}",
    "void main(){",
    " vec2 px=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uScale+uOrigin;",
    " float ph=uPhase;",
    // vortice attorno al puntatore
    " vec2 dm=px-uMouse.xy;float infl=exp(-dot(dm,dm)/(2.*190.*190.))*uMouse.z;",
    " float an=infl*(1.1+uEnergy);float s=sin(an),c=cos(an);",
    " vec2 uv=(uMouse.xy+mat2(c,-s,s,c)*dm)/560.;",
    // onde dei clic
    " float ring=0.;",
    " for(int i=0;i<4;i++){vec4 r=uRip[i];if(r.w>0.){vec2 d=px-r.xy;float L=length(d);",
    "  float w=exp(-pow((L-r.z*640.)/80.,2.))*r.w*(1.-r.z/2.4);ring+=w;uv+=d/(L+1.)*w*.06;}}",
    // liquido: deformazione del dominio a più livelli
    " vec2 q=vec2(fbm(uv+vec2(0.,ph)),fbm(uv+vec2(5.2,1.3)-ph*.8));",
    " vec2 r=vec2(fbm(uv+3.6*q+vec2(1.7,9.2)+ph*.6),fbm(uv+3.6*q+vec2(8.3,2.8)-ph*.5));",
    " float f=fbm(uv+3.6*r);",
    " float v=smoothstep(.22,.88,f);v*=v*.5+.5;v*=.5+.5*length(r);",
    " float ridge=pow(1.-abs(sin(f*18.85)),12.)*smoothstep(.38,.8,f);",
    " v=clamp(v*.85+ridge*.4+infl*(.22+uEnergy*.18)+ring*.5+uFlash*.55,0.,1.);",
    // tonalità della sezione, con il confine a onda verso la sezione precedente
    " float wave=(noise(vec2(px.x/260.,ph*1.7))-.5)*34.+sin(px.x/120.+ph*7.)*4.;",
    " float k=smoothstep(-1.2,1.2,px.y-(uB+wave));",
    " float tone=mix(uTone.x,uTone.y,k),inten=mix(uInt.x,uInt.y,k);",
    // limiti scelti per mantenere il contrasto del testo (WCAG AA)
    " vec3 dark=vec3(v*mix(.11,.22,inten));",
    " vec3 light=vec3(1.-v*.058);",
    " vec3 col=mix(dark,light,tone)+(hash(gl_FragCoord.xy+fract(ph*13.))-.5)/255.;",
    " gl_FragColor=vec4(col,1.);",
    "}"
  ].join("\n");

  function Liquid() {
    var glc = doc.createElement("canvas");
    var gl = glc.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
    if (!gl) return null;
    // Senza accelerazione grafica (o su dispositivi molto deboli) il liquido resta fermo
    var info = gl.getExtension("WEBGL_debug_renderer_info");
    var gpu = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "");
    if (!forceFull && (/swiftshader|llvmpipe|software|basic render/i.test(gpu) || (navigator.hardwareConcurrency || 4) <= 2)) FX.lite = true;
    var still = FX.lite;

    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var vs = sh(gl.VERTEX_SHADER, LIQUID_VS), fs = sh(gl.FRAGMENT_SHADER, LIQUID_FS);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ["uRes", "uOrigin", "uScale", "uPhase", "uMouse", "uEnergy", "uFlash", "uRip", "uB", "uTone", "uInt"].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    var S = window.innerWidth < 700 ? .5 : (DPR > 1 ? .6 : .5);   // risoluzione del liquido rispetto ai pixel CSS
    var MARGIN = 160, EXT = 26;
    var items = [], lost = false;

    function sizeGL() {
      glc.width = Math.ceil(window.innerWidth * S);
      glc.height = Math.ceil((window.innerHeight + MARGIN * 2) * S);
    }
    sizeGL();

    var hosts = [].slice.call(doc.querySelectorAll(".hero, .page-hero, main > section, .notfound, .auth-page, .site-footer"))
      .filter(function (el, i, a) { return a.indexOf(el) === i; });

    hosts.forEach(function (el) {
      var c = doc.createElement("canvas");
      c.className = "fx-liq";
      c.setAttribute("aria-hidden", "true");
      el.insertBefore(c, el.firstChild);
      el.classList.add("fx-liq-host");
      var bigText = el.classList.contains("hero") || el.classList.contains("page-hero") || el.classList.contains("notfound");
      items.push({
        el: el, c: c, ctx: c.getContext("2d"),
        tone: el.classList.contains("section--light") ? 1 : 0,
        inten: el.hasAttribute("data-fx-int") ? parseFloat(el.getAttribute("data-fx-int")) : bigText ? 1 : 0,
        prev: null, ext: 0, w: 0, h: 0, visible: false, drawn: false
      });
    });

    function layout() {
      items.forEach(function (it, i) {
        var r = it.el.getBoundingClientRect(), p = items[i - 1];
        it.prev = null; it.ext = 0;
        if (p) {
          var pr = p.el.getBoundingClientRect();
          if (Math.abs(pr.bottom - r.top) < 2) { it.prev = p; it.ext = EXT; }
        }
        it.c.style.top = -it.ext + "px";
        it.c.style.height = "calc(100% + " + it.ext + "px)";
        var w = Math.round(r.width), h = Math.round(r.height + it.ext);
        if (w !== it.w || h !== it.h) {
          it.w = w; it.h = h;
          it.c.width = Math.max(1, Math.round(w * S));
          it.c.height = Math.max(1, Math.round(h * S));
          it.drawn = false;
        }
      });
    }
    layout();

    if ("ResizeObserver" in window) {
      var ro = new ResizeObserver(function () { layout(); });
      items.forEach(function (it) { ro.observe(it.el); });
    }
    window.addEventListener("resize", function () { sizeGL(); layout(); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        items.forEach(function (it) { if (it.el === en.target) it.visible = en.isIntersecting; });
      });
    }, { rootMargin: "200px 0px" });
    items.forEach(function (it) { io.observe(it.el); });

    glc.addEventListener("webglcontextlost", function (e) {
      e.preventDefault(); lost = true;
      items.forEach(function (it) { it.c.remove(); it.el.classList.remove("fx-liq-host"); });
      root.classList.remove("fx-liquid");
    });

    var rip = new Float32Array(16);

    // Disegna la fascia [y0, y1) (pixel CSS della tela della sezione)
    function renderSlice(it, rectTop, y0, y1, t) {
      var hs = Math.min(glc.height, Math.ceil((y1 - y0) * S));
      if (hs <= 0) return;
      var top = rectTop + window.scrollY - it.ext;      // inizio della tela, in coordinate di pagina
      gl.viewport(0, 0, glc.width, hs);
      gl.uniform2f(U.uRes, glc.width, hs);
      gl.uniform2f(U.uOrigin, 0, top + y0);
      gl.uniform1f(U.uScale, S);
      gl.uniform1f(U.uPhase, still ? 3.7 : FX.phase);
      var p = FX.pointer;
      gl.uniform3f(U.uMouse, p.x + window.scrollX, p.y + window.scrollY, p.active && !still ? 1 : 0);
      gl.uniform1f(U.uEnergy, FX.energy);
      gl.uniform1f(U.uFlash, FX.flash);
      for (var i = 0; i < 4; i++) {
        var r = FX.ripples[i];
        rip[i * 4] = r ? r.x : 0; rip[i * 4 + 1] = r ? r.y : 0;
        rip[i * 4 + 2] = r ? t - r.t : 0; rip[i * 4 + 3] = r ? r.s : 0;
      }
      gl.uniform4fv(U.uRip, rip);
      gl.uniform1f(U.uB, top + it.ext);
      var pv = it.prev || it;
      gl.uniform2f(U.uTone, pv.tone, it.tone);
      gl.uniform2f(U.uInt, pv.inten, it.inten);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      it.ctx.drawImage(glc, 0, glc.height - hs, glc.width, hs, 0, Math.round(y0 * S), it.c.width, hs);
    }

    var frame = 0, lastY = -1, lastPX = 0, lastPY = 0;
    FX.addTick(function (t) {
      if (lost) return;
      frame++;
      var y = window.scrollY, p = FX.pointer;
      var busy = y !== lastY || p.x !== lastPX || p.y !== lastPY || FX.ripples.length || FX.flash > .01;
      lastY = y; lastPX = p.x; lastPY = p.y;
      var vh = window.innerHeight;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.visible) continue;
        if (still) {
          // Versione leggera: un'immagine ferma, disegnata una volta sola
          if (it.drawn) continue;
          var rt = it.el.getBoundingClientRect().top;
          for (var a = 0; a < it.h; a += vh + MARGIN * 2) renderSlice(it, rt, a, Math.min(it.h, a + vh + MARGIN * 2), t);
          it.drawn = true;
          continue;
        }
        if (!busy && frame % 2) continue;   // a riposo basta mezza frequenza
        var r = it.el.getBoundingClientRect();
        var canvasTop = r.top - it.ext;
        var y0 = Math.max(0, -canvasTop - MARGIN), y1 = Math.min(it.h, vh - canvasTop + MARGIN);
        if (y1 > y0) renderSlice(it, r.top, y0, y1, t);
      }
    });

    root.classList.add("fx-liquid");
    return { layout: layout };
  }

  /* ------------------------------------------------------------------------
     2. Logo che si dissolve in particelle
     Al passaggio del mouse il logo si sgretola in polvere a partire dal punto
     toccato; quando il mouse si allontana le particelle tornano al loro posto.
     ------------------------------------------------------------------------ */
  function samplePixels(img, w, h, maxN) {
    var c = doc.createElement("canvas");
    c.width = Math.max(1, Math.round(w * DPR)); c.height = Math.max(1, Math.round(h * DPR));
    var x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0, c.width, c.height);
    var d;
    try { d = x.getImageData(0, 0, c.width, c.height).data; } catch (err) { return null; }
    var n = 0, i;
    for (i = 3; i < d.length; i += 4) if (d[i] > 110) n++;
    var step = Math.max(1, Math.ceil(Math.sqrt(n / maxN)));
    var pts = [];
    for (var yy = 0; yy < c.height; yy += step) {
      for (var xx = 0; xx < c.width; xx += step) {
        i = (yy * c.width + xx) * 4;
        if (d[i + 3] > 110) pts.push(xx / DPR, yy / DPR, d[i] > 127 ? 1 : 0);
      }
    }
    return { pts: pts, size: step / DPR };
  }

  function Dissolve(img, hoverEl, opts) {
    opts = opts || {};
    var wrap = doc.createElement("span");
    wrap.className = "fx-dissolve";
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
    var c = doc.createElement("canvas");
    c.className = "fx-dissolve-cvs";
    c.setAttribute("aria-hidden", "true");
    wrap.appendChild(c);
    var ctx = c.getContext("2d");

    var parts = [], w = 0, h = 0, M = 0, size = 1, color = "#fff";
    var P = 0, target = 0, running = false, entry = { x: 0, y: 0 }, hover = null;

    function build(ex, ey) {
      var r = img.getBoundingClientRect();
      if (!r.width) return false;
      if (Math.round(r.width) !== w || !parts.length) {
        w = Math.round(r.width); h = Math.round(r.height);
        M = Math.round(Math.max(40, h * 1.6));
        var s = samplePixels(img, w, h, opts.max || 1800);
        if (!s) return false;
        size = s.size;
        color = s.pts[2] ? "#fff" : "#000";
        parts = [];
        for (var i = 0; i < s.pts.length; i += 3) parts.push({ hx: s.pts[i] + M, hy: s.pts[i + 1] + M });
        c.width = Math.round((w + 2 * M) * DPR); c.height = Math.round((h + 2 * M) * DPR);
        c.style.width = (w + 2 * M) + "px"; c.style.height = (h + 2 * M) + "px";
      }
      var wr = wrap.getBoundingClientRect();
      c.style.left = (r.left - wr.left - M) + "px";
      c.style.top = (r.top - wr.top - M) + "px";
      // ogni particella parte con un ritardo che cresce allontanandosi dal punto d'ingresso
      var maxD = Math.hypot(w, h) || 1;
      parts.forEach(function (p) {
        var dx = p.hx - (ex + M), dy = p.hy - (ey + M), d = Math.hypot(dx, dy) || 1;
        var a = Math.random() * Math.PI * 2;
        var ux = dx / d * .7 + Math.cos(a) * .7 + .25, uy = dy / d * .7 + Math.sin(a) * .7 - .55;
        var ul = Math.hypot(ux, uy) || 1;
        p.dx = ux / ul; p.dy = uy / ul;
        p.dist = 4 + Math.pow(Math.random(), 1.6) * M * .8;
        p.delay = clamp(d / maxD * .75 + Math.random() * .25, 0, 1);
        p.ph = Math.random() * 6.28; p.f = .8 + Math.random() * 1.6;
        p.ox = 0; p.oy = 0;
      });
      return true;
    }

    function start() {
      if (running) return;
      running = true;
      img.style.opacity = "0";
      c.style.display = "block";
    }
    function stop() {
      running = false;
      img.style.opacity = "";
      c.style.display = "none";
    }

    function enter(e) {
      if (e && e.pointerType && e.pointerType !== "mouse") return;
      var r = img.getBoundingClientRect();
      var ex = e ? e.clientX - r.left : r.width / 2, ey = e ? e.clientY - r.top : r.height / 2;
      if (!running || P < .02) { entry.x = ex; entry.y = ey; if (!build(ex, ey)) return; }
      target = 1; start();
    }
    function leave() { target = 0; hover = null; }

    hoverEl.addEventListener("pointerenter", enter);
    hoverEl.addEventListener("pointerleave", leave);
    hoverEl.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = c.getBoundingClientRect();
      hover = { x: e.clientX - r.left, y: e.clientY - r.top };
    });

    FX.addTick(function (t, dt) {
      if (!running) return;
      var speed = target ? 1 / 2.2 : 1 / .9;
      P = clamp(P + (target ? dt : -dt) * speed, 0, 1);
      if (P <= 0 && !target) { stop(); return; }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, w + 2 * M, h + 2 * M);
      ctx.fillStyle = color;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var l = clamp((P * 1.7 - p.delay * .7), 0, 1), e = ease(l);
        var x = p.hx + p.dx * p.dist * e + Math.sin(t * p.f + p.ph) * 3.5 * e;
        var y = p.hy + p.dy * p.dist * e + Math.cos(t * p.f * .8 + p.ph) * 3.5 * e;
        if (hover) {
          var hx = x - hover.x, hy = y - hover.y, d2 = hx * hx + hy * hy;
          if (d2 < 900) { var d = Math.sqrt(d2) || 1, f = (1 - d / 30) * 9; p.ox += hx / d * f * .2; p.oy += hy / d * f * .2; }
        }
        p.ox *= .9; p.oy *= .9;
        var s = size * (1 - e * .35);
        ctx.globalAlpha = 1 - e * .6;
        ctx.fillRect(x + p.ox, y + p.oy, s, s);
      }
      ctx.globalAlpha = 1;
    });

    return {
      // Comparsa iniziale: le particelle arrivano da sparse e formano il logo
      intro: function () {
        var go = function () {
          var r = img.getBoundingClientRect();
          if (!build(r.width / 2, r.height / 2)) return;
          P = 1; target = 0; start();
        };
        if (img.complete) go(); else img.addEventListener("load", go, { once: true });
      }
    };
  }

  /* ------------------------------------------------------------------------
     3. Scritta finale a particelle (in fondo a ogni pagina)
     Le particelle formano il logo e scappano dal puntatore; con un clic
     esplodono e poi si ricompongono.
     ------------------------------------------------------------------------ */
  function Wordmark(footer) {
    var holder = doc.createElement("div");
    holder.className = "fx-wordmark";
    holder.setAttribute("aria-hidden", "true");
    var c = doc.createElement("canvas");
    holder.appendChild(c);
    var cont = footer.querySelector(".container");
    (cont || footer).appendChild(holder);
    var ctx = c.getContext("2d");
    var img = new Image();
    img.src = (doc.querySelector(".footer-logo") || {}).src || "assets/img/logo-white.png";

    var parts = [], W = 0, H = 0, dot = 2, awake = 0, inView = false, introDone = false;
    var ptr = null;

    function build() {
      W = Math.round(holder.clientWidth);
      if (!W || !img.naturalWidth) return;
      H = Math.round(W * img.naturalHeight / img.naturalWidth);
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      c.style.height = H + "px";
      var s = samplePixels(img, W, H, W < 600 ? 3200 : 9000);
      if (!s) return;
      dot = Math.max(1.2, s.size * .66);
      var old = parts;
      parts = [];
      for (var i = 0; i < s.pts.length; i += 3) {
        var o = old[parts.length];
        parts.push({ hx: s.pts[i], hy: s.pts[i + 1], x: o ? o.x : s.pts[i], y: o ? o.y : s.pts[i + 1], vx: 0, vy: 0 });
      }
      awake = 1; draw();
    }

    function scatter(cx, cy, power) {
      parts.forEach(function (p) {
        var dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1, f = power * (.4 + Math.random() * .9) * Math.max(.15, 1 - d / (W * .7));
        p.vx += dx / d * f; p.vy += dy / d * f - Math.random() * power * .1;
      });
      awake = 1;
    }

    function draw() {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      for (var i = 0; i < parts.length; i++) ctx.fillRect(parts[i].x, parts[i].y, dot, dot);
    }

    holder.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      ptr = { x: e.clientX - r.left, y: e.clientY - r.top };
      awake = 1;
    });
    holder.addEventListener("pointerleave", function () { ptr = null; });
    holder.addEventListener("pointerdown", function (e) {
      if (reduce) return;
      var r = c.getBoundingClientRect();
      scatter(e.clientX - r.left, e.clientY - r.top, 16);
      FX.pulse(.25);
    });

    new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting;
      if (inView && !introDone && parts.length && !reduce) {
        introDone = true;
        parts.forEach(function (p) { p.x = Math.random() * W; p.y = p.hy + (Math.random() - .5) * H * 1.6; p.vx = p.vy = 0; });
        awake = 1;
      }
    }, { rootMargin: "0px 0px -10% 0px" }).observe(holder);

    if (img.complete && img.naturalWidth) build(); else img.addEventListener("load", build);
    var rw = 0;
    window.addEventListener("resize", function () { if (holder.clientWidth !== rw) { rw = holder.clientWidth; build(); } });

    FX.addTick(function () {
      if (!inView || !awake || reduce) return;
      var R = Math.max(70, W * .085), R2 = R * R, moving = 0;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var ax = (p.hx - p.x) * .055, ay = (p.hy - p.y) * .055;
        if (ptr) {
          var dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < R2) { var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.4; ax += dx / d * f; ay += dy / d * f; }
        }
        p.vx = (p.vx + ax) * .84; p.vy = (p.vy + ay) * .84;
        p.x += p.vx; p.y += p.vy;
        if (Math.abs(p.vx) + Math.abs(p.vy) > .02) moving++;
      }
      draw();
      if (!moving && !ptr) awake = 0;
    });
  }

  /* ------------------------------------------------------------------------
     4. Cursore che inverte i colori, pulsanti magnetici, schede che si
        inclinano e luce che segue il puntatore
     ------------------------------------------------------------------------ */
  function Cursor() {
    var el = doc.createElement("div");
    el.className = "fx-cursor";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = "<span></span>";
    doc.body.appendChild(el);
    var x = -100, y = -100, shown = false;
    doc.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      if (!shown) { shown = true; x = e.clientX; y = e.clientY; el.classList.add("is-on"); }
      var t = e.target.closest ? e.target : null;
      el.classList.toggle("is-hover", !!(t && t.closest("a, button, label, summary, select, [role='button'], .btn") && !t.closest(".brand, .fx-dissolve")));
      el.classList.toggle("is-text", !!(t && t.closest("input, textarea")));
    }, { passive: true });
    doc.addEventListener("pointerdown", function () { el.classList.add("is-down"); });
    doc.addEventListener("pointerup", function () { el.classList.remove("is-down"); });
    root.addEventListener("mouseleave", function () { shown = false; el.classList.remove("is-on"); });
    var big = false;
    doc.addEventListener("pointermove", function (e) {
      big = !!(e.target.closest && e.target.closest("[data-3d], .fx-wordmark"));
    }, { passive: true });
    FX.addTick(function () {
      if (!shown) return;
      el.classList.toggle("is-big", big || !!FX.hot);
      x += (FX.pointer.x - x) * .28; y += (FX.pointer.y - y) * .28;
      el.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
    });
  }

  function Pointerly() {
    var magnet = null, tilt = null;
    function resetMagnet() { if (magnet) { magnet.style.translate = ""; magnet = null; } }
    function resetTilt() { if (tilt) { tilt.style.removeProperty("--rx"); tilt.style.removeProperty("--ry"); tilt.classList.remove("is-tilting"); tilt = null; } }

    doc.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || !e.target.closest) return;
      var b = e.target.closest(".btn");
      if (b !== magnet) resetMagnet();
      if (b && !b.closest(".cookie")) {
        magnet = b;
        var r = b.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) / (r.width / 2), my = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        b.style.translate = (mx * 7).toFixed(1) + "px " + (my * 5).toFixed(1) + "px";
      }
      var tl = e.target.closest(".fx-tilt");
      if (tl !== tilt) resetTilt();
      if (tl) {
        tilt = tl; tl.classList.add("is-tilting");
        var tr = tl.getBoundingClientRect();
        var nx = (e.clientX - tr.left) / tr.width - .5, ny = (e.clientY - tr.top) / tr.height - .5;
        tl.style.setProperty("--ry", (nx * 7).toFixed(2) + "deg");
        tl.style.setProperty("--rx", (-ny * 7).toFixed(2) + "deg");
      }
      var sp = e.target.closest(".fx-spot");
      if (sp) {
        var sr = sp.getBoundingClientRect();
        sp.style.setProperty("--gx", (e.clientX - sr.left).toFixed(0) + "px");
        sp.style.setProperty("--gy", (e.clientY - sr.top).toFixed(0) + "px");
      }
    }, { passive: true });
    doc.addEventListener("pointerleave", function () { resetMagnet(); resetTilt(); });
    doc.querySelectorAll(".action-card, .service").forEach(function (n) { n.classList.add("fx-tilt"); });
    doc.querySelectorAll(".action-card, .service, .price-card, .review, .step").forEach(function (n) { n.classList.add("fx-spot"); });
  }

  /* ------------------------------------------------------------------------
     5. Modelli 3D: caricati solo quando servono, per non rallentare l'apertura
     ------------------------------------------------------------------------ */
  function load3D() {
    var stages = doc.querySelectorAll("[data-3d]");
    if (!stages.length) return;
    if (FX.lite && !reduce) {
      stages.forEach(function (s) { s.classList.add("is-unsupported"); });
      return;
    }
    var test = doc.createElement("canvas");
    if (!(test.getContext("webgl2") || test.getContext("webgl"))) {
      stages.forEach(function (s) { s.classList.add("is-unsupported"); });
      return;
    }
    var started = false;
    function go() {
      if (started) return;
      started = true;
      ["pointermove", "scroll", "touchstart", "keydown"].forEach(function (ev) { window.removeEventListener(ev, go); });
      import("./fx3d.js").then(function (m) { m.init(FX); }).catch(function () {
        stages.forEach(function (s) { s.classList.add("is-unsupported"); });
      });
    }
    ["pointermove", "scroll", "touchstart", "keydown"].forEach(function (ev) { window.addEventListener(ev, go, { passive: true, once: true }); });
    var later = function () { setTimeout(go, 2500); };
    if (doc.readyState === "complete") later(); else window.addEventListener("load", later);
  }

  /* ------------------------------------------------------------------------
     Avvio
     ------------------------------------------------------------------------ */
  try { Liquid(); } catch (err) { /* il sito resta con gli sfondi originali */ }

  if (!reduce) {
    var brandImg = doc.querySelector(".site-header .brand img");
    if (brandImg) {
      var brand = Dissolve(brandImg, brandImg.closest(".brand"), { max: 1600 });
      var first = false;
      try { first = !sessionStorage.getItem("onit-fx-intro"); sessionStorage.setItem("onit-fx-intro", "1"); } catch (err) {}
      if (first) setTimeout(brand.intro, 450);
    }
    var footLogo = doc.querySelector(".site-footer .footer-logo");
    if (footLogo && finePointer) Dissolve(footLogo, footLogo, { max: 2200 });
  }
  var footer = doc.querySelector(".site-footer");
  if (footer && !root.classList.contains("no-wordmark")) Wordmark(footer);

  if (finePointer && !reduce) { Cursor(); Pointerly(); }
  load3D();
})();
