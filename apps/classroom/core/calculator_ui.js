/* Modo Aula — calculadora de sala: normal e científica, na gaveta ou destacada.
 *
 * Pedido dele, em 20/08: *"nos dois agora quero uma calculadora, com função científica ou
 * normal (a normal tem que ter raiz quadrada) e que possa ficar na gaveta ou ser destacada
 * e ajustar o tamanho."* E, sobre a projeção: espelhada, mas **opcional** — a turma vê
 * quando ele decide mostrar.
 *
 * ## Três decisões que valem explicação
 *
 * **1. Sem `eval`.** A expressão é avaliada por um shunting-yard próprio (`avaliar`). Não é
 * preciosismo: `eval` num campo de texto que fica aberto na projeção, num arquivo que
 * também roda na máquina de outro professor, é a única porta desnecessária do sistema. O
 * parser cabe em ~90 linhas e é testável — e está testado em `testes/teste_calculadora.js`.
 *
 * **2. Posição e tamanho em fração da JANELA, não da superfície.** O Modo Aula tem três
 * hosts (`modo_aula.html`, `modo_aula_pdf.html`, `modo_aula_projector.html`) e cada modo
 * carrega um conjunto diferente de módulos — o modo `book-y9`, por exemplo, não tem a
 * camada de objetos. Uma calculadora ancorada em `ModoAulaObjectSurfaces` sumiria ao trocar
 * de modo, que é a família de defeito que ele descreveu como "engasgo". Fração de viewport
 * funciona nos três hosts e faz o espelho cair no mesmo lugar num projetor de outra
 * resolução.
 *
 * **3. O espelho é desligado por padrão.** Conta de professor conferindo troco de exercício
 * não precisa de plateia. O botão diz o que faz: *mostrar para a turma*.
 */
(function () {
  "use strict";

  if (window.__modoAulaCalculadora) return;
  window.__modoAulaCalculadora = true;

  var params = new URLSearchParams(location.search);
  var slot = "maple-demo-volume";
  var PROJECAO = false;
  var CHAVE = "maple-demo:classroom:calc:" + (slot || "sem-slot");
  var CANAL = ""; // No projection channel in this demo.

  var canal = null;
  try { if (CANAL && "BroadcastChannel" in window) canal = new BroadcastChannel(CANAL); }
  catch (erro) {}

  /* ------------------------------------------------------------------ o motor ---- */

  var avaliar = window.ModoAulaCalcMotor.avaliar;


  /* ------------------------------------------------------------------ estado ---- */

  function ler() {
    try { return JSON.parse(localStorage.getItem(CHAVE) || "null") || {}; }
    catch (erro) { return {}; }
  }
  function gravar(estado) {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (erro) {}
  }

  var estado = ler();
  if (!estado.modo) estado.modo = "normal";
  /* `aberta` é diferente de `destacada`, e a falta dessa distinção era o defeito que ele
     relatou em 21/08: *"a calculadora não tá fechando"*.
       - `destacada` diz ONDE ela mora: na gaveta ou solta sobre a tela;
       - `aberta`   diz SE ela está na tela.
     Sem `aberta`, o botão da barra só sabia abrir: clicar de novo com ela solta apenas
     regravava `destacada = true`. E no visualizador de PDF, que não tem gaveta, o
     "guardar" caía na guarda `if (!destacada && !caixaGaveta) destacada = true` e ela
     voltava no mesmo instante — ali não havia jeito NENHUM de tirá-la da tela. */
  if (typeof estado.aberta !== "boolean") estado.aberta = false;
  if (typeof estado.destacada !== "boolean") estado.destacada = false;
  if (typeof estado.espelho !== "boolean") estado.espelho = false;
  if (typeof estado.graus !== "boolean") estado.graus = true;
  if (!estado.caixa) estado.caixa = { x: 0.6, y: 0.12, w: 0.32, h: 0.68 };
  if (typeof estado.expr !== "string") estado.expr = "";
  if (typeof estado.visor !== "string") estado.visor = "0";
  var memoria = 0;

  /* ------------------------------------------------------------------ o desenho ---- */

  var TECLAS_NORMAL = [
    ["MC", "MR", "M+", "M−"],
    ["C", "⌫", "√", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["±", "0", ".", "="]
  ];
  var TECLAS_CIENT = [
    ["MC", "MR", "M+", "M−", "DEG"],
    ["sin", "cos", "tan", "π", "e"],
    ["ln", "log", "x²", "xʸ", "1/x"],
    ["(", ")", "√", "%", "÷"],
    ["7", "8", "9", "C", "×"],
    ["4", "5", "6", "⌫", "−"],
    ["1", "2", "3", "±", "+"],
    ["0", ".", "="]
  ];

  function estilos() {
    if (document.getElementById("modoAulaCalcCss")) return;
    var css = document.createElement("style");
    css.id = "modoAulaCalcCss";
    css.textContent = [
      ".ma-calc{display:flex;flex-direction:column;gap:8px;font:500 14px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#172033}",
      ".ma-calc-topo{display:flex;align-items:center;gap:6px;flex-wrap:wrap}",
      ".ma-calc-topo .sp{margin-left:auto}",
      ".ma-calc button{font:inherit;color:inherit;cursor:pointer}",
      ".ma-calc-modo{display:inline-flex;border:1px solid #c9d2e2;border-radius:8px;overflow:hidden}",
      ".ma-calc-modo button{border:0;background:#fff;padding:5px 10px;font-size:12.5px;font-weight:700;color:#5b6672}",
      ".ma-calc-modo button.on{background:#1e4999;color:#fff}",
      ".ma-calc-acao{border:1px solid #c9d2e2;background:#fff;border-radius:8px;padding:5px 9px;font-size:12.5px;font-weight:600}",
      ".ma-calc-fechar{margin-left:auto;width:26px;height:26px;flex:0 0 auto;border:1px solid #c9d2e2;",
      "background:#fff;border-radius:50%;font:700 15px/1 system-ui;color:#5b6672;cursor:pointer}",
      ".ma-calc-fechar:hover{border-color:#c0272d;color:#c0272d}",
      ".ma-calc-acao.on{background:#1e4999;border-color:#1e4999;color:#fff}",
      /* O visor: expressão pequena em cima, resultado grande embaixo. É a leitura que o
         aluno faz de longe quando a calculadora está projetada. */
      ".ma-calc-visor{background:#0f1a2b;color:#fff;border-radius:10px;padding:9px 12px;text-align:right;min-height:64px;display:flex;flex-direction:column;justify-content:flex-end;gap:2px;overflow:hidden}",
      ".ma-calc-expr{font-size:13px;color:#9fb3d1;min-height:16px;word-break:break-all}",
      ".ma-calc-num{font-size:30px;font-weight:700;letter-spacing:-.01em;word-break:break-all;line-height:1.05}",
      ".ma-calc-erro .ma-calc-num{color:#ff9d95;font-size:17px;font-weight:600}",
      ".ma-calc-mem{font-size:11px;color:#7f93b3}",
      ".ma-calc-teclas{display:grid;gap:6px}",
      ".ma-calc-teclas button{border:1px solid #d7dee9;background:#fff;border-radius:9px;padding:10px 4px;font-size:16px;font-weight:600;min-height:40px}",
      ".ma-calc-teclas button:active{background:#eef2f9}",
      ".ma-calc-teclas button.op{background:#f3f6fb;color:#1e4999}",
      ".ma-calc-teclas button.ig{background:#1e4999;border-color:#1e4999;color:#fff}",
      ".ma-calc-teclas button.fn{font-size:13.5px;color:#5b6672}",
      /* Destacada: janela flutuante sobre tudo, movida e redimensionada pelo próprio
         professor. `position:fixed` de propósito — ver o cabeçalho do arquivo. */
      ".ma-calc-flutua{position:fixed;z-index:60;background:#fff;border:1px solid #c9d2e2;border-radius:14px;box-shadow:0 18px 46px rgba(15,26,43,.28);padding:10px;display:flex;flex-direction:column;min-width:230px;min-height:280px}",
      /* A janela destacada tem altura definida por ele, então quem se ajusta é o teclado:
         `1fr` nas linhas e `min-height:0` na cadeia inteira. Sem isso o grid mantinha a
         altura natural das teclas e vazava por baixo da borda — apareceu na primeira
         captura em tamanho real. */
      ".ma-calc-flutua .ma-calc{flex:1;min-height:0;overflow:hidden}",
      ".ma-calc-flutua .ma-calc-teclas{flex:1;min-height:0;grid-auto-rows:1fr}",
      ".ma-calc-flutua .ma-calc-teclas button{min-height:0;padding:4px}",
      ".ma-calc-flutua .ma-calc-topo{flex:none}",
      ".ma-calc-flutua .ma-calc-visor{flex:none}",
      ".ma-calc-guardada{display:flex;flex-direction:column;gap:9px;align-items:flex-start;padding:4px 2px;font:500 13px/1.45 system-ui;color:#5b6672}",
      /* Arrasta-se pela BARRA DE TOPO, não por uma faixa invisível por cima dela. A
         primeira versão punha uma `.ma-calc-pega` de 26px cobrindo a largura inteira, e
         ela engolia os cliques dos próprios botões — não dava para trocar para científica
         nem para guardar a janela. Quem apareceu com isso foi o teste de duas janelas. */
      ".ma-calc-flutua .ma-calc-topo{cursor:move;user-select:none}",
      ".ma-calc-flutua .ma-calc-topo button{cursor:pointer}",
      ".ma-calc-canto{position:absolute;right:2px;bottom:2px;width:20px;height:20px;cursor:nwse-resize;border-right:3px solid #c9d2e2;border-bottom:3px solid #c9d2e2;border-radius:0 0 12px 0}",
      ".ma-calc-flutua .ma-calc-topo{padding-left:2px}",
      /* Na projeção não há controle nenhum: a turma vê visor e teclas, e mais nada. */
      ".ma-calc-tv{position:fixed;z-index:70;background:#fff;border-radius:16px;box-shadow:0 22px 60px rgba(15,26,43,.4);padding:14px;display:none;flex-direction:column}",
      ".ma-calc-tv.on{display:flex}",
      ".ma-calc-tv .ma-calc-visor{min-height:96px}",
      ".ma-calc-tv .ma-calc-num{font-size:44px}",
      ".ma-calc-tv .ma-calc-expr{font-size:17px}",
      ".ma-calc-tv .ma-calc{flex:1;min-height:0;overflow:hidden}",
      ".ma-calc-tv .ma-calc-teclas{flex:1;min-height:0;grid-auto-rows:1fr}",
      ".ma-calc-tv .ma-calc-teclas button{pointer-events:none;min-height:0;padding:4px;font-size:14px}",
      ".ma-calc-tv .ma-calc-teclas button.batida{background:#1e4999;border-color:#1e4999;color:#fff}"
    ].join("\n");
    document.head.appendChild(css);
  }

  function novo(tag, classe, texto) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto != null) el.textContent = texto;
    return el;
  }

  /* Monta a calculadora dentro de um container. `interativa=false` é a versão da projeção:
     mesmos elementos, sem eventos. */
  function montar(container, interativa) {
    var raiz = novo("div", "ma-calc");
    var topo = novo("div", "ma-calc-topo");
    var visor = novo("div", "ma-calc-visor");
    var expr = novo("div", "ma-calc-expr");
    var num = novo("div", "ma-calc-num", "0");
    var mem = novo("div", "ma-calc-mem", "");
    visor.appendChild(expr); visor.appendChild(num); visor.appendChild(mem);
    var teclas = novo("div", "ma-calc-teclas");
    raiz.appendChild(topo); raiz.appendChild(visor); raiz.appendChild(teclas);
    container.appendChild(raiz);
    return { raiz: raiz, topo: topo, visor: visor, expr: expr, num: num, mem: mem, teclas: teclas };
  }

  function desenharTeclas(ui, modo) {
    var mapa = modo === "cientifica" ? TECLAS_CIENT : TECLAS_NORMAL;
    var colunas = modo === "cientifica" ? 5 : 4;
    ui.teclas.style.gridTemplateColumns = "repeat(" + colunas + ",1fr)";
    ui.teclas.innerHTML = "";
    mapa.forEach(function (linha) {
      linha.forEach(function (rotulo) {
        var b = novo("button", "", rotulo);
        b.type = "button";
        b.dataset.tecla = rotulo;
        if (/^[+\-×÷=]$/.test(rotulo)) b.className = "op";
        if (rotulo === "=") b.className = "ig";
        if (/^(MC|MR|M\+|M−|sin|cos|tan|ln|log|x²|xʸ|1\/x|DEG|RAD|√|%|±|⌫|C|\(|\))$/.test(rotulo)) {
          b.className = "fn";
        }
        if (rotulo === "=" && modo === "cientifica") b.style.gridColumn = "span 3";
        ui.teclas.appendChild(b);
      });
    });
  }

  function formatar(v) {
    if (typeof v !== "number") return String(v);
    if (!isFinite(v)) return v > 0 ? "∞" : (isNaN(v) ? "—" : "−∞");
    var s = Math.abs(v) >= 1e12 || (Math.abs(v) < 1e-6 && v !== 0)
      ? v.toExponential(6) : String(Math.round(v * 1e10) / 1e10);
    return s.replace("-", "−");
  }

  /* ------------------------------------------------------------- lado professor ---- */

  function iniciarProfessor() {
    estilos();

    var caixaGaveta = null, ui = null, flutua = null, uiFlutua = null, botaoDaBarra = null;
    /* O registro de abas nasce no `modo_aula_planning_tabs.js`, e os dois sobem no mesmo
       `DOMContentLoaded`. Quando a calculadora ganhava a corrida, ela concluía "não há
       gaveta" e nascia DESTACADA — uma janela flutuante por cima da interface, que a
       bancada pegou interceptando o clique na aba do guia. Esperar o registro aparecer,
       com teto de quatro segundos, é o que torna a decisão estável; sem gaveta de verdade
       (o visualizador de PDF não tem uma) o teto expira e o comportamento é o mesmo de
       antes. O mesmo padrão está em `modo_aula_instrucoes.js`, pela mesma razão. */
    var abas = window.__modoAulaAbasDaGaveta;
    if (abas && abas.registrar) caixaGaveta = abas.registrar({ nome: "calc", rotulo: "Calculadora" });
    if (!caixaGaveta && temGaveta() && Date.now() < esperarAte) {
      return setTimeout(iniciarProfessor, 120);
    }
    if (!caixaGaveta) {
      /* Sem gaveta (o visualizador de PDF não tem uma), quando ABERTA ela só pode estar
         solta. Fechada, não está em lugar nenhum — que é o ponto. */
      if (estado.aberta) estado.destacada = true;
    } else {
      caixaGaveta.classList.add("goals-body");
      ui = montar(caixaGaveta, true);
      controles(ui, false);
      ligar(ui);
    }

    botaoNaBarra();
    render();

    function botaoNaBarra() {
      /* Duas cascas, dois nomes: `.toolbar` é a barra do hub, `.tools` é a do
         visualizador de PDF. Procurar só por `.toolbar` significava que no visualizador
         NUNCA houve botão nem atalho — a calculadora nascia solta pelo boot e não tinha
         como sair da frente. Era esse o defeito de 21/08. */
      var barra = document.querySelector(".toolbar, .tools");
      if (!barra) return;
      /* Na casca o botão já vem no HTML, no meio da família (lousa, tela preta,
         objetivos, recursos). Aqui ele é ADOTADO, e não recriado: recriar o deixaria no
         fim da barra, fora da família, que é justamente o que ele pediu para mudar. No
         visualizador de PDF não há botão no HTML, e então este código cria um. */
      var b = document.getElementById("calcBtn");
      var jaExistia = !!b;
      if (!b) b = novo("button", "icon-btn", "");
      b.id = "calcBtn";
      b.type = "button";
      b.title = "Calculadora (tecla C)";
      b.setAttribute("aria-label", b.title);
      /* Botão da MESMA família da lousa, da tela preta e dos recursos — ele pediu isso
         em 21/08. Usa o sprite da casca quando existe (`#i-calc`); no visualizador de
         PDF, que não tem sprite, cai no símbolo desenhado à mão. */
      if (!jaExistia) {
        if (document.getElementById("i-calc")) {
          b.innerHTML = '<svg class="icon"><use href="#i-calc"/></svg>';
        } else {
          b.textContent = "√";
        }
        barra.appendChild(b);
      }
      b.addEventListener("click", function () { alternar(); });
      botaoDaBarra = b;
      document.addEventListener("keydown", function (ev) {
        var alvo = ev.target || {};
        if (/input|textarea|select/i.test(alvo.tagName || "")) return;
        if (alvo.isContentEditable) return;
        /* `C`, e não `K`: no hub o `K` já é o quadro preto (`modo_aula.js`, setBoard),
           e roubar um atalho existente é a maneira mais barata de estragar a aula de
           alguém. As livres eram poucas — `b e f h k l m o p r x z` já estavam tomadas. */
        if ((ev.key || "").toLowerCase() === "c") { ev.preventDefault(); b.click(); }
      });
    }

    /* Uma porta só, que abre e fecha. Aberta e na gaveta, mostra a aba; aberta e solta,
       mostra a janela; fechada, some das duas. */
    function alternar(valor) {
      var querAbrir = typeof valor === "boolean" ? valor : !estado.aberta;
      estado.aberta = querAbrir;
      if (querAbrir && !caixaGaveta) estado.destacada = true;
      salvar();
      render();
      if (querAbrir && caixaGaveta && !estado.destacada && abas && abas.mostrar) {
        abas.mostrar("calc");
      }
    }

    function controles(alvo, ehFlutuante) {
      alvo.topo.innerHTML = "";
      var modo = novo("div", "ma-calc-modo");
      ["normal", "cientifica"].forEach(function (nome) {
        var b = novo("button", estado.modo === nome ? "on" : "",
                     nome === "normal" ? "normal" : "científica");
        b.type = "button";
        b.addEventListener("click", function () {
          estado.modo = nome; salvar(); render();
        });
        modo.appendChild(b);
      });
      alvo.topo.appendChild(modo);

      /* "guardar" só faz sentido havendo gaveta. Sem ela — o visualizador de PDF — o
         botão vira FECHAR, em vez de prometer um lugar que não existe e devolver a
         calculadora à tela no mesmo instante, que era o defeito. */
      if (caixaGaveta || !ehFlutuante) {
        var mover = novo("button", "ma-calc-acao sp", ehFlutuante ? "guardar" : "destacar");
        mover.type = "button";
        mover.title = ehFlutuante ? "Volta para a gaveta" : "Solta a calculadora sobre a tela";
        mover.addEventListener("click", function () {
          estado.destacada = !ehFlutuante;
          salvar(); render();
        });
        alvo.topo.appendChild(mover);
      }

      if (ehFlutuante) {
        var fechar = novo("button", "ma-calc-fechar", "×");
        fechar.type = "button";
        fechar.title = "Fechar a calculadora";
        fechar.setAttribute("aria-label", fechar.title);
        fechar.setAttribute("data-acao", "fechar");
        fechar.addEventListener("click", function () { alternar(false); });
        alvo.topo.appendChild(fechar);
      }
    }

    function criarFlutuante() {
      if (flutua) return;
      flutua = novo("div", "ma-calc-flutua");
      var canto = novo("div", "ma-calc-canto");
      document.body.appendChild(flutua);
      uiFlutua = montar(flutua, true);
      flutua.appendChild(canto);
      controles(uiFlutua, true);
      ligar(uiFlutua);
      arrastar(uiFlutua.topo, canto);
      posicionar();
    }

    function posicionar() {
      if (!flutua) return;
      var c = estado.caixa;
      flutua.style.left = (c.x * window.innerWidth) + "px";
      flutua.style.top = (c.y * window.innerHeight) + "px";
      flutua.style.width = (c.w * window.innerWidth) + "px";
      flutua.style.height = (c.h * window.innerHeight) + "px";
    }

    function arrastar(pega, canto) {
      var gesto = null;
      function inicio(tipo, ev) {
        gesto = { tipo: tipo, x: ev.clientX, y: ev.clientY, caixa: JSON.parse(JSON.stringify(estado.caixa)) };
        ev.preventDefault();
        window.addEventListener("pointermove", mover);
        window.addEventListener("pointerup", fim);
      }
      function mover(ev) {
        if (!gesto) return;
        var dx = (ev.clientX - gesto.x) / window.innerWidth;
        var dy = (ev.clientY - gesto.y) / window.innerHeight;
        var c = estado.caixa;
        if (gesto.tipo === "mover") {
          c.x = Math.max(0, Math.min(1 - gesto.caixa.w, gesto.caixa.x + dx));
          c.y = Math.max(0, Math.min(1 - gesto.caixa.h, gesto.caixa.y + dy));
        } else {
          c.w = Math.max(.16, Math.min(.9, gesto.caixa.w + dx));
          c.h = Math.max(.24, Math.min(.95, gesto.caixa.h + dy));
        }
        posicionar();
      }
      function fim() {
        gesto = null; salvar(); publicar();
        window.removeEventListener("pointermove", mover);
        window.removeEventListener("pointerup", fim);
      }
      /* Clique em botão é clique em botão; o arrasto começa no espaço vazio da barra. */
      pega.addEventListener("pointerdown", function (ev) {
        if (ev.target.closest("button")) return;
        inicio("mover", ev);
      });
      canto.addEventListener("pointerdown", function (ev) { inicio("tamanho", ev); });
      window.addEventListener("resize", posicionar);
    }

    function ligar(alvo) {
      alvo.teclas.addEventListener("click", function (ev) {
        var b = ev.target.closest("button[data-tecla]");
        if (b) apertar(b.dataset.tecla);
      });
    }

    /* Depois do `=`, a próxima tecla decide o que acontece — e é assim em qualquer
       calculadora do mundo, mas não era assim aqui: eu deixava a expressão antiga na tela,
       então digitar `sin` depois de `12×12=` produzia `12×12sin(` e um erro. Dígito ou
       função começam conta NOVA; operador CONTINUA a partir do resultado, que é o gesto de
       quem acabou de somar e quer dividir o total. */
    function apertar(tecla) {
      var v = estado.visor;
      if (estado.calculou) {
        estado.calculou = false;
        if (/^[0-9.(π]$/.test(tecla) || /^(sin|cos|tan|ln|log|√|e)$/.test(tecla)) {
          estado.expr = "";
        } else if (/^[+\-−×÷^%]$/.test(tecla) || tecla === "x²" || tecla === "xʸ") {
          estado.expr = estado.erro ? "" : String(estado.visor);
        }
      }
      if (tecla === "C") { estado.expr = ""; estado.visor = "0"; }
      else if (tecla === "⌫") estado.expr = estado.expr.slice(0, -1);
      else if (tecla === "=") { calcular(); estado.calculou = true; }
      else if (tecla === "±") estado.expr = estado.expr ? "−(" + estado.expr + ")" : "−";
      else if (tecla === "DEG" || tecla === "RAD") { estado.graus = !estado.graus; }
      else if (tecla === "MC") memoria = 0;
      else if (tecla === "MR") estado.expr += formatarParaExpr(memoria);
      else if (tecla === "M+") memoria += Number(String(v).replace("−", "-")) || 0;
      else if (tecla === "M−") memoria -= Number(String(v).replace("−", "-")) || 0;
      else if (tecla === "x²") estado.expr += "^2";
      else if (tecla === "xʸ") estado.expr += "^";
      else if (tecla === "1/x") estado.expr = "1/(" + estado.expr + ")";
      else if (/^(sin|cos|tan|ln|log)$/.test(tecla)) estado.expr += tecla + "(";
      else estado.expr += tecla;
      if (tecla !== "=") estado.erro = false;
      salvar(); render(); publicar(tecla);
    }

    function formatarParaExpr(v) { return String(v).replace("−", "-"); }

    function calcular() {
      if (!estado.expr.trim()) { estado.visor = "0"; estado.erro = false; return; }
      try {
        var r = avaliar(estado.expr.replace(/−/g, "-"), estado.graus);
        estado.visor = formatar(r);
        estado.erro = false;
      } catch (erro) {
        estado.visor = erro.message;
        estado.erro = true;
      }
    }

    function pintar(alvo) {
      if (!alvo) return;
      desenharTeclas(alvo, estado.modo);
      alvo.expr.textContent = estado.expr || " ";
      alvo.num.textContent = estado.visor;
      alvo.visor.parentNode.classList.toggle("ma-calc-erro", !!estado.erro);
      alvo.mem.textContent = (memoria ? "M " + formatar(memoria) + "   " : "")
        + (estado.modo === "cientifica" ? (estado.graus ? "DEG" : "RAD") : "");
      var deg = alvo.teclas.querySelector('[data-tecla="DEG"]');
      if (deg) deg.textContent = estado.graus ? "DEG" : "RAD";
    }

    function render() {
      var solta = estado.aberta && estado.destacada;
      if (solta) criarFlutuante();
      if (flutua) flutua.style.display = solta ? "flex" : "none";
      if (botaoDaBarra) {
        botaoDaBarra.classList.toggle("active", !!estado.aberta);
        botaoDaBarra.setAttribute("aria-pressed", estado.aberta ? "true" : "false");
      }
      if (caixaGaveta) caixaGaveta.hidden = !estado.aberta;
      /* Com a calculadora destacada, a aba não mostra uma segunda calculadora esmaecida —
         mostra onde ela está e como trazê-la de volta. Duas calculadoras na tela, uma
         delas fantasma, é a leitura errada. */
      if (ui) {
        ui.raiz.hidden = !estado.aberta || !!estado.destacada;
        if (estado.aberta && !estado.destacada) { controles(ui, false); pintar(ui); }
      }
      if (caixaGaveta) {
        var aviso = caixaGaveta.querySelector(".ma-calc-guardada");
        if (estado.destacada && !aviso) {
          aviso = novo("div", "ma-calc-guardada");
          aviso.appendChild(novo("div", "", "A calculadora está solta na tela."));
          var volta = novo("button", "ma-calc-acao", "trazer para a gaveta");
          volta.type = "button";
          volta.addEventListener("click", function () { estado.destacada = false; salvar(); render(); });
          aviso.appendChild(volta);
          caixaGaveta.appendChild(aviso);
        }
        if (aviso) aviso.hidden = !solta;
      }
      if (uiFlutua && solta) { controles(uiFlutua, true); pintar(uiFlutua); posicionar(); }
    }

    function salvar() { gravar(estado); }

    function publicar(tecla) {
      if (!canal) return;
      try {
        canal.postMessage({
          type: "calc-state",
          mostrar: !!estado.espelho,
          modo: estado.modo, expr: estado.expr, visor: estado.visor,
          erro: !!estado.erro, graus: estado.graus, caixa: estado.caixa,
          tecla: tecla || null, memoria: memoria
        });
      } catch (erro) {}
    }

    /* Quando o projetor abre no meio da aula, ele pergunta; a resposta é o estado inteiro.
       É o mesmo handshake que o Class Mode usa, e evita a 2ª tela começar vazia. */
    if (canal) {
      canal.addEventListener("message", function (ev) {
        var d = ev && ev.data || {};
        /* Três nomes para o mesmo pedido — "quem está aí, me manda o estado". O
             `projector-ready` é o que a `modo_aula_projector.html` já envia sozinha ao
             abrir, e é o único que chega quando a segunda tela é aberta no meio da aula
             sem que ninguém toque em nada. `quem-esta-ai` é o nome do Class Mode. */
          if (d.type === "projector-hello" || d.type === "quem-esta-ai" ||
              d.type === "projector-ready") publicar();
      });
    }
    publicar();
  }

  /* -------------------------------------------------------------- lado projeção ---- */

  function iniciarProjecao() {
    estilos();
    var caixa = novo("div", "ma-calc-tv");
    document.body.appendChild(caixa);
    var ui = montar(caixa, false);
    ui.topo.remove();
    var ultimaTecla = null;

    function aplicar(d) {
      caixa.classList.toggle("on", !!d.mostrar);
      if (!d.mostrar) return;
      var c = d.caixa || estado.caixa;
      caixa.style.left = (c.x * window.innerWidth) + "px";
      caixa.style.top = (c.y * window.innerHeight) + "px";
      caixa.style.width = (c.w * window.innerWidth) + "px";
      caixa.style.height = (c.h * window.innerHeight) + "px";
      desenharTeclas(ui, d.modo);
      ui.expr.textContent = d.expr || " ";
      ui.num.textContent = d.visor;
      ui.visor.parentNode.classList.toggle("ma-calc-erro", !!d.erro);
      ui.mem.textContent = (d.memoria ? "M " + formatar(d.memoria) + "   " : "")
        + (d.modo === "cientifica" ? (d.graus ? "DEG" : "RAD") : "");
      /* A tecla apertada pisca na projeção: é o que faz a turma acompanhar a conta em vez
         de só ver o número mudar. */
      if (d.tecla && d.tecla !== ultimaTecla) {
        var b = ui.teclas.querySelector('[data-tecla="' + d.tecla.replace(/"/g, "") + '"]');
        if (b) {
          b.classList.add("batida");
          setTimeout(function () { b.classList.remove("batida"); }, 220);
        }
      }
      ultimaTecla = d.tecla;
    }

    var respondeu = false;
    /* O `projector-hello` sai cedo demais no boot: medido em 20/08, o professor não
       responde ao primeiro, e a 2ª tela nasce vazia até alguém mexer em alguma coisa.
       Insistir por alguns segundos é mais barato que descobrir de quem é a corrida — e
       resolve também o caso de a projeção abrir antes do hub terminar de carregar. */
    function cumprimentar() {
      var tentativas = 0;
      (function bater() {
        if (respondeu || tentativas >= 8) return;
        tentativas += 1;
        try { canal.postMessage({ type: "projector-hello" }); } catch (erro) {}
        setTimeout(bater, 320);
      })();
    }
    if (canal) {
      canal.addEventListener("message", function (ev) {
        var d = ev && ev.data || {};
        if (d.type === "calc-state") { respondeu = true; aplicar(d); }
      });
      cumprimentar();
    }
    window.addEventListener("resize", function () {
      if (caixa.classList.contains("on")) aplicar({ mostrar: true, caixa: estado.caixa,
        modo: estado.modo, expr: estado.expr, visor: estado.visor, graus: estado.graus });
    });
  }

  /* Há gaveta neste host? O elemento existe desde o HTML; o que demora é o registro de
     abas ser montado por cima dele. Se o elemento não existe, não adianta esperar. */
  function temGaveta() { return !!document.getElementById("goalsDrawer"); }
  var esperarAte = 0;

  function comecar() {
    esperarAte = Date.now();
    if (PROJECAO) iniciarProjecao();
    else iniciarProfessor();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", comecar);
  } else {
    comecar();
  }
})();
