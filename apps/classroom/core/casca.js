/* Modo Aula — a casca inteira com um lugar para cada coisa.
 *
 * Ele, 29/09, com a captura na mão: *"a barra recursos da aula tá tampando o menu novo.
 * Tem que pensar no ux como um todo senão vira frankstein"*. Eram quatro peças que não se
 * conheciam — o trilho de botões numa borda, a prateleira "Recursos da aula" no rodapé, o
 * painel "Apoio da aula" aberto por cima e a barra de tinta —, cada uma se posicionando
 * sozinha, e a de tinta do PDF mora num iframe que não enxerga a prateleira.
 *
 * O desenho, um papel por canto:
 *
 *   ┌───────────────────────────────────────┐
 *   │ ◉ Aula                                │  canto de cima: o que vai para a tela
 *   │                                       │  (lousa, recursos) e as ferramentas da
 *   │            só o conteúdo              │  aula (tela preta, relógio, sorteio,
 *   │                                       │  calculadora, projeção, apoio, sair)
 *   │ ● escrita                     1 / 6 › │  cantos de baixo: tinta à esquerda,
 *   └───────────────────────────────────────┘  página do recurso à direita
 *
 * Nada fica pregado no meio da tela. O trilho e a prateleira somem; o que eles faziam
 * mora no painel "Aula", que é montado na hora de abrir a partir dos botões que já
 * existem (inclusive os que outros módulos acrescentam ao trilho depois) e fecha assim que
 * a escolha é feita. O painel de apoio continua existindo, fechado até ser pedido.
 *
 * Mesmo interruptor da barra de tinta: `?barra=antiga` volta à casca antiga naquele
 * navegador.
 */
(function () {
  "use strict";
  if (window.MACasca) return;
  try {
    if (localStorage.getItem("maple-demo:classroom:barra-antiga") === "1") { window.MACasca = { ativo: false }; return; }
  } catch (e) {}

  function estilos() {
    if (document.getElementById("maCascaCss")) return;
    var s = document.createElement("style");
    s.id = "maCascaCss";
    s.textContent = [
      /* o que sai de cena */
      "body.ma-casca .drawer-rail,body.ma-casca .drawer-tab{display:none!important}",
      /* A prateleira sai para baixo da borda em vez de sumir: a barra de lâminas e o botão
         "Escrever" se posicionam ACIMA dela, e com display:none ela mediria zero e os
         jogaria para fora da tela. */
      "body.ma-casca #resourceShelf{visibility:hidden!important;pointer-events:none!important;transform:translateY(calc(100% + 60px))!important;transition:none!important}",
      "body.ma-casca .topbar{display:none!important}",
      /* sem o cabeçalho, a grade da página fica com uma linha só — senão a área de
         trabalho cai na linha "auto" e perde a altura */
      "body.ma-casca .app{grid-template-rows:1fr!important}",
      "body.ma-casca .drawer.closed{visibility:hidden}",
      /* a bolinha da aula */
      ".ma-aula-botao{position:fixed;z-index:62;left:14px;top:14px;width:36px;height:36px;border-radius:50%;border:1px solid #d8deea;background:rgba(255,255,255,.96);box-shadow:0 6px 18px rgba(23,32,51,.14);display:grid;place-items:center;cursor:pointer;opacity:.5;transition:opacity .25s;color:#344054;padding:0}",
      ".ma-aula-botao:hover,.ma-aula-botao.aberto{opacity:1}",
      "body.ma-dock-direita .ma-aula-botao{left:auto;right:14px}",
      ".ma-aula{position:fixed;z-index:63;left:14px;top:58px;width:300px;max-height:calc(100vh - 80px);overflow:auto;display:none;padding:10px;border:1px solid #d8deea;border-radius:14px;background:#fff;box-shadow:0 14px 36px rgba(23,32,51,.22);font:12px/1.3 system-ui;color:#172033}",
      "body.ma-dock-direita .ma-aula{left:auto;right:14px}",
      ".ma-aula.aberto{display:block}",
      ".ma-aula h4{margin:2px 2px 6px;font:700 10px/1 system-ui;letter-spacing:.06em;text-transform:uppercase;color:#667085}",
      ".ma-aula .titulo{font:700 13px/1.25 system-ui;margin:0 2px 10px}",
      ".ma-aula .titulo small{display:block;font-weight:500;color:#667085;margin-top:2px}",
      ".ma-aula .lista{display:flex;flex-direction:column;gap:3px;margin-bottom:10px}",
      ".ma-aula .item{display:flex;align-items:center;gap:9px;width:100%;min-height:34px;padding:5px 8px;border:1px solid transparent;border-radius:9px;background:none;cursor:pointer;text-align:left;font:600 12px system-ui;color:#172033}",
      ".ma-aula .item:hover{background:#f2f5fa}",
      ".ma-aula .item.ativo{background:#eef3fc;border-color:#c9d6ee;color:#1e4999}",
      ".ma-aula .item .ic{width:22px;height:22px;display:grid;place-items:center;flex:0 0 auto;color:#475467}",
      ".ma-aula .item .ic svg{width:18px;height:18px}",
      ".ma-aula .grade{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}",
      ".ma-aula .grade .item{flex-direction:column;justify-content:center;gap:4px;min-height:58px;text-align:center;font-size:10.5px;font-weight:600}",
      "body.projector-display .ma-aula,body.projector-display .ma-aula-botao{display:none!important}"
    ].join("");
    document.head.appendChild(s);
  }

  var ICONE_AULA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
    'stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  function rotulo(el) {
    var t = (el.getAttribute("title") || el.getAttribute("aria-label") || el.textContent || "").trim();
    t = t.replace(/\s*\(.*?\)\s*/g, " ").trim();
    var curtos = {
      "Sair do Modo Aula e voltar ao painel semanal": "Sair",
      "Abrir ou fechar apoio da aula": "Apoio da aula",
      "Abrir ou fechar objetivos": "Apoio da aula",
      "Abrir tela de projeção limpa": "Projeção",
      "Relógio e temporizadores": "Relógio",
      "Sorteio e grupos": "Sorteio",
      "Abrir controle privado de English Wins": "English Wins",
      "Mostrar a instrução na tela da turma": "Instrução"
    };
    return curtos[t] || t;
  }
  var PROPRIOS = {
    "Projeção": '<rect x="2.5" y="4" width="12" height="9" rx="1.5"/><rect x="9.5" y="11" width="12" height="9" rx="1.5"/>',
    "English Wins": '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L3.4 9.3l6-.7z"/>'
  };
  var SUBMENUS = {
    "Relógio": { seletor: ".time-widget-menu [data-show-widget]" },
    "Sorteio": { seletor: ".roster-menu [data-open-roster]" }
  };
  var ICONES_SUB = {
    "Relógio": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',
    "Cronômetro": '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V10M10 3h4M18 6l1.5-1.5"/>',
    "Temporizador": '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9"/>',
    "Roleta de nomes": '<circle cx="12" cy="12" r="8.5"/><path d="M12 12L17 6M12 3.5v2"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
    "Agrupador": '<circle cx="8" cy="9" r="2.6"/><circle cx="16" cy="9" r="2.6"/><path d="M3.5 19c.6-3 2.3-4.5 4.5-4.5s3.9 1.5 4.5 4.5M11.5 19c.6-3 2.3-4.5 4.5-4.5s3.9 1.5 4.5 4.5"/>'
  };
  function svgDe(corpo) {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + corpo + "</svg>";
  }
  function desenho(el) {
    var proprio = PROPRIOS[rotulo(el)];
    if (proprio) {
      return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linejoin="round">' + proprio + "</svg>";
    }
    var svg = el.querySelector("svg");
    return svg ? svg.outerHTML : '<span style="font:700 15px system-ui">' + (el.textContent || "•").trim().slice(0, 2) + "</span>";
  }
  function ativo(el) {
    return el.classList.contains("active") || el.getAttribute("aria-pressed") === "true";
  }

  function montar() {
    estilos();
    document.body.classList.add("ma-casca");

    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "ma-aula-botao";
    botao.title = "Aula: lousa, recursos e ferramentas";
    botao.innerHTML = ICONE_AULA;
    document.body.appendChild(botao);

    var painel = document.createElement("div");
    painel.className = "ma-aula";
    painel.setAttribute("role", "dialog");
    painel.setAttribute("aria-label", "Aula");
    document.body.appendChild(painel);

    function item(el, texto, classe) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "item" + (classe ? " " + classe : "") + (ativo(el) ? " ativo" : "");
      b.innerHTML = '<span class="ic">' + desenho(el) + "</span>";
      var label = document.createElement("span"); label.textContent = texto; b.appendChild(label);
      /* O clique vai para o botão original DEPOIS que este gesto termina: as ferramentas
         da aula fecham seus menus quando percebem um clique "fora" deles, e o próprio
         clique no painel contava como fora. */
      b.addEventListener("click", function () { fechar(); setTimeout(function () { el.click(); }, 0); });
      return b;
    }

    function construir() {
      painel.innerHTML = "";
      var titulo = document.getElementById("lessonTitle");
      var meta = document.getElementById("lessonMeta");
      if (titulo) {
        var t = document.createElement("div");
        t.className = "titulo";
        t.textContent = titulo.textContent;
        if (meta && meta.textContent) { var small = document.createElement("small"); small.textContent = meta.textContent; t.appendChild(small); }
        painel.appendChild(t);
      }

      /* Na tela: a lousa e cada recurso da aula */
      var h1 = document.createElement("h4"); h1.textContent = "Na tela"; painel.appendChild(h1);
      var lista = document.createElement("div"); lista.className = "lista"; painel.appendChild(lista);
      var branca = document.getElementById("whiteBtn"), preta = document.getElementById("blackBtn");
      var palco = document.getElementById("stage");
      var naLousa = palco && !palco.classList.contains("has-resource");
      [[branca, "Lousa branca"], [preta, "Lousa preta"]].forEach(function (par) {
        if (!par[0]) return;
        var b = item(par[0], par[1]);
        b.classList.toggle("ativo", naLousa && ativo(par[0]));
        lista.appendChild(b);
      });
      document.querySelectorAll("#resourceList .resource-card").forEach(function (card) {
        var principal = card.querySelector(".resource-main");
        if (!principal) return;
        var nome = (card.querySelector("strong") || principal).textContent.trim();
        var b = item(principal, nome, card.classList.contains("active") ? "ativo" : "");
        lista.appendChild(b);
      });
      var fecharRecurso = document.getElementById("closeResourceBtn");

      /* Ferramentas da aula: tudo o que morava no trilho, menos o que já está acima */
      var h2 = document.createElement("h4"); h2.textContent = "Ferramentas da aula"; painel.appendChild(h2);
      var grade = document.createElement("div"); grade.className = "grade"; painel.appendChild(grade);
      var fora = ["whiteBtn", "blackBtn", "resourcesBtn", "closeResourceBtn"];
      var fontes = [];
      var aba = document.getElementById("drawerTab");
      if (aba) fontes.push(aba);
      document.querySelectorAll(".drawer-rail .toolbar > button, .topbar .toolbar > button").forEach(function (el) {
        if (fora.indexOf(el.id) < 0 && fontes.indexOf(el) < 0 && !el.hidden) fontes.push(el);
      });
      /* Sair por último */
      fontes.sort(function (a, b) { return (a.id === "sairBtn") - (b.id === "sairBtn"); });
      fontes.forEach(function (el) {
        /* Relógio e Sorteio não abrem a ferramenta: abrem um menu pequeno ao lado do
           botão, que agora está escondido. O painel mostra direto as opções do menu. */
        var sub = SUBMENUS[rotulo(el)];
        var opcoes = sub ? document.querySelectorAll(sub.seletor) : [];
        if (opcoes.length) {
          Array.prototype.forEach.call(opcoes, function (op) {
            var nome = (op.querySelector("strong") || op).textContent.trim();
            var b = item(op, nome);
            var ic = ICONES_SUB[nome];
            if (ic) b.querySelector(".ic").innerHTML = svgDe(ic);
            grade.appendChild(b);
          });
          return;
        }
        grade.appendChild(item(el, rotulo(el)));
      });
      if (fecharRecurso && !fecharRecurso.hidden) {
        /* "Fechar recurso" é o mesmo que voltar à lousa — já está em "Na tela". */
      }
    }

    function abrir() { construir(); painel.classList.add("aberto"); botao.classList.add("aberto"); }
    function fechar() { painel.classList.remove("aberto"); botao.classList.remove("aberto"); }
    botao.addEventListener("click", function () {
      if (painel.classList.contains("aberto")) fechar(); else abrir();
    });
    document.addEventListener("pointerdown", function (ev) {
      if (!painel.classList.contains("aberto")) return;
      if (painel.contains(ev.target) || botao.contains(ev.target)) return;
      fechar();
    }, true);
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") fechar(); });

    /* O painel de apoio começa fechado: ele é do professor, não da turma. Continua a um
       clique, em "Ferramentas da aula". */
    var gaveta = document.getElementById("goalsDrawer");
    var aba = document.getElementById("drawerTab");
    if (gaveta && !gaveta.classList.contains("closed") && aba) aba.click();

    window.MACasca = { ativo: true, abrir: abrir, fechar: fechar };
  }

  function quandoPronta() {
    if (document.getElementById("stage")) montar();
  }
  if (window.ModoAulaShell) quandoPronta();
  else document.addEventListener("modo-aula:shell-ready", quandoPronta, { once: true });
})();
