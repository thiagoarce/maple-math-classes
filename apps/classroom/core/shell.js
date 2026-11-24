/* Modo Aula — casca projetável genérica. */
(function () {
  "use strict";

  // This demo does not read manifests from browser storage.
  var PREFS_KEY = "maple-demo:classroom:prefs:v5";
  var params = new URLSearchParams(location.search);
  var slot = "maple-demo-volume";
  var manifest = window.MAPLE_DEMO_MANIFEST || null;
  var prefs = readJson(PREFS_KEY, {
    board: "white",
    goalsOpen: true,
    goalsSide: "right",
    shelfOpen: true
  });
  var active = null;

  var $ = function (id) { return document.getElementById(id); };
  var ui = {
    app: $("app"), title: $("lessonTitle"), meta: $("lessonMeta"), activeLabel: $("activeLabel"),
    stage: $("stage"), board: $("board"), frame: $("resourceFrame"), image: $("resourceImage"),
    goalsDrawer: $("goalsDrawer"), goalsBody: $("goalsBody"), drawerTab: $("drawerTab"),
    drawerSide: $("drawerSideBtn"), drawerClose: $("drawerCloseBtn"), shelf: $("resourceShelf"),
    shelfHandle: $("shelfHandle"), shelfLabel: $("shelfLabel"), list: $("resourceList"),
    white: $("whiteBtn"), black: $("blackBtn"), blackoutBtn: $("blackoutBtn"),
    goalsBtn: $("goalsBtn"), resourcesBtn: $("resourcesBtn"), closeResource: $("closeResourceBtn"),
    fullscreen: $("fullscreenBtn"), blackout: $("blackout"), error: $("errorState")
  };

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) { return fallback; }
  }

  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (error) {}
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function icon(id) {
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + id + '"></use></svg>';
  }

  function pressed(button, value) {
    button.classList.toggle("active", !!value);
    button.setAttribute("aria-pressed", value ? "true" : "false");
  }

  function ensureExtendedViewers() {
    var viewer = ui.frame && ui.frame.parentElement;
    if (!viewer) return;

    ui.video = $("resourceVideo");
    if (!ui.video) {
      ui.video = document.createElement("video");
      ui.video.id = "resourceVideo";
      ui.video.controls = true;
      ui.video.playsInline = true;
      ui.video.hidden = true;
      viewer.appendChild(ui.video);
    }

    ui.detail = $("resourceDetail");
    if (!ui.detail) {
      ui.detail = document.createElement("div");
      ui.detail.id = "resourceDetail";
      ui.detail.className = "resource-detail";
      ui.detail.hidden = true;
      viewer.appendChild(ui.detail);
    }

    if (!$("modoAulaResourceCss")) {
      var style = document.createElement("style");
      style.id = "modoAulaResourceCss";
      style.textContent = [
        ".viewer video{display:block;width:100%;height:100%;object-fit:contain;background:#111}",
        ".resource-detail{position:absolute;inset:0;overflow:auto;padding:clamp(24px,5vw,76px);background:#f5f7fb}",
        ".resource-detail-card{width:min(920px,100%);margin:0 auto;padding:clamp(24px,4vw,52px);background:#fff;border:1px solid #d8deea;border-radius:20px;box-shadow:0 16px 50px rgba(23,32,51,.12)}",
        ".resource-detail-kicker{margin-bottom:10px;color:#1e4999;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}",
        ".resource-detail h1{margin:0 0 18px;font-size:clamp(26px,4vw,48px);line-height:1.08}",
        ".resource-detail-text{font-size:clamp(18px,2.2vw,30px);line-height:1.55;white-space:pre-wrap}",
        ".resource-detail-url{margin-top:22px;padding:12px 14px;border-radius:10px;background:#eef1f6;color:#667085;font-size:12px;overflow-wrap:anywhere}",
        ".resource-open-link{display:inline-flex;align-items:center;justify-content:center;margin-top:22px;padding:13px 18px;border-radius:11px;background:#1e4999;color:#fff;text-decoration:none;font-weight:850}",
        ".resource-open-link:hover{filter:brightness(.92)}"
      ].join("");
      document.head.appendChild(style);
    }
  }

  function renderHeader() {
    ui.title.textContent = manifest.title || "Modo Aula";
    ui.meta.textContent = [manifest.subject, manifest.year].filter(Boolean).join(" · ");
    document.title = (manifest.title || "Modo Aula") + " — Modo Aula";
  }

  function goalBlock(title, values, className) {
    if (!values || !values.length) return "";
    return '<section class="goal ' + className + '"><h2>' + esc(title) + '</h2><ul>' +
      values.map(function (value) { return "<li>" + esc(value) + "</li>"; }).join("") +
      "</ul></section>";
  }

  function renderGoals() {
    var html = goalBlock("Objetivos", manifest.goals, "goals") +
      goalBlock("Critérios de sucesso", manifest.criteria, "criteria") +
      goalBlock("Rotina", manifest.routine, "routine");
    ui.goalsBody.innerHTML = html || '<p class="muted">Esta aula não possui objetivos cadastrados no próprio “No quadro”.</p>';
  }

  function formats(resource) {
    var result = [];
    if (resource.videoUrl) result.push({ kind: "video", label: "Vídeo" });
    if (resource.htmlUrl) result.push({ kind: "html", label: isY9BookResource(resource) ? "Livro anotável" : "HTML" });
    if (resource.pdfUrl) result.push({ kind: "pdf", label: "PDF" });
    if (resource.imageUrl) result.push({ kind: "image", label: "Imagem" });
    if (resource.fileUrl) result.push({ kind: "file", label: "Arquivo" });
    if (resource.linkUrl) result.push({ kind: "link", label: "Link" });
    if (resource.text || (!result.length && resource.description)) result.push({ kind: "text", label: "Texto" });
    return result;
  }

  function defaultKind(resource) {
    if (resource.videoUrl) return "video";
    if (/momento|interativ|simula|explora|atividade/i.test(resource.title || "") && resource.htmlUrl) return "html";
    if (resource.pdfUrl) return "pdf";
    if (resource.htmlUrl) return "html";
    if (resource.imageUrl) return "image";
    if (resource.linkUrl) return "link";
    if (resource.fileUrl) return "file";
    return "text";
  }

  function symbolFor(resource) {
    if (resource.videoUrl || resource.htmlUrl || resource.linkUrl) return "html";
    if (resource.imageUrl) return "image";
    return "doc";
  }

  function renderResources() {
    var resources = manifest.resources || [];
    ui.shelfLabel.textContent = resources.length ? "Recursos da aula · " + resources.length : "Recursos da aula";
    if (!resources.length) {
      ui.list.innerHTML = '<p class="muted">Nenhum recurso foi encontrado neste card.</p>';
      return;
    }
    ui.list.innerHTML = resources.map(function (resource) {
      var opts = formats(resource);
      var primary = defaultKind(resource);
      return '<article class="resource-card" data-resource="' + esc(resource.id) + '">' +
        '<button type="button" class="resource-main" data-open="' + esc(resource.id) + '" data-kind="' + primary + '">' +
          '<span class="symbol">' + icon(symbolFor(resource)) + '</span>' +
          '<span><strong title="' + esc(resource.title) + '">' + esc(resource.title) + '</strong><small>' +
            esc(opts.map(function (item) { return item.label; }).join(" · ")) + '</small></span>' +
        '</button>' +
        (opts.length > 1 ? '<div class="formats">' + opts.map(function (item) {
          return '<button type="button" data-open="' + esc(resource.id) + '" data-kind="' + item.kind + '">' + item.label + '</button>';
        }).join("") + '</div>' : "") +
      '</article>';
    }).join("");
  }

  function findResource(id) {
    return (manifest.resources || []).find(function (resource) { return resource.id === id; }) || null;
  }

  function setActiveCard(id) {
    Array.prototype.slice.call(document.querySelectorAll(".resource-card")).forEach(function (card) {
      card.classList.toggle("active", card.getAttribute("data-resource") === id);
    });
  }

  function hideViewers() {
    escapatoria(null);
    if (window.ModoAulaDocViewer) window.ModoAulaDocViewer.fechar();
    ui.frame.hidden = true;
    ui.image.hidden = true;
    if (ui.video) ui.video.hidden = true;
    if (ui.detail) ui.detail.hidden = true;
  }

  /* O trilho: a aba da gaveta e os botões da casca, em pé, na borda de fora da gaveta.
   *
   * o professor, 13/08: *"hoje eu não tenho já um botão para abrir e fechar objetivos? um
   * lateral? (...) não seria melhor tirar o botão repetido de abrir os objetivos e
   * colocar junto a ele perpendicularmente?"* — tinha mesmo dois: a aba da gaveta e o
   * `goalsBtn` da barra. Sobrou a aba, e os outros botões foram morar ao lado dela.
   *
   * Fica dentro da gaveta de propósito: assim acompanha o fechar e, sobretudo, troca de
   * lado com ela pelo botão que já existe. */
  function montarTrilho() {
    var barra = document.querySelector(".toolbar");
    if (!barra || !ui.goalsDrawer || document.querySelector(".drawer-rail")) return;

    var repetido = $("goalsBtn");
    if (repetido) repetido.remove();

    var trilho = document.createElement("div");
    trilho.className = "drawer-rail";
    trilho.appendChild(ui.drawerTab);
    trilho.appendChild(barra);
    ui.goalsDrawer.appendChild(trilho);
  }

  function closeResource() {
    active = null;
    hideViewers();
    ui.frame.removeAttribute("src");
    ui.image.removeAttribute("src");
    if (ui.video) {
      ui.video.pause();
      ui.video.removeAttribute("src");
      ui.video.load();
    }
    if (ui.detail) ui.detail.innerHTML = "";
    ui.stage.classList.remove("has-resource");
    ui.activeLabel.textContent = "Lousa";
    ui.closeResource.hidden = true;
    setActiveCard("");
  }

  /* PDF e livro do Y9 são o mesmo visualizador, em modos diferentes. Eram três páginas
     (`modo_aula_pdf.html`, `_v5`, `book_y9_v1`), duas delas geradas por `String.replace`
     em cima da primeira — e foi assim que o livro passou quatro dias carregando o motor
     de PDF sem ninguém ver. */
  function pdfViewerUrl(resource) {
    return "/materials/modo_aula_pdf.html?modo=pdf&embed=1&slot=" + encodeURIComponent(slot) +
      "&resource=" + encodeURIComponent(resource.id);
  }

  function isY9BookResource(resource) {
    if (!resource || !resource.htmlUrl) return false;
    try {
      return /\/materials\/Y9\/Math\/_padrao\/livro\.html$/i.test(
        new URL(resource.htmlUrl, document.baseURI).pathname
      );
    } catch (error) {
      return /(?:^|\/)Y9\/Math\/_padrao\/livro\.html(?:[?#]|$)/i.test(resource.htmlUrl);
    }
  }

  function y9BookViewerUrl(resource) {
    return "/materials/modo_aula_pdf.html?modo=book-y9&embed=1&slot=" + encodeURIComponent(slot) +
      "&resource=" + encodeURIComponent(resource.id);
  }

  function videoEmbedUrl(raw) {
    try {
      var url = new URL(raw, document.baseURI);
      var host = url.hostname.replace(/^www\./, "").toLowerCase();
      if (host === "youtu.be") {
        var shortId = url.pathname.split("/").filter(Boolean)[0];
        return shortId ? "https://www.youtube.com/embed/" + encodeURIComponent(shortId) : raw;
      }
      if (host === "youtube.com" || host === "m.youtube.com") {
        var id = url.searchParams.get("v");
        if (!id && /^\/(?:shorts|embed)\//.test(url.pathname)) id = url.pathname.split("/")[2];
        return id ? "https://www.youtube.com/embed/" + encodeURIComponent(id) : raw;
      }
      if (host === "vimeo.com" || host === "player.vimeo.com") {
        var parts = url.pathname.split("/").filter(Boolean);
        var videoId = parts.filter(function (part) { return /^\d+$/.test(part); }).pop();
        return videoId ? "https://player.vimeo.com/video/" + encodeURIComponent(videoId) : raw;
      }
    } catch (error) {}
    return raw;
  }

  function isDirectVideo(raw) {
    try { return /\.(?:mp4|webm|ogv|mov|m4v)(?:[?#].*)?$/i.test(new URL(raw, document.baseURI).pathname); }
    catch (error) { return false; }
  }

  function detailLabel(kind) {
    return kind === "file" ? "Arquivo da aula" : kind === "link" ? "Link da aula" : "Material da aula";
  }

  function renderDetail(resource, kind) {
    var url = kind === "file" ? resource.fileUrl : kind === "link" ? resource.linkUrl : "";
    var description = resource.text || resource.description || "Este recurso não possui uma descrição adicional.";
    var button = url ? '<a class="resource-open-link" href="' + esc(url) + '" target="_blank" rel="noopener">' +
      (kind === "file" ? "Abrir ou baixar arquivo" : "Abrir link em nova aba") + '</a>' : "";
    var shownUrl = url ? '<div class="resource-detail-url">' + esc(url) + '</div>' : "";
    ui.detail.innerHTML = '<article class="resource-detail-card">' +
      '<div class="resource-detail-kicker">' + esc(detailLabel(kind)) + '</div>' +
      '<h1>' + esc(resource.title) + '</h1>' +
      '<div class="resource-detail-text">' + esc(description) + '</div>' + button + shownUrl +
      '</article>';
    ui.detail.hidden = false;
  }

  /* Saída de emergência, sempre visível sobre o embed. Muitos sites recusam `<iframe>`
     por cabeçalho, e o navegador bloqueia EM SILÊNCIO: a página não tem como descobrir
     que ficou em branco. Um botão discreto no canto é mais honesto que uma detecção que
     não existe. */
  function escapatoria(url) {
    var antigo = document.getElementById("maEscapatoria");
    if (antigo) antigo.remove();
    if (!url) return;
    var a = document.createElement("a");
    a.id = "maEscapatoria";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "abrir em nova aba ↗";
    a.title = "Se o quadro ficar em branco, o site recusou ser embutido";
    a.style.cssText = "position:absolute;right:12px;top:12px;z-index:9;padding:5px 10px;" +
      "border-radius:9px;border:1px solid #c9d3e4;background:rgba(255,255,255,.94);" +
      "color:#1e4999;font:700 11.5px/1 system-ui;text-decoration:none;" +
      "box-shadow:0 6px 18px rgba(15,26,43,.16)";
    (ui.frame.parentNode || ui.stage).appendChild(a);
  }

  function openResource(id, kind) {
    var resource = findResource(id);
    // Initial demo supports only the explicitly bundled HTML and plain text.
    if (!resource || (kind !== "html" && kind !== "text")) return;
    if (kind === "html" && resource.htmlUrl !== "../simulators/volume/index.html") return;
    if (active && active.id === id && active.kind === kind) {
      closeResource();
      return;
    }

    hideViewers();
    if (kind === "pdf" && resource.pdfUrl) {
      ui.frame.src = pdfViewerUrl(resource);
      ui.frame.title = resource.title + " — PDF anotável";
      ui.frame.hidden = false;
    } else if (kind === "html" && resource.htmlUrl) {
      ui.frame.src = resource.htmlUrl;
      ui.frame.title = resource.title + (isY9BookResource(resource) ? " — livro anotável" : "");
      ui.frame.hidden = false;
    } else if (kind === "image" && resource.imageUrl) {
      ui.image.src = resource.imageUrl;
      ui.image.alt = resource.title;
      ui.image.hidden = false;
    } else if (kind === "video" && resource.videoUrl) {
      if (isDirectVideo(resource.videoUrl)) {
        ui.video.src = resource.videoUrl;
        ui.video.hidden = false;
        ui.video.play().catch(function () {});
      } else {
        ui.frame.src = videoEmbedUrl(resource.videoUrl);
        ui.frame.title = resource.title;
        ui.frame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
        ui.frame.setAttribute("allowfullscreen", "");
        ui.frame.hidden = false;
      }
    } else if (kind === "link" && resource.linkUrl) {
      /* Antes isto era só um cartão com "abrir em nova aba". Ele pediu o embed em 21/08,
         e a razão é boa: um applet do GeoGebra ou do Desmos é conteúdo que JÁ é remoto —
         recusar embutir não torna a aula mais robusta, só mais trabalhosa. Ver o
         cabeçalho de `_padrao/modo_aula_embed.js`. */
      var alvo = window.ModoAulaEmbed
        ? window.ModoAulaEmbed.resolver(resource.linkUrl)
        : { url: resource.linkUrl, embutivel: false };
      if (alvo.embutivel) {
        ui.frame.src = alvo.url;
        ui.frame.title = resource.title;
        ui.frame.setAttribute("allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture");
        ui.frame.setAttribute("allowfullscreen", "");
        ui.frame.hidden = false;
        escapatoria(alvo.url);
      } else {
        renderDetail(resource, "link");
      }
    } else if (kind === "file" && resource.fileUrl) {
      /* `.md` e `.txt` abrem FORMATADOS, dentro da aula. Ele pediu em 21/08: os `.md`
         daqui são gabarito e spec, os dois documentos que se abre no meio da aula, e
         mandá-los para outra aba era o comportamento errado. `.docx` continua caindo no
         cartão — ele vira PDF pelo `apresentacao_para_pdf.py` e abre anotável, o que é
         melhor que uma renderização em HTML. */
      if (window.ModoAulaDocViewer && window.ModoAulaDocViewer.ehTexto(resource.fileUrl)) {
        window.ModoAulaDocViewer.abrir(ui.frame.parentNode || ui.stage,
                                       resource.fileUrl, resource.title);
      } else {
        renderDetail(resource, "file");
      }
    } else if (kind === "text" && (resource.text || resource.description)) {
      renderDetail(resource, "text");
    } else return;

    active = { id: id, kind: kind };
    ui.stage.classList.add("has-resource");
    ui.activeLabel.textContent = resource.title +
      (kind === "pdf" || (kind === "html" && isY9BookResource(resource)) ? " · escrever" :
       kind === "html" ? " · interagir" : kind === "video" ? " · assistir" : "");
    ui.closeResource.hidden = false;
    setActiveCard(id);
  }

  function setBoard(mode) {
    prefs.board = mode;
    ui.board.classList.toggle("black", mode === "black");
    pressed(ui.white, mode === "white");
    pressed(ui.black, mode === "black");
    closeResource();
    savePrefs();
  }

  function toggleGoals(force) {
    prefs.goalsOpen = typeof force === "boolean" ? force : !prefs.goalsOpen;
    ui.goalsDrawer.classList.toggle("closed", !prefs.goalsOpen);
    if (ui.goalsBtn && ui.goalsBtn.isConnected) pressed(ui.goalsBtn, prefs.goalsOpen);
    savePrefs();
  }

  function applyGoalsSide() {
    ui.goalsDrawer.classList.toggle("left", prefs.goalsSide === "left");
    ui.goalsDrawer.classList.toggle("right", prefs.goalsSide !== "left");
  }

  function toggleGoalsSide() {
    prefs.goalsSide = prefs.goalsSide === "left" ? "right" : "left";
    applyGoalsSide();
    savePrefs();
  }

  function toggleShelf(force) {
    prefs.shelfOpen = typeof force === "boolean" ? force : !prefs.shelfOpen;
    ui.shelf.classList.toggle("closed", !prefs.shelfOpen);
    pressed(ui.resourcesBtn, prefs.shelfOpen);
    savePrefs();
  }

  function showBlackout(value) {
    ui.blackout.hidden = !value;
    pressed(ui.blackoutBtn, value);
  }

  function fullscreen() {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function () {});
    else if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
  }

  function bind() {
    ui.white.addEventListener("click", function () { setBoard("white"); });
    ui.black.addEventListener("click", function () { setBoard("black"); });
    ui.blackoutBtn.addEventListener("click", function () { showBlackout(true); });
    ui.blackout.addEventListener("click", function () { showBlackout(false); });
    /* O `goalsBtn` foi removido por ser o mesmo que a aba da gaveta; se algum dia
       voltar, continua ligado. */
    if (ui.goalsBtn) ui.goalsBtn.addEventListener("click", function () { toggleGoals(); });
    ui.drawerTab.addEventListener("click", function () { toggleGoals(); });
    ui.drawerClose.addEventListener("click", function () { toggleGoals(false); });
    ui.drawerSide.addEventListener("click", toggleGoalsSide);
    ui.resourcesBtn.addEventListener("click", function () { toggleShelf(); });
    ui.shelfHandle.addEventListener("click", function () { toggleShelf(); });
    ui.closeResource.addEventListener("click", closeResource);
    ui.fullscreen.addEventListener("click", fullscreen);
    ui.list.addEventListener("click", function (event) {
      var button = event.target.closest("[data-open]");
      if (!button) return;
      openResource(button.getAttribute("data-open"), button.getAttribute("data-kind"));
    });
    document.addEventListener("keydown", function (event) {
      if (event.target && /input|textarea|select/i.test(event.target.tagName)) return;
      var key = event.key.toLowerCase();
      if (key === "escape" && !ui.blackout.hidden) showBlackout(false);
      else if (key === "b") setBoard("white");
      else if (key === "k") setBoard("black");
      else if (key === "x") showBlackout(true);
      else if (key === "o") toggleGoals();
      else if (key === "r") toggleShelf();
      else if (key === "f") fullscreen();
    });
  }

  function fail() {
    ui.app.hidden = true;
    ui.error.hidden = false;
    document.title = "Modo Aula indisponível";
  }

  function publishShellApi() {
    /* Camadas de condução não imitam cliques nem conhecem a estrutura visual da
       prateleira. Esta fronteira abre o recurso real — inclusive o livro Y9 anotável —
       ou volta à mesma lousa integrada que o professor já usa. */
    window.ModoAulaShell = {
      manifest: function () { return manifest; },
      resources: function () { return (manifest.resources || []).slice(); },
      findResource: findResource,
      /* Abre um endereço que NÃO está no manifesto — o link que ele cola na hora
         (`_padrao/modo_aula_link_avulso.js`). Recurso da aula continua vindo do painel;
         isto é a exceção, e ela existe porque a coisa que se quer mostrar às 07:40
         raramente estava no plano das 06:00. */
      abrirEndereco: function () { return false; },
      openResource: function (id, kind) {
        var resource = findResource(id);
        if (!resource) return false;
        openResource(id, kind || defaultKind(resource));
        return true;
      },
      showBoard: function (mode) { setBoard(mode === "black" ? "black" : "white"); },
      closeResource: closeResource,
      active: function () { return active ? { id: active.id, kind: active.kind } : null; }
    };
    document.dispatchEvent(new CustomEvent("modo-aula:shell-ready"));
  }

  function boot() {
    if (!slot || !manifest || manifest.slot !== slot) {
      fail();
      return;
    }
    ensureExtendedViewers();
    renderHeader();
    renderGoals();
    renderResources();
    applyGoalsSide();
    toggleGoals(!!prefs.goalsOpen);
    toggleShelf(!!prefs.shelfOpen);
    montarTrilho();
    pressed(ui.white, prefs.board !== "black");
    pressed(ui.black, prefs.board === "black");
    ui.board.classList.toggle("black", prefs.board === "black");
    bind();
    publishShellApi();
  }

  boot();
})();
