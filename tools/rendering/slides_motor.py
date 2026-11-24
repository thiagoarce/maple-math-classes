# -*- coding: utf-8 -*-
"""O motor de navegação das lâminas — um só, para as duas famílias de deck.

Até 21/08 havia dois, e eles divergiam em tudo menos no essencial:

- `slides_lib.py`    — `data-next` / `data-prev`, função `show()`, sem contador vivo;
- `slides_y9_lib.py` — `data-prox` / `data-ant`, função `mostrar()`, com contador,
  `location.hash` e, junto no mesmo bloco, a escada, as notas e o cronômetro da lâmina.

Aqui mora só o que as duas famílias fazem igual: mostrar uma lâmina, andar para frente e
para trás, teclado, e os botões da navegação. Os extras do Y9 continuam no
`slides_y9_lib.py`, porque dependem da marcação de lá — unificar o que não é igual seria
inventar acoplamento.

## Reveal / step

A partir de 23/08, o motor também conhece um primitive mínimo de progressão dentro da
mesma lâmina. Qualquer elemento marcado com `data-reveal` nasce invisível mas continua
ocupando seu espaço no layout.

A ordem pedagógica é independente da ordem do DOM quando o autor usa
`data-reveal="N"`. O motor agrupa elementos pelo mesmo índice: todos os elementos com o
mesmo `N` aparecem ou desaparecem juntos. Isso permite, por exemplo, deixar uma caixa no
começo do HTML por razões de layout, mas fazê-la aparecer apenas no passo 5.

`data-reveal` sem valor continua válido como fallback e segue a ordem natural do DOM. Os
itens sem índice são tratados como passos individuais depois dos grupos explicitamente
numerados, preservando compatibilidade com decks já gerados.

Isto não é uma animação decorativa. É uma primitive pedagógica para uma explicação que
precisa evoluir sem virar quatro lâminas: linha seguinte de uma equação, interpretação,
callout ou representação. A transição é curta e discreta; `prefers-reduced-motion` a
remove. A seta direita / PageDown / espaço primeiro consomem os reveals da lâmina e só
depois avançam. A seta esquerda / PageUp desfaz o último grupo de reveal antes de voltar
de lâmina. Os botões de navegação obedecem à mesma regra.

O estado é preservado se o professor sair e voltar à lâmina. `MASlides.revealReset()`
existe para reiniciar explicitamente a construção. Na impressão, todos os reveals ficam
visíveis temporariamente para que o PDF não perca conteúdo.

## Focus / highlight

Desde 23/08 o motor conhece um segundo gesto, e ele **não** é o reveal. Reveal traz
informação que não estava na tela; `focus` muda ONDE está a atenção sem esconder nada — o
contexto continua visível, recuado. É a diferença entre "agora eu te mostro" e "agora
olha aqui".

`data-focus="N"` segue exatamente a mesma regra de agrupamento do reveal: índice
pedagógico independente do DOM, mesmo `N` = grupo simultâneo. As duas compartilham o
código do agrupamento; duas cópias divergiriam na primeira mudança.

Só recua quem PARTICIPA, isto é, quem tem `data-focus`. Elemento sem o atributo é cenário
e fica intocado — recuar a lâmina inteira apagaria justamente o contexto que este gesto
existe para preservar. Quem participa e não está em foco vai a `opacity: .28`.

Duas roupas, aplicadas por classe na peça:

- `.ma-alvo` — alvo matemático em linha, com marca coral discreta atrás do texto;
- `.ma-bloco` — cartão ou bloco, com borda e preenchimento suaves. Sem zoom, sem sombra
  de PowerPoint, sem cara de botão de framework.

Na tecla, a ordem dos gestos é: a informação **entra** (reveal), depois a atenção **se
move** (focus), e só então a lâmina vira. Assim uma mesma lâmina traz a linha nova e
depois aponta dentro dela.

Impressão nunca sai com conteúdo apagado, e `prefers-reduced-motion` remove a transição.

## Por que continua INLINE no deck

Um `<script src>` externo é tentador e está errado aqui por duas razões, e a segunda é
verificável: `testes/checar_slides.js` abre cada deck por `file://`, e o professor abre
decks direto numa aba do Chrome. Deck é material de aula, não página de site — ele tem
que funcionar sozinho, sem servidor. É a mesma lição do pdf.js em `_padrao/pdfjs/LEIA-ME.md`.

## A API, e para que ela existe

O motor expõe `window.MASlides`:

    MASlides.total()        -> quantas lâminas
    MASlides.atual()        -> índice da ativa, lido do DOM
    MASlides.ir(n)          -> vai para a lâmina n (dá a volta nas pontas)
    MASlides.aoMudar(cb)    -> chama cb(indice, total) a cada troca
    MASlides.focusNext()    -> move o foco para o próximo grupo `data-focus`
    MASlides.focusPrev()    -> volta o foco um grupo
    MASlides.focusReset()   -> tira o foco de tudo, devolvendo a lâmina ao repouso
    MASlides.revealNext()   -> revela o próximo grupo `data-reveal` da lâmina ativa
    MASlides.revealPrev()   -> esconde o último grupo de reveal já aberto
    MASlides.revealReset()  -> volta a lâmina ativa ao estado inicial

Ela existe para o Modo Aula comandar o deck sem adivinhação. Sem a API, o driver
(`_padrao/modo_aula_slides.js`) tem de clicar no botão do próprio deck para não deixar a
variável interna do motor defasada — funciona, mas é arqueologia de DOM. Com a API é uma
chamada.

`atual()` pergunta ao DOM em vez de confiar num contador interno: qualquer coisa que troque
a lâmina por fora — uma âncora, o Modo Aula, o teste — deixaria os dois fora de sincronia,
e a tecla seguinte agiria na lâmina errada. Essa lição já estava escrita no motor do Y9, na
parte da escada; agora vale para a navegação inteira.

`location.hash` só é escrito quando o `<body>` traz `data-slides-hash="1"`. Os decks do Y9
sempre gravaram o hash e continuam gravando; os das outras famílias nunca gravaram e
continuam sem gravar. Regerar um deck não é hora de mudar o que ele faz.

## A página do livro abre POR CIMA da lâmina (09/09)

Pedido dele: *"para eu clicar na miniatura de página do livro e abrir a página sem sair do
slide"*. Estava registrado como dependência minha em `docs/CLAUDE_SLIDES_Y9.md`, item 2:
*"ampliar página legível, fechar e retornar ao mesmo slide/reveal; projetor acompanha ...
enquanto ampliada, navegação não deve trocar slides por engano"*.

O gerador do Y9 emite a miniatura como `<a class="book-page" target="_blank">`, que joga a
página em OUTRA ABA — a aula sai da tela. O motor agora intercepta e abre por cima, e três
detalhes decidem se isso funciona de verdade:

- **a miniatura vira `<button>` no boot.** Não é preciosismo: o
  `modo_aula_html_presenter_sync.js` ignora explicitamente qualquer clique dentro de
  `a[href]` (linha 75), então uma âncora NUNCA chegaria ao projetor. Como `<button>` ela
  entra no espelhamento que já existe, sem tocar na camada de sincronia. O `<a>` fica no
  HTML para quem abrir sem JavaScript;
- **com a página aberta, seta não troca de lâmina.** A ampliação é um estado, e navegar
  por baixo dela seria trocar o slide sem o professor ver;
- **fechar devolve a lâmina exatamente como estava** — o motor não mexe em reveal nem em
  foco ao abrir ou fechar.

O CSS estrutural (posição, tamanho, camada) vem no motor porque sem ele a ampliação
simplesmente não funciona; cor e tipografia continuam sendo da folha da peça.

## Sair do deck e voltar ao painel (09/09)

Pedido dele na mesma conversa. O painel abre o deck com `target="_blank"`, então "voltar
ao painel" é, na maioria das vezes, **fechar esta aba** — o painel continua atrás. Quando
a aba não foi aberta pelo painel (recarregada, favoritada, aberta na mão), `window.close()`
não funciona por regra do navegador, e aí o botão navega para o painel. As duas saídas
existem porque só uma delas nunca é suficiente.

O botão nasce em todo deck. Um deck de aula é aberto pelo painel e volta para ele; deck que
não quiser marca `data-sem-voltar` no `<body>`.
"""

MOTOR = r"""<script>
(function () {
  "use strict";
  var laminas = [].slice.call(document.querySelectorAll(".slide"));
  if (!laminas.length) return;
  var contador = document.querySelector("[data-conta]");
  var comHash = document.body && document.body.getAttribute("data-slides-hash") === "1";
  var ouvintes = [];
  var semMovimento = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function atual() {
    for (var i = 0; i < laminas.length; i++) {
      if (laminas[i].classList.contains("active")) return i;
    }
    return 0;
  }

  /* `data-reveal` e `data-focus` compartilham a MESMA regra de agrupamento: índice
     pedagógico independente do DOM, mesmo número = grupo simultâneo, sem número = passo
     avulso no fim. Ter duas cópias dessa regra é o modo de falha que o contrato do
     espelho existe para impedir — então ela mora aqui, uma vez, parametrizada. */
  function elementosDe(atributo, lamina) {
    return [].slice.call((lamina || laminas[atual()]).querySelectorAll("[" + atributo + "]"));
  }

  function elementosReveal(lamina) { return elementosDe("data-reveal", lamina); }
  function elementosFocus(lamina) { return elementosDe("data-focus", lamina); }

  function gruposDe(atributo, lamina) {
    var els = elementosDe(atributo, lamina);
    var numerados = {};
    var ordemNumerada = [];
    var naturais = [];

    els.forEach(function (el) {
      var bruto = el.getAttribute(atributo);
      var txt = bruto == null ? "" : String(bruto).trim();
      if (txt !== "" && !isNaN(Number(txt))) {
        var n = Number(txt);
        if (!Object.prototype.hasOwnProperty.call(numerados, n)) {
          numerados[n] = [];
          ordemNumerada.push(n);
        }
        numerados[n].push(el);
      } else {
        naturais.push([el]);
      }
    });

    ordemNumerada.sort(function (a, b) { return a - b; });
    var grupos = ordemNumerada.map(function (n) { return numerados[n]; });
    return grupos.concat(naturais);
  }

  function gruposReveal(lamina) { return gruposDe("data-reveal", lamina); }
  function gruposFocus(lamina) { return gruposDe("data-focus", lamina); }

  function esconderReveal(el) {
    el.classList.remove("is-revealed");
    el.setAttribute("aria-hidden", "true");
    el.style.visibility = "hidden";
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    el.style.pointerEvents = "none";
  }

  /* A opacidade de quem JÁ foi revelado mora no CSS, não no estilo em linha. Enquanto
     ela ficava aqui como `opacity:1`, vencia qualquer classe por especificidade — e um
     passo revelado NUNCA recuava quando o foco ia para outro. No raster: os passos 1 e 2
     desbotavam, os 4 e 5 (revelados) continuavam a plena tinta, e meia lâmina parecia
     estar em foco ao mesmo tempo. Reveal e focus precisam empilhar; para empilhar, os
     dois têm de falar pela mesma via. */
  function mostrarReveal(el, instantaneo) {
    el.classList.add("is-revealed");
    el.setAttribute("aria-hidden", "false");
    el.style.visibility = "visible";
    el.style.pointerEvents = "";
    el.style.transform = "none";
    if (instantaneo || semMovimento) {
      el.style.transition = "none";
      el.style.opacity = "";
      /* força o browser a aplicar o estado sem transição antes de devolver o padrão */
      void el.offsetWidth;
      el.style.transition = semMovimento ? "none" : "opacity 180ms ease, transform 180ms ease";
    } else {
      el.style.opacity = "";
    }
  }

  function prepararReveal(lamina) {
    elementosReveal(lamina).forEach(function (el) {
      el.style.transition = semMovimento ? "none" : "opacity 180ms ease, transform 180ms ease";
      el.style.willChange = "opacity, transform";
      esconderReveal(el);
    });
  }

  function grupoAberto(grupo) {
    return grupo.some(function (el) { return el.classList.contains("is-revealed"); });
  }

  function revealNext() {
    var grupos = gruposReveal();
    for (var i = 0; i < grupos.length; i++) {
      if (!grupoAberto(grupos[i])) {
        grupos[i].forEach(function (el) { mostrarReveal(el, false); });
        return true;
      }
    }
    return false;
  }

  function revealPrev() {
    var grupos = gruposReveal();
    for (var i = grupos.length - 1; i >= 0; i--) {
      if (grupoAberto(grupos[i])) {
        grupos[i].forEach(esconderReveal);
        return true;
      }
    }
    return false;
  }

  function revealReset() {
    elementosReveal().forEach(esconderReveal);
  }

  /* ------------------------------------------------------------------ focus ---- */
  /* `focus` NÃO é `reveal`. Reveal traz informação que não estava lá; focus muda ONDE
     está a atenção sem esconder nada — o contexto continua na tela, recuado. É a
     diferença entre "agora eu te mostro" e "agora olha aqui".
     
     Só recua quem participa, isto é, quem tem `data-focus`. Elemento sem o atributo é
     cenário e fica intocado; recuar a lâmina inteira apagaria o contexto, que é
     exatamente o que este gesto existe para preservar. */
  var CSS_FOCUS = [
    /* `is-revealed` é o estado "já entrou" do reveal; o foco escreve por cima dele, e por
       isso as duas classes de foco vêm com a especificidade dobrada. Sem isso a ordem das
       regras decidiria quem manda, e reveal e focus não empilhariam. */
    ".is-revealed{opacity:1}",
    ".ma-focus-participa{transition:opacity 200ms ease,filter 200ms ease}",
    ".ma-focus-recuado.ma-focus-recuado{opacity:.28}",
    ".ma-focus-ativo.ma-focus-ativo{opacity:1}",
    /* Alvo matemático em linha: marca coral discreta, não caixa de UI. */
    "[data-focus].ma-alvo.ma-focus-ativo{background:linear-gradient(transparent 62%,rgba(224,90,70,.30) 62%);",
    "box-decoration-break:clone;-webkit-box-decoration-break:clone}",
    /* Cartão/bloco em foco: borda e preenchimento suaves, sem zoom de PowerPoint. */
    "[data-focus].ma-bloco.ma-focus-ativo{box-shadow:0 0 0 2px rgba(224,90,70,.55);",
    "background:rgba(224,90,70,.05)}",
    "@media (prefers-reduced-motion: reduce){.ma-focus-participa{transition:none}}",
    /* Impressão nunca sai com conteúdo apagado — o papel não tem passo a passo. */
    "@media print{.ma-focus-recuado{opacity:1!important}",
    "[data-focus].ma-focus-ativo{box-shadow:none!important;background:none!important}}"
  ].join("");

  (function estiloFocus() {
    if (document.getElementById("maFocusCss")) return;
    var e = document.createElement("style");
    e.id = "maFocusCss";
    e.textContent = CSS_FOCUS;
    (document.head || document.documentElement).appendChild(e);
  }());

  function prepararFocus(lamina) {
    elementosFocus(lamina).forEach(function (el) {
      el.classList.add("ma-focus-participa");
      el.classList.remove("ma-focus-ativo", "ma-focus-recuado");
    });
  }

  /* Índice do grupo em foco na lâmina ativa; -1 quando nenhum. */
  function focoAtual(lamina) {
    var grupos = gruposFocus(lamina);
    for (var i = 0; i < grupos.length; i++) {
      if (grupos[i].some(function (el) { return el.classList.contains("ma-focus-ativo"); })) return i;
    }
    return -1;
  }

  function aplicarFoco(i) {
    var grupos = gruposFocus();
    elementosFocus().forEach(function (el) {
      el.classList.remove("ma-focus-ativo", "ma-focus-recuado");
    });
    if (i < 0) return;
    grupos.forEach(function (grupo, j) {
      grupo.forEach(function (el) {
        el.classList.add(j === i ? "ma-focus-ativo" : "ma-focus-recuado");
      });
    });
  }

  function focusNext() {
    var grupos = gruposFocus();
    if (!grupos.length) return false;
    var i = focoAtual();
    if (i >= grupos.length - 1) return false;
    aplicarFoco(i + 1);
    return true;
  }

  function focusPrev() {
    var grupos = gruposFocus();
    if (!grupos.length) return false;
    var i = focoAtual();
    if (i < 0) return false;
    aplicarFoco(i - 1);
    return true;
  }

  function focusReset() { aplicarFoco(-1); }

  /* A ordem dos gestos numa tecla: primeiro a informação ENTRA (reveal), depois a
     atenção se MOVE (focus), e só então a lâmina vira. Assim uma mesma lâmina pode usar
     os dois — traz a linha nova, e depois aponta dentro dela. */
  function avancar() {
    if (revealNext()) return true;
    if (focusNext()) return true;
    return false;
  }

  function voltar() {
    if (focusPrev()) return true;
    if (revealPrev()) return true;
    return false;
  }

  laminas.forEach(prepararReveal);
  laminas.forEach(prepararFocus);

  /* ## Transição entre lâminas — DESLIGADA por padrão
   *
   * professor, 24/08, pedindo as duas coisas: transição entre lâminas E mais movimento
   * dentro delas.
   *
   * O motor só faz transição quando o `<body>` traz `data-transicao`. Sem o atributo,
   * `ir()` continua exatamente como sempre foi — é o que mantém os 35 decks já gerados
   * intocados por esta mudança. Regerar um deck não é hora de mudar o que ele faz.
   *
   * O que o motor fornece é o SENTIDO e o estado de saída; a aparência é da folha de
   * estilo da peça, porque transição é decisão de design e não de motor. `data-sentido`
   * ("frente" ou "tras") vai na raiz, e a lâmina que sai ganha `.is-saindo` até a
   * animação terminar. Sem o sentido, avançar e voltar produzem o mesmo movimento e a
   * transição passa a mentir sobre a direção da aula. */
  var comTransicao = document.body && document.body.hasAttribute("data-transicao");
  var DURACAO = 320;
  var saindoAgora = null;

  function limparSaida() {
    if (!saindoAgora) return;
    saindoAgora.classList.remove("is-saindo");
    saindoAgora = null;
  }

  function ir(i) {
    var n = ((i % laminas.length) + laminas.length) % laminas.length;
    var de = atual();
    if (comTransicao && !semMovimento && n !== de) {
      limparSaida();                       /* clique rápido não deixa duas lâminas saindo */
      document.documentElement.setAttribute(
        "data-sentido", ((n - de + laminas.length) % laminas.length) === 1 ? "frente" : "tras");
      saindoAgora = laminas[de];
      saindoAgora.classList.add("is-saindo");
      setTimeout(limparSaida, DURACAO);
    }
    laminas.forEach(function (x, j) { x.classList.toggle("active", j === n); });
    if (contador) contador.textContent = (n + 1) + " / " + laminas.length;
    if (comHash) location.hash = "l" + (n + 1);
    ouvintes.forEach(function (cb) { try { cb(n, laminas.length); } catch (e) {} });
    return n;
  }

  document.addEventListener("click", function (e) {
    var mini = e.target.closest("[data-action='ampliar-pagina']");
    if (mini) {
      e.preventDefault();
      abrirPagina(mini.getAttribute("data-src"), mini.getAttribute("data-legenda"));
      return;
    }
    if (capa) return;                    /* com a página aberta, nada navega por baixo */
    if (e.target.closest("[data-next],[data-prox]")) {
      if (!avancar()) ir(atual() + 1);
    }
    if (e.target.closest("[data-prev],[data-ant]")) {
      if (!voltar()) ir(atual() - 1);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.target && (/input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable)) return;
    if (e.key === "Escape" && fecharPagina()) { e.preventDefault(); return; }
    /* Ampliada, a página é o estado da tela: seta não pode trocar a lâmina por baixo
       dela. É o que o registro de dependência pede em letra. */
    if (capa) { if (e.key !== "Tab") e.preventDefault(); return; }
    if (["ArrowRight", "PageDown", " "].indexOf(e.key) >= 0) {
      e.preventDefault();
      if (!avancar()) ir(atual() + 1);
    }
    else if (["ArrowLeft", "PageUp"].indexOf(e.key) >= 0) {
      e.preventDefault();
      if (!voltar()) ir(atual() - 1);
    }
    else if (e.key === "Home") ir(0);
    else if (e.key === "End") ir(laminas.length - 1);
  });

  /* PDF/print precisa conter a explicação completa, não só o estado em que a projeção
     parou. Guardamos o estado, abrimos tudo para imprimir e restauramos depois. */
  window.addEventListener("beforeprint", function () {
    laminas.forEach(function (lamina) {
      elementosReveal(lamina).forEach(function (el) {
        el.setAttribute("data-reveal-print-open", el.classList.contains("is-revealed") ? "1" : "0");
        mostrarReveal(el, true);
      });
    });
  });
  window.addEventListener("afterprint", function () {
    laminas.forEach(function (lamina) {
      elementosReveal(lamina).forEach(function (el) {
        if (el.getAttribute("data-reveal-print-open") === "1") mostrarReveal(el, true);
        else esconderReveal(el);
        el.removeAttribute("data-reveal-print-open");
      });
    });
  });

  /* ============================ ampliar a página do livro ====================== */

  var PAINEL = "/materials/painel_semanal.html";
  var capa = null;

  function estilo() {
    if (document.getElementById("ma-motor-css")) return;
    var st = document.createElement("style");
    st.id = "ma-motor-css";
    st.textContent =
      ".ma-capa{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;gap:1.2vh;padding:2.4vh 2vw;" +
      "background:rgba(12,18,28,.88);cursor:zoom-out}" +
      ".ma-capa img{max-width:94vw;max-height:84vh;object-fit:contain;border-radius:6px;" +
      "background:#fff;box-shadow:0 18px 60px rgba(0,0,0,.45)}" +
      ".ma-capa figcaption{color:#fff;font-size:2.1vh;opacity:.9;text-align:center}" +
      ".ma-capa .ma-fechar{position:absolute;top:2vh;right:2vw;font:inherit;" +
      "font-size:2.1vh;padding:.6em 1.1em;border-radius:.6em;border:0;cursor:pointer;" +
      "background:#fff;color:#172734}" +
      /* Sem `display` aqui de propósito: a peça já diz como a miniatura se arruma
         (`.book-page{display:flex}` no Y9), e um `display` meu — mais específico por
         ser elemento+classe — jogava a legenda para o lado da imagem. Este bloco só
         desfaz a aparência de botão. */
      "button.book-page{font:inherit;color:inherit;background:none;border:0;padding:0;" +
      "cursor:zoom-in;text-align:inherit}" +
      "button.ma-voltar{width:auto;height:auto;min-width:0;min-height:0;" +
      "line-height:1.2;font:inherit;font-size:.92em;padding:.35em .8em;border-radius:.6em;" +
      "cursor:pointer;border:1px solid rgba(23,39,52,.22);" +
      "background:rgba(255,255,255,.92);color:#172734;opacity:.6;" +
      "transition:opacity .15s;margin-right:.6em;white-space:nowrap;flex:0 0 auto}" +
      "button.ma-voltar:hover{opacity:1}" +
      ".ma-voltar-solto{position:fixed;bottom:1.2vh;left:1.2vw;z-index:8000;font-size:1.6vh}" +
      "@media print{.ma-voltar,.ma-capa{display:none!important}}";
    document.head.appendChild(st);
  }

  function fecharPagina() {
    if (!capa) return false;
    capa.remove();
    capa = null;
    document.documentElement.removeAttribute("data-pagina-aberta");
    return true;
  }

  function abrirPagina(src, legenda) {
    if (!src) return false;
    estilo();
    fecharPagina();
    capa = document.createElement("figure");
    capa.className = "ma-capa";
    var img = document.createElement("img");
    img.src = src;
    img.alt = legenda || "";
    capa.appendChild(img);
    if (legenda) {
      var cap = document.createElement("figcaption");
      cap.textContent = legenda;
      capa.appendChild(cap);
    }
    var x = document.createElement("button");
    x.className = "ma-fechar";
    x.type = "button";
    x.textContent = "Fechar";
    capa.appendChild(x);
    capa.addEventListener("click", fecharPagina);
    document.body.appendChild(capa);
    /* O atributo na raiz é o que a folha de estilo e o Modo Aula podem observar sem
       perguntar nada ao motor. */
    document.documentElement.setAttribute("data-pagina-aberta", "1");
    return true;
  }

  /* A miniatura nasce `<a target="_blank">` para funcionar sem JavaScript. Com o motor
     no ar ela vira botão, porque é como botão que o espelhamento do Modo Aula a vê. */
  function promoverMiniaturas() {
    [].slice.call(document.querySelectorAll("a.book-page,a[data-ampliar]")).forEach(
      function (a) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = a.className;
        b.setAttribute("data-action", "ampliar-pagina");
        b.setAttribute("data-src", a.getAttribute("href") || "");
        var img = a.querySelector("img");
        var texto = a.querySelector("span");
        b.setAttribute("data-legenda",
          (img && img.getAttribute("alt")) || (texto && texto.textContent) || "");
        while (a.firstChild) b.appendChild(a.firstChild);
        a.parentNode.replaceChild(b, a);
      });
  }
  promoverMiniaturas();

  /* ============================ sair para o painel ============================= */

  function voltarAoPainel() {
    /* Aberto pelo painel numa aba nova: fechar devolve o professor ao painel que já
       está atrás. Sem `opener` o navegador recusa `close()`, e aí navegamos. */
    if (window.opener && !window.opener.closed) { window.close(); return; }
    if (window.history.length > 1) { window.history.back(); return; }
    window.location.href = PAINEL;
  }

  if (!(document.body && document.body.hasAttribute("data-sem-voltar"))) {
    estilo();
    var sair = document.createElement("button");
    sair.type = "button";
    sair.className = "ma-voltar";
    sair.setAttribute("data-action", "sair-do-deck");
    sair.textContent = "\u2190 painel";
    sair.title = "Fechar as lâminas e voltar ao painel semanal";
    sair.addEventListener("click", voltarAoPainel);
    /* A barra de navegação é a casa natural do botão: é onde a navegação já mora, e lá
       ele não passa por cima de nada. Flutuando no canto ele cobria o cabeçalho do deck
       — apareceu no raster do M01. Sem barra, ele flutua, mas embaixo à esquerda, longe
       do título e das setas. */
    var conta = document.querySelector("[data-conta]");
    var casa = conta && conta.parentNode;
    if (casa) casa.insertBefore(sair, casa.firstChild);
    else { sair.classList.add("ma-voltar-solto"); document.body.appendChild(sair); }
  }

  window.MASlides = {
    total: function () { return laminas.length; },
    atual: atual,
    ir: ir,
    aoMudar: function (cb) { if (typeof cb === "function") ouvintes.push(cb); },
    focusNext: focusNext,
    focusPrev: focusPrev,
    focusReset: focusReset,
    revealNext: revealNext,
    revealPrev: revealPrev,
    revealReset: revealReset,
    abrirPagina: abrirPagina,
    fecharPagina: fecharPagina,
    paginaAberta: function () { return !!capa; },
    voltarAoPainel: voltarAoPainel
  };

  var alvo = comHash ? Number(String(location.hash || "").replace("#l", "")) - 1 : -1;
  ir(alvo >= 0 && alvo < laminas.length ? alvo : 0);
}());
</script>"""