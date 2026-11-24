/* Formas prontas: arrastar define a caixa, a forma nasce dentro dela.
 *
 * Ele, 29/09: *"Colocar outras formas prontas, triangulo retangulo, retangulo, hexágono,
 * pentágono etc."* Além das cinco de antes: seta dupla, quadrado, círculo, triângulo
 * retângulo, triângulo equilátero, losango, paralelogramo, trapézio, pentágono,
 * hexágono, octógono e eixos cartesianos. Quadrado, círculo e os regulares ficam
 * sempre regulares; nas outras, Shift trava a caixa quadrada. */
(function () {
  "use strict";
  if (window.__modoAulaShapes) return;
  window.__modoAulaShapes = true;

  var PREFS = "maple-demo:classroom:shapes:v1";
  var attached = [];
  var prefs = { snap: true };
  try { prefs = Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS) || "{}")); } catch (error) {}

  function savePrefs() { try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch (error) {} }
  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() :
      "shape-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function point(event, parent) {
    var r = parent.getBoundingClientRect();
    return {
      x: clamp(event.clientX - r.left, 0, r.width),
      y: clamp(event.clientY - r.top, 0, r.height),
      nx: r.width ? clamp((event.clientX - r.left) / r.width, 0, 1) : 0,
      ny: r.height ? clamp((event.clientY - r.top) / r.height, 0, 1) : 0,
      width: r.width || 1,
      height: r.height || 1
    };
  }
  function snapEnd(start, end, enabled) {
    if (!enabled) return end;
    var length = Math.hypot(end.x - start.x, end.y - start.y);
    var angle = Math.atan2(end.y - start.y, end.x - start.x);
    var step = Math.PI / 12;
    angle = Math.round(angle / step) * step;
    return Object.assign({}, end, {
      x: start.x + Math.cos(angle) * length,
      y: start.y + Math.sin(angle) * length,
      nx: (start.x + Math.cos(angle) * length) / end.width,
      ny: (start.y + Math.sin(angle) * length) / end.height
    });
  }
  function arrowPoints(start, end) {
    var angle = Math.atan2(end.y - start.y, end.x - start.x);
    var size = Math.max(10, Math.min(24, Math.hypot(end.x - start.x, end.y - start.y) * .16));
    var left = angle + Math.PI * .82;
    var right = angle - Math.PI * .82;
    return [
      start.nx, start.ny,
      end.nx, end.ny,
      (end.x + Math.cos(left) * size) / end.width,
      (end.y + Math.sin(left) * size) / end.height,
      end.nx, end.ny,
      (end.x + Math.cos(right) * size) / end.width,
      (end.y + Math.sin(right) * size) / end.height
    ];
  }
  function ellipsePoints(left, top, right, bottom, width, height) {
    var values = [];
    var cx = (left + right) / 2, cy = (top + bottom) / 2;
    var rx = Math.max(2, Math.abs(right - left) / 2);
    var ry = Math.max(2, Math.abs(bottom - top) / 2);
    for (var i = 0; i <= 64; i++) {
      var angle = Math.PI * 2 * i / 64;
      values.push((cx + Math.cos(angle) * rx) / width, (cy + Math.sin(angle) * ry) / height);
    }
    return values;
  }
  /* Polígono regular inscrito no círculo que cabe na caixa (quadrada). */
  function regularPoints(n, left, top, right, bottom, width, height, phase) {
    var cx = (left + right) / 2, cy = (top + bottom) / 2;
    var radius = Math.min(right - left, bottom - top) / 2;
    var values = [];
    for (var i = 0; i <= n; i++) {
      var angle = phase + Math.PI * 2 * (i % n) / n;
      values.push((cx + Math.cos(angle) * radius) / width, (cy + Math.sin(angle) * radius) / height);
    }
    return values;
  }
  function closedPoints(corners, width, height) {
    var values = [];
    corners.concat([corners[0]]).forEach(function (c) { values.push(c[0] / width, c[1] / height); });
    return values;
  }
  function headAt(x, y, angle, size, width, height) {
    var left = angle + Math.PI * .82, right = angle - Math.PI * .82;
    return [
      (x + Math.cos(left) * size) / width, (y + Math.sin(left) * size) / height,
      x / width, y / height,
      (x + Math.cos(right) * size) / width, (y + Math.sin(right) * size) / height,
      x / width, y / height
    ];
  }
  /* Os que nascem regulares: a caixa vira quadrada, a partir do ponto de partida. */
  var REGULARES = { square: 1, circle: 1, equilateral: 1, pentagon: 1, hexagon: 1, octagon: 1 };
  var NOMES = {
    square: "rectangle", circle: "ellipse", "right-triangle": "right-triangle", equilateral: "triangle",
    rhombus: "polygon", parallelogram: "polygon", trapezoid: "polygon",
    pentagon: "polygon", hexagon: "polygon", octagon: "polygon", axes: "axes", "double-arrow": "arrow"
  };
  function makeStroke(surface, tool, start, end, event) {
    var r = surface.parent.getBoundingClientRect();
    var left = Math.min(start.x, end.x), right = Math.max(start.x, end.x);
    var top = Math.min(start.y, end.y), bottom = Math.max(start.y, end.y);
    if (REGULARES[tool] || (event.shiftKey && tool !== "line" && tool !== "arrow" && tool !== "double-arrow")) {
      var side = Math.max(right - left, bottom - top);
      right = start.x <= end.x ? start.x + side : start.x - side;
      bottom = start.y <= end.y ? start.y + side : start.y - side;
      left = Math.min(start.x, right); right = Math.max(start.x, right);
      top = Math.min(start.y, bottom); bottom = Math.max(start.y, bottom);
    }
    var widthValue = Math.max(1, Number(surface.ink.getWidthForTool("pen")) || 4);
    var stroke = {
      id: uid(),
      tool: "pen",
      shape: NOMES[tool] || tool,
      color: surface.ink.getColorForTool("pen") || "#1e4999",
      width: surface.ink.normalizesWidth ? widthValue / r.width : widthValue,
      opacity: 1,
      points: [],
      pressure: [],
      createdAt: new Date().toISOString()
    };
    if (tool === "line") stroke.points = [start.nx, start.ny, end.nx, end.ny];
    else if (tool === "arrow") stroke.points = arrowPoints(start, end);
    else if (tool === "rectangle") stroke.points = [left / r.width, top / r.height, right / r.width, top / r.height, right / r.width, bottom / r.height, left / r.width, bottom / r.height, left / r.width, top / r.height];
    else if (tool === "square") stroke.points = closedPoints([[left, top], [right, top], [right, bottom], [left, bottom]], r.width, r.height);
    else if (tool === "triangle") stroke.points = [(left + right) / 2 / r.width, top / r.height, right / r.width, bottom / r.height, left / r.width, bottom / r.height, (left + right) / 2 / r.width, top / r.height];
    else if (tool === "right-triangle") {
      /* O ângulo reto fica no canto de onde o arraste começou. */
      var qx = start.x <= end.x ? left : right, qy = start.y <= end.y ? top : bottom;
      var ox = qx === left ? right : left, oy = qy === top ? bottom : top;
      stroke.points = closedPoints([[qx, qy], [ox, qy], [qx, oy]], r.width, r.height);
    }
    else if (tool === "equilateral") {
      var side = right - left, h = side * Math.sqrt(3) / 2, base = top + (bottom - top + h) / 2;
      stroke.points = closedPoints([[(left + right) / 2, base - h], [right, base], [left, base]], r.width, r.height);
    }
    else if (tool === "rhombus") stroke.points = closedPoints([[(left + right) / 2, top], [right, (top + bottom) / 2], [(left + right) / 2, bottom], [left, (top + bottom) / 2]], r.width, r.height);
    else if (tool === "parallelogram") {
      var s = (right - left) * .25;
      stroke.points = closedPoints([[left + s, top], [right, top], [right - s, bottom], [left, bottom]], r.width, r.height);
    }
    else if (tool === "trapezoid") {
      var t = (right - left) * .22;
      stroke.points = closedPoints([[left + t, top], [right - t, top], [right, bottom], [left, bottom]], r.width, r.height);
    }
    else if (tool === "pentagon") stroke.points = regularPoints(5, left, top, right, bottom, r.width, r.height, -Math.PI / 2);
    else if (tool === "hexagon") stroke.points = regularPoints(6, left, top, right, bottom, r.width, r.height, 0);
    else if (tool === "octagon") stroke.points = regularPoints(8, left, top, right, bottom, r.width, r.height, Math.PI / 8);
    else if (tool === "double-arrow") {
      var ang = Math.atan2(end.y - start.y, end.x - start.x);
      var size = Math.max(10, Math.min(24, Math.hypot(end.x - start.x, end.y - start.y) * .16));
      stroke.points = headAt(start.x, start.y, ang + Math.PI, size, r.width, r.height)
        .concat([end.nx, end.ny])
        .concat(headAt(end.x, end.y, ang, size, r.width, r.height));
    }
    else if (tool === "axes") {
      /* Um traço só, que volta pelo próprio caminho: eixo x com seta à direita, eixo y
         com seta em cima, cruzando no meio da caixa. */
      var mx = (left + right) / 2, my = (top + bottom) / 2;
      var head = Math.max(10, Math.min(18, Math.min(right - left, bottom - top) * .1));
      stroke.points = [left / r.width, my / r.height]
        .concat(headAt(right, my, 0, head, r.width, r.height))
        .concat([mx / r.width, my / r.height, mx / r.width, bottom / r.height])
        .concat(headAt(mx, top, -Math.PI / 2, head, r.width, r.height));
    }
    else stroke.points = ellipsePoints(left, top, right, bottom, r.width, r.height);
    for (var i = 0; i < stroke.points.length / 2; i++) stroke.pressure.push(.5);
    return stroke;
  }
  var FORMAS = [
    ["line", "Linha", '<path d="M4 20L20 4"/>'],
    ["arrow", "Seta", '<path d="M4 20L20 4M11 4h9v9"/>'],
    ["double-arrow", "Seta dupla", '<path d="M4 20L20 4M11 4h9v9M13 20H4v-9"/>'],
    ["axes", "Eixos cartesianos", '<path d="M2 13h19M18 10l3 3-3 3M11 22V3M8 6l3-3 3 3"/>'],
    ["rectangle", "Retângulo", '<rect x="3" y="6" width="18" height="12"/>'],
    ["square", "Quadrado", '<rect x="5" y="5" width="14" height="14"/>'],
    ["ellipse", "Elipse", '<ellipse cx="12" cy="12" rx="9.5" ry="6.5"/>'],
    ["circle", "Círculo", '<circle cx="12" cy="12" r="8.5"/>'],
    ["triangle", "Triângulo isósceles", '<path d="M12 4l9 16H3z"/>'],
    ["right-triangle", "Triângulo retângulo (o ângulo reto fica onde o arraste começa)", '<path d="M4 4v16h16z"/><path d="M4 16h4v4"/>'],
    ["equilateral", "Triângulo equilátero", '<path d="M12 4.5l8.7 15H3.3z"/>'],
    ["rhombus", "Losango", '<path d="M12 3l8 9-8 9-8-9z"/>'],
    ["parallelogram", "Paralelogramo", '<path d="M7 6h14l-4 12H3z"/>'],
    ["trapezoid", "Trapézio", '<path d="M7 6h10l4 12H3z"/>'],
    ["pentagon", "Pentágono regular", '<path d="M12 3l8.6 6.2-3.3 10.1H6.7L3.4 9.2z"/>'],
    ["hexagon", "Hexágono regular", '<path d="M21 12l-4.5 7.8h-9L3 12l4.5-7.8h9z"/>'],
    ["octagon", "Octógono regular", '<path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z"/>']
  ];
  function installStyles() {
    if (document.getElementById("modoAulaShapesCss")) return;
    var style = document.createElement("style");
    style.id = "modoAulaShapesCss";
    style.textContent = [
      ".ma-shape-layer{position:absolute;inset:0;z-index:7;pointer-events:none;touch-action:none}.ma-shape-layer.active{pointer-events:auto;cursor:crosshair}",
      ".ma-shape-menu{position:fixed;z-index:1100;display:none;grid-template-columns:repeat(6,38px);gap:5px;padding:7px;border:1px solid #d8deea;border-radius:11px;background:#fff;box-shadow:0 10px 28px rgba(23,32,51,.2)}.ma-shape-menu.open{display:grid}",
      ".ma-shape-menu button{display:grid;place-items:center;padding:0;width:38px;height:36px;border:1px solid #d8deea;border-radius:8px;background:#fff;color:#172033;font:700 17px/1 system-ui;cursor:pointer}.ma-shape-menu button.active{background:#1e4999;color:#fff;border-color:#1e4999}",
      ".ma-shape-menu .snap{grid-column:1/-1;width:auto;font-size:11px}.ma-shape-angle{position:absolute;z-index:9;display:none;padding:4px 6px;border-radius:6px;background:#172033;color:#fff;font:700 11px/1 system-ui;pointer-events:none}.ma-shape-angle.visible{display:block}"
    ].join("");
    document.head.appendChild(style);
  }

  function attach(surface) {
    if (!surface || surface.shapes || attached.indexOf(surface) >= 0) return;
    attached.push(surface);
    var parent = surface.parent;
    var toolbar = surface.kind === "board" ? document.getElementById("boardTools") : document.querySelector(".tools");
    if (!parent || !toolbar) return;

    var layer = document.createElement("div");
    layer.className = "ma-shape-layer";
    parent.appendChild(layer);
    var label = document.createElement("div");
    label.className = "ma-shape-angle";
    parent.appendChild(label);

    var button = document.createElement("button");
    button.type = "button";
    button.className = surface.kind === "board" ? "board-tool" : "icon-btn";
    button.title = "Formas e linhas";
    button.setAttribute("aria-label", button.title);
    button.textContent = "△";
    var imageButton = toolbar.querySelector("[data-ma-image]");
    if (imageButton) toolbar.insertBefore(button, imageButton);
    else toolbar.appendChild(button);

    var menu = document.createElement("div");
    menu.className = "ma-shape-menu";
    menu.innerHTML = FORMAS.map(function (f) {
      return '<button data-shape="' + f[0] + '" title="' + f[1] + '"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" ' +
        'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + f[2] + '</svg></button>';
    }).join("") + '<button class="snap" data-snap="1" title="Encaixar linhas a cada 15 graus">Encaixe 15°</button>';
    document.body.appendChild(menu);

    var activeTool = null;
    var drawing = null;
    var activePointerId = null;

    function positionMenu() {
      var r = button.getBoundingClientRect();
      var mw = menu.offsetWidth || 280, mh = menu.offsetHeight || 170;
      menu.style.left = Math.max(6, Math.min(innerWidth - mw - 6, r.left)) + "px";
      menu.style.top = (r.bottom + 6 + mh > innerHeight ? Math.max(6, r.top - mh - 6) : r.bottom + 6) + "px";
    }
    function updateSnap() {
      menu.querySelector("[data-snap]").classList.toggle("active", prefs.snap);
    }
    function stop() {
      if (drawing) finish({ pointerId: activePointerId });
      activeTool = null;
      drawing = null;
      activePointerId = null;
      layer.classList.remove("active");
      button.classList.remove("active");
      menu.querySelectorAll("[data-shape]").forEach(function (item) { item.classList.remove("active"); });
      label.classList.remove("visible");
    }
    function activate(tool) {
      if (window.ModoAulaFerramenta) window.ModoAulaFerramenta("forma");
      activeTool = tool;
      layer.classList.add("active");
      button.classList.add("active");
      menu.querySelectorAll("[data-shape]").forEach(function (item) { item.classList.toggle("active", item.getAttribute("data-shape") === tool); });
      menu.classList.remove("open");
    }
    button.addEventListener("click", function () {
      if (menu.classList.contains("open")) menu.classList.remove("open");
      else { updateSnap(); menu.classList.add("open"); positionMenu(); }
    });
    menu.addEventListener("click", function (event) {
      var shape = event.target.closest("[data-shape]");
      if (shape) activate(shape.getAttribute("data-shape"));
      var snap = event.target.closest("[data-snap]");
      if (snap) { prefs.snap = !prefs.snap; savePrefs(); updateSnap(); }
    });
    document.addEventListener("pointerdown", function (event) {
      if (!menu.contains(event.target) && event.target !== button) menu.classList.remove("open");
    });
    toolbar.addEventListener("click", function (event) {
      if (event.target.closest("[data-tool],[data-ma-select]")) stop();
    }, true);
    window.addEventListener("modo-aula-ferramenta", function (event) {
      if (activeTool && event.detail && event.detail.nome !== "forma") stop();
    });


    function samePointer(event) {
      return activePointerId === null || !event || event.pointerId == null || event.pointerId === activePointerId;
    }
    function contactLost(event) {
      return !!(activePointerId !== null && event && event.buttons != null && (event.buttons & 1) === 0 &&
        (event.pointerType === "mouse" || Number(event.pressure || 0) <= 0));
    }
    layer.addEventListener("pointerdown", function (event) {
      if (!activeTool || activePointerId !== null || event.isPrimary === false ||
          (surface.kind === "board" && document.getElementById("stage").classList.contains("has-resource"))) return;
      event.preventDefault();
      activePointerId = event.pointerId == null ? "__legacy__" : event.pointerId;
      surface.ink.beforeChange();
      var start = point(event, parent);
      var stroke = makeStroke(surface, activeTool, start, start, event);
      surface.ink.getStrokes().push(stroke);
      drawing = { start: start, stroke: stroke, moved: false };
      if (layer.setPointerCapture && event.pointerId != null) {
        try { layer.setPointerCapture(event.pointerId); } catch (error) {}
      }
    });
    function moveShape(event, renderNow) {
      if (!drawing || !samePointer(event)) return;
      if (contactLost(event)) { finish(event); return; }
      event.preventDefault();
      var end = point(event, parent);
      if ((activeTool === "line" || activeTool === "arrow" || activeTool === "double-arrow") && (prefs.snap || event.shiftKey)) end = snapEnd(drawing.start, end, true);
      drawing.moved = Math.hypot(end.x - drawing.start.x, end.y - drawing.start.y) > 4;
      var replacement = makeStroke(surface, activeTool, drawing.start, end, event);
      Object.keys(drawing.stroke).forEach(function (key) { delete drawing.stroke[key]; });
      Object.assign(drawing.stroke, replacement);
      if (renderNow !== false) surface.ink.redraw();
      if (activeTool === "line" || activeTool === "arrow" || activeTool === "double-arrow") {
        var angle = Math.atan2(end.y - drawing.start.y, end.x - drawing.start.x) * 180 / Math.PI;
        label.textContent = Math.round(angle) + "°";
        label.style.left = Math.min(drawing.start.x, end.x) + Math.abs(end.x - drawing.start.x) / 2 + 8 + "px";
        label.style.top = Math.min(drawing.start.y, end.y) + Math.abs(end.y - drawing.start.y) / 2 + 8 + "px";
        label.classList.add("visible");
      }
    }
    layer.addEventListener("pointermove", function (event) {
      var samples = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
      if (!samples || !samples.length) samples = [event]; else { samples = samples.slice(Math.max(0, samples.length - 8)); samples.push(event); }
      samples.forEach(function (sample, index) { moveShape(sample, index === samples.length - 1); });
    });
    function finish(event) {
      if (!samePointer(event)) return;
      var pointerId = activePointerId;
      if (!drawing) { activePointerId = null; return; }
      if (!drawing.moved) {
        var list = surface.ink.getStrokes();
        list.splice(list.indexOf(drawing.stroke), 1);
        surface.ink.rollbackChange();
      } else surface.ink.changed();
      drawing = null;
      activePointerId = null;
      label.classList.remove("visible");
      if (pointerId !== null && pointerId !== "__legacy__" && layer.releasePointerCapture) {
        try { layer.releasePointerCapture(pointerId); } catch (error) {}
      }
    }
    layer.addEventListener("pointerup", finish);
    layer.addEventListener("pointercancel", finish);
    layer.addEventListener("lostpointercapture", finish);
    window.addEventListener("blur", function () { if (activePointerId !== null) finish({ pointerId: activePointerId }); });
    document.addEventListener("visibilitychange", function () { if (document.hidden && activePointerId !== null) finish({ pointerId: activePointerId }); });

    surface.shapes = { stop: stop, activate: activate, layer: layer };
  }

  installStyles();
  function scan() {
    (window.ModoAulaObjectSurfaces || []).forEach(attach);
  }
  scan();
  /* A superfície avisa quando nasce (`modo_aula_objects_boot.js`). O tique de 3 s é
     rede de segurança para o caso de este script subir antes do que avisa. */
  window.addEventListener("modo-aula-object-surface", scan);
  setInterval(scan, 3000);
})();
