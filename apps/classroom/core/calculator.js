/* Motor aritmético original da calculadora de sala, separado da interface. */
(function () {
  "use strict";
  var FUNCOES = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    ln: Math.log, log: function (v) { return Math.log(v) / Math.LN10; },
    sqrt: Math.sqrt, abs: Math.abs
  };
  var TRIG = { sin: 1, cos: 1, tan: 1 };
  var TRIG_INV = { asin: 1, acos: 1, atan: 1 };
  var OPS = {
    "+": { p: 1, f: function (a, b) { return a + b; } },
    "-": { p: 1, f: function (a, b) { return a - b; } },
    "*": { p: 2, f: function (a, b) { return a * b; } },
    "/": { p: 2, f: function (a, b) { return a / b; } },
    "^": { p: 4, dir: "direita", f: Math.pow }
  };

  function tokenizar(texto) {
    var tokens = [], i = 0;
    while (i < texto.length) {
      var c = texto[i];
      if (c === " ") { i++; continue; }
      if (/[0-9.]/.test(c)) {
        var n = "";
        while (i < texto.length && /[0-9.]/.test(texto[i])) n += texto[i++];
        tokens.push({ t: "num", v: parseFloat(n) });
        continue;
      }
      if (/[a-zA-Zπ√]/.test(c)) {
        var nome = "";
        while (i < texto.length && /[a-zA-Zπ√]/.test(texto[i])) nome += texto[i++];
        if (nome === "π") tokens.push({ t: "num", v: Math.PI });
        else if (nome === "e") tokens.push({ t: "num", v: Math.E });
        else if (nome === "√") tokens.push({ t: "fun", v: "sqrt" });
        else if (FUNCOES[nome]) tokens.push({ t: "fun", v: nome });
        else throw new Error("não conheço " + nome);
        continue;
      }
      if (c === "%") { tokens.push({ t: "pct" }); i++; continue; }
      if (c === "(" || c === ")") { tokens.push({ t: c }); i++; continue; }
      var op = c === "×" ? "*" : c === "÷" ? "/" : c === "−" ? "-" : c;
      if (OPS[op]) { tokens.push({ t: "op", v: op }); i++; continue; }
      throw new Error("símbolo solto: " + c);
    }
    return tokens;
  }

  /* Shunting-yard com unário e porcentagem pós-fixa. `graus` decide se as trigonométricas
     recebem grau ou radiano — o professor troca no botão DEG/RAD, e o padrão é DEG porque
     é o que a prova do Ensino Médio usa. */
  function avaliar(texto, graus) {
    var tokens = tokenizar(texto);
    var saida = [], pilha = [], anterior = null;

    function aplicaTopo() {
      var topo = pilha.pop();
      if (topo.t === "fun") {
        var x = saida.pop();
        if (x === undefined) throw new Error("falta número");
        if (graus && TRIG[topo.v]) x = x * Math.PI / 180;
        var r = FUNCOES[topo.v](x);
        if (graus && TRIG_INV[topo.v]) r = r * 180 / Math.PI;
        saida.push(r);
        return;
      }
      if (topo.t === "neg") { saida.push(-saida.pop()); return; }
      var b = saida.pop(), a = saida.pop();
      if (a === undefined || b === undefined) throw new Error("falta número");
      saida.push(OPS[topo.v].f(a, b));
    }

    tokens.forEach(function (tk) {
      if (tk.t === "num") saida.push(tk.v);
      else if (tk.t === "fun") pilha.push(tk);
      else if (tk.t === "pct") saida.push(saida.pop() / 100);
      else if (tk.t === "op") {
        var unario = !anterior || anterior.t === "op" || anterior.t === "(";
        if (unario && tk.v === "-") { pilha.push({ t: "neg" }); anterior = tk; return; }
        if (unario && tk.v === "+") { anterior = tk; return; }
        /* O unário tem precedência PRÓPRIA (3), entre a multiplicação (2) e a potência (4).
           Tratá-lo como "aplica sempre" fazia `−2^2` virar `(−2)^2 = 4`, quando a convenção
           — e o que o aluno vê no livro — é `−(2^2) = −4`. Função fica em 5: `√9^2` resolve
           a raiz primeiro, que é o comportamento previsível numa calculadora de teclas. */
        while (pilha.length) {
          var topo = pilha[pilha.length - 1];
          if (topo.t === "(") break;
          var pTopo = topo.t === "fun" ? 5 : topo.t === "neg" ? 3 : OPS[topo.v].p;
          var maior = pTopo > OPS[tk.v].p;
          var igualEsq = pTopo === OPS[tk.v].p && OPS[tk.v].dir !== "direita";
          if (maior || igualEsq) aplicaTopo(); else break;
        }
        pilha.push(tk);
      } else if (tk.t === "(") pilha.push(tk);
      else if (tk.t === ")") {
        while (pilha.length && pilha[pilha.length - 1].t !== "(") aplicaTopo();
        if (!pilha.length) throw new Error("parêntese sobrando");
        pilha.pop();
        if (pilha.length && pilha[pilha.length - 1].t === "fun") aplicaTopo();
      }
      anterior = tk;
    });
    while (pilha.length) {
      if (pilha[pilha.length - 1].t === "(") throw new Error("parêntese aberto");
      aplicaTopo();
    }
    if (saida.length !== 1 || !isFinite(saida[0])) {
      if (saida.length === 1) return saida[0];   // deixa Infinity/NaN chegarem ao visor
      throw new Error("expressão incompleta");
    }
    return saida[0];
  }

  window.ModoAulaCalcMotor = { avaliar: avaliar, tokenizar: tokenizar };
})();
