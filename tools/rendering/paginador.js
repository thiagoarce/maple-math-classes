/* paginador.js — monta as páginas da lista NO NAVEGADOR DE QUEM IMPRIME.
 *
 * Por que existe
 * --------------
 * A lista quebrou duas vezes na mão do professor em 28/07: no Safari dele uma questão caiu
 * numa TERCEIRA coluna, fora da folha, embora o verificador tivesse passado limpo no
 * Chrome do sandbox. Não era um bug pontual — era a arquitetura. Todo o pipeline decidia
 * AQUI, na geração, o que ia em cada A4, e métricas de fonte e de MathJax mudam entre
 * renderizadores. Corte cravado offline é aposta no ambiente de quem imprime.
 *
 * A correção não é medir melhor: é medir NO LUGAR CERTO. Este script roda quando o
 * arquivo abre, mede a fonte real, o MathJax real, a largura real, e só então decide onde
 * cada questão vai. Acerta por construção, em qualquer navegador.
 *
 * Melhoria progressiva
 * --------------------
 * Sem JS, o CSS de fluxo contínuo (`@page` + `column-count`) já entrega uma lista
 * CORRETA — só não otimizada. Este script é a camada de cima. Se ele não rodar, nada
 * quebra; só sobra mais papel.
 *
 * O que ele otimiza, na ordem de prioridade que o professor definiu (28/07):
 *   1. caber, com espaço pro aluno resolver;
 *   2. se não couber, otimizar a ORDEM;
 *   3. depois da ordem, o ESPAÇAMENTO — e espaço extra só onde sobra, nunca antes.
 */
(function () {
  "use strict";

  var MM = 3.779528;               // 1mm em px a 96dpi
  var CFG = {
    larguraPagina: 210, alturaPagina: 297,
    margemX: 14, margemTopo: 14, margemPe: 16,
    alturaCabecalhoInterno: 12,    // faixa de identificação das páginas 2+
    gapColunas: 7,
    /* O padding de 22mm do .a4 NÃO limpa a arte do timbre: a faixa laranja/vermelha do
       pé é desenho de fundo e invade o miolo. O padrão do repo cobra 110 a 160px de
       sobra no pé de cada página (preview.py) exatamente por isso. 30mm é o meio dessa
       faixa. Sem esta reserva a última questão fica escrita por cima da faixa. */
    respiroTimbre: 30,
    folgaPx: 6                     // tolerância de arredondamento do navegador
  };

  function mm(v) { return v * MM; }

  function larguraColuna() {          // em mm, dentro do miolo real do .a4
    return (caixaA4().primeira.largura / MM - CFG.gapColunas) / 2;
  }

  /* Altura útil de dentro do .a4, MEDIDA — não estimada.
   *
   * Errei isso e o PDF mostrou na hora: eu calculava a capacidade pelas margens do
   * `@page` (14/16mm) mas desenho dentro do `.a4` do handout_lib, que tem padding próprio
   * de 40mm no topo (32mm nas internas) e 22mm no pé, por causa do timbre. São ~235mm
   * reais contra os 267mm que eu supunha — e o resultado foi uma lista com 11 questões
   * numa página só, com duas delas vazando por baixo do timbre, fora da área imprimível.
   *
   * A régua agora é o próprio .a4: cria um, lê o padding computado e devolve o miolo. Se
   * o padrão mudar o padding um dia, isto acompanha sozinho. */
  var _caixa = null;
  function caixaA4() {
    if (_caixa) return _caixa;
    function medirClasse(cls) {
      var p = document.createElement("div");
      p.className = cls;
      p.style.cssText = "position:absolute;visibility:hidden;left:-9999px;top:0";
      document.body.appendChild(p);
      var cs = getComputedStyle(p);
      var alt = p.getBoundingClientRect().height
              - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      var larg = p.getBoundingClientRect().width
               - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      p.remove();
      return { altura: alt, largura: larg };
    }
    _caixa = { primeira: medirClasse("a4"), interna: medirClasse("a4 inner") };
    return _caixa;
  }

  function alturaUtil(k, alturaTituloPx) {
    var c = caixaA4();
    var respiro = mm(CFG.respiroTimbre);
    return k === 1 ? c.primeira.altura - alturaTituloPx - respiro
                   : c.interna.altura - mm(CFG.alturaCabecalhoInterno) - respiro;
  }

  // ------------------------------------------------------------------ medir ----
  /* Mede cada bloco duas vezes: na largura de uma coluna e na largura cheia. A segunda
   * serve para descobrir quem NÃO cabe em coluna — tabela larga e imagem grande, que o
   * professor apontou como caso real ("quando tem tabela é inviável ser em coluna"). */
  function medir(blocos) {
    var régua = document.createElement("div");
    régua.style.cssText = "position:absolute;visibility:hidden;left:-9999px;top:0";
    document.body.appendChild(régua);

    var out = blocos.map(function (b) {
      var clone = b.cloneNode(true);
      régua.innerHTML = "";
      régua.appendChild(clone);

      régua.style.width = larguraColuna() + "mm";
      var hCol = clone.getBoundingClientRect().height;
      var largoDemais = false;
      // um filho indivisível mais largo que a coluna transborda — não adianta empacotar
      var filhos = clone.querySelectorAll("img, table, svg");
      for (var i = 0; i < filhos.length; i++) {
        if (filhos[i].getBoundingClientRect().width > mm(larguraColuna()) + 2) {
          largoDemais = true;
          break;
        }
      }
      if (clone.scrollWidth > clone.clientWidth + 2) largoDemais = true;

      régua.style.width = (CFG.larguraPagina - 2 * CFG.margemX) + "mm";
      var hCheia = clone.getBoundingClientRect().height;

      return { el: b, hCol: hCol, hCheia: hCheia, cheio: largoDemais,
               aquecimento: b.classList.contains("bex-aquecimento") };
    });

    régua.remove();
    return out;
  }

  // --------------------------------------------------------------- empacotar ----
  /* Distribui os blocos em páginas de duas colunas.
   *
   * Blocos de largura cheia entram como faixa: ocupam a página inteira naquela altura, e
   * as colunas recomeçam abaixo. Por isso o empacotamento é por PÁGINA, não por coluna
   * solta — é o que permite misturar uma coluna e duas na mesma folha, que foi o pedido.
   *
   * A ordem dos blocos normais é reordenada (decrescente por altura, First Fit
   * Decreasing): as maiores primeiro, as menores encaixando nos vãos. O professor liberou a
   * ordem em 28/07 — a progressão de dificuldade sai da ordem e é indicada à parte.
   */
  function empacotar(medidos, alturaTituloPx) {
    /* O aquecimento não entra na otimização: é o bloco que ABRE a lista, sempre primeiro
       na página 1 e sempre em largura cheia (são seis itens em duas colunas próprias —
       espremido numa coluna do miolo ele quebra linha em tudo). */
    var aquece = medidos.filter(function (m) { return m.aquecimento; });
    var resto = medidos.filter(function (m) { return !m.aquecimento; });

    /* ALTO DEMAIS TAMBÉM É "NÃO CABE EM COLUNA" (04/08). A promoção a faixa larga só
     * olhava LARGURA — um filho mais largo que a coluna. Mas as duas listas de
     * Superfícies Espaciais quebraram por ALTURA: são questões do ENEM com cinco e seis
     * imagens (uma por alternativa) que, empilhadas numa coluna de 323px, davam 1663px e
     * 1322px — mais que a página inteira, que tem ~1123px. Nenhum empacotamento resolve
     * um bloco maior que a folha.
     *
     * Em largura cheia as mesmas alternativas se distribuem e a altura despenca. Então a
     * regra passa a ser: não coube em coluna e cabe inteiro na faixa? Vira faixa. */
    var capacidade1 = alturaUtil(1, alturaTituloPx);
    resto.forEach(function (m) {
      if (!m.cheio && m.hCol > capacidade1 && m.hCheia < m.hCol) m.cheio = true;
      // Nem em faixa cabe: o problema é a questão, não a diagramação. Marcada para o
      // checar_listas apontar a causa em vez de reportar um transbordo genérico.
      m.gigante = Math.min(m.hCol, m.cheio ? m.hCheia : m.hCol) > capacidade1;
    });

    var cheios = resto.filter(function (m) { return m.cheio; });
    var normais = resto.filter(function (m) { return !m.cheio; })
                       .sort(function (a, b) { return b.hCol - a.hCol; });

    var paginas = [];
    function novaPagina() {
      var k = paginas.length + 1;
      var p = { faixas: [], colA: [], colB: [], usoA: 0, usoB: 0,
                capacidade: alturaUtil(k, alturaTituloPx) };
      paginas.push(p);
      return p;
    }
    var pg = novaPagina();
    aquece.forEach(function (m) { pg.faixas.push(m); });

    // faixas largas primeiro: elas cortam a página e definem o que sobra pras colunas
    cheios.forEach(function (m) {
      var usado = pg.faixas.reduce(function (s, f) { return s + f.hCheia; }, 0);
      // Faixa que sozinha ocupa quase a folha inteira ganha página própria; misturá-la
      // com outra empurra a segunda para fora, que é o transbordo que apareceu aqui.
      var precisaFolhaPropria = m.hCheia > pg.capacidade * 0.7;
      if (pg.faixas.length && (precisaFolhaPropria
                               || usado + m.hCheia > pg.capacidade * 0.7)) {
        pg = novaPagina();
      }
      pg.faixas.push(m);
      if (precisaFolhaPropria) pg = novaPagina();
    });

    function espaco(p) {
      var gastoFaixas = p.faixas.reduce(function (s, f) { return s + f.hCheia; }, 0);
      return p.capacidade - gastoFaixas;
    }

    normais.forEach(function (m) {
      for (var i = 0; i < paginas.length; i++) {
        var p = paginas[i], lim = espaco(p);
        if (p.usoA + m.hCol <= lim) { p.colA.push(m); p.usoA += m.hCol; return; }
        if (p.usoB + m.hCol <= lim) { p.colB.push(m); p.usoB += m.hCol; return; }
      }
      var novo = novaPagina();
      novo.colA.push(m);
      novo.usoA += m.hCol;
    });

    return paginas;
  }

  /* Equilíbrio entre páginas: com o MESMO número de páginas, o professor não quer "2
   * questões na primeira e 4 na segunda". Move blocos da página mais cheia para a mais
   * vazia enquanto isso reduzir a diferença e nada estourar. */
  function equilibrar(paginas) {
    if (paginas.length < 2) return paginas;
    function carga(p) { return Math.max(p.usoA, p.usoB); }
    for (var passo = 0; passo < 40; passo++) {
      var ord = paginas.slice().sort(function (a, b) { return carga(b) - carga(a); });
      var cheia = ord[0], vazia = ord[ord.length - 1];
      if (carga(cheia) - carga(vazia) < mm(15)) break;
      var doadora = cheia.usoA >= cheia.usoB ? "colA" : "colB";
      if (!cheia[doadora].length) break;
      var m = cheia[doadora][cheia[doadora].length - 1];   // o menor da coluna mais cheia
      var alvo = vazia.usoA <= vazia.usoB ? "colA" : "colB";
      var limite = vazia.capacidade
        - vazia.faixas.reduce(function (s, f) { return s + f.hCheia; }, 0);
      var usoAlvo = alvo === "colA" ? vazia.usoA : vazia.usoB;
      if (usoAlvo + m.hCol > limite) break;
      cheia[doadora].pop();
      if (doadora === "colA") cheia.usoA -= m.hCol; else cheia.usoB -= m.hCol;
      vazia[alvo].push(m);
      if (alvo === "colA") vazia.usoA += m.hCol; else vazia.usoB += m.hCol;
    }
    return paginas;
  }

  /* Equilibra as DUAS colunas de cada página. O empacotamento enche a coluna A até o
   * limite e só então usa a B, o que deixa a B curta e a página torta. Aqui os blocos da
   * página são redistribuídos entre as duas colunas minimizando a diferença de altura. */
  function equilibrarColunas(paginas) {
    paginas.forEach(function (p) {
      var todos = p.colA.concat(p.colB);
      if (todos.length < 2) return;
      todos.sort(function (a, b) { return b.hCol - a.hCol; });
      var limite = p.capacidade
        - p.faixas.reduce(function (s, f) { return s + f.hCheia; }, 0);
      var A = [], B = [], usoA = 0, usoB = 0;
      todos.forEach(function (m) {          // sempre na coluna mais vazia que comporte
        if (usoA <= usoB && usoA + m.hCol <= limite) { A.push(m); usoA += m.hCol; }
        else if (usoB + m.hCol <= limite) { B.push(m); usoB += m.hCol; }
        else if (usoA + m.hCol <= limite) { A.push(m); usoA += m.hCol; }
        else { B.push(m); usoB += m.hCol; }
      });
      p.colA = A; p.colB = B; p.usoA = usoA; p.usoB = usoB;
    });
    return paginas;
  }

  /* Renumera Q1..Qn na ORDEM DE LEITURA depois de tudo posicionado.
   * A reordenação por encaixe embaralha as questões — sem isto a folha sai "Q2, Q3, Q6 /
   * Q5, Q1, Q4", que foi o que o primeiro teste produziu. Ordem de leitura: faixas da
   * página, depois coluna esquerda inteira, depois a direita. */
  function renumerar(paginas) {
    var n = 0;
    paginas.forEach(function (p) {
      p.faixas.concat(p.colA, p.colB).forEach(function (m) {
        // estudo extra e aquecimento não são questão — saíam numerados como se fossem
        if (m.el.classList.contains("bex-extra")) return;
        if (m.el.classList.contains("bex-aquecimento")) return;
        var tag = m.el.querySelector(".tag");
        if (!tag) return;
        n += 1;
        tag.textContent = (n < 10 ? "0" : "") + n;
      });
    });
  }

  /* Espaço de resolução: SÓ onde sobra, e proporcional à sobra daquela coluna.
   * "O espaço adicional pra questão é só se sobrar espaço na página, não antes."
   * Coluna cheia não ganha nada; coluna com um vão grande reparte o vão entre as suas
   * questões. Teto de 45mm para não virar uma caixa vazia gigante. */
  function distribuirSobra(paginas) {
    paginas.forEach(function (p) {
      var limite = p.capacidade
        - p.faixas.reduce(function (s, f) { return s + f.hCheia; }, 0);
      [["colA", "usoA"], ["colB", "usoB"]].forEach(function (par) {
        var col = p[par[0]], uso = p[par[1]];
        if (!col.length) return;
        var sobra = limite - uso;
        if (sobra <= mm(4)) return;
        var porQuestao = Math.min(sobra / col.length, mm(45));
        col.forEach(function (m) {
          m.el.style.paddingBottom = (porQuestao / MM).toFixed(1) + "mm";
        });
      });
    });
  }

  // ---------------------------------------------------------------- desenhar ----
  function desenhar(paginas, topo, rodapeTexto) {
    var wrap = document.querySelector(".fx-wrap") || document.body;
    var n = paginas.length;
    var novo = document.createDocumentFragment();

    paginas.forEach(function (p, idx) {
      var folha = document.createElement("div");
      folha.className = "a4" + (idx ? " inner" : "");

      if (idx === 0 && topo) {
        folha.appendChild(topo);
      } else {
        var slim = document.createElement("div");
        slim.className = "pg-slim";
        slim.innerHTML = rodapeTexto;
        folha.appendChild(slim);
      }

      p.faixas.forEach(function (m) { folha.appendChild(m.el); });

      if (p.colA.length || p.colB.length) {
        var tab = document.createElement("table");
        tab.className = "lay pg-cols";
        var largura = larguraColuna() * MM / caixaA4().primeira.largura * 100;
        var td = function (col) {
          var c = document.createElement("td");
          c.setAttribute("width", largura.toFixed(1) + "%");
          c.style.verticalAlign = "top";
          col.forEach(function (m) { c.appendChild(m.el); });
          return c;
        };
        var tr = document.createElement("tr");
        tr.appendChild(td(p.colA));
        tr.appendChild(td(p.colB));
        var tb = document.createElement("tbody");
        tb.appendChild(tr);
        tab.appendChild(tb);
        folha.appendChild(tab);
      }

      var num = document.createElement("span");
      num.className = "pgnum";
      num.textContent = (idx + 1) + " / " + n;
      folha.appendChild(num);

      novo.appendChild(folha);
    });

    wrap.innerHTML = "";
    wrap.appendChild(novo);
    document.documentElement.setAttribute("data-paginado", n);

    /* Deixa a conta à vista para quem for CURAR a lista depois (curar.py): quanto de cada
       página foi realmente ocupado e quantas questões couberam nela. Sem isso o curador
       teria que remedir por fora, com outra régua — e régua diferente foi a origem de
       todos os defeitos de diagramação desta lista. */
    document.documentElement.setAttribute("data-ocupacao", paginas.map(function (p) {
      var faixas = p.faixas.reduce(function (s, f) { return s + f.hCheia; }, 0);
      var usado = faixas + Math.max(p.usoA, p.usoB);
      return (p.capacidade > 0 ? Math.min(1, usado / p.capacidade) : 1).toFixed(3);
    }).join(","));
    /* Questão que não cabe na folha nem em largura cheia. É defeito de CONTEÚDO — quase
       sempre uma questão de vestibular com uma imagem por alternativa. Publicar aqui faz
       o `checar_listas.py` dizer "a questão 3 é maior que a página" em vez de "transbordou
       400px", que manda procurar no lugar errado. */
    var gigantes = [];
    paginas.forEach(function (p) {
      p.faixas.concat(p.colA, p.colB).forEach(function (m) {
        if (!m.gigante) return;
        var tag = m.el.querySelector(".tag");
        gigantes.push(tag ? tag.textContent.trim() : "?");
      });
    });
    if (gigantes.length) {
      document.documentElement.setAttribute("data-gigantes", gigantes.join(","));
    }
    document.documentElement.setAttribute("data-questoes", paginas.map(function (p) {
      return p.faixas.concat(p.colA, p.colB).filter(function (m) {
        return !m.el.classList.contains("bex-extra")
            && !m.el.classList.contains("bex-aquecimento");
      }).length;
    }).join(","));
  }

  // -------------------------------------------------------------------- main ----
  function paginar() {
    var corpo = document.querySelector(".fx-corpo");
    if (!corpo) return;
    var blocos = Array.prototype.slice.call(
      corpo.querySelectorAll(".bex, .bex-extra, .bex-aquecimento"));
    if (!blocos.length) return;

    var topo = document.querySelector(".fx-topo");
    var alturaTitulo = topo ? topo.getBoundingClientRect().height + mm(4) : 0;
    var rodape = (document.title || "Lista de Exerc&iacute;cios");

    var medidos = medir(blocos);
    var paginas = equilibrarColunas(equilibrar(empacotar(medidos, alturaTitulo)));
    renumerar(paginas);
    distribuirSobra(paginas);
    desenhar(paginas, topo, rodape);
  }

  function quandoPronto() {
    function medirPronto() {
      return (document.fonts ? document.fonts.ready : Promise.resolve()).then(paginar);
    }
    function falha() { document.documentElement.setAttribute("data-paginado", "erro"); }
    if (window.MAMath && typeof MAMath.pronto === "function") {
      MAMath.pronto().then(medirPronto).catch(falha);
    } else {
      falha();
    }
  }

  if (document.readyState === "complete") quandoPronto();
  else window.addEventListener("load", quandoPronto);
})();
