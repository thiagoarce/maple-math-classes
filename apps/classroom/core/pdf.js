/* Modo Aula — motor PDF v3: tinta suave e formas por manter a ponta pressionada. */
(function () {
  "use strict";

  if (window.__modoAulaPdfV3) return;
  window.__modoAulaPdfV3 = true;
  if (!window.ModoAulaInkCore) {
    console.error("ModoAulaInkCore não carregado.");
    return;
  }

  var params = new URLSearchParams(location.search);
  var lessonSlot = "maple-demo-volume";
  var resourceId = "pdf-demo";

  /* Na parede roda o mesmo visualizador, mas em espelho: não aceita caneta e não grava
     nada. Sem isto seriam DUAS instâncias completas do editor gravando na mesma linha
     do IndexedDB — cada uma incrementando `localRevision` e sobrescrevendo a outra. */
  var PROJECAO = false;
  var manifest = { title: "Demonstração", resources: [{ id: "pdf-demo", title: "Área e volume", pdfUrl: "fixtures/volume-demo.pdf" }] };

  var resource = manifest && (manifest.resources || []).find(function (item) {
    return item.id === resourceId;
  });
  /* A TINTA É DA FOLHA, NÃO DO DIA.
   *
   * Ele, em 04/09: *"como os handouts e listas são compartilhados entre as aulas, a tinta
   * escrita em uma aula vai ter que ser compartilhada pra outra para eu continuar a
   * escrever no mesmo arquivo."*
   *
   * A chave era `lessonSlot + "|pdf|" + resourceId`, e `lessonSlot` é
   * `data|hora|ano|disciplina` — a DATA estava na chave. Consequência medida: o handout de
   * Logaritmos serve 09/09, 16/09 e 23/09 (regra nº 11: a folha é do conteúdo, não da
   * data) e ganhava TRÊS camadas de tinta independentes. Ele abria a mesma folha no
   * segundo encontro e ela voltava em branco.
   *
   * A identidade estável da folha é o caminho publicado do PDF — não o `resourceId`, que
   * é do manifesto de cada aula. Então a chave passa a ser o caminho.
   *
   * O QUADRO continua por aula (`|board`), e isso é de propósito: o quadro branco é o
   * rascunho DAQUELE dia, não um documento que continua. */
  function chaveDaFolha(url) {
    var caminho = String(url || "");
    try { caminho = new URL(caminho, location.href).pathname; } catch (erro) {}
    return "folha|" + caminho;
  }

  var ALVO = resource && resource.pdfUrl ? {
    slot: chaveDaFolha(resource.pdfUrl),
    /* A chave antiga, por aula. Só é lida uma vez, na adoção — ver `carregarComAdocao`. */
    slotAntigo: lessonSlot + "|pdf|" + resourceId,
    lessonSlot: lessonSlot,
    title: (manifest.title || "Aula") + " · " + (resource.title || "PDF"),
    resourceId: resourceId,
    pdfUrl: resource.pdfUrl
  } : null;

  window.__MODO_AULA_PDF_SESSION_SLOT = ALVO && ALVO.slot || "";
  window.__MODO_AULA_PDF_LESSON_SLOT = lessonSlot;
  window.__MODO_AULA_PDF_TITLE = ALVO && ALVO.title || "PDF";

  var DB_NAME = "maple-demo-classroom", DB_VERSION = 1, STORE = "sessions";
  // Cópia local desde 20/08 — ver `pdfjs/LEIA-ME.md`. O CDN caía com o Wi-Fi da escola
  // no meio da aula, que é exatamente quando o PDF precisa abrir.
  var PDF_WORKER = new URL("pdf-runtime/node_modules/pdfjs-dist/build/pdf.worker.mjs", location.href).href;
  var PREFS_KEY = "maple-demo:classroom:pdf-tools:v3";
  var pdfDoc = null, pdfBytes = null, state = null, engine = null;
  /* Traço que a outra janela está fazendo agora; só a tela de projeção usa. */
  var rascunhoRemoto = null;
  var tool = "pen", saveTimer = null, resizeTimer = null, snapStatusTimer = null;
  var history = {};
  var prefs = readLocal(PREFS_KEY, null) || migratePrefs();

  function migratePrefs() {
    var old = readLocal("maple-demo:classroom:pdf-tools:v2", {}) || {};
    return {
      pressure: old.pressure !== false,
      colors: old.colors || { pen: "#1e4999", highlighter: "#ffe100", laser: "#ef233c" },
      widths: old.widths || { pen: 4, highlighter: 22, laser: 5, eraserPartial: 16, eraserStroke: 18 }
    };
  }

  var $ = function (id) { return document.getElementById(id); };
  var ui = {
    workspace: $("workspace"), sheet: $("sheet"), pdf: $("pdfCanvas"), inkHost: $("ink"),
    loading: $("loading"), title: $("lessonTitle"), page: $("pageLabel"), prev: $("prevPage"),
    next: $("nextPage"), pen: $("penBtn"), highlighter: $("highlighterBtn"), laser: $("laserBtn"),
    eraserPartial: $("eraserBtn"), eraserStroke: $("strokeEraserBtn"), color: $("color"),
    width: $("width"), pressure: $("pressure"), undo: $("undoBtn"), redo: $("redoBtn"),
    clear: $("clearBtn"), export: $("exportBtn"), fullscreen: $("fullscreenBtn"),
    status: $("saveStatus"), help: $("help"), closeHelp: $("closeHelp")
  };
  if (!ALVO || !ui.workspace || !ui.sheet || !ui.pdf || !ui.inkHost) {
    if (ui.loading) ui.loading.textContent = "PDF não encontrado no manifesto desta aula.";
    return;
  }

  var inkCanvas = document.createElement("canvas");
  inkCanvas.id = "pdfInkCanvas";
  inkCanvas.className = "pdf-ink-canvas";
  inkCanvas.setAttribute("aria-label", "Camada de anotação do PDF");
  ui.inkHost.appendChild(inkCanvas);

  var laserCanvas = document.createElement("canvas");
  laserCanvas.id = "pdfLaserCanvas";
  laserCanvas.className = "pdf-laser-canvas";
  laserCanvas.setAttribute("aria-hidden", "true");
  ui.inkHost.appendChild(laserCanvas);

  var eraserCursor = document.createElement("div");
  eraserCursor.className = "pdf-eraser-cursor";
  document.body.appendChild(eraserCursor);

  injectStyles();
  bind();
  init();

  function readLocal(key, fallback) {
    try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (error) { return fallback; }
  }
  function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (error) {} }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function randomId() {
    return crypto.randomUUID ? crypto.randomUUID() :
      "s-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function status(text, kind) {
    ui.status.textContent = text;
    ui.status.className = "status" + (kind ? " " + kind : "");
  }
  function fail(message, error) {
    console.error(message, error || "");
    ui.loading.hidden = false;
    ui.loading.textContent = message;
    status(message, "error");
  }
  function showSnapStatus(shape) {
    var labels = { line: "reta", ellipse: "elipse", triangle: "triângulo", rectangle: "retângulo", square: "quadrado" };
    clearTimeout(snapStatusTimer);
    status(labels[shape] || "forma", "ok");
    snapStatusTimer = setTimeout(function () { status("alterações locais", "dirty"); }, 850);
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
  function dbGet(slotValue) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var request = db.transaction(STORE, "readonly").objectStore(STORE).get(slotValue);
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

  function blankState() {
    return {
      version: 3,
      slot: ALVO.slot,
      lessonSlot: ALVO.lessonSlot,
      title: ALVO.title,
      activePage: 1,
      resource: {
        id: ALVO.resourceId,
        type: "pdf",
        url: ALVO.pdfUrl,
        fingerprint: null,
        numPages: 0
      },
      pages: {},
      localRevision: 0,
      updatedAt: new Date().toISOString()
    };
  }
  function ensureState(value) {
    var result = value && value.slot === ALVO.slot ? value : blankState();
    result.version = 3;
    if (!result.pages) result.pages = {};
    Object.keys(result.pages).forEach(function (key) {
      var page = result.pages[key];
      if (!page || !Array.isArray(page.strokes)) result.pages[key] = { strokes: [] };
      result.pages[key].strokes.forEach(function (stroke) {
        if (!stroke.id) stroke.id = randomId();
        if (!stroke.tool) stroke.tool = "pen";
        if (stroke.opacity == null) stroke.opacity = stroke.tool === "highlighter" ? 0.26 : 1;
      });
    });
    return result;
  }
  /* Lê a tinta da folha e, na primeira vez, ADOTA a que ficou na chave antiga.
   *
   * Sem isto a mudança de chave apagaria da vista tudo o que já foi escrito nas aulas de
   * setembro — a tinta continuaria no banco, numa chave que ninguém mais lê, que é a pior
   * forma de perder: silenciosa. A adoção acontece uma vez, quando a chave nova ainda não
   * tem página nenhuma com traço; a linha antiga fica no banco, intocada, como rede. */
  function carregarComAdocao() {
    return dbGet(ALVO.slot).then(function (novo) {
      if (temTraco(novo)) return novo;
      return dbGet(ALVO.slotAntigo).then(function (antigo) {
        if (!temTraco(antigo)) return novo;
        antigo.slot = ALVO.slot;
        antigo.adotadaDe = ALVO.slotAntigo;
        return dbPut(clone(antigo)).then(function () { return antigo; })
                                   .catch(function () { return antigo; });
      }).catch(function () { return novo; });
    });
  }

  function temTraco(estado) {
    if (!estado || !estado.pages) return false;
    return Object.keys(estado.pages).some(function (k) {
      var pagina = estado.pages[k];
      return pagina && Array.isArray(pagina.strokes) && pagina.strokes.length > 0;
    });
  }

  function pageData(pageNumber) {
    var key = String(pageNumber);
    if (!state.pages[key]) state.pages[key] = { strokes: [] };
    return state.pages[key];
  }
  function pageHistory(pageNumber) {
    var key = String(pageNumber);
    if (!history[key]) history[key] = { undo: [], redo: [] };
    return history[key];
  }
  function pushHistory() {
    var h = pageHistory(state.activePage);
    h.undo.push(clone(pageData(state.activePage).strokes));
    if (h.undo.length > 50) h.undo.shift();
    h.redo = [];
    updateHistoryButtons();
  }
  function rollbackHistory() {
    pageHistory(state.activePage).undo.pop();
    updateHistoryButtons();
  }
  function undo() {
    if (!state || !pdfDoc || !ui.loading.hidden) return;
    var h = pageHistory(state.activePage);
    if (!h.undo.length) return;
    h.redo.push(clone(pageData(state.activePage).strokes));
    pageData(state.activePage).strokes = h.undo.pop();
    engine.redraw();
    scheduleSave();
    updateHistoryButtons();
  }
  function redo() {
    if (!state || !pdfDoc || !ui.loading.hidden) return;
    var h = pageHistory(state.activePage);
    if (!h.redo.length) return;
    h.undo.push(clone(pageData(state.activePage).strokes));
    pageData(state.activePage).strokes = h.redo.pop();
    engine.redraw();
    scheduleSave();
    updateHistoryButtons();
  }
  function updateHistoryButtons() {
    var h = pageHistory(state ? state.activePage : 1);
    ui.undo.disabled = !h.undo.length;
    ui.redo.disabled = !h.redo.length;
  }
  function scheduleSave() {
    status("alterações locais", "dirty");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveLocal, 220);
  }
  function saveLocal() {
    if (PROJECAO || !state || !pdfDoc || !ui.loading.hidden) return Promise.resolve();
    state.updatedAt = new Date().toISOString();
    state.localRevision = Number(state.localRevision || 0) + 1;
    return dbPut(clone(state)).then(function () {
      status("salvo neste computador", "ok");
    }).catch(function (error) {
      fail("falha no autosave local", error);
    });
  }

  function sha256(buffer) {
    return crypto.subtle.digest("SHA-256", buffer).then(function (digest) {
      return "sha256:" + Array.from(new Uint8Array(digest)).map(function (byte) {
        return byte.toString(16).padStart(2, "0");
      }).join("");
    });
  }
  function fetchPdf() {
    return fetch(ALVO.pdfUrl, { credentials: "omit", cache: "no-cache", redirect: "error" })
      .then(function (response) {
        if (!response.ok) throw new Error("PDF respondeu " + response.status);
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        pdfBytes = buffer;
        return sha256(buffer);
      })
      .then(async function (fingerprint) {
        if (state.resource.fingerprint && state.resource.fingerprint !== fingerprint) {
          var backup = clone(state);
          backup.slot = state.slot + "|material-antigo|" + Date.now();
          // Do not discard any ink until the previous version is safely archived.
          await dbPut(backup);
          state.pages = {};
          history = {};
          status("material mudou · tinta antiga arquivada", "dirty");
        }
        state.resource.fingerprint = fingerprint;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER;
        return window.pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes), isEvalSupported: false, useSystemFonts: true, cMapUrl: new URL("pdf-runtime/node_modules/pdfjs-dist/cmaps/", location.href).href, cMapPacked: true, standardFontDataUrl: new URL("pdf-runtime/node_modules/pdfjs-dist/standard_fonts/", location.href).href, wasmUrl: new URL("pdf-runtime/node_modules/pdfjs-dist/wasm/", location.href).href }).promise;
      })
      .then(function (doc) {
        pdfDoc = doc;
        state.resource.numPages = doc.numPages;
        if (state.activePage > doc.numPages) state.activePage = 1;
        return renderPage().then(function (ok) {
          if (!ok) throw new Error("Falha na renderização inicial");
        });
      });
  }
  function renderPage() {
    if (!pdfDoc || !state) return Promise.resolve();
    ui.loading.hidden = false;
    ui.loading.textContent = "Renderizando página " + state.activePage + "…";
    return pdfDoc.getPage(state.activePage).then(function (page) {
      var base = page.getViewport({ scale: 1 });
      var available = Math.max(320, ui.workspace.clientWidth - 42);
      var scale = Math.min(1.75, Math.max(0.55, available / base.width));
      var viewport = page.getViewport({ scale: scale });
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var context = ui.pdf.getContext("2d", { alpha: false });

      ui.pdf.width = Math.floor(viewport.width * dpr);
      ui.pdf.height = Math.floor(viewport.height * dpr);
      ui.pdf.style.width = viewport.width + "px";
      ui.pdf.style.height = viewport.height + "px";
      ui.sheet.style.width = viewport.width + "px";
      ui.sheet.style.height = viewport.height + "px";
      ui.inkHost.style.width = viewport.width + "px";
      ui.inkHost.style.height = viewport.height + "px";
      engine.resize(viewport.width, viewport.height, dpr);

      return page.render({
        canvas: ui.pdf,
        viewport: viewport,
        transform: dpr === 1 ? null : [dpr, 0, 0, dpr, 0, 0]
      }).promise;
    }).then(function () {
      engine.redraw();
      updatePageUI();
      ui.loading.hidden = true;
      window.dispatchEvent(new CustomEvent("modo-aula-pdf-rendered"));
      return true;
    }).catch(function (error) {
      fail("não foi possível renderizar o PDF", error);
      return false;
    });
  }

  function currentWidth(name) {
    name = name || tool;
    return Math.max(1, Number((prefs.widths || {})[name]) || (name === "highlighter" ? 22 : 4));
  }
  function currentColor(name) {
    name = name || tool;
    var key = name === "highlighter" ? "highlighter" : name === "laser" ? "laser" : "pen";
    return (prefs.colors || {})[key] || "#1e4999";
  }
  function isEraser(name) {
    name = name || tool;
    return name === "eraserPartial" || name === "eraserStroke";
  }
  function selectTool(next) {
    tool = next;
    [ui.pen, ui.highlighter, ui.laser, ui.eraserPartial, ui.eraserStroke].forEach(function (button) {
      if (!button) return;
      var selected = button.getAttribute("data-tool") === tool;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    if (engine) engine.setTool(tool);
    applyToolPrefs();
  }
  function applyToolPrefs() {
    ui.color.value = currentColor(tool);
    ui.width.value = String(currentWidth(tool));
    ui.color.closest("label").hidden = isEraser();
    ui.pressure.checked = prefs.pressure !== false;
  }
  function changePage(delta) {
    if (!pdfDoc || !ui.loading.hidden) return;
    var next = Math.max(1, Math.min(pdfDoc.numPages, state.activePage + delta));
    if (next === state.activePage) return;
    var anterior = state.activePage;
    state.activePage = next;
    renderPage().then(function (ok) {
      if (ok) scheduleSave();
      else state.activePage = anterior;
    });
  }
  function updatePageUI() {
    ui.title.textContent = ALVO.title;
    ui.page.textContent = state.activePage + " / " + (pdfDoc ? pdfDoc.numPages : 1);
    ui.prev.disabled = state.activePage <= 1;
    ui.next.disabled = !pdfDoc || state.activePage >= pdfDoc.numPages;
    updateHistoryButtons();
  }
  function clearPage() {
    if (!state || !pdfDoc || !ui.loading.hidden) return;
    if (!pageData(state.activePage).strokes.length) return;
    pushHistory();
    pageData(state.activePage).strokes = [];
    engine.redraw();
    scheduleSave();
  }
  function exportJson() {
    if (!state || !pdfDoc || !ui.loading.hidden) return;
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modo-aula-" + ALVO.resourceId + "-backup.json";
    anchor.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    } else if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  function bind() {
    [ui.pen, ui.highlighter, ui.laser, ui.eraserPartial, ui.eraserStroke].forEach(function (button) {
      if (button) button.addEventListener("click", function () {
        selectTool(button.getAttribute("data-tool"));
      });
    });
    ui.color.addEventListener("input", function () {
      var key = tool === "highlighter" ? "highlighter" : tool === "laser" ? "laser" : "pen";
      prefs.colors[key] = ui.color.value;
      savePrefs();
    });
    ui.width.addEventListener("input", function () {
      prefs.widths[tool] = Math.max(1, Number(ui.width.value) || 4);
      if (engine) engine.updateCursor();
      savePrefs();
    });
    ui.pressure.addEventListener("change", function () {
      prefs.pressure = ui.pressure.checked;
      savePrefs();
    });
    ui.prev.addEventListener("click", function () { changePage(-1); });
    ui.next.addEventListener("click", function () { changePage(1); });
    ui.undo.addEventListener("click", undo);
    ui.redo.addEventListener("click", redo);
    ui.clear.addEventListener("click", clearPage);
    ui.export.addEventListener("click", exportJson);
    ui.fullscreen.addEventListener("click", toggleFullscreen);
    if (ui.closeHelp) ui.closeHelp.addEventListener("click", function () { ui.help.hidden = true; });

    document.addEventListener("keydown", function (event) {
      if (event.target && /input|textarea|select/i.test(event.target.tagName)) return;
      var key = event.key.toLowerCase();
      if (key === "p") selectTool("pen");
      else if (key === "h") selectTool("highlighter");
      else if (key === "l") selectTool("laser");
      else if (key === "e") selectTool(event.shiftKey ? "eraserStroke" : "eraserPartial");
      else if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if (key === "pageup") changePage(-1);
      else if (key === "pagedown") changePage(1);
    }, true);

    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (engine) engine.redraw();
      }, 120);
    });
  }

  function injectStyles() {
    var style = document.createElement("style");
    style.id = "modoAulaPdfToolsV3Css";
    style.textContent = [
      ".ink{pointer-events:none}.pdf-ink-canvas,.pdf-laser-canvas{position:absolute;inset:0;display:block;touch-action:none;user-select:none}",
      ".pdf-ink-canvas{z-index:1;pointer-events:auto;cursor:crosshair}.pdf-laser-canvas{z-index:2;pointer-events:none}.pdf-ink-canvas.eraser-active{cursor:none}",
      ".pdf-eraser-cursor{position:fixed;z-index:1005;display:none;border:1.5px solid rgba(30,73,153,.9);border-radius:50%;background:rgba(30,73,153,.12);box-shadow:0 0 0 1px rgba(255,255,255,.8);pointer-events:none;transform:translate(-50%,-50%)}"
    ].join("");
    document.head.appendChild(style);
  }

  function init() {
    if (params.get("embed") === "1") document.body.classList.add("embed");
    ui.title.textContent = ALVO.title;

    engine = window.ModoAulaInkCore.create({
      canvas: inkCanvas,
      laserCanvas: laserCanvas,
      eraserCursor: eraserCursor,
      /* Na parede, o rascunho que está chegando ao vivo entra por último, por cima do
         que veio do banco — mesmo desenhador, mesma ordem de camadas. A cópia só existe
         quando há rascunho: na janela do professor esta lista é a de verdade, e o núcleo
         escreve nela (é onde ele empurra o traço em andamento). */
      getStrokes: function () {
        if (!state) return [];
        var traços = pageData(state.activePage).strokes;
        return rascunhoRemoto ? traços.concat([rascunhoRemoto]) : traços;
      },
      setStrokes: function (value) { pageData(state.activePage).strokes = value; },
      beforeChange: pushHistory,
      rollbackChange: rollbackHistory,
      changed: scheduleSave,
      disabled: function () { return PROJECAO || !state || ui.loading.hidden === false; },
      getWidth: currentWidth,
      getColor: currentColor,
      getPressure: function () { return prefs.pressure !== false; },
      normalizeWidth: true,
      onSnap: showSnapStatus
    });

  /* Ponte mínima para a tela de projeção — mesmo espírito do `ink_bridge`: expõe o
     necessário sem acoplar o motor a quem espelha.

     A lousa já espelhava a escrita relendo o IndexedDB e redesenhando (ver
     `modo_aula_projector_board.js`). O PDF e o livro do Y9 não tinham equivalente:
     o professor, 12/08 — *"a escrita em PDF e no livro não aparecem"* na tela do aluno. As
     duas janelas são do mesmo origin e compartilham o banco; falta só a de projeção
     reler quando a revisão muda. Quem faz isso é `modo_aula_pdf_projector_ink.js`.

     Só instala com alvo válido: cada modo do visualizador tem o seu motor, e quem não
     tem sessão não pode sobrescrever o gancho de quem tem. */
  if (ALVO) {
    window.__modoAulaPdfSessao = {
      slot: function () { return ALVO.slot; },
      paginaAtiva: function () { return state ? state.activePage : null; },
      /* O traço que a caneta está fazendo agora, ou `null`. O núcleo de tinta empurra o
         traço em andamento para dentro da lista da página assim que a ponta encosta e o
         vai engordando ponto a ponto — então "o traço ativo" é o último da lista
         enquanto a caneta não levanta. Quem transmite é o `pdf_tinta_viva.js`. */
      tracoAtivo: function () {
        if (!state) return null;
        var traços = pageData(state.activePage).strokes;
        return traços.length ? traços[traços.length - 1] : null;
      },
      /* Só na parede: o que a outra janela está desenhando neste instante, desenhado
         por cima do que veio do banco. É rascunho — a gravação seguinte o substitui
         pelo traço definitivo, já simplificado. */
      rascunho: function (dados) {
        dados = dados || {};
        rascunhoRemoto = dados.fim ? null :
          (dados.traco && dados.pagina === (state && state.activePage) ? dados.traco : null);
        if (dados.laser && engine && engine.laserRemoto) {
          engine.laserRemoto({
            id: dados.laser.id, x: dados.laser.x, y: dados.laser.y,
            cor: dados.laser.cor, largura: dados.laser.largura, fim: !!dados.fim
          });
        }
        if (engine && engine.redraw) engine.redraw();
      },
      /* Relê a sessão DO DISCO e redesenha quando ela mudou. Devolve `true` se mudou.
         Não mexe em zoom nem rolagem — disso cuida o `pdf_presenter_sync`.

         A primeira versão disto expunha `revisao()` lendo `state.localRevision` da
         memória, e o `pdf_projector_ink` comparava esse número consigo mesmo: como só
         mudava DEPOIS de recarregar, nunca mudava, e a parede ficava congelada no que
         havia quando abriu. A revisão que interessa é a do banco, e só quem lê o banco
         a conhece — por isso a comparação mora aqui dentro. */
      recarregar: function () {
        return dbGet(ALVO.slot).then(function (stored) {
          if (!stored) return false;
          var mesmaTinta = state && Number(stored.localRevision || 0) === Number(state.localRevision || 0);
          var mesmaPagina = state && stored.activePage === state.activePage;
          if (mesmaTinta && mesmaPagina) return false;
          var virouPagina = !mesmaPagina;
          state = ensureState(stored);
          if (virouPagina) renderPage();
          else if (engine && engine.redraw) engine.redraw();
          return true;
        }).catch(function () { return false; });
      }
    };
  }

    selectTool("pen");
    dbGet(ALVO.slot).then(function (stored) {
      state = ensureState(stored);
      return fetchPdf();
    }).then(function () {
      status("salvo neste computador", "ok");
      scheduleSave();
    }).catch(function (error) {
      state = state || blankState();
      fail("não foi possível iniciar o PDF", error);
    });
  }
})();
