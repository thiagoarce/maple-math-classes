/* Modo Aula — projeção read-only da lousa vetorial + laser efêmero. */
(function () {
  "use strict";

  if (window.__modoAulaProjectorBoardV2) return;
  window.__modoAulaProjectorBoardV2 = true;

  var params = new URLSearchParams(location.search);
  var slot = "maple-demo-volume";
  var board = document.getElementById("board");
  if (!slot || !board) return;

  var DB_NAME = "maple-demo-classroom", DB_VERSION = 1, STORE = "sessions";
  var STATE_SLOT = slot + "|board";
  var CHANNEL_NAME = "modo-aula:presentation:v1:" + slot;
  var LASER_SIGNAL_KEY = "modo-aula:presentation:board-laser:v1:" + slot;
  var channel = null;

  var canvas = document.createElement("canvas");
  canvas.id = "projectorBoardInkCanvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "2";
  board.appendChild(canvas);

  var laserCanvas = document.createElement("canvas");
  laserCanvas.id = "projectorBoardLaserCanvas";
  laserCanvas.setAttribute("aria-hidden", "true");
  laserCanvas.style.position = "absolute";
  laserCanvas.style.inset = "0";
  laserCanvas.style.width = "100%";
  laserCanvas.style.height = "100%";
  laserCanvas.style.pointerEvents = "none";
  laserCanvas.style.zIndex = "3";
  board.appendChild(laserCanvas);

  var ctx = canvas.getContext("2d");
  var laserCtx = laserCanvas.getContext("2d");
  var state = null;
  var lastRevision = -1;
  var lastMode = "";
  var pollTimer = null;
  var laserPoints = [];
  /* O traço que o professor está fazendo AGORA, antes de virar registro no banco. */
  var rascunho = null;
  var expiraRascunho = null;
  var laserFrame = 0;
  var LASER_TTL = 520;

  try {
    // No broadcast channel in the isolated demo.
  } catch (error) {}

  resize();
  bind();
  poll();

  function bind() {
    window.addEventListener("resize", function () { resize(); redraw(); drawLaser(performance.now()); });
    if (window.ResizeObserver) {
      new ResizeObserver(function () { resize(); redraw(); drawLaser(performance.now()); }).observe(board);
    }
    if (window.MutationObserver) {
      new MutationObserver(function () {
        var mode = currentMode();
        if (mode !== lastMode) { lastMode = mode; redraw(); }
      }).observe(board, { attributes: true, attributeFilter: ["class"] });
    }
    if (channel) {
      channel.addEventListener("message", function (event) {
        var data = event && event.data || {};
        if (data.type === "board-laser" && data.state) receiveLaser(data.state);
        if (data.type === "board-ink-live") receberRascunho(data);
      });
    }
    window.addEventListener("beforeunload", function () {
      clearTimeout(pollTimer);
      if (laserFrame) cancelAnimationFrame(laserFrame);
      try { if (channel) channel.close(); } catch (error) {}
    });
  }

  function currentMode() {
    /* A casca manda a chave da superfície no estado. Quando ela é `slide:<recurso>:<n>`,
       o professor está escrevendo por cima de uma lâmina e a parede tem de reler ESSA
       superfície do mesmo registro — a lousa branca estaria vazia. */
    // Only the two generic board surfaces are allowed.
    return board.classList.contains("black") ? "black" : "white";
  }

  function openDB() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        // A projector never creates or upgrades the editor database.
        request.transaction.abort();
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function readState() {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var request = db.transaction(STORE, "readonly").objectStore(STORE).get(STATE_SLOT);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error); };
      }).finally(function () { db.close(); });
    });
  }

  function poll() {
    clearTimeout(pollTimer);
    readState().then(function (next) {
      var revision = next ? Number(next.localRevision || 0) : -1;
      var mode = currentMode();
      if (revision !== lastRevision || mode !== lastMode) {
        state = next;
        lastRevision = revision;
        lastMode = mode;
        redraw();
      }
    }).catch(function () {}).finally(function () {
      pollTimer = setTimeout(poll, 180);
    });
  }

  function resize() {
    var rect = board.getBoundingClientRect();
    var width = Math.max(1, Math.round(rect.width));
    var height = Math.max(1, Math.round(rect.height));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nextWidth = Math.max(1, Math.round(width * dpr));
    var nextHeight = Math.max(1, Math.round(height * dpr));
    [
      { canvas: canvas, context: ctx },
      { canvas: laserCanvas, context: laserCtx }
    ].forEach(function (item) {
      if (item.canvas.width === nextWidth && item.canvas.height === nextHeight) return;
      item.canvas.width = nextWidth;
      item.canvas.height = nextHeight;
      item.canvas.style.width = width + "px";
      item.canvas.style.height = height + "px";
      item.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  /* ## O traço em andamento
   *
   * O espelho lê o IndexedDB, e o banco só muda 260ms depois de a caneta levantar —
   * somado ao ciclo de 180ms daqui, a parede recebia a letra pronta, em bloco. O que
   * chega por `board-ink-live` é o traço ainda sendo feito: desenhado por cima do que
   * veio do disco e descartado assim que a gravação seguinte o substitui pelo definitivo,
   * já simplificado. Mesma solução do PDF, em `modo_aula_pdf_tinta_viva.js`.
   *
   * Se a janela do professor fechar no meio de um traço, o último quadro ficaria na
   * parede para sempre — a gravação que o apagaria nunca vem. Por isso o rascunho tem
   * validade curta. */
  var VALIDADE_DO_RASCUNHO_MS = 500;

  function receberRascunho(dados) {
    rascunho = dados && !dados.fim && dados.traco
      ? { modo: dados.modo, traco: dados.traco } : null;
    clearTimeout(expiraRascunho);
    if (rascunho) {
      expiraRascunho = setTimeout(function () { rascunho = null; redraw(); },
        VALIDADE_DO_RASCUNHO_MS);
    }
    redraw();
  }

  function redraw() {
    resize();
    var rect = board.getBoundingClientRect();
    var width = Math.max(1, rect.width);
    var height = Math.max(1, rect.height);
    ctx.clearRect(0, 0, width, height);
    /* A saída antecipada ficava aqui: `if (!state || !state.surfaces) return`. Numa lousa
       que ainda não foi gravada nenhuma vez, `state` é nulo — e era exatamente o começo
       da aula, quando o professor escreve a primeira coisa, que a parede não mostrava
       nada. O traço em andamento não depende de haver registro no banco. */
    var superficie = (state && state.surfaces && state.surfaces[currentMode()]) || { strokes: [] };
    var strokes = Array.isArray(superficie.strokes) ? superficie.strokes : [];
    if (rascunho && rascunho.modo === currentMode()) strokes = strokes.concat([rascunho.traco]);
    if (!strokes.length) return;
    strokes.filter(function (stroke) { return stroke.tool === "highlighter"; }).forEach(function (stroke) { drawStroke(stroke, width, height); });
    strokes.filter(function (stroke) { return stroke.tool !== "highlighter"; }).forEach(function (stroke) { drawStroke(stroke, width, height); });
  }

  function drawStroke(stroke, width, height) {
    var points = stroke.points || [];
    if (points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = stroke.opacity == null ? 1 : stroke.opacity;
    ctx.strokeStyle = stroke.color || "#1e4999";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    var baseWidth = strokePixelWidth(stroke, width);
    if (points.length === 2) {
      var radius = Math.max(0.75, baseWidth * pressureFactor(pressureAt(stroke, 0), stroke.tool) / 2);
      ctx.beginPath();
      ctx.arc(points[0] * width, points[1] * height, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
    for (var i = 0; i < points.length - 2; i += 2) {
      var p = (pressureAt(stroke, i / 2) + pressureAt(stroke, i / 2 + 1)) / 2;
      ctx.lineWidth = Math.max(1, baseWidth * pressureFactor(p, stroke.tool));
      ctx.beginPath();
      ctx.moveTo(points[i] * width, points[i + 1] * height);
      ctx.lineTo(points[i + 2] * width, points[i + 3] * height);
      ctx.stroke();
    }
    ctx.restore();
  }

  function strokePixelWidth(stroke, surfaceWidth) {
    var value = Number(stroke.width) || 4;
    return value <= 0.2 ? value * surfaceWidth : value;
  }

  function pressureAt(stroke, index) {
    var value = Number((stroke.pressure || [])[index]);
    return isFinite(value) && value > 0 ? value : 0.5;
  }

  function pressureFactor(value, strokeTool) {
    return strokeTool === "highlighter" ? 1 : 0.62 + Math.max(0.08, Math.min(1, value)) * 0.78;
  }

  function receiveLaser(next) {
    if (!next || !next.active) {
      startLaserLoop();
      return;
    }
    laserPoints.push({
      x: clamp01(next.x),
      y: clamp01(next.y),
      color: next.color || (currentMode() === "black" ? "#ff4057" : "#ef233c"),
      width: Math.max(2, Number(next.width) || 5),
      t: performance.now()
    });
    if (laserPoints.length > 180) laserPoints.splice(0, laserPoints.length - 180);
    startLaserLoop();
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function startLaserLoop() {
    if (laserFrame) return;
    laserFrame = requestAnimationFrame(laserLoop);
  }

  function laserLoop(now) {
    laserFrame = 0;
    drawLaser(now);
    laserPoints = laserPoints.filter(function (point) { return now - point.t < LASER_TTL; });
    if (laserPoints.length) laserFrame = requestAnimationFrame(laserLoop);
  }

  function drawLaser(now) {
    resize();
    var rect = board.getBoundingClientRect();
    var width = Math.max(1, rect.width);
    var height = Math.max(1, rect.height);
    laserCtx.clearRect(0, 0, width, height);
    var alive = laserPoints.filter(function (point) { return now - point.t < LASER_TTL; });
    for (var i = 0; i < alive.length; i++) {
      var point = alive[i];
      var alpha = Math.max(0, 1 - (now - point.t) / LASER_TTL);
      var x = point.x * width;
      var y = point.y * height;
      if (i > 0) {
        var previous = alive[i - 1];
        if (point.t - previous.t < 140) {
          laserCtx.save();
          laserCtx.globalAlpha = alpha * 0.72;
          laserCtx.strokeStyle = point.color;
          laserCtx.lineWidth = point.width;
          laserCtx.lineCap = "round";
          laserCtx.beginPath();
          laserCtx.moveTo(previous.x * width, previous.y * height);
          laserCtx.lineTo(x, y);
          laserCtx.stroke();
          laserCtx.restore();
        }
      }
      if (i === alive.length - 1) {
        laserCtx.save();
        laserCtx.globalAlpha = Math.max(0.35, alpha);
        laserCtx.fillStyle = point.color;
        laserCtx.shadowColor = point.color;
        laserCtx.shadowBlur = Math.max(8, point.width * 1.8);
        laserCtx.beginPath();
        laserCtx.arc(x, y, Math.max(3, point.width * 0.8), 0, Math.PI * 2);
        laserCtx.fill();
        laserCtx.restore();
      }
    }
  }
})();
