/* Modo Aula — lousa vetorial v3: traços suaves e formas por manter a ponta pressionada. */
(function () {
  "use strict";

  if (window.__modoAulaBoardV3) return;
  window.__modoAulaBoardV3 = true;
  if (!window.ModoAulaInkCore) {
    console.error("ModoAulaInkCore não carregado.");
    return;
  }

  var params = new URLSearchParams(location.search);
  var lessonSlot = "maple-demo-volume";
  if (!lessonSlot) return;

  var board = document.getElementById("board");
  var stage = document.getElementById("stage");
  var whiteBtn = document.getElementById("whiteBtn");
  var blackBtn = document.getElementById("blackBtn");
  if (!board || !stage || !whiteBtn || !blackBtn) return;

  var DB_NAME = "maple-demo-classroom", DB_VERSION = 1, STORE = "sessions";
  var STATE_SLOT = lessonSlot + "|board";
  var PREFS_KEY = "maple-demo:classroom:board-tools:v3";
  var state = null;
  var currentMode = board.classList.contains("black") ? "black" : "white";
  var tool = "pen";
  var saveTimer = null, resizeTimer = null, snapStatusTimer = null;
  var history = { white: { undo: [], redo: [] }, black: { undo: [], redo: [] } };
  var prefs = readLocal(PREFS_KEY, null) || migratePrefs();

  function migratePrefs() {
    var old = readLocal("maple-demo:classroom:board-tools:v2", {}) || {};
    return {
      toolbarCollapsed: !!old.toolbarCollapsed,
      pressure: old.pressure !== false,
      colors: old.colors || {
        white: { pen: "#1e4999", highlighter: "#ffe100", laser: "#ef233c" },
        black: { pen: "#ffeb3b", highlighter: "#35d0ff", laser: "#ff4057" }
      },
      widths: old.widths || { pen: 5, highlighter: 24, laser: 5, eraserPartial: 18, eraserStroke: 18 }
    };
  }

  var canvas = document.createElement("canvas");
  canvas.id = "boardInkCanvas";
  canvas.className = "board-ink-canvas";
  canvas.setAttribute("aria-label", "Superfície de escrita da lousa");
  var empty = board.querySelector(".empty");
  if (empty) empty.remove();
  board.appendChild(canvas);

  var laserCanvas = document.createElement("canvas");
  laserCanvas.id = "boardLaserCanvas";
  laserCanvas.className = "board-laser-canvas";
  laserCanvas.setAttribute("aria-hidden", "true");
  board.appendChild(laserCanvas);

  var toolbar = document.createElement("div");
  toolbar.id = "boardTools";
  toolbar.className = "board-tools" + (prefs.toolbarCollapsed ? " collapsed" : "");
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "Ferramentas da lousa");
  toolbar.innerHTML = [
    toolButton("pen", "Caneta (P)", "✎", true),
    toolButton("highlighter", "Marca-texto (H)", "▰"),
    toolButton("laser", "Tinta laser (L)", "⌁"),
    toolButton("eraserPartial", "Borracha parcial (E)", "◒"),
    toolButton("eraserStroke", "Apagar traço inteiro (Shift+E)", "⌫"),
    '<label class="board-color" title="Cor"><input id="boardColor" type="color"></label>',
    '<label class="board-width" title="Espessura"><span>≡</span><input id="boardWidth" type="range" min="1" max="40" step="1"></label>',
    '<button type="button" class="board-tool pressure-toggle" data-action="pressure" title="Pressão da mesa digitalizadora" aria-label="Pressão da mesa digitalizadora">◢</button>',
    '<button type="button" class="board-tool" data-action="undo" title="Desfazer" aria-label="Desfazer">↶</button>',
    '<button type="button" class="board-tool" data-action="redo" title="Refazer" aria-label="Refazer">↷</button>',
    '<button type="button" class="board-tool" data-action="clear" title="Limpar lousa" aria-label="Limpar lousa">⌧</button>',
    '<button type="button" class="board-tool" data-action="focus" title="Tela máxima da lousa" aria-label="Tela máxima da lousa">⛶</button>',
    '<span class="board-save-status" id="boardSaveStatus">local</span>',
    '<button type="button" class="board-tool board-tools-toggle" data-action="collapse" title="Recolher ferramentas" aria-label="Recolher ferramentas">‹</button>'
  ].join("");
  stage.appendChild(toolbar);

  var eraserCursor = document.createElement("div");
  eraserCursor.className = "board-eraser-cursor";
  document.body.appendChild(eraserCursor);

  var focusExit = document.createElement("button");
  focusExit.id = "boardFocusExit";
  focusExit.type = "button";
  focusExit.className = "board-focus-exit";
  focusExit.title = "Sair da tela máxima";
  focusExit.setAttribute("aria-label", focusExit.title);
  focusExit.textContent = "×";
  document.body.appendChild(focusExit);

  var colorInput = document.getElementById("boardColor");
  var widthInput = document.getElementById("boardWidth");
  var saveStatus = document.getElementById("boardSaveStatus");
  var engine = null;

  injectStyles();
  bind();
  loadState().then(function () {
    engine = window.ModoAulaInkCore.create({
      canvas: canvas,
      laserCanvas: laserCanvas,
      eraserCursor: eraserCursor,
      getStrokes: function () { return surface().strokes; },
      setStrokes: function (value) { surface().strokes = value; },
      beforeChange: pushHistory,
      rollbackChange: function () { historyFor().undo.pop(); updateTools(); },
      changed: scheduleSave,
      /* A tinta se desligava sempre que havia recurso aberto — era isso que tornava
         impossível anotar por cima de um slide. Continua desligada para os outros
         recursos (vídeo, HTML interativo), onde a camada roubaria o ponteiro. */
      disabled: function () {
        return !state || (stage.classList.contains("has-resource") && !anotandoLamina());
      },
      getWidth: function (name) { return Number((prefs.widths || {})[name]) || (name === "highlighter" ? 24 : 5); },
      getColor: function (name) { return toolColor(name); },
      getPressure: function () { return prefs.pressure !== false; },
      normalizeWidth: false,
      onSnap: showSnapStatus
    });
    applyToolPrefs();
    resizeCanvas();
    updateVisibility();
    ligarTintaViva();
  });

  /* ## A escrita da lousa chegando na parede enquanto a mão anda
   *
   * A tela de projeção relê o IndexedDB e redesenha quando a revisão muda. Só que a
   * revisão só muda quando esta janela grava, e ela grava 260ms DEPOIS de o traço
   * terminar; somado ao ciclo de 180ms do espelho, a parede recebia a letra inteira de
   * uma vez, com quase meio segundo de atraso. o professor, 13/08: *"a tinta no modo
   * apresentação aparece de modo cortado"*. Foi curado no PDF em `pdf_tinta_viva.js`;
   * esta é a mesma cura na lousa.
   *
   * O canal é o mesmo `modo-aula:presentation:v1:<slot>` que a casca já usa, porque o
   * espelho da lousa já escuta nele. Trafega o traço em andamento uma vez por quadro, e
   * o ponto do laser junto. Parado, não posta nada.
   *
   * O laser é dívida minha: em 12/08 apaguei o `board_laser_presenter_sync.js` na
   * limpeza, anotando que "o board_v3 já publica o dele". Não publicava — ninguém
   * publicava, e o `board-laser` que o espelho espera nunca mais chegou. Volta aqui,
   * junto com a tinta, que precisa exatamente do mesmo caminho. */
  function ligarTintaViva() {
    var canal = null;
    try {
      if (false) { // Projection disabled until the paired host is validated.
        canal = new BroadcastChannel("modo-aula:presentation:v1:" + lessonSlot);
      }
    } catch (error) { return; }
    if (!canal) return;

    var quadro = 0;
    var desenhando = false;

    function publicar(fim) {
      var traços = state ? surface().strokes : [];
      var laser = engine && engine.laserAtivo ? engine.laserAtivo() : null;
      try {
        canal.postMessage({
          type: "board-ink-live",
          slot: lessonSlot,
          modo: currentMode,
          traco: fim ? null : (traços.length ? traços[traços.length - 1] : null),
          fim: !!fim
        });
        /* O espelho da lousa desenha o laser com o próprio rastro; ele espera um ponto
           por vez, no formato que o `receiveLaser` dele já lê. */
        if (laser && !fim) {
          canal.postMessage({
            type: "board-laser", slot: lessonSlot,
            state: { active: true, x: laser.x, y: laser.y, color: laser.cor, width: laser.largura }
          });
        } else if (fim) {
          canal.postMessage({ type: "board-laser", slot: lessonSlot, state: { active: false } });
        }
      } catch (error) {}
    }

    function agendar() {
      if (quadro) return;
      quadro = requestAnimationFrame(function () {
        quadro = 0;
        publicar(false);
        if (desenhando) agendar();
      });
    }

    canvas.addEventListener("pointerdown", function () { desenhando = true; agendar(); }, true);
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (nome) {
      canvas.addEventListener(nome, function () { desenhando = false; publicar(true); }, true);
    });
    window.addEventListener("blur", function () { desenhando = false; publicar(true); });
    window.addEventListener("beforeunload", function () { publicar(true); });
  }

  function toolButton(name, title, glyph, active) {
    return '<button type="button" class="board-tool' + (active ? " active" : "") +
      '" data-tool="' + name + '" title="' + title + '" aria-label="' + title + '">' + glyph + "</button>";
  }
  function readLocal(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (error) { return fallback; }
  }
  function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (error) {} }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function randomId() {
    return crypto.randomUUID ? crypto.randomUUID() :
      "b-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function blankState() {
    return {
      version: 3,
      slot: STATE_SLOT,
      lessonSlot: lessonSlot,
      surfaces: { white: { strokes: [] }, black: { strokes: [] } },
      localRevision: 0,
      updatedAt: new Date().toISOString()
    };
  }
  function ensureState(value) {
    var result = value && value.slot === STATE_SLOT ? value : blankState();
    result.version = 3;
    if (!result.surfaces) result.surfaces = {};
    ["white", "black"].forEach(function (mode) {
      if (!result.surfaces[mode]) result.surfaces[mode] = { strokes: [] };
      if (!Array.isArray(result.surfaces[mode].strokes)) result.surfaces[mode].strokes = [];
      result.surfaces[mode].strokes.forEach(function (stroke) {
        if (!stroke.id) stroke.id = randomId();
        if (!stroke.tool) stroke.tool = "pen";
        if (stroke.opacity == null) stroke.opacity = stroke.tool === "highlighter" ? 0.26 : 1;
      });
    });
    return result;
  }
  function openDB() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "slot" });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }
  function dbGet(key) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error); };
      }).finally(function () { db.close(); });
    });
  }
  function dbPut(value) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(STORE, "readwrite");
        transaction.objectStore(STORE).put(value);
        transaction.oncomplete = resolve;
        transaction.onerror = function () { reject(transaction.error); };
      }).finally(function () { db.close(); });
    });
  }
  function loadState() {
    return dbGet(STATE_SLOT).then(function (stored) {
      state = ensureState(stored);
      setStatus("salvo", "ok");
    }).catch(function () {
      state = blankState();
      setStatus("local", "warn");
    });
  }
  function scheduleSave() {
    if (!state) return;
    setStatus("alterado", "dirty");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveLocal, 260);
  }
  function saveLocal() {
    if (!state) return Promise.resolve();
    state.localRevision = Number(state.localRevision || 0) + 1;
    state.updatedAt = new Date().toISOString();
    return dbPut(clone(state)).then(function () {
      setStatus("salvo", "ok");
    }).catch(function () {
      setStatus("falhou", "error");
    });
  }
  function setStatus(text, kind) {
    saveStatus.textContent = text;
    saveStatus.className = "board-save-status" + (kind ? " " + kind : "");
  }
  function showSnapStatus(shape) {
    var labels = { line: "reta", ellipse: "elipse", triangle: "triângulo", rectangle: "retângulo", square: "quadrado" };
    clearTimeout(snapStatusTimer);
    setStatus(labels[shape] || "forma", "ok");
    snapStatusTimer = setTimeout(function () { setStatus("alterado", "dirty"); }, 850);
  }
  /* O modo deixou de ser só `white`/`black`: anotar sobre uma lâmina de slide usa a
     MESMA lousa, com a chave `slide:<recurso>:<indice>`. Reaproveitar em vez de criar
     uma segunda camada dá de graça o que já custou caro aqui: o motor de tinta, o
     autosave no IndexedDB, o desfazer por superfície e — o que mais importa — o espelho
     da parede, que relê este mesmo registro. Por isso a superfície nasce sob demanda. */
  function surface(mode) {
    var chave = mode || currentMode;
    if (!state.surfaces[chave]) state.surfaces[chave] = { strokes: [] };
    return state.surfaces[chave];
  }
  function historyFor(mode) {
    var chave = mode || currentMode;
    if (!history[chave]) history[chave] = { undo: [], redo: [] };
    return history[chave];
  }
  function pushHistory() {
    var h = historyFor();
    h.undo.push(clone(surface().strokes));
    if (h.undo.length > 50) h.undo.shift();
    h.redo = [];
    updateTools();
  }
  function undo() {
    var h = historyFor();
    if (!h.undo.length) return;
    h.redo.push(clone(surface().strokes));
    surface().strokes = h.undo.pop();
    engine.redraw();
    scheduleSave();
    updateTools();
  }
  function redo() {
    var h = historyFor();
    if (!h.redo.length) return;
    h.undo.push(clone(surface().strokes));
    surface().strokes = h.redo.pop();
    engine.redraw();
    scheduleSave();
    updateTools();
  }
  function clearBoard() {
    if (!surface().strokes.length) return;
    pushHistory();
    surface().strokes = [];
    engine.redraw();
    scheduleSave();
  }
  function toolColor(name) {
    var perMode = (prefs.colors || {})[currentMode] || {};
    return perMode[name] ||
      (name === "highlighter" ? "#ffe100" :
        name === "laser" ? "#ef233c" :
          currentMode === "black" ? "#ffeb3b" : "#1e4999");
  }
  function isEraser(name) {
    name = name || tool;
    return name === "eraserPartial" || name === "eraserStroke";
  }
  function selectTool(next) {
    tool = next;
    toolbar.querySelectorAll("[data-tool]").forEach(function (button) {
      button.classList.toggle("active", button.getAttribute("data-tool") === tool);
    });
    if (engine) engine.setTool(tool);
    applyToolPrefs();
  }
  function applyToolPrefs() {
    var colorTool = tool === "highlighter" ? "highlighter" : tool === "laser" ? "laser" : "pen";
    colorInput.value = toolColor(colorTool);
    widthInput.value = String(Math.max(1, Number((prefs.widths || {})[tool]) ||
      (tool === "highlighter" ? 24 : 5)));
    colorInput.closest("label").hidden = isEraser();
    toolbar.querySelector('[data-action="pressure"]').classList.toggle("active", prefs.pressure !== false);
    updateTools();
  }
  function updateTools() {
    var h = historyFor();
    toolbar.querySelector('[data-action="undo"]').disabled = !h.undo.length;
    toolbar.querySelector('[data-action="redo"]').disabled = !h.redo.length;
  }
  function setMode(mode) {
    currentMode = mode;
    applyToolPrefs();
    updateVisibility();
    resizeCanvas();
    if (engine) engine.redraw();
  }

  /* Fronteira para quem conduz de fora — hoje `modo_aula_slides_tinta.js`. Camadas de
     condução não imitam clique nem conhecem a estrutura visual daqui; é a mesma regra
     do `ModoAulaShell`. */
  window.ModoAulaLousa = {
    modo: function () { return currentMode; },
    irPara: setMode,
    redesenhar: function () { resizeCanvas(); if (engine) engine.redraw(); }
  };
  function resizeCanvas() {
    var rect = board.getBoundingClientRect();
    if (!rect.width || !rect.height || !engine) return;
    engine.resize(rect.width, rect.height, Math.min(window.devicePixelRatio || 1, 2));
  }
  function anotandoLamina() {
    return /^slide:/.test(currentMode) && stage.classList.contains("ma-anotando-lamina");
  }
  function updateVisibility() {
    var resourceOpen = stage.classList.contains("has-resource");
    var lamina = anotandoLamina();
    toolbar.hidden = resourceOpen && !lamina;
    canvas.style.pointerEvents = (resourceOpen && !lamina) ? "none" : "auto";
    laserCanvas.hidden = resourceOpen && !lamina;
  }
  function setToolbarCollapsed(value) {
    prefs.toolbarCollapsed = !!value;
    toolbar.classList.toggle("collapsed", prefs.toolbarCollapsed);
    var button = toolbar.querySelector('[data-action="collapse"]');
    button.textContent = prefs.toolbarCollapsed ? "›" : "‹";
    savePrefs();
  }
  function enterFocus() {
    document.body.classList.add("board-focus");
    focusExit.hidden = false;
    requestAnimationFrame(resizeCanvas);
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    }
  }
  function exitFocus() {
    document.body.classList.remove("board-focus");
    focusExit.hidden = true;
    requestAnimationFrame(resizeCanvas);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }
  function toggleFocus() {
    if (document.body.classList.contains("board-focus")) exitFocus();
    else enterFocus();
  }

  function injectStyles() {
    var style = document.createElement("style");
    style.id = "modoAulaBoardCssV3";
    style.textContent = [
      ".board{overflow:hidden}",
      ".board-ink-canvas,.board-laser-canvas{position:absolute;inset:0;display:block;touch-action:none;user-select:none}",
      ".board-ink-canvas{z-index:1;cursor:crosshair}.board-laser-canvas{z-index:2;pointer-events:none}",
      ".board-ink-canvas.eraser-active{cursor:none}.board-ink-canvas.laser-active{cursor:crosshair}",
      ".board-eraser-cursor{position:fixed;z-index:1005;display:none;border:1.5px solid rgba(30,73,153,.9);border-radius:50%;background:rgba(30,73,153,.12);pointer-events:none;transform:translate(-50%,-50%)}",
      ".board-tools{position:absolute;z-index:10;left:50%;top:14px;transform:translateX(-50%);display:flex;align-items:center;gap:5px;padding:6px;border:1px solid #d8deea;border-radius:13px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(23,32,51,.15);backdrop-filter:blur(8px)}",
      ".board-tool,.board-color,.board-width{height:36px;border:1px solid #d8deea;border-radius:9px;background:#fff;color:#172033;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto}",
      ".board-tool{width:36px;font-size:18px;cursor:pointer}.board-tool.active{background:#1e4999;border-color:#1e4999;color:#fff}.board-tool:disabled{opacity:.35}",
      ".board-color{width:36px;padding:4px}.board-color input{appearance:none;-webkit-appearance:none;width:25px;height:25px;padding:0;border:0;border-radius:50%;overflow:hidden;background:transparent}.board-color input::-webkit-color-swatch-wrapper{padding:0}.board-color input::-webkit-color-swatch{border:0;border-radius:50%}",
      ".board-width{width:118px;padding:0 7px;gap:5px}.board-width input{width:80px;accent-color:#1e4999}",
      ".board-save-status{min-width:52px;padding:0 6px;color:#667085;font-size:10px;font-weight:800;text-align:center}.board-save-status.ok{color:#237a42}.board-save-status.dirty{color:#a75b00}.board-save-status.error{color:#a52727}",
      ".board-tools.collapsed>*:not(.board-tools-toggle){display:none}.board-tools.collapsed{left:12px;transform:none}.board-tools-toggle{font-size:23px}",
      ".board-focus-exit{display:none;position:fixed;z-index:1002;right:12px;top:12px;width:42px;height:42px;border:1px solid rgba(255,255,255,.42);border-radius:12px;background:rgba(23,32,51,.72);color:#fff;font-size:26px;line-height:1;cursor:pointer;box-shadow:0 7px 22px rgba(0,0,0,.24)}",
      "body.board-focus .app{position:fixed;inset:0;display:block;height:100%;background:#fff}body.board-focus .topbar,body.board-focus .drawer,body.board-focus .shelf{display:none!important}body.board-focus .workspace,body.board-focus .stage{position:absolute;inset:0;width:100%;height:100%}body.board-focus .board-tools{top:12px}body.board-focus .board-focus-exit{display:block}",
      "@media(max-width:850px){.board-tools{left:8px;right:8px;top:8px;transform:none;overflow-x:auto;justify-content:flex-start}.board-width{width:100px}.board-width input{width:62px}.board-save-status{display:none}.board-tools.collapsed{right:auto}.board-focus-exit{right:8px;top:8px}}"
    ].join("");
    document.head.appendChild(style);
  }

  function bind() {
    toolbar.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) return;
      var nextTool = button.getAttribute("data-tool");
      var action = button.getAttribute("data-action");
      if (nextTool) selectTool(nextTool);
      else if (action === "pressure") {
        prefs.pressure = prefs.pressure === false;
        applyToolPrefs();
        savePrefs();
      } else if (action === "undo") undo();
      else if (action === "redo") redo();
      else if (action === "clear") clearBoard();
      else if (action === "focus") enterFocus();
      else if (action === "collapse") setToolbarCollapsed(!prefs.toolbarCollapsed);
    });
    colorInput.addEventListener("input", function () {
      var key = tool === "highlighter" ? "highlighter" : tool === "laser" ? "laser" : "pen";
      prefs.colors[currentMode][key] = colorInput.value;
      savePrefs();
    });
    widthInput.addEventListener("input", function () {
      prefs.widths[tool] = Math.max(1, Number(widthInput.value) || 5);
      if (engine) engine.updateCursor();
      savePrefs();
    });
    whiteBtn.addEventListener("click", function () { setMode("white"); });
    blackBtn.addEventListener("click", function () { setMode("black"); });
    focusExit.addEventListener("click", exitFocus);

    document.addEventListener("keydown", function (event) {
      if (event.target && /input|textarea|select/i.test(event.target.tagName)) return;
      var key = event.key.toLowerCase();
      if (key === "p") selectTool("pen");
      else if (key === "h") selectTool("highlighter");
      else if (key === "l") selectTool("laser");
      else if (key === "e") selectTool(event.shiftKey ? "eraserStroke" : "eraserPartial");
      else if (key === "m" && !stage.classList.contains("has-resource")) {
        event.preventDefault();
        toggleFocus();
      } else if (key === "escape" && document.body.classList.contains("board-focus")) {
        exitFocus();
      } else if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      }
    }, true);

    document.addEventListener("fullscreenchange", function () {
      if (!document.fullscreenElement && document.body.classList.contains("board-focus")) {
        document.body.classList.remove("board-focus");
        focusExit.hidden = true;
        requestAnimationFrame(resizeCanvas);
      }
    });
    /* Estes dois observadores recalculavam o modo a partir da classe do quadro. Com a
       superfície de lâmina isso desfazia a troca no mesmo quadro de animação: quem
       ligava o "Escrever" sobre o slide via a lousa voltar para `white` sozinha, sem
       erro nenhum no console. Enquanto a lâmina está no comando, o fundo branco/preto
       não é quem manda. */
    function modoDoFundo() {
      if (anotandoLamina()) return currentMode;
      return board.classList.contains("black") ? "black" : "white";
    }
    new MutationObserver(function () {
      updateVisibility();
      var nextMode = modoDoFundo();
      if (nextMode !== currentMode) setMode(nextMode);
    }).observe(stage, { attributes: true, attributeFilter: ["class"] });
    new MutationObserver(function () {
      var nextMode = modoDoFundo();
      if (nextMode !== currentMode) setMode(nextMode);
    }).observe(board, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 100);
    });
  }
})();
