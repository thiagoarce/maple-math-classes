/* Liga seleção e imagens locais às superfícies reais da lousa e do PDF. */
(function () {
  "use strict";
  if (window.__modoAulaObjectsBoot) return;
  window.__modoAulaObjectsBoot = true;

  function styles() {
    if (document.getElementById("modoAulaObjectsCss")) return;
    var style = document.createElement("style");
    style.id = "modoAulaObjectsCss";
    style.textContent = [
      ".ma-object-layer,.ma-selection-layer{position:absolute;inset:0}",
      ".ma-object-layer{z-index:1;pointer-events:none;overflow:hidden}.ma-selection-layer{z-index:6;pointer-events:none;touch-action:none;user-select:none}",
      ".ma-selection-layer.active{pointer-events:auto;cursor:default}",
      ".ma-local-image{position:absolute;display:block;max-width:none;max-height:none;transform-origin:center center;user-select:none;-webkit-user-drag:none;pointer-events:none}",
      ".ma-selection-box{position:absolute;display:none;border:1.5px solid #1e4999;box-shadow:0 0 0 1px rgba(255,255,255,.9);transform-origin:center center;pointer-events:none}.ma-selection-box.visible{display:block}",
      ".ma-handle{position:absolute;width:13px;height:13px;border:2px solid #1e4999;border-radius:50%;background:#fff;pointer-events:auto;transform:translate(-50%,-50%)}",
      ".ma-handle[data-handle='nw']{left:0;top:0;cursor:nwse-resize}.ma-handle[data-handle='ne']{left:100%;top:0;cursor:nesw-resize}.ma-handle[data-handle='sw']{left:0;top:100%;cursor:nesw-resize}.ma-handle[data-handle='se']{left:100%;top:100%;cursor:nwse-resize}",
      ".ma-rotate-line{position:absolute;left:50%;top:-30px;width:1px;height:30px;background:#1e4999}.ma-handle[data-handle='rotate']{left:50%;top:-34px;cursor:grab;background:#1e4999}",
      ".ma-object-toolbar{position:absolute;z-index:8;display:none;align-items:center;gap:4px;padding:5px;border:1px solid #d8deea;border-radius:10px;background:rgba(255,255,255,.97);box-shadow:0 8px 24px rgba(23,32,51,.18);pointer-events:auto;white-space:nowrap}.ma-object-toolbar.visible{display:flex}",
      ".ma-object-toolbar button{width:32px;height:32px;padding:0;border:1px solid #d8deea;border-radius:8px;background:#fff;color:#172033;font:700 15px/1 system-ui;cursor:pointer}.ma-object-toolbar button.active{background:#1e4999;color:#fff;border-color:#1e4999}",
      ".ma-object-toolbar label{height:32px;display:flex;align-items:center;gap:4px;padding:0 6px;border:1px solid #d8deea;border-radius:8px;background:#fff;font:700 10px/1 system-ui;color:#667085}.ma-object-toolbar input{width:72px;accent-color:#1e4999}",
      ".ma-marquee{position:absolute;display:none;border:1.5px dashed #1e4999;background:rgba(30,73,153,.08);pointer-events:none}.ma-marquee.visible{display:block}",
      ".ma-selection-box.group{border-style:dashed}.ma-selection-box.cropping{border:2px solid #d98a00}.ma-selection-box.cropping .ma-handle{border-color:#d98a00;border-radius:2px}.ma-selection-box.cropping .ma-handle[data-handle='rotate'],.ma-selection-box.cropping .ma-rotate-line{display:none}",
      ".ma-crop-ghost{position:absolute;display:none;border:1px dashed rgba(217,138,0,.9);background:rgba(217,138,0,.07);pointer-events:none}.ma-crop-ghost.visible{display:block}",
      ".ma-object-toolbar button{display:inline-grid;place-items:center}.ma-object-toolbar button[hidden]{display:none}.ma-sel-count{font:700 11px/1 system-ui;color:#1e4999;padding:0 4px}.ma-sel-count:empty{display:none}",
      ".ma-file-input{display:none!important}.ma-drop-active{outline:3px dashed rgba(30,73,153,.65);outline-offset:-8px}",
      "@media(max-width:700px){.ma-object-toolbar{max-width:calc(100% - 12px);overflow-x:auto}.ma-object-toolbar label{display:none}}"
    ].join("");
    document.head.appendChild(style);
  }

  function makeInput() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.className = "ma-file-input";
    document.body.appendChild(input);
    return input;
  }

  function attach(config) {
    var canvas = config.canvas();
    var parent = config.parent();
    var toolbar = config.toolbar();
    if (!canvas || !parent || !toolbar || canvas.getAttribute("data-ma-objects") === "1") return false;
    var ink = canvas.__modoAulaInkInstance;
    if (!ink || !window.MALocalImages || !window.MASelection) return false;
    canvas.setAttribute("data-ma-objects", "1");

    var selection;
    var images = window.MALocalImages.create({
      parent: parent,
      before: canvas,
      getScope: config.scope,
      onRender: function () { if (selection) selection.render(); }
    });
    selection = window.MASelection.create({
      parent: parent,
      ink: ink,
      images: images,
      available: config.available
    });
    var input = makeInput();

    var selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = config.kind === "board" ? "board-tool" : "icon-btn";
    selectButton.setAttribute("data-ma-select", "1");
    selectButton.title = "Selecionar, mover e transformar (V)";
    selectButton.setAttribute("aria-label", selectButton.title);
    selectButton.textContent = "⌖";

    var imageButton = document.createElement("button");
    imageButton.type = "button";
    imageButton.className = config.kind === "board" ? "board-tool" : "icon-btn";
    imageButton.setAttribute("data-ma-image", "1");
    imageButton.title = "Inserir imagem local";
    imageButton.setAttribute("aria-label", imageButton.title);
    imageButton.textContent = "▧";

    var anchor = toolbar.querySelector('[data-action="undo"],#undoBtn');
    if (anchor) {
      toolbar.insertBefore(imageButton, anchor);
      toolbar.insertBefore(selectButton, imageButton);
    } else {
      toolbar.appendChild(selectButton);
      toolbar.appendChild(imageButton);
    }

    function selectMode() {
      ferramenta("selecao");
      selection.setActive(true);
      toolbar.querySelectorAll("[data-tool]").forEach(function (button) { button.classList.remove("active"); });
      selectButton.classList.add("active");
    }
    function leaveSelectMode() {
      selection.setActive(false);
      selectButton.classList.remove("active");
    }
    function addFiles(files) {
      if (config.available && !config.available()) return Promise.resolve();
      return images.insertFiles(files).then(function (item) {
        if (!item) return;
        selectMode();
        selection.select({ type: "image", id: item.id });
      });
    }

    selectButton.addEventListener("click", selectMode);
    imageButton.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      addFiles(input.files).finally(function () { input.value = ""; });
    });
    toolbar.addEventListener("click", function (event) {
      if (event.target.closest("[data-tool]")) ferramenta("tinta");
    }, true);
    window.addEventListener("modo-aula-ferramenta", function (event) {
      if (event.detail && event.detail.nome !== "selecao") leaveSelectMode();
    });

    parent.addEventListener("dragover", function (event) {
      var items = Array.prototype.slice.call(event.dataTransfer && event.dataTransfer.items || []);
      if (!items.some(function (item) { return item.kind === "file" && /^image\//.test(item.type); })) return;
      event.preventDefault();
      parent.classList.add("ma-drop-active");
    });
    parent.addEventListener("dragleave", function () { parent.classList.remove("ma-drop-active"); });
    parent.addEventListener("drop", function (event) {
      parent.classList.remove("ma-drop-active");
      var files = Array.prototype.slice.call(event.dataTransfer && event.dataTransfer.files || []).filter(window.MALocalImages.isImage);
      if (!files.length) return;
      event.preventDefault();
      addFiles(files);
    });
    document.addEventListener("paste", function (event) {
      if (config.available && !config.available()) return;
      if (event.target && /input|textarea|select/i.test(event.target.tagName)) return;
      var files = [];
      Array.prototype.slice.call(event.clipboardData && event.clipboardData.items || []).forEach(function (item) {
        if (item.kind === "file" && /^image\//.test(item.type)) files.push(item.getAsFile());
      });
      if (!files.length) return;
      event.preventDefault();
      addFiles(files);
    });
    document.addEventListener("keydown", function (event) {
      if (event.target && /input|textarea|select/i.test(event.target.tagName)) return;
      if (event.key.toLowerCase() === "v") { event.preventDefault(); selectMode(); }
    }, true);

    if (config.observeScope) config.observeScope(function () {
      selection.clear();
      images.refresh().then(function () { selection.render(); });
      avisar("modo-aula-object-scope", config.kind);
    });
    window.addEventListener("resize", function () { images.render(); selection.render(); });

    window.ModoAulaObjectSurfaces = window.ModoAulaObjectSurfaces || [];
    setTimeout(function () { avisar("modo-aula-object-surface", config.kind); }, 0);
    window.ModoAulaObjectSurfaces.push({
      kind: config.kind,
      parent: parent,
      ink: ink,
      images: images,
      selection: selection,
      scope: config.scope,
      addFiles: addFiles
    });
    return true;
  }

  /* Quem depende das superfícies — formas, instrumentos, exportação — as descobria
     varrendo `ModoAulaObjectSurfaces` a cada 300 ms, e relia o `localStorage` a cada
     350 ms para saber que a página tinha virado. Cinco varreduras por segundo, em três
     módulos, na mesma janela que precisa desenhar tinta a 60 fps: era daí que vinha
     boa parte do engasgo da segunda tela. Agora a superfície avisa, e o tique fica só
     como rede de segurança. */
  /* Seleção, texto e formas põem cada um uma camada por cima da folha. Quem liga a
     sua avisa, e as outras saem da frente — antes, escolher Texto com a Seleção ligada
     deixava a camada da seleção por cima e o toque na folha não criava a caixa (ele,
     29/09: "inserir texto não funciona"). */
  function ferramenta(nome) {
    window.dispatchEvent(new CustomEvent("modo-aula-ferramenta", { detail: { nome: nome } }));
  }
  window.ModoAulaFerramenta = ferramenta;
  function avisar(nome, kind) {
    window.dispatchEvent(new CustomEvent(nome, { detail: { kind: kind } }));
  }

  function attachBoard() {
    var slot = "maple-demo-volume";
    return attach({
      kind: "board",
      canvas: function () { return document.querySelector(".board-ink-canvas"); },
      parent: function () { return document.getElementById("board"); },
      toolbar: function () { return document.getElementById("boardTools"); },
      scope: function () {
        var board = document.getElementById("board");
        return slot + "|local-image|board|" + (board && board.classList.contains("black") ? "black" : "white");
      },
      available: function () {
        var stage = document.getElementById("stage");
        return !!stage && !stage.classList.contains("has-resource");
      },
      observeScope: function (callback) {
        var board = document.getElementById("board");
        if (board) new MutationObserver(callback).observe(board, { attributes: true, attributeFilter: ["class"] });
      }
    });
  }

  function attachPdf() {
    var page = document.getElementById("pageLabel");
    return attach({
      kind: "pdf",
      canvas: function () { return document.querySelector(".pdf-ink-canvas"); },
      parent: function () { return document.getElementById("ink"); },
      toolbar: function () { return document.querySelector(".tools"); },
      scope: function () {
        var session = window.__MODO_AULA_PDF_SESSION_SLOT || new URLSearchParams(location.search).get("slot") || "pdf";
        var current = String(page && page.textContent || "1").split("/")[0].trim() || "1";
        return session + "|local-image|page|" + current;
      },
      available: function () {
        var loading = document.getElementById("loading");
        return !loading || loading.hidden;
      },
      observeScope: function (callback) {
        if (page) new MutationObserver(callback).observe(page, { childList: true, characterData: true, subtree: true });
        window.addEventListener("modo-aula-pdf-rendered", callback);
      }
    });
  }

  styles();
  function scan() { attachBoard(); } // PDF host not enabled in the demo.
  scan();
  window.addEventListener("modo-aula-ink-instance", function () { setTimeout(scan, 0); });
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
