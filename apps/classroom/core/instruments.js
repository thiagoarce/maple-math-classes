/* Instrumentos matemáticos locais: régua, esquadro e transferidor. */
(function () {
  "use strict";
  if (window.__modoAulaInstruments) return;
  window.__modoAulaInstruments = true;

  var attached = [];
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function read(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (error) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) {} }

  function styles() {
    if (document.getElementById("modoAulaInstrumentsCss")) return;
    var style = document.createElement("style");
    style.id = "modoAulaInstrumentsCss";
    style.textContent = [
      ".ma-instrument{position:absolute;z-index:5;display:none;transform-origin:center center;pointer-events:none;filter:drop-shadow(0 4px 8px rgba(23,32,51,.18))}.ma-instrument.visible{display:block}",
      ".ma-instrument .body{position:absolute;inset:0;pointer-events:none;overflow:hidden}.ma-instrument .drag,.ma-instrument .rotate,.ma-instrument .resize,.ma-instrument .close{position:absolute;z-index:2;pointer-events:auto;display:grid;place-items:center;border:1px solid rgba(30,73,153,.6);background:rgba(255,255,255,.92);color:#1e4999;font:700 12px/1 system-ui;cursor:pointer}",
      ".ma-instrument .drag{left:50%;top:-15px;width:44px;height:22px;border-radius:8px;transform:translateX(-50%);cursor:move}.ma-instrument .rotate{right:-13px;top:-13px;width:25px;height:25px;border-radius:50%;cursor:grab}.ma-instrument .resize{right:-13px;bottom:-13px;width:25px;height:25px;border-radius:7px;cursor:nwse-resize}.ma-instrument .close{left:-11px;top:-11px;width:23px;height:23px;border-radius:50%}",
      ".ma-instrument .body svg{width:100%;height:100%;display:block;overflow:hidden}.ma-instrument .drag,.ma-instrument .rotate,.ma-instrument .resize{touch-action:none}",
      ".ma-instrument-menu{position:fixed;z-index:1110;display:none;grid-template-columns:repeat(3,44px);gap:5px;padding:7px;border:1px solid #d8deea;border-radius:11px;background:#fff;box-shadow:0 10px 28px rgba(23,32,51,.2)}.ma-instrument-menu.open{display:grid}.ma-instrument-menu button{width:44px;height:38px;border:1px solid #d8deea;border-radius:8px;background:#fff;color:#172033;font:700 17px/1 system-ui;cursor:pointer}.ma-instrument-menu .hide{grid-column:1/-1;width:auto;font-size:11px}"
    ].join("");
    document.head.appendChild(style);
  }

  // Relative diagram units, not a physical centimetre calibration.
  var TAMANHO = { ruler: [720, 64], square: [240, 240], protractor: [380, 190] };
  function instrumentSvg(type) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none" ';
    if (type === "ruler") {
      svg += 'viewBox="0 0 720 64"><rect x="1" y="1" width="718" height="62" rx="4" fill="#ffd640" fill-opacity=".33" stroke="#ad831c" stroke-width="2"/>';
      for (var i = 0; i <= 100; i++) {
        var x = 12 + i * 6.96, major = i % 10 === 0;
        svg += '<line data-tick="' + i + '" x1="' + x + '" x2="' + x + '" y1="2" y2="' + (major ? 23 : i % 5 === 0 ? 16 : 10) + '" stroke="#805d12" stroke-width="' + (major ? 1.8 : 1) + '"/>';
        if (major) svg += '<text data-unit="' + i/10 + '" x="' + x + '" y="39" text-anchor="middle" font-size="13" fill="#805d12">' + i/10 + '</text>';
      }
    } else if (type === "square") {
      svg += 'viewBox="0 0 240 240"><path d="M1 239V1L239 239Z" fill="#40beff" fill-opacity=".24" stroke="#006ca8" stroke-width="2"/><path d="M1 220H20V239" fill="none" stroke="#006ca8" stroke-width="2"/><text x="27" y="75" font-size="14" fill="#004c78">45°</text><text x="165" y="223" font-size="14" fill="#004c78">45°</text>';
    } else {
      svg += 'viewBox="0 0 380 190"><path d="M1 189 A189 189 0 0 1 379 189 Z" fill="#cb91ea" fill-opacity=".30" stroke="#8443aa" stroke-width="2"/>';
      for (var a = 0; a <= 180; a += 1) {
        var rad = a * Math.PI / 180, major = a % 10 === 0, mid = a % 5 === 0;
        var outer = 187, inner = major ? 171 : mid ? 177 : 182;
        function px(r) { return 190 + r * Math.cos(rad); }
        function py(r) { return 189 - r * Math.sin(rad); }
        svg += '<line data-angle="' + a + '" x1="' + px(outer) + '" y1="' + py(outer) + '" x2="' + px(inner) + '" y2="' + py(inner) + '" stroke="#532076" stroke-width="' + (major ? 1.6 : .8) + '"/>';
        if (a % 30 === 0) svg += '<text x="' + px(153) + '" y="' + (py(153) - 5) + '" font-size="12" fill="#532076" text-anchor="middle">' + a + '°</text>';
      }
      svg += '<circle cx="190" cy="189" r="3" fill="#532076"/>';
    }
    return svg + '</svg>';
  }
  function instrument(type) {
    var node = document.createElement("div");
    node.className = "ma-instrument ma-" + type;
    node.setAttribute("data-instrument", type);
    node.innerHTML = '<div class="body"></div><div class="labels"></div><button class="close" title="Ocultar">×</button><button class="drag" title="Mover">•••</button><button class="rotate" title="Girar">↻</button><button class="resize" title="Redimensionar">↘</button>';
    node.querySelector(".body").innerHTML = instrumentSvg(type);
    return node;
  }

  function attach(surface) {
    if (!surface || surface.instruments || attached.indexOf(surface) >= 0) return;
    attached.push(surface);
    var parent = surface.parent;
    var toolbar = surface.kind === "board" ? document.getElementById("boardTools") : document.querySelector(".tools");
    if (!parent || !toolbar) return;

    var nodes = {
      ruler: instrument("ruler"),
      square: instrument("square"),
      protractor: instrument("protractor")
    };
    Object.keys(nodes).forEach(function (key) { parent.appendChild(nodes[key]); });

    var button = document.createElement("button");
    button.type = "button";
    button.className = surface.kind === "board" ? "board-tool" : "icon-btn";
    button.title = "Régua, esquadro e transferidor";
    button.setAttribute("aria-label", button.title);
    button.textContent = "📐";
    var selectButton = toolbar.querySelector("[data-ma-select]");
    if (selectButton) toolbar.insertBefore(button, selectButton);
    else toolbar.appendChild(button);

    var menu = document.createElement("div");
    menu.className = "ma-instrument-menu";
    menu.innerHTML = '<button data-add="ruler" title="Régua">▭</button><button data-add="square" title="Esquadro">◩</button><button data-add="protractor" title="Transferidor">◒</button><button class="hide" data-hide="1">Ocultar instrumentos</button>';
    document.body.appendChild(menu);

    var scope = "";
    var state = null;
    var saveTimer = null;

    function key() { return "maple-demo:classroom:instruments:" + surface.scope(); }
    function defaults() {
      return {
        ruler: { x: .25, y: .35, width: .48, height: .09, rotation: 0, visible: false },
        square: { x: .25, y: .35, width: .25, height: .28, rotation: 0, visible: false },
        protractor: { x: .25, y: .38, width: .42, height: .22, rotation: 0, visible: false }
      };
    }
    function load() {
      var next = key();
      if (next === scope && state) return;
      scope = next;
      state = Object.assign(defaults(), read(scope) || {});
      render();
    }
    function save() {
      clearTimeout(saveTimer);
      var keyToSave = scope, snapshot = JSON.parse(JSON.stringify(state));
      saveTimer = setTimeout(function () { write(keyToSave, snapshot); }, 100);
    }
    function render() {
      if (!state) return;
      var r = parent.getBoundingClientRect();
      Object.keys(nodes).forEach(function (type) {
        var item = state[type];
        var node = nodes[type];
        node.classList.toggle("visible", !!item.visible);
        node.style.left = item.x * r.width + "px";
        node.style.top = item.y * r.height + "px";
        var width = item.width * r.width;
        var height = width * TAMANHO[type][1] / TAMANHO[type][0];
        if (r.height) item.height = height / r.height;
        node.style.width = width + "px";
        node.style.height = height + "px";
        node.style.transform = "rotate(" + (item.rotation || 0) + "deg)";
      });
    }
    /* Aparece no pedaço da folha que está NA TELA, com tamanho de régua de verdade.
       Antes as coordenadas eram frações da folha inteira: numa apostila de 12 páginas
       a régua nascia fora da vista e com 170 px de altura. */
    function show(type) {
      load();
      var item = state[type];
      if (!item.visible) {
        var r = parent.getBoundingClientRect();
        if (r.width && r.height) {
          var left = Math.max(r.left, 0), right = Math.min(r.right, innerWidth);
          var top = Math.max(r.top, 0), bottom = Math.min(r.bottom, innerHeight);
          var w = Math.min(TAMANHO[type][0], (right - left) * .62);
          var h = w * TAMANHO[type][1] / TAMANHO[type][0];
          item.width = w / r.width;
          item.height = h / r.height;
          item.x = ((left + right) / 2 - w / 2 - r.left) / r.width;
          item.y = ((top + bottom) / 2 - h / 2 - r.top) / r.height;
          item.rotation = 0;
        }
      }
      item.visible = true; save(); render();
    }
    /* As bordas que servem de guia, em px de tela: régua (as duas longas), esquadro
       (os dois catetos e a hipotenusa), transferidor (a base). */
    var BORDAS = {
      ruler: [[0, 0, 1, 0], [0, 1, 1, 1]],
      square: [[0, 1, 1, 1], [0, 0, 0, 1], [0, 0, 1, 1]],
      protractor: [[0, 1, 1, 1]]
    };
    function guia(cx, cy) {
      if (!state || (surface.kind === "board" && document.getElementById("stage").classList.contains("has-resource"))) return null;
      var melhor = null;
      Object.keys(nodes).forEach(function (type) {
        var item = state[type], node = nodes[type];
        if (!item.visible) return;
        var w = node.offsetWidth, h = node.offsetHeight;
        if (!w || !h) return;
        var b = node.getBoundingClientRect();
        var ox = b.left + b.width / 2, oy = b.top + b.height / 2;
        var a = (item.rotation || 0) * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
        function tela(u, v) {
          var lx = (u - .5) * w, ly = (v - .5) * h;
          return [ox + lx * cos - ly * sin, oy + lx * sin + ly * cos];
        }
        BORDAS[type].forEach(function (e) {
          var p = tela(e[0], e[1]), q = tela(e[2], e[3]);
          var dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
          if (!len) return;
          dx /= len; dy /= len;
          var t = (cx - p[0]) * dx + (cy - p[1]) * dy;
          if (t < -24 || t > len + 24) return;
          var d = Math.abs((cx - p[0]) * dy - (cy - p[1]) * dx);
          if (d <= 22 && (!melhor || d < melhor.d)) melhor = { ax: p[0], ay: p[1], dx: dx, dy: dy, d: d };
        });
      });
      return melhor;
    }
    (window.ModoAulaInkGuias = window.ModoAulaInkGuias || []).push(guia);
    function hideAll() { Object.keys(state).forEach(function (type) { state[type].visible = false; }); save(); render(); }
    function positionMenu() {
      var r = button.getBoundingClientRect();
      menu.style.left = Math.max(6, Math.min(innerWidth - 155, r.left)) + "px";
      menu.style.top = Math.min(innerHeight - 110, r.bottom + 6) + "px";
    }

    button.addEventListener("click", function () {
      if (menu.classList.contains("open")) menu.classList.remove("open");
      else { positionMenu(); menu.classList.add("open"); }
    });
    menu.addEventListener("click", function (event) {
      var add = event.target.closest("[data-add]");
      if (add) show(add.getAttribute("data-add"));
      if (event.target.closest("[data-hide]")) hideAll();
      menu.classList.remove("open");
    });
    document.addEventListener("pointerdown", function (event) {
      if (!menu.contains(event.target) && event.target !== button) menu.classList.remove("open");
    });

    Object.keys(nodes).forEach(function (type) {
      var node = nodes[type];
      var gesture = null;
      node.querySelector(".close").addEventListener("click", function () { state[type].visible = false; save(); render(); });
      function begin(action, event) {
        event.preventDefault(); event.stopPropagation();
        load();
        var r = parent.getBoundingClientRect();
        var item = state[type];
        var cx = (item.x + item.width / 2) * r.width;
        var cy = (item.y + item.height / 2) * r.height;
        gesture = {
          action: action,
          startX: event.clientX,
          startY: event.clientY,
          original: JSON.parse(JSON.stringify(item)),
          startAngle: Math.atan2(event.clientY - (r.top + cy), event.clientX - (r.left + cx))
        };
        event.currentTarget.setPointerCapture && event.currentTarget.setPointerCapture(event.pointerId);
      }
      node.querySelector(".drag").addEventListener("pointerdown", function (event) { begin("move", event); });
      node.querySelector(".rotate").addEventListener("pointerdown", function (event) { begin("rotate", event); });
      node.querySelector(".resize").addEventListener("pointerdown", function (event) { begin("resize", event); });
      node.addEventListener("pointermove", function (event) {
        if (!gesture) return;
        var r = parent.getBoundingClientRect();
        var item = state[type];
        var dx = event.clientX - gesture.startX;
        var dy = event.clientY - gesture.startY;
        if (gesture.action === "move") {
          item.x = clamp(gesture.original.x + dx / r.width, -.5, 1.5);
          item.y = clamp(gesture.original.y + dy / r.height, -.5, 1.5);
        } else if (gesture.action === "resize") {
          if (!r.width || !r.height) return;
          // Resize along the diagonal of the rotated instrument without changing its aspect.
          var a = (gesture.original.rotation || 0) * Math.PI / 180;
          var ratio = TAMANHO[type][1] / TAMANHO[type][0];
          var localX = dx * Math.cos(a) + dy * Math.sin(a);
          var localY = -dx * Math.sin(a) + dy * Math.cos(a);
          var delta = (localX + ratio * localY) / (1 + ratio * ratio);
          item.width = clamp(gesture.original.width + delta / r.width, .12, 1.25);
          item.height = item.width * r.width * ratio / r.height;
        } else {
          var cx = (gesture.original.x + gesture.original.width / 2) * r.width + r.left;
          var cy = (gesture.original.y + gesture.original.height / 2) * r.height + r.top;
          var angle = Math.atan2(event.clientY - cy, event.clientX - cx);
          item.rotation = gesture.original.rotation + (angle - gesture.startAngle) * 180 / Math.PI;
        }
        save(); render();
      });
      function end() { gesture = null; }
      node.addEventListener("pointerup", end);
      node.addEventListener("pointercancel", end);
      node.addEventListener("lostpointercapture", end);
    });

    load();
    if (window.ResizeObserver) new ResizeObserver(render).observe(parent);
    /* `load()` só faz alguma coisa quando o escopo muda — virar a página, trocar o
       fundo da lousa. Quem sabe disso é a superfície, e agora ela avisa; a varredura
       de 350 ms lia o `localStorage` três vezes por segundo para descobrir o mesmo. */
    window.addEventListener("modo-aula-object-scope", function () { load(); });
    window.addEventListener("modo-aula-pdf-rendered", function () { load(); });
    window.addEventListener("storage", function (ev) {
      if (ev && ev.key && ev.key === scope) { state = null; load(); }
    });
    setInterval(function () { load(); }, 3000);
    surface.instruments = { hideAll: hideAll, render: render };
  }

  styles();
  function scan() { (window.ModoAulaObjectSurfaces || []).forEach(attach); }
  scan();
  window.addEventListener("modo-aula-object-surface", scan);
  setInterval(scan, 3000);
})();
