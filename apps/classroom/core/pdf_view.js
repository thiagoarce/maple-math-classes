/* Modo Aula — zoom físico coordenado do PDF, tinta, imagens e seleção. */
(function () {
  "use strict";
  if (window.__modoAulaPdfViewV3) return;
  window.__modoAulaPdfViewV3 = true;

  var MIN_ZOOM = 0.35, MAX_ZOOM = 4, STEP = 1.2;
  var STORAGE_KEY = "maple-demo:classroom:view:v4";
  var workspace = document.getElementById("workspace");
  var sheet = document.getElementById("sheet");
  var pdfCanvas = document.getElementById("pdfCanvas");
  var inkHost = document.getElementById("ink");
  var nextPage = document.getElementById("nextPage");
  if (!workspace || !sheet || !pdfCanvas || !inkHost || !nextPage) return;

  var zoom = 1, mode = "width", label = null;
  var baseWidth = 0, baseHeight = 0;
  var applying = false;

  function icon(paths) {
    return '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">' + paths + "</svg>";
  }
  function button(id, title, paths) {
    var node = document.createElement("button");
    node.type = "button";
    node.id = id;
    node.className = "icon-btn";
    node.title = title;
    node.setAttribute("aria-label", title);
    node.innerHTML = icon(paths);
    return node;
  }
  function insertAfter(reference, node) {
    reference.parentNode.insertBefore(node, reference.nextSibling);
    return node;
  }
  function clamp(value) {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value) || 1));
  }
  function available() {
    var style = getComputedStyle(workspace);
    return {
      width: Math.max(1, workspace.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0)),
      height: Math.max(1, workspace.clientHeight - parseFloat(style.paddingTop || 0) - parseFloat(style.paddingBottom || 0))
    };
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: mode, zoom: zoom })); }
    catch (error) {}
  }
  function preference() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
    catch (error) { return null; }
  }
  function captureBaseSize() {
    var width = parseFloat(pdfCanvas.style.width) || 0;
    var height = parseFloat(pdfCanvas.style.height) || 0;
    if (!width || !height) return false;
    baseWidth = width;
    baseHeight = height;
    return true;
  }
  function inkEngine() {
    var canvas = document.querySelector(".pdf-ink-canvas");
    return canvas && canvas.__modoAulaInkInstance || null;
  }
  function refreshObjectLayers() {
    (window.ModoAulaObjectSurfaces || []).forEach(function (surface) {
      if (!surface || surface.kind !== "pdf") return;
      try { surface.images.render(); } catch (error) {}
      try { surface.selection.render(); } catch (error) {}
    });
  }
  function resizeInk(width, height) {
    var engine = inkEngine();
    if (!engine || !engine.resize) return;
    engine.resize(width, height, Math.min(window.devicePixelRatio || 1, 2));
  }
  function apply(value, nextMode, skipSave) {
    if (applying) return;
    if (!baseWidth || !baseHeight) {
      if (!captureBaseSize()) return;
    }
    applying = true;
    zoom = clamp(value);
    mode = nextMode || "manual";

    var width = Math.max(1, baseWidth * zoom);
    var height = Math.max(1, baseHeight * zoom);

    /* Nunca usar CSS zoom/transform: eles alteram o visual sem alterar
       o sistema lógico do canvas e deslocam PointerEvent em relação à tinta. */
    sheet.style.zoom = "";
    sheet.style.transform = "";
    sheet.style.transformOrigin = "";
    sheet.style.width = width + "px";
    sheet.style.height = height + "px";
    pdfCanvas.style.width = width + "px";
    pdfCanvas.style.height = height + "px";
    inkHost.style.width = width + "px";
    inkHost.style.height = height + "px";

    resizeInk(width, height);
    refreshObjectLayers();

    workspace.style.justifyContent = width <= available().width + 1 ? "center" : "flex-start";
    if (label) label.textContent = Math.round(zoom * 100) + "%";
    if (!skipSave) save();
    window.dispatchEvent(new CustomEvent("modo-aula-pdf-view-resized", {
      detail: { zoom: zoom, width: width, height: height }
    }));
    applying = false;
  }
  function fit(nextMode, skipSave) {
    if (!baseWidth || !baseHeight) {
      if (!captureBaseSize()) return;
    }
    var room = available();
    apply(nextMode === "height" ? room.height / baseHeight : room.width / baseWidth, nextMode, skipSave);
  }
  function restore() {
    var stored = preference();
    if (stored && stored.mode === "manual" && isFinite(stored.zoom)) {
      apply(stored.zoom, "manual", true);
    } else {
      fit(stored && stored.mode === "height" ? "height" : "width", true);
    }
  }

  var separator = document.createElement("span");
  separator.className = "sep";
  var anchor = insertAfter(nextPage, separator);
  var out = insertAfter(anchor, button("zoomOutBtn", "Diminuir zoom", '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6"/>'));
  label = document.createElement("span");
  label.id = "zoomLabel";
  label.className = "control zoom-value";
  label.textContent = "100%";
  label.setAttribute("aria-label", "Zoom atual");
  anchor = insertAfter(out, label);
  var inside = insertAfter(anchor, button("zoomInBtn", "Aumentar zoom", '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4M8 11h6M11 8v6"/>'));
  var fitWidth = insertAfter(inside, button("fitWidthBtn", "Ajustar à largura", '<path d="M4 5v14M20 5v14M8 12h8M8 12l3-3M8 12l3 3M16 12l-3-3M16 12l-3 3"/>'));
  var fitHeight = insertAfter(fitWidth, button("fitHeightBtn", "Ajustar à altura", '<path d="M5 4h14M5 20h14M12 8v8M12 8l-3 3M12 8l3 3M12 16l-3-3M12 16l3-3"/>'));

  var style = document.createElement("style");
  style.id = "modoAulaPdfViewV3Css";
  style.textContent = ".zoom-value{min-width:58px;padding:0 7px;font-variant-numeric:tabular-nums}@media(max-width:600px){.zoom-value{min-width:52px}}";
  document.head.appendChild(style);

  out.addEventListener("click", function () { apply(zoom / STEP, "manual"); });
  inside.addEventListener("click", function () { apply(zoom * STEP, "manual"); });
  fitWidth.addEventListener("click", function () { fit("width"); });
  fitHeight.addEventListener("click", function () { fit("height"); });

  window.addEventListener("modo-aula-pdf-rendered", function () {
    /* renderPage sempre devolve os estilos do canvas à dimensão-base da página. */
    requestAnimationFrame(function () {
      if (!captureBaseSize()) return;
      restore();
    });
  });
  window.addEventListener("resize", function () {
    clearTimeout(window.__modoPdfViewResizeTimerV3);
    window.__modoPdfViewResizeTimerV3 = setTimeout(function () {
      if (!baseWidth || !baseHeight) return;
      if (mode === "manual") apply(zoom, "manual", true);
      else fit(mode, true);
    }, 100);
  });
  document.addEventListener("keydown", function (event) {
    if (!(event.ctrlKey || event.metaKey) || event.target && /input|textarea|select/i.test(event.target.tagName)) return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      apply(zoom * STEP, "manual");
    } else if (event.key === "-") {
      event.preventDefault();
      apply(zoom / STEP, "manual");
    } else if (event.key === "0") {
      event.preventDefault();
      fit("width");
    }
  }, true);
})();
