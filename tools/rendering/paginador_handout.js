/* Paginador de handouts no navegador: preserva a ordem dos blocos, mede a folha real, agrupa títulos e caixas de trabalho e preserva o limite original de páginas. */
(function () {
  "use strict";

  var MM = 3.779528;
  var FOLGA = 6;          // tolerância de arredondamento do navegador, em px

  /* Consultar o contrato de paginação no README. */
  var RESPIRO = 12 * 3.779528;

  /* Blocos que NÃO são conteúdo: são a mobília da página, redesenhada a cada folha. */
  var MOBILIA = /^(hd-title|hd-sub|hd-meta|pgnum)$/;

  /* Um título de seção sozinho no pé da página é o defeito clássico de paginação
     automática: o aluno vira a folha para descobrir do que a seção falava. Ele gruda no
     que vem depois. */
  function ehTitulo(el) {
    return /(^|\s)sec(\s|$)/.test(el.className || "");
  }

  /* A caixa de trabalho (`wb`) responde ao bloco imediatamente anterior. Separá-los põe
     o enunciado numa folha e a linha de resposta na outra. */
  function ehTrabalho(el) {
    return /(^|\s)(wb|fm-fill)(\s|$)/.test(el.className || "");
  }

  function ehEspacoElastico(el) {
    return /(^|\s)(wb)(\s|$)/.test(el.className || "");
  }

  /* Altura útil: medida dentro de um `.a4` de verdade, não estimada a partir do @page.
   * O `.a4` do handout_lib tem padding próprio (40mm no topo da primeira, 32mm nas
   * internas, 22mm no pé) por causa do timbre — estimar aqui foi o erro que, no
   * paginador das listas, produziu uma página com duas questões por baixo do timbre. */
  function medirCaixa(modelo) {
    var st = getComputedStyle(modelo);
    var r = modelo.getBoundingClientRect();
    return {
      largura: r.width - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight),
      altura: r.height - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom)
    };
  }

  function coletar() {
    var paginas = Array.prototype.slice.call(document.querySelectorAll(".a4"));
    if (!paginas.length) return null;
    var blocos = [];
    paginas.forEach(function (p) {
      Array.prototype.slice.call(p.children).forEach(function (el) {
        var c = (el.className || "").split(/\s+/)[0];
        if (MOBILIA.test(c) || el.tagName === "SPAN") return;
        blocos.push(el);
      });
    });
    paginas.forEach(function (p) {
      p.__ordem = Array.prototype.slice.call(p.children);
    });
    return { paginas: paginas, blocos: blocos };
  }

  /* Agrupa em UNIDADES INDIVISÍVEIS, preservando a ordem. Uma unidade é
     [título de seção]* + bloco + [caixa de trabalho]*. */
  function agrupar(blocos) {
    var grupos = [];
    var atual = null;
    blocos.forEach(function (el) {
      if (ehTitulo(el)) {
        // título abre uma unidade nova e espera o conteúdo dela
        atual = { els: [el], aberta: true };
        grupos.push(atual);
        return;
      }
      if (ehTrabalho(el) && atual && !atual.aberta) {
        atual.els.push(el);
        return;
      }
      if (atual && atual.aberta) {
        atual.els.push(el);
        atual.aberta = false;
        return;
      }
      atual = { els: [el], aberta: false };
      grupos.push(atual);
    });
    return grupos;
  }

  /* Consultar o contrato de paginação no README. */
  /* Consultar o contrato de paginação no README. */
  function medirGrupos(grupos, folha) {
    var alturaOriginal = folha.style.height;
    var minOriginal = folha.style.minHeight;
    folha.style.height = "auto";
    folha.style.minHeight = "0";
    while (folha.firstChild) folha.removeChild(folha.firstChild);

    var marcas = [];
    grupos.forEach(function (g) {
      var marca = document.createElement("div");
      marca.style.cssText = "height:0;margin:0;padding:0;border:0";
      folha.appendChild(marca);
      marcas.push(marca);
      g.els.forEach(function (el) { folha.appendChild(el); });
    });
    var fim = document.createElement("div");
    fim.style.cssText = "height:0;margin:0;padding:0;border:0";
    folha.appendChild(fim);

    var base = folha.getBoundingClientRect().top;
    var topos = marcas.map(function (m) { return m.getBoundingClientRect().top - base; });
    topos.push(fim.getBoundingClientRect().top - base);
    grupos.forEach(function (g, i) { g.altura = topos[i + 1] - topos[i]; });

    marcas.forEach(function (m) { m.remove(); });
    fim.remove();
    folha.style.height = alturaOriginal;
    folha.style.minHeight = minOriginal;
  }

  function capacidadeDe(indicePagina, capP, capI) {
    return indicePagina === 0 ? capP : capI;
  }

  /* Quantas folhas, no mínimo, mantendo a ordem: guloso, o próximo grupo entra se couber.
     Nenhum rearranjo reduz esse número quando a ordem é fixa. */
  function minimoDePaginas(grupos, capP, capI) {
    var n = 1, uso = 0;
    for (var i = 0; i < grupos.length; i++) {
      var cap = capacidadeDe(n - 1, capP, capI);
      if (uso && uso + grupos[i].altura > cap + FOLGA) { n += 1; uso = 0; }
      uso += grupos[i].altura;
    }
    return n;
  }

  /* Consultar o contrato de paginação no README. */
  function empacotar(grupos, capP, capI) {
    var N = minimoDePaginas(grupos, capP, capI);
    var G = grupos.length;
    var INF = Infinity;
    // custo[i][p] = melhor penalidade cortando os grupos [i..G) em p folhas
    var memo = [];
    var corte = [];
    for (var i = 0; i <= G; i++) { memo.push([]); corte.push([]); }

    function resolver(i, p, folha) {
      if (i === G) return p === 0 ? 0 : INF;
      if (p === 0) return INF;
      if (memo[i][p] !== undefined) return memo[i][p];
      var cap = capacidadeDe(folha, capP, capI);
      var uso = 0, melhor = INF, melhorJ = -1;
      for (var j = i; j < G; j++) {
        uso += grupos[j].altura;
        // um grupo maior que a folha inteira entra sozinho — não há corte possível
        if (uso > cap + FOLGA && j > i) break;
        var ultima = (p === 1);
        var penal = ultima ? 0 : Math.pow(Math.max(0, cap - uso), 2);
        var resto = resolver(j + 1, p - 1, folha + 1);
        if (resto === INF) continue;
        if (penal + resto < melhor) { melhor = penal + resto; melhorJ = j; }
        if (ultima && j + 1 === G) break;
      }
      memo[i][p] = melhor;
      corte[i][p] = melhorJ;
      return melhor;
    }

    // Se o equilíbrio não fechar em N folhas (grupo gigante, por exemplo), cai no guloso:
    // pior diagramação, mas nunca conteúdo perdido.
    var paginas = [];
    if (resolver(0, N, 0) === INF) {
      var atual = { grupos: [], uso: 0, capacidade: capP };
      paginas.push(atual);
      grupos.forEach(function (g) {
        if (atual.grupos.length && atual.uso + g.altura > atual.capacidade + FOLGA) {
          atual = { grupos: [], uso: 0, capacidade: capI };
          paginas.push(atual);
        }
        atual.grupos.push(g);
        atual.uso += g.altura;
      });
      return paginas;
    }
    var idx = 0, restam = N, folha = 0;
    while (restam > 0 && idx < G) {
      var fim = corte[idx][restam];
      var p = { grupos: grupos.slice(idx, fim + 1), uso: 0,
                capacidade: capacidadeDe(folha, capP, capI) };
      p.grupos.forEach(function (g) { p.uso += g.altura; });
      paginas.push(p);
      idx = fim + 1;
      restam -= 1;
      folha += 1;
    }
    return paginas;
  }

  /* A sobra vira ESPAÇO PARA ESCREVER, não branco no pé.
   *
   * "Tudo que gasta espaço tem que ter espaço usado" é o mesmo princípio que ele aplicou
   * ao tempo da aula. Numa página com caixas de trabalho, a sobra cresce as caixas — o
   * aluno recebe linha a mais para resolver. Numa página sem caixa nenhuma (só teoria),
   * a sobra fica onde está: esticar parágrafo não ajuda ninguém. */
  function distribuirSobra(paginas) {
    paginas.forEach(function (p) {
      var sobra = p.capacidade - p.uso;
      if (sobra < 10) return;
      var caixas = [];
      p.grupos.forEach(function (g) {
        g.els.forEach(function (el) { if (ehEspacoElastico(el)) caixas.push(el); });
      });
      if (!caixas.length) return;
      // teto por caixa: 40mm. Caixa de 15 linhas não ajuda; vira página vazia com borda.
      var porCaixa = Math.min(sobra / caixas.length, 40 * MM);
      caixas.forEach(function (el) {
        var atual = el.getBoundingClientRect().height;
        el.style.minHeight = ((atual + porCaixa) / MM).toFixed(1) + "mm";
      });
    });
  }

  /* A mobília tem que ser copiada ANTES da medição.
     `medirGrupos` esvazia a primeira folha para usá-la de régua; ler o cabeçalho dela
     depois disso devolve nada, e a página 1 saiu sem título — o handout começava
     direto na Diagnóstica. */
  function guardarMobilia(pagina) {
    var out = [];
    Array.prototype.slice.call(pagina.children).forEach(function (el) {
      var c = (el.className || "").split(/\s+/)[0];
      if (MOBILIA.test(c) && c !== "pgnum") out.push(el.cloneNode(true));
    });
    return out;
  }

  function desenhar(paginas, modeloPrimeira, modeloInterna, antigas) {
    var pai = antigas[0].parentNode;
    var frag = document.createDocumentFragment();
    paginas.forEach(function (p, i) {
      var molde = i === 0 ? modeloPrimeira : modeloInterna;
      var folha = document.createElement("div");
      folha.className = molde.classe;
      molde.mobilia.forEach(function (el) { folha.appendChild(el.cloneNode(true)); });
      p.grupos.forEach(function (g) {
        g.els.forEach(function (el) { folha.appendChild(el); });
      });
      var num = document.createElement("span");
      num.className = "pgnum";
      num.textContent = (i + 1) + " / " + paginas.length;
      folha.appendChild(num);
      frag.appendChild(folha);
    });
    antigas.forEach(function (p) { p.remove(); });
    pai.appendChild(frag);
    document.documentElement.setAttribute("data-paginado", "handout");
    document.documentElement.setAttribute("data-paginas", String(paginas.length));
    return Array.prototype.slice.call(pai.querySelectorAll(".a4"));
  }

  /* A sobra REAL, medida na folha já montada — não a estimada no empacotamento.
   *
   * Existe porque a estimativa é feita numa régua fora da página e nenhuma régua é
   * perfeita: a primeira versão errava 13% para mais. O que o verificador (e eu) precisa
   * saber não é o que o algoritmo achou que ia caber, é o que coube. Negativo aqui
   * significa conteúdo por baixo do timbre, e é o único número que importa. */
  function publicarSobras(folhas) {
    var sobras = folhas.map(function (p) {
      return Math.round(p.clientHeight - p.scrollHeight);
    });
    document.documentElement.setAttribute("data-sobra", sobras.join(","));
    if (sobras.some(function (s) { return s < 0; })) {
      document.documentElement.setAttribute("data-estouro", "1");
    }
  }

  /* Desfaz a medição: a folha 1 foi esvaziada para servir de régua, então os blocos
     precisam voltar para onde estavam. Sem isto, desistir de paginar deixaria o handout
     inteiro empilhado na primeira página — pior que o defeito que se tentava corrigir. */
  function restaurar(paginas, grupos) {
    var i = 0;
    paginas.forEach(function (p) {
      p.__ordem.forEach(function (el) { p.appendChild(el); });
    });
    void i;
  }


  function paginar() {
    var col = coletar();
    if (!col || col.blocos.length < 2) return;
    var primeira = col.paginas[0];
    var interna = col.paginas[1] || col.paginas[0];

    var caixaP = medirCaixa(primeira);
    var caixaI = medirCaixa(interna);

    // A mobília ocupa altura na folha e tem que sair da capacidade, senão a primeira
    // página recebe conteúdo demais — o cabeçalho completo dela é alto.
    function alturaMobilia(pagina) {
      var h = 0;
      Array.prototype.slice.call(pagina.children).forEach(function (el) {
        var c = (el.className || "").split(/\s+/)[0];
        if (MOBILIA.test(c) && c !== "pgnum") {
          var r = el.getBoundingClientRect();
          var st = getComputedStyle(el);
          h += r.height + parseFloat(st.marginTop || 0) + parseFloat(st.marginBottom || 0);
        }
      });
      return h;
    }

    var capP = caixaP.altura - alturaMobilia(primeira) - RESPIRO;
    var capI = caixaI.altura - alturaMobilia(interna) - RESPIRO;

    var classeP = primeira.className, classeI = interna.className;
    var mobiliaP = guardarMobilia(primeira), mobiliaI = guardarMobilia(interna);

    var grupos = agrupar(col.blocos);
    // mede DEPOIS de calcular as capacidades: a medição esvazia a primeira folha, e a
    // mobília dela precisa estar no lugar para a altura do cabeçalho sair certa.
    medirGrupos(grupos, primeira);

    // Grupo maior que a folha inteira não tem paginação que resolva — é conteúdo demais
    // num bloco só. Fica marcado para o verificador apontar a causa certa em vez de
    // reportar um transbordo genérico.
    var gigantes = grupos.filter(function (g) { return g.altura > capI; });
    if (gigantes.length) {
      document.documentElement.setAttribute("data-gigantes", String(gigantes.length));
    }

    /* Consultar o contrato de paginação no README. */
    var original = col.paginas.length;
    if (minimoDePaginas(grupos, capP, capI) > original) {
      restaurar(col.paginas, grupos);
      document.documentElement.setAttribute("data-paginado", "apertado");
      document.documentElement.setAttribute("data-paginas", String(original));
      return;
    }
    var paginas = empacotar(grupos, capP, capI);
    var folhas = desenhar(paginas,
                          { classe: classeP, mobilia: mobiliaP },
                          { classe: classeI, mobilia: mobiliaI },
                          col.paginas);
    distribuirSobra(paginas);
    publicarSobras(folhas);
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
