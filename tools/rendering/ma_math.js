/* Matemática das lâminas — uma voz só, composta offline.
 *
 * A regra fechada no laboratório, em `_padrao/fontes/FONTES_MATEMATICAS.md`:
 *
 *     MathJax compõe; Euler fala; Fira Bold enfatiza.
 *
 * Este arquivo é a única coisa que a superfície precisa conhecer. Ela escreve TeX e diz a
 * VOZ; quem sabe que existe MathJax, que a fonte é um pacote separado e que o SVG demora
 * um quadro para existir é este helper.
 *
 * ## Como se usa
 *
 *     <span data-math>x^2 - 5x + 6 = 0</span>              → voz euler (padrão)
 *     <span data-math data-voz="fira-bold">V = \frac{Ab\,h}{3}</span>
 *
 *     MAMath.pronto().then(...)     // ou o evento `ma:math-ready` no document
 *
 * ## Dois modos de entrada, um motor só
 *
 * A lâmina marca cada nó com `data-math`. O HANDOUT não: ele escreve `$…$` no meio do
 * texto, e são 116 geradores fazendo isso há meses. Reescrevê-los para trocar de motor
 * seria mexer no conteúdo de aulas que já aconteceram para resolver um problema de
 * tipografia — troca errada.
 *
 * Então a página que quer delimitadores declara:
 *
 *     <html data-math-delim="$">
 *
 * e o MathJax passa a varrer o documento inteiro por `$…$`, em vez de compor nó a nó.
 * Nada do conteúdo muda; muda só quem compõe, e com qual voz.
 *
 * Cuidado que vem junto: nesse modo o `$` é delimitador de verdade, então `R$ 40,00` sem
 * escape engole o par de cifrões e come o texto entre eles. O `handout_lib.build()` já
 * reprova isso desde 07/2026 (`R\$`), e esse assert passa a valer para as duas
 * superfícies.
 *
 * ## As três decisões que este arquivo carrega
 *
 * **1. Nada de CDN.** O núcleo matemático é vendorizado em `_padrao/mathjax/v4.1.3/`. A
 * lâmina abre por `file://`, no computador dele, com o Wi-Fi da escola — que é a mesma
 * razão do pdf.js e das fontes. O aceite do handoff é explícito: rede desligada e a
 * matemática continua sendo composta.
 *
 * **2. `math-ready` só depois de SVG de verdade.** O primeiro specimen do laboratório
 * gerou TeX cru e mesmo assim se declarou pronto — falso positivo. Aqui a prontidão exige
 * que CADA nó tenha `mjx-container[jax="SVG"]` com um `<svg>` dentro; sobrando `\frac`,
 * `\sqrt` ou `\boldsymbol` cru, isto FALHA em voz alta em vez de deixar passar.
 *
 * **3. Ênfase é voz matemática, não `font-weight`.** `fira-bold` compõe com
 * `\boldsymbol{}`, que é a variante matemática negrito da fonte. Engrossar o traço de um
 * texto não é a mesma coisa e produz um negrito falso, com espaçamento errado.
 *
 * O que este helper NÃO faz: encolher fonte para caber. Overflow se resolve primeiro no
 * layout — a caixa cresce ou reorganiza antes de a tipografia diminuir. Quem mede é o
 * portão, depois do typeset.
 */
(function () {
  "use strict";

  if (window.MAMath) return;

  var VOZES = { "euler": true, "fira-bold": true };
  var raiz = null;          // caminho até `_padrao/mathjax/v4.1.3`
  var promessa = null;

  /* Onde ESTE script mora, para achar o irmão `mathjax/`. Vale por `file://` também.
   *
   * Resolvido AGORA, na avaliação do arquivo, e não na primeira chamada — este é o único
   * instante em que `document.currentScript` é garantidamente este script.
   *
   * A versão anterior resolvia tarde, e o defeito só apareceu quando outra superfície
   * passou a chamar `MAMath.pronto()` de dentro do próprio script: em 07/09 as ativações
   * chamaram de `ativacao.js`, `currentScript` era `ativacao.js`, e o motor foi buscar
   * `.../ativacoes/ativacao.jsmathjax/v4.1.3/...` — 404, `data-math-ready="erro"` e a
   * página inteira sem matemática. A varredura por `src` só corrigia o caso em que
   * `currentScript` é NULO, não o caso em que ele é OUTRO script. */
  var RAIZ_DO_SCRIPT = (function () {
    var meu = document.currentScript;
    if (!meu || !/ma_math\.js/.test(meu.src || "")) {
      var todos = document.getElementsByTagName("script");
      for (var i = todos.length - 1; i >= 0; i--) {
        if (/ma_math\.js/.test(todos[i].src || "")) { meu = todos[i]; break; }
      }
    }
    return ((meu && meu.src) || "").replace(/ma_math\.js.*$/, "") + "mathjax/v4.1.3/";
  })();

  function base() {
    if (raiz) return raiz;
    raiz = RAIZ_DO_SCRIPT;
    return raiz;
  }

  function tex(el) {
    var bruto = el.getAttribute("data-math");
    var corpo = bruto && bruto.trim() ? bruto : el.textContent;
    corpo = String(corpo || "").trim();
    var voz = el.getAttribute("data-voz") || "euler";
    if (!VOZES[voz]) voz = "euler";
    /* `\boldsymbol` é a variante MATEMÁTICA negrito; `font-weight` não serve. */
    return voz === "fira-bold" ? "\\boldsymbol{" + corpo + "}" : corpo;
  }

  /* A página pediu modo delimitador? (`<html data-math-delim="$">`) */
  function delim() {
    return document.documentElement.hasAttribute("data-math-delim");
  }

  function alvos() {
    return Array.prototype.slice.call(document.querySelectorAll("[data-math]"));
  }

  /* No modo delimitador quem responde pela prontidão é o resultado: cada container que o
     MathJax criou. Sem isto a checagem não teria o que olhar — não existe `[data-math]`
     nenhum na folha — e o `math-ready` diria OK para uma página onde o motor não rodou. */
  function containers() {
    return Array.prototype.slice.call(document.querySelectorAll('mjx-container[jax="SVG"]'))
      .map(function (c) { return c.parentNode || c; });
  }

  /* Um nó só está composto quando existe SVG de verdade dentro dele E esse SVG não é uma
     mensagem de erro.
     
     A segunda metade custou um falso positivo em 23/08: faltava a extensão `boldsymbol`,
     o MathJax compôs a frase *"Extension \"boldsymbol\" failed to load"* como SVG
     perfeitamente válido, e esta função disse REAL SVG READY para três blocos — um deles
     sendo o erro, em vermelho, no meio da lâmina. Container existia, SVG existia, TeX cru
     não sobrava. O que faltava era perguntar se o SVG DIZ alguma coisa boa.
     
     Erro do MathJax vem marcado com `mjx-merror`. É a única pergunta que separa
     "composto" de "composto um aviso de fracasso". */
  function composto(el) {
    var c = el.querySelector('mjx-container[jax="SVG"]');
    if (!c || !c.querySelector("svg")) return false;
    return !c.querySelector("mjx-merror, [data-mjx-error]");
  }

  /* TeX que sobrou. Duas formas, e a segunda me pegou em 23/08:
     
     1. COM a barra — `\frac`, `\sqrt`: o MathJax não processou o nó;
     2. SEM a barra — `frac`, `tfrac`, `left`, `right`: a barra se perdeu ANTES, na
        geração do HTML. Aí o MathJax compõe as palavras como texto, sem erro nenhum,
        e a lâmina mostra "left (tfrac62 right)² 9" achando que está tudo bem. Foi o que
        aconteceu num specimen meu, e o `math-ready` disse OK.
     
     Dentro de um nó de matemática essas palavras nunca são texto legítimo — ninguém
     escreve "left" em português no meio de uma equação. Procurar as duas formas é o que
     separa "composto" de "composto lixo". */
  var PALAVRAS_TEX = /(^|[^a-zA-Z])(frac|tfrac|dfrac|sqrt|boldsymbol|begin|end|left|right|cdot|quad|qquad|text)([^a-zA-Z]|$)/;
  function cru(el) {
    var t = el.textContent || "";
    if (/\\(frac|sqrt|boldsymbol|begin|left|right|sum|int)\b/.test(t)) return true;
    return PALAVRAS_TEX.test(t);
  }

  function configurar() {
    window.MathJax = {
      loader: {
        load: ["[mathjax-euler-extension]/svg", "[tex]/boldsymbol"],
        /* `[tex]` aponta para as extensões TeX vendorizadas. Sem isto o `\boldsymbol` da
           voz de ênfase tenta buscar a extensão e falha — e o MathJax compõe a MENSAGEM
           DE ERRO como SVG válido, que foi o falso positivo de 23/08. */
        /* `mathjax-fira` é o caminho das peças DINÂMICAS da fonte. O bundle traz o
           essencial embutido e busca o resto sob demanda — `math-other`, `arrows`,
           `calligraphic` e afins. Sem declarar isto, ele vai ao `cdn.jsdelivr.net` no
           meio da aula. Medido em 23/08 com a rede bloqueada: um pedido externo escapou,
           justamente o que o critério de aceite proíbe. */
        paths: {
          "mathjax-euler-extension": base() + "euler",
          "mathjax-fira": base() + "fira",
          "tex": base() + "tex-extensions"
        }
      },
      tex: Object.assign(
        delim()
          ? { inlineMath: [["$", "$"]], displayMath: [["$$", "$$"], ["\\[", "\\]"]],
              processEscapes: true }
          : { inlineMath: [], displayMath: [], processEscapes: false },
        /* Notação portuguesa. `\\tg`, `\\sen`, `\\cotg`, `\\cossec` e `\\arctg` não
           existem no TeX padrão: sem estas macros o MathJax compõe o comando cru em
           VERMELHO no meio da fórmula, e a folha parece quebrada. Apareceu em 31/08 na
           entrada de 20/10 do Y10 ("1 + \\tg^2 x = \\sec^2 x"). `\\operatorname`
           mantém a letra reta e o espaçamento de função, igual a `\\sen` do original. */
        { macros: {
            sen: ["\\operatorname{sen}", 0],
            tg: ["\\operatorname{tg}", 0],
            cotg: ["\\operatorname{cotg}", 0],
            cossec: ["\\operatorname{cossec}", 0],
            arctg: ["\\operatorname{arctg}", 0]
        } }),
      /* `font` diz à extensão Euler QUAL fonte ela estende. Sem isto ela assume
         `mathjax-newcm` e avisa "The required mathjax-newcm SVG font can't be found" —
         e a promessa de startup nunca resolve, com a lâmina presa em "compondo…".
         Medido em 23/08; o handoff dava a combinação Fira+Euler como validada, mas o
         emparelhamento só fecha declarando a base aqui. */
      svg: { font: "mathjax-fira", fontCache: "global",
             displayAlign: "left", displayIndent: "0",
             /* `<html data-math-inteira>`: sem quebra automática dentro da fórmula em
                linha. Os listões pedem (25/09): "|x|" numa linha e "< 1" na seguinte. */
             linebreaks: { inline: !document.documentElement.hasAttribute("data-math-inteira") } },
      /* `attachSpeech: []` remove a ação de render que sobe o `speech-worker`. O
         MathJax 4 gera descrição de leitor de tela num Web Worker do pacote `sre/`
         (4,6 MB) que eu não vendorizei: por `file://` ele falha, e a promessa de startup
         NUNCA resolve — a lâmina fica presa em "compondo…" para sempre. Desligar a ação
         é melhor que vendorizar 4,6 MB de fala para uma superfície projetada.
         Se um dia a acessibilidade da lâmina importar, vendorizar `sre/` e tirar isto. */
      /* `ignoreHtmlClass` é o default do MathJax, mas declarado aqui ele deixa de ser
         suposição: `<span class="tex2jax-ignora">` marca texto que NÃO é fórmula. Existe
         por causa do cifrão de moeda — `R$ 107,50 … R$ 185,00` é um par de delimitadores,
         e o enunciado entre os dois some. O `\\$` resolvia a leitura, mas compunha o
         cifrão em fonte matemática, com espaço de operador: na tela saía `R  $  19,00`. */
      options: { enableMenu: false, renderActions: { attachSpeech: [] },
                 ignoreHtmlClass: "tex2jax-ignora", processHtmlClass: "tex2jax-processa" },
      startup: { typeset: false }
    };
  }

  /* ============================================================
     O menos, e por que ele precisa de remendo
     ============================================================
     Investigado em 24/08, depois de ele apontar a diferença nas equações complexas.

     A extensão Euler (`@mathjax/mathjax-euler-font-extension`) define **365** pontos de
     código — letras, algarismos, `(`, `+`, `=`, `Σ`, `∫`, e até o hífen U+002D. Ela **não**
     define o **menos matemático U+2212**. E é justamente esse que aparece: a entrada TeX
     converte todo `-` de modo matemático em U+2212.

     Resultado: numa página inteira em Euler, todo sinal de menos caía na fonte BASE, que
     aqui é a Fira. A Fira é sans-serif e o traço dela é curto — lê como hífen. Numa
     inequação passa; numa matriz cheia de negativos (`ad − bc`, `−b`, `−c`) destoa.

     Não é configuração errada nossa: é lacuna do pacote. O `svg:{font:"mathjax-fira"}`
     continua certo e necessário — sem declarar a base, a extensão procura `mathjax-newcm`,
     que não está vendorizado, e a lâmina trava em "compondo…".

     O conserto usa o que já está aqui: a **Euler-Math.otf** vendorizada em `_padrao/fontes/`
     TEM o glifo (`minus`, largura 756/1000). O caminho abaixo é o mesmo que a própria
     extensão usa — `addExtension`, com o glifo no formato `[altura, profundidade, largura,
     {p: path}]`, em unidades de em e coordenadas de 1000 por em.

     Só o menos entra. A raiz (U+221A) também falta e também foi medida, mas radical tem
     máquina de esticamento e variantes no MathJax; trocá-lo é outra investigação, e trocar
     por metade seria pior que não trocar. Fica registrado, não feito. */
  var GLIFOS_QUE_FALTAM = {
    /* U+2212, extraído da Euler-Math.otf com fontTools: bbox (46,230)-(710,270),
       avanço 756. A barra é levemente inclinada, como a da Euler de verdade. */
    /* SEM o `M` inicial e SEM o `Z` final: o MathJax embrulha o caminho ele mesmo. Com
       eles, o `d` sai `MM46 230…ZZ`, que não é caminho SVG válido — visto no DOM antes de
       consertar, e é o tipo de erro que não levanta exceção nenhuma: o navegador
       simplesmente não desenha. */
    8722: [0.27, 0, 0.756, { p: "46 230H704L710 270H53" }],
    /* `<=` e `>=` (U+2264/U+2265), pedidos por ele em 24/08. Aparecem o tempo todo no
       currículo de Y9 e Y10 — a unidade inteira de inequações vive deles —, e tinham o
       mesmo defeito do menos: a extensão Euler não os define, então saíam em Fira.
       Dois contornos cada (o traço da desigualdade e a barra de baixo), e com profundidade
       abaixo da linha de base, ao contrário do menos. */
    8804: [0.649, 0.149, 0.8, { p: "100 360 676 94C689 88 701 83 706 83C719 83 724 97 724 110C724 120 709 125 700 129L196 361V370L700 605C709 609 724 612 724 623C724 636 720 649 707 649C702 649 689 644 676 638L100 372ZM124 124C124 114 139 109 148 105L676 -138C689 -144 701 -149 706 -149C719 -149 724 -135 724 -122C724 -112 709 -107 700 -103L172 140C159 146 147 151 142 151C129 151 124 137 124 124" }],  /* ≤ */
    8805: [0.649, 0.149, 0.8, { p: "100 110C100 97 105 83 118 83C123 83 135 88 148 94L724 360V372L148 638C135 644 122 649 117 649C104 649 100 636 100 623C100 612 115 609 124 605L628 370V361L124 129C115 125 100 120 100 110ZM100 -122C100 -135 105 -149 118 -149C123 -149 135 -144 148 -138L676 105C685 109 700 114 700 124C700 137 695 151 682 151C677 151 665 146 652 140L124 -103C115 -107 100 -112 100 -122" }],  /* ≥ */
  };

  function remendarGlifos() {
    try {
      var jax = window.MathJax && window.MathJax.startup &&
                window.MathJax.startup.document &&
                window.MathJax.startup.document.outputJax;
      if (!jax || !jax.font || typeof jax.font.addExtension !== "function") return false;
      jax.font.addExtension({ name: "ma-euler-faltantes",
                              chars: { normal: GLIFOS_QUE_FALTAM } });
      return true;
    } catch (e) {
      /* Um glifo faltando é feio; uma lâmina que não abre é fatal. Se o formato interno
         mudar numa versão futura, o menos volta a ser o da Fira e a aula acontece. */
      return false;
    }
  }

  function carregar() {
    return new Promise(function (ok, falha) {
      var s = document.createElement("script");
      s.src = base() + "fira/tex-mml-svg-mathjax-fira.js";
      s.async = true;
      s.onerror = function () {
        falha(new Error("motor matemático não carregou: " + s.src));
      };
      s.onload = function () {
        var espera = window.MathJax && window.MathJax.startup && window.MathJax.startup.promise;
        (espera || Promise.resolve()).then(function () { remendarGlifos(); ok(); }, falha);
      };
      document.head.appendChild(s);
    });
  }

  /* O texto que o aluno de fato enxerga: tudo menos o que mora dentro de `<script>` e
     `<style>`, que o navegador não desenha e o MathJax, com razão, não visita. */
  function textoVisivel() {
    var passo = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (no) {
        var pai = no.parentNode;
        while (pai && pai !== document.body) {
          var tag = pai.nodeName;
          if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
          pai = pai.parentNode;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var partes = [], no;
    while ((no = passo.nextNode())) partes.push(no.nodeValue);
    return partes.join("");
  }

  /* Modo delimitador: o MathJax varre a página inteira, e a conferência é feita sobre o
     que ele produziu. A mesma pergunta dos dois lados — existe SVG, e o SVG não é um
     aviso de fracasso? */
  function comporDocumento() {
    return window.MathJax.typesetPromise().then(function () {
      var feitos = containers();
      var falhos = feitos.filter(function (el) { return !composto(el); });
      /* TeX cru aqui é o delimitador que sobrou na tela: `$\frac{1}{2}$` visível como
         texto significa que o motor não passou por ali.
         
         `textContent` do body inclui o que está DENTRO de `<script>`, e isso deu um falso
         negativo em 14/09: a abertura do Y10 carrega as entradas do Caderno num ilhote
         `<script type="application/json">`, com `\sqrt` lá dentro. A matemática da página
         estava composta — 270 SVGs, nada de cifrão na tela — e mesmo assim o
         `math-ready` virou `erro`, porque a varredura leu o JSON. O que interessa é o
         texto QUE APARECE; então a varredura passou a pular script e style. */
      var sobrou = textoVisivel().match(
        /\$[^$\n]*\\(?:frac|sqrt|boldsymbol|left|right|begin)/);
      if (falhos.length || sobrou) {
        throw new Error("matemática não composta: " + falhos.length +
          " container(es) com erro" + (sobrou ? ", e TeX cru na página: " + sobrou[0] : ""));
      }
      return { nos: feitos.length, modo: "delimitador" };
    });
  }

  function compor() {
    if (delim()) return comporDocumento();
    var lista = alvos();
    if (!lista.length) return Promise.resolve({ nos: 0 });
    lista.forEach(function (el) {
      el.setAttribute("data-math-tex", tex(el));
    });
    var jobs = lista.map(function (el) {
      return window.MathJax.tex2svgPromise(el.getAttribute("data-math-tex"), {
        display: el.hasAttribute("data-display")
      }).then(function (no) {
        el.textContent = "";
        el.appendChild(no);
      });
    });
    return Promise.all(jobs).then(function () {
      return window.MathJax.startup.document.updateDocument
        ? window.MathJax.startup.document.updateDocument()
        : null;
    }).then(function () {
      var falhos = lista.filter(function (el) { return !composto(el) || cru(el); });
      if (falhos.length) {
        throw new Error("matemática não composta em " + falhos.length + " nó(s) " +
          "(SVG ausente, TeX cru ou erro do MathJax): " +
          falhos.slice(0, 2).map(function (e) {
            return (e.getAttribute("data-math-tex") || "").slice(0, 40);
          }).join(" | "));
      }
      return { nos: lista.length };
    });
  }

  function anunciar(estado, detalhe) {
    document.documentElement.setAttribute("data-math-ready", estado);
    document.dispatchEvent(new CustomEvent("ma:math-ready", { detail: detalhe }));
  }

  function pronto() {
    if (promessa) return promessa;
    configurar();
    promessa = carregar()
      .then(compor)
      .then(function (r) { anunciar("ok", r); return r; })
      .catch(function (erro) {
        anunciar("erro", { erro: String(erro && erro.message || erro) });
        throw erro;
      });
    return promessa;
  }

  /* Recompor UM nó com TeX novo, depois que a página já compôs.
   *
   * As ativações projetadas (`_padrao/ativacoes/`) mostram expressões que mudam enquanto
   * o professor arrasta: `y = 2|x+2| + 3`, `-2 + 2i`, `2\sqrt{2}`. Antes disto elas
   * escreviam a expressão como TEXTO na fonte da interface, e o professor viu na hora:
   * *"essas equações dinâmicas não combinam com a nossa fonte matemática né?"* — não
   * combinavam mesmo, eram um quinto dialeto ao lado do handout e da lâmina.
   *
   * O caminho errado seria a ativação aprender a chamar MathJax. Quem sabe que existe
   * MathJax é este arquivo; a superfície escreve TeX e diz a voz. Então a capacidade
   * mora aqui.
   *
   * Síncrono de propósito: é chamado de dentro de um `pointermove`, e uma promessa por
   * quadro produziria lâminas fora de ordem quando duas resolvessem trocadas.
   *
   * Devolve `true` se compôs. Antes de o motor estar pronto devolve `false` e deixa o
   * texto como está — a página chama de novo quando `pronto()` resolver. */
  function recompor(el, texto, voz) {
    if (!el) return false;
    if (!window.MathJax || !window.MathJax.tex2svg) return false;
    var corpo = String(texto == null ? "" : texto).trim();
    if (el.getAttribute("data-math-tex") === corpo) return true;   // nada mudou
    var v = VOZES[voz] ? voz : "euler";
    var no;
    /* Sem quebra automática de linha AQUI, e só aqui.
     *
     * O MathJax 4 quebra matemática em linha por conta própria quando ela não cabe
     * (`linebreaks.inline`, ligado por padrão). Numa ativação isso produziu
     * `(x − 2)² + (y + 1)² > 4` partido em TRÊS `<svg>` empilhados, com o "> 4" numa
     * segunda linha — lido como duas sentenças. E enganou a medida: o container passou a
     * caber na caixa justamente porque quebrou, então a conferência de largura dizia que
     * estava tudo bem.
     *
     * Aqui a resposta certa para "não cabe" é encolher (`Ativacao.caber`), não quebrar.
     * A opção é restaurada logo depois porque o HANDOUT usa o mesmo motor e tem 116
     * geradores que nunca foram medidos sem quebra — mudar o padrão global deles seria
     * uma decisão de outra superfície, tomada de carona. */
    var saida = window.MathJax.startup && window.MathJax.startup.output;
    var quebrava = saida && saida.options && saida.options.linebreaks
      ? saida.options.linebreaks.inline : null;
    try {
      if (quebrava !== null) saida.options.linebreaks.inline = false;
      no = window.MathJax.tex2svg(v === "fira-bold" ? "\\boldsymbol{" + corpo + "}" : corpo,
                                  { display: false });
    } catch (erro) {
      return false;
    } finally {
      if (quebrava !== null) saida.options.linebreaks.inline = quebrava;
    }
    el.textContent = "";
    el.appendChild(no);
    /* O passo que faltava, e que custou uma lâmina INVISÍVEL.
     *
     * A saída SVG está configurada com `fontCache:"global"`: cada glifo é desenhado uma
     * vez num cache compartilhado e as fórmulas o referenciam por `<use href="#MJX-…">`.
     * `tex2svg` cria as referências mas NÃO publica o cache — quem publica é
     * `updateDocument()`, que o caminho normal (`compor`) já chamava e este não.
     *
     * O efeito medido em 07/09: três `<use>`, os três apontando para nada, zero `<path>`.
     * A caixa tinha largura, o container existia, o portão dizia "composto" — e na tela
     * aparecia só o traço da fração. Foi o raster que mostrou; nenhuma medida de DOM
     * teria mostrado, porque tudo o que elas perguntavam estava lá.
     *
     * Por isso `composto()` não basta como resposta, e o portão das ativações passou a
     * exigir que TODA referência resolva. */
    if (window.MathJax.startup && window.MathJax.startup.document &&
        window.MathJax.startup.document.updateDocument) {
      window.MathJax.startup.document.updateDocument();
    }
    el.setAttribute("data-math-tex", corpo);
    return composto(el) && !cru(el);
  }

  window.MAMath = { pronto: pronto, recompor: recompor, VOZES: Object.keys(VOZES),
                    base: base, composto: composto };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { pronto().catch(function () {}); });
  } else {
    pronto().catch(function () {});
  }
})();
