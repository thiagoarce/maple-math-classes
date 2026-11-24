/* Extracted from original painel_formatacao.js: presentation-only helpers. */
(function(root) {
  "use strict";
  function esc(texto) {
    return String(texto == null ? "" : texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function tipoDoBloco(texto) {
    texto = String(texto || "").toLowerCase();
    if (/devolut|retomad|diagn[oó]st|ativa[cç][aã]o|aquecimento|abertura|disparador/.test(texto)) return "inicio";
    if (/teoria|explica|modela|exemplo|constru|demonstra|sistematiza|mapa da/.test(texto)) return "ensino";
    if (/pr[aá]tica|exerc[ií]c|circuito|atividade|aplica[cç][aã]o|resolu[cç][aã]o|trabalho|esta[cç][aã]o/.test(texto)) return "pratica";
    if (/quest[aã]o do dia|passaporte|fechamento|sa[ií]da|ticket|organiza[cç][aã]o|tarefa|dever/.test(texto)) return "fechamento";
    return "neutro";
  }

  function segmentos(texto) {
    var linhas = String(texto || "").replace(/\r/g, "").split(/\n+/);
    var saida = [];
    linhas.forEach(function (linha) {
      linha = linha.trim();
      if (!linha) return;
      var partes = linha.split(/(?=(?:^|\s)[-•]?\s*\(?\d{1,3}\s*min\)?\s*(?:[—–-]|:)?\s*)/i);
      partes.forEach(function (parte) {
        parte = parte.trim();
        if (parte) saida.push(parte);
      });
    });
    return saida.length ? saida : [String(texto || "").trim()];
  }

  function htmlDoSegmento(texto) {
    var bruto = String(texto || "").trim();
    var tempo = "";
    var m = bruto.match(/^[-•]?\s*(\(?\d{1,3}\s*min\)?)\s*(?:[—–-]|:)?\s*/i);
    if (m) {
      tempo = m[1].replace(/[()]/g, "");
      bruto = bruto.slice(m[0].length).trim();
    }

    var seguro = esc(bruto).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    var rotulo = bruto.match(/^([^:—–.]{2,58})([:—–.])\s+/);
    if (rotulo) {
      var inicio = esc(rotulo[1] + rotulo[2]);
      seguro = '<strong class="plano-rotulo">' + inicio + "</strong> " +
               esc(bruto.slice(rotulo[0].length)).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    }
    seguro = seguro.replace(/\((\d{1,3}\s*min)\)/gi, '<span class="plano-tempo">$1</span>');
    return (tempo ? '<span class="plano-tempo">' + esc(tempo) + "</span>" : "") + seguro;
  }

  root.PlanningFormat = {tipoDoBloco, segmentos, htmlDoSegmento};
})(typeof window !== "undefined" ? window : globalThis);
