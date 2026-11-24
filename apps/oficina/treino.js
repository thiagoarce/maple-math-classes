// Núcleo de geradores reutilizado da Oficina da Conta. Sem vínculo com produtos ou contas.
(function (raiz) {
  const sorteio = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const um = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const br = (x, casas = 4) => {
    const r = Math.round(x * 10 ** casas) / 10 ** casas;
    const [i, d] = String(Math.abs(r)).split(".");
    const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (r < 0 ? "−" : "") + int + (d ? "," + d : "");
  };
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const sup = (n) => String(n).split("").map((c) => SUP[c]).join("");
  const mdc = (a, b) => (b ? mdc(b, a % b) : Math.abs(a));
  const frac = (n, d) => { const g = mdc(n, d); n /= g; d /= g; if (d < 0) { n = -n; d = -d; } return d === 1 ? br(n) : `${n < 0 ? "−" : ""}${Math.abs(n)}/${d}`; };
  const fat = (n) => (n <= 1 ? 1 : n * fat(n - 1));
  const comb = (n, k) => fat(n) / (fat(k) * fat(n - k));

  const F = [
    // ----------------------------------------------------------- Básico
    { id: "tabuada", nome: "Tabuada esticada", grupo: "Básico", gerar() {
      const t = um(["11", "25", "9", "comum"]);
      if (t === "11") { const a = sorteio(12, 81); return { conta: `${a} × 11`, resposta: a * 11, mostrar: br(a * 11), jeito: `Vezes 11: ${a} × 10 + ${a} = ${br(a * 10)} + ${a}.` }; }
      if (t === "25") { const a = sorteio(3, 40) * 4 + um([0, 0, 2]); return { conta: `${a} × 25`, resposta: a * 25, mostrar: br(a * 25), jeito: `Vezes 25 é vezes 100 dividido por 4: ${br(a * 100)} ÷ 4.` }; }
      if (t === "9") { const a = sorteio(13, 99); return { conta: `${a} × 9`, resposta: a * 9, mostrar: br(a * 9), jeito: `Vezes 9: ${a} × 10 − ${a} = ${br(a * 10)} − ${a}.` }; }
      const a = sorteio(12, 19), b = sorteio(6, 9);
      return { conta: `${a} × ${b}`, resposta: a * b, mostrar: br(a * b), jeito: `Quebre o ${a}: 10 × ${b} + ${a - 10} × ${b} = ${10 * b} + ${(a - 10) * b}.` };
    } },
    { id: "multiplicar", nome: "Multiplicar de cabeça", grupo: "Básico", gerar() {
      const t = um(["metade", "redondo", "quadrado"]);
      if (t === "metade") { const a = um([5, 15, 25, 35, 45]), b = sorteio(3, 24) * 2; return { conta: `${a} × ${b}`, resposta: a * b, mostrar: br(a * b), jeito: `Metade de um, dobro do outro: ${a * 2} × ${b / 2}.` }; }
      if (t === "redondo") { const a = um([19, 29, 39, 49, 99, 21, 31, 51, 101]), b = sorteio(3, 12); const r = Math.round(a / 10) * 10; return { conta: `${a} × ${b}`, resposta: a * b, mostrar: br(a * b), jeito: `Arredonde e corrija: ${r} × ${b} ${a < r ? "−" : "+"} ${Math.abs(r - a)} × ${b}.` }; }
      const a = um([15, 25, 35, 45, 55, 65, 75, 85, 95]); const d = (a - 5) / 10;
      return { conta: `${a}²`, resposta: a * a, mostrar: br(a * a), jeito: `Terminado em 5: ${d} × ${d + 1} = ${d * (d + 1)} e põe 25 no fim.` };
    } },
    { id: "dividir", nome: "Dividir sem sofrer", grupo: "Básico", gerar() {
      const q = um([2, 3, 4, 5, 6, 8, 12, 15, 20, 25, 30, 40, 50]), d = um([0.2, 0.25, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 0.12, 0.24, 0.05]);
      const n = Math.round(q * d * 100) / 100;
      return { conta: `${br(n)} ÷ ${br(d)}`, resposta: q, mostrar: br(q), jeito: `Escreva como fração e tire as vírgulas multiplicando os dois por 100: {${br(n * 100)}|${br(d * 100)}}.` };
    } },
    { id: "decimais", nome: "Vírgulas", grupo: "Básico", gerar() {
      const t = um(["vezes", "mais", "menos"]);
      if (t === "vezes") { const a = sorteio(2, 9) / 10, b = um([0.2, 0.3, 0.4, 0.5, 0.05, 1.5, 2.5]); const r = Math.round(a * b * 10000) / 10000; return { conta: `${br(a)} × ${br(b)}`, resposta: r, mostrar: br(r), jeito: "Multiplique sem vírgula e conte as casas decimais dos dois números: o resultado tem a soma delas." }; }
      const a = sorteio(11, 99) / 10, b = sorteio(101, 999) / 100;
      if (t === "mais") return { conta: `${br(a)} + ${br(b)}`, resposta: Math.round((a + b) * 100) / 100, mostrar: br(a + b, 2), jeito: "Alinhe as vírgulas: complete com zero o que tem menos casas." };
      const [m, n] = a > b ? [a, b] : [b, a];
      return { conta: `${br(m)} − ${br(n)}`, resposta: Math.round((m - n) * 100) / 100, mostrar: br(m - n, 2), jeito: "Alinhe as vírgulas e complete com zero antes de subtrair." };
    } },
    { id: "fracoes", nome: "Frações", grupo: "Básico", gerar() {
      const t = um(["de", "soma", "divide"]);
      if (t === "de") { const d = um([3, 4, 5, 6, 8]), n = sorteio(1, d - 1), b = d * sorteio(4, 30); return { conta: `{${n}|${d}} de ${b}`, resposta: (n * b) / d, mostrar: br((n * b) / d), jeito: `Divide pelo de baixo e multiplica pelo de cima: ${b} ÷ ${d} = ${b / d}; × ${n}.` }; }
      if (t === "soma") { const b = um([2, 3, 4, 5, 6]), d = um([3, 4, 6, 8, 10].filter((x) => x !== b)); const a = sorteio(1, b - 1), c = sorteio(1, d - 1); return { conta: `{${a}|${b}} + {${c}|${d}}`, resposta: a / b + c / d, mostrar: frac(a * d + c * b, b * d), jeito: `Mesmo denominador: {${a * d}|${b * d}} + {${c * b}|${b * d}}. Responda em fração (a/b).` }; }
      const a = sorteio(1, 5), b = sorteio(2, 7), c = sorteio(1, 5), d = sorteio(2, 7);
      return { conta: `{${a}|${b}} ÷ {${c}|${d}}`, resposta: (a / b) / (c / d), mostrar: frac(a * d, b * c), jeito: `Inverte a segunda e multiplica: {${a}|${b}} × {${d}|${c}}. Responda em fração (a/b).` };
    } },
    { id: "potencias", nome: "Potências e raízes", grupo: "Básico", gerar() {
      const t = um(["pot", "raiz", "dez", "estima"]);
      if (t === "pot") { const [b, e] = um([[2, 5], [2, 6], [2, 7], [2, 8], [2, 10], [3, 3], [3, 4], [3, 5], [4, 3], [5, 3], [5, 4], [6, 3], [7, 2], [11, 2], [12, 2], [13, 2], [15, 2]]); return { conta: `${b}${sup(e)}`, resposta: b ** e, mostrar: br(b ** e), jeito: `${b}${sup(e)} é o ${b} multiplicado ${e} vezes. Vale ter de cor as potências de 2 até 2¹⁰ = 1 024.` }; }
      if (t === "raiz") { const [r, i] = um([[2, 144], [2, 169], [2, 196], [2, 225], [2, 256], [2, 324], [2, 400], [2, 625], [3, 27], [3, 64], [3, 125], [3, 216], [3, 1000], [2, 0.25], [2, 0.09], [2, 1.44]]); const v = Math.round(i ** (1 / r) * 1000) / 1000; return { conta: `${r === 3 ? "∛" : "√"}${br(i)}`, resposta: v, mostrar: br(v), jeito: r === 3 ? `Que número vezes ele mesmo três vezes dá ${br(i)}?` : `Que número vezes ele mesmo dá ${br(i)}? Com vírgula: √{${br(i * 100)}|100}.` }; }
      if (t === "dez") { const a = sorteio(-6, 6), b = sorteio(-6, 6); return { conta: `10${sup(a)} · 10${sup(b)} = 10 elevado a quanto?`, resposta: a + b, mostrar: br(a + b), jeito: "Mesma base na multiplicação: soma os expoentes (com sinal)." }; }
      const n = um([20, 30, 50, 60, 80, 90, 110, 130, 150, 200]), r = Math.round(Math.sqrt(n));
      return { conta: `√${n} fica mais perto de qual inteiro?`, resposta: r, mostrar: br(r), jeito: `Ache os quadrados vizinhos: ${Math.floor(Math.sqrt(n))}² = ${Math.floor(Math.sqrt(n)) ** 2} e ${Math.ceil(Math.sqrt(n))}² = ${Math.ceil(Math.sqrt(n)) ** 2}.` };
    } },
    { id: "notacao", nome: "Notação científica", grupo: "Básico", gerar() {
      const t = um(["vezes", "divide", "escreve"]);
      if (t === "escreve") { const m = um([1.2, 2.5, 3.6, 4.8, 7.5]), e = um([-5, -4, -3, 3, 4, 5, 6]); const v = m * 10 ** e; return { conta: `${br(v, 8)} = ${br(m)} · 10 elevado a quanto?`, resposta: e, mostrar: br(e), jeito: e > 0 ? "Conte quantas casas a vírgula andou para a esquerda: expoente positivo." : "Número menor que 1: a vírgula anda para a direita e o expoente é negativo." }; }
      const a = um([2, 3, 4, 1.5, 2.5]), b = um([2, 3, 4]), x = sorteio(2, 8), y = sorteio(-4, 6);
      if (t === "vezes") { const m = a * b, e = x + y; const [mm, ee] = m >= 10 ? [m / 10, e + 1] : [m, e]; return { conta: `(${br(a)} · 10${sup(x)}) · (${br(b)} · 10${sup(y)}) = ${br(mm)} · 10 elevado a quanto?`, resposta: ee, mostrar: br(ee), jeito: `Multiplica os números (${br(a)} · ${br(b)} = ${br(m)}) e soma os expoentes${m >= 10 ? "; como passou de 10, a vírgula anda uma casa e o expoente sobe 1" : ""}.` }; }
      const m = a * b, e = x + y;
      return { conta: `(${br(m)} · 10${sup(e)}) ÷ (${br(b)} · 10${sup(y)}) = ${br(a)} · 10 elevado a quanto?`, resposta: x, mostrar: br(x), jeito: "Divide os números e subtrai os expoentes (o de cima menos o de baixo)." };
    } },
    { id: "unidades", nome: "Unidades", grupo: "Básico", gerar() {
      const t = um(["km", "m2", "m3", "litro", "hora"]);
      if (t === "km") { const v = sorteio(12, 95) / 10; return { conta: `${br(v)} km em metros`, resposta: v * 1000, mostrar: br(v * 1000), jeito: "1 km = 1 000 m: a vírgula anda três casas." }; }
      if (t === "m2") { const v = sorteio(2, 40) / 10; return { conta: `${br(v)} m² em cm²`, resposta: Math.round(v * 10000), mostrar: br(v * 10000), jeito: "1 m = 100 cm, então 1 m² = 100 × 100 = 10 000 cm²." }; }
      if (t === "m3") { const v = sorteio(2, 45) / 10; return { conta: `${br(v)} m³ em litros`, resposta: Math.round(v * 1000), mostrar: br(v * 1000), jeito: "1 m³ = 1 000 L (e 1 dm³ = 1 L)." }; }
      if (t === "litro") { const v = sorteio(150, 4500); return { conta: `${br(v)} cm³ em litros`, resposta: v / 1000, mostrar: br(v / 1000), jeito: "1 L = 1 000 cm³ (= 1 000 mL)." }; }
      const h = sorteio(1, 4), m = um([0.25, 0.5, 0.75, 0.2, 0.4]);
      return { conta: `${br(h + m)} h em minutos`, resposta: Math.round((h + m) * 60), mostrar: br((h + m) * 60), jeito: `A parte depois da vírgula é fração de hora: ${br(m)} × 60 = ${br(m * 60)} min. Não é ${br(m * 100)} min!` };
    } },
    // ------------------------------------------------------- Porcentagem
    { id: "pct_de", nome: "Quanto é x% de y", grupo: "Porcentagem", gerar() {
      const p = um([1, 5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60, 75, 80, 120, 150]), y = um([40, 60, 80, 120, 140, 160, 200, 240, 300, 360, 480, 500, 800, 1200]);
      return { conta: `${p}% de ${br(y)}`, resposta: (p * y) / 100, mostrar: br((p * y) / 100), jeito: p % 10 === 0 ? `10% de ${br(y)} é ${br(y / 10)}; vezes ${p / 10}.` : p === 25 ? `25% é um quarto: ${br(y)} ÷ 4.` : p === 75 ? `75% é três quartos: ${br(y)} ÷ 4 × 3.` : `1% de ${br(y)} é ${br(y / 100)}; multiplique por ${p}.` };
    } },
    { id: "pct_quanto", nome: "a é quantos % de b", grupo: "Porcentagem", gerar() {
      const b = um([20, 25, 40, 50, 80, 120, 200, 250, 400, 500]), p = um([5, 10, 15, 20, 25, 30, 40, 60, 75, 80]); const a = (b * p) / 100;
      return { conta: `${br(a)} é quantos por cento de ${br(b)}?`, resposta: p, mostrar: `${p}%`, jeito: `Parte ÷ todo: ${br(a)} ÷ ${br(b)} = ${br(p / 100)} = ${p}%.` };
    } },
    { id: "pct_preco", nome: "Aumento e desconto", grupo: "Porcentagem", gerar() {
      const p = um([5, 10, 15, 20, 25, 30, 40]), v = um([40, 60, 80, 120, 150, 200, 240, 360, 500]), sobe = Math.random() < 0.5;
      const f = sobe ? 1 + p / 100 : 1 - p / 100;
      return { conta: `R$ ${br(v)} com ${sobe ? "aumento" : "desconto"} de ${p}%`, resposta: Math.round(v * f * 100) / 100, mostrar: `R$ ${br(v * f, 2)}`, jeito: `Use o fator: ${br(v)} × ${br(f)}.` };
    } },
    { id: "pct_fator", nome: "Fatores e sucessivos", grupo: "Porcentagem", gerar() {
      const t = um(["fator", "suc", "volta"]);
      if (t === "fator") { const p = um([3, 8, 12, 15, 20, 35, 40, 60]), sobe = Math.random() < 0.5; const f = sobe ? 1 + p / 100 : 1 - p / 100; return { conta: `Fator de ${sobe ? "aumento" : "desconto"} de ${p}%`, resposta: f, mostrar: br(f), jeito: sobe ? `Aumento: 1 + ${br(p / 100)}.` : `Desconto: 1 − ${br(p / 100)}.` }; }
      if (t === "suc") { const [a, b] = um([[20, -20], [10, 10], [20, 10], [-20, -10], [50, -20], [25, -20], [-10, -10], [30, -30], [10, -10]]); const v = Math.round(((1 + a / 100) * (1 + b / 100) - 1) * 10000) / 100; const s = (x) => (x > 0 ? `+${x}%` : `−${-x}%`); return { conta: `${s(a)} e depois ${s(b)}: variação total, em %`, resposta: v, mostrar: `${v > 0 ? "+" : ""}${br(v)}%`, jeito: `Multiplique os fatores: ${br(1 + a / 100)} × ${br(1 + b / 100)} = ${br((1 + a / 100) * (1 + b / 100))}. Responda com sinal (− para queda).` }; }
      const [p, d] = um([[25, 20], [100, 50], [60, 37.5], [50, 100 / 3], [20, 50 / 3], [150, 60]]);
      return { conta: `Subiu ${p}%. Que desconto, em %, volta ao preço antigo?`, resposta: Math.round(d * 100) / 100, mostrar: `${br(d, 2)}%`, jeito: `Preço 100 vira ${100 + p}; para voltar, tira ${p} de ${100 + p}: {${p}|${100 + p}}.`, tol: 0.01 };
    } },
    // -------------------------------------------------------- Proporção
    { id: "regra3", nome: "Regra de três", grupo: "Proporção", gerar() {
      if (Math.random() < 0.5) { const a = sorteio(2, 9), b = a * um([3, 4, 5, 6, 12, 15]), c = a * sorteio(2, 7); return { conta: `${a} está para ${b} assim como ${c} está para x`, resposta: (b * c) / a, mostrar: br((b * c) / a), jeito: `De ${a} para ${c} multiplicou por ${c / a}: faça o mesmo com ${b}.` }; }
      const n = um([2, 3, 4, 6, 8]), d = um([6, 12, 18, 24]), m = um([3, 4, 6, 8, 9, 12].filter((x) => (n * d) % x === 0 && x !== n));
      return { conta: `${n} pessoas fazem em ${d} dias. ${m} pessoas fazem em quantos dias?`, resposta: (n * d) / m, mostrar: br((n * d) / m), jeito: `Inversa: o produto pessoas × dias fica: ${n} × ${d} = ${n * d}; ÷ ${m}.` };
    } },
    { id: "escala", nome: "Escala", grupo: "Proporção", gerar() {
      if (Math.random() < 0.6) { const e = um([1000, 5000, 20000, 50000, 100000, 250000, 500000]), d = sorteio(2, 18) / 2; const km = (d * e) / 100000; return { conta: `Escala 1 : ${br(e)}. ${br(d)} cm no mapa são quantos km?`, resposta: km, mostrar: br(km), jeito: `${br(d)} × ${br(e)} = ${br(d * e)} cm; de cm para km divide por 100 000.` }; }
      const k = um([2, 3, 4, 5, 10]), a = um([2, 5, 8, 12, 20]);
      return { conta: `Medidas × ${k}. Uma área de ${a} m² vira quantos m²?`, resposta: a * k * k, mostrar: br(a * k * k), jeito: `Área multiplica por k² = ${k * k}.` };
    } },
    { id: "taxa", nome: "Velocidade e taxas", grupo: "Proporção", gerar() {
      const t = um(["vel", "tempo", "vazao"]);
      if (t === "vel") { const v = um([45, 60, 72, 80, 90, 100, 120]), h = um([0.5, 1.5, 2, 2.5, 3]); return { conta: `${br(v * h)} km em ${br(h)} h: velocidade média em km/h`, resposta: v, mostrar: br(v), jeito: "Velocidade = distância ÷ tempo." }; }
      if (t === "tempo") { const v = um([40, 60, 80, 90, 120]), d = v * um([0.25, 0.5, 0.75, 1.5]); return { conta: `${br(d)} km a ${v} km/h: quantos minutos?`, resposta: (d / v) * 60, mostrar: br((d / v) * 60), jeito: `Tempo = ${br(d)} ÷ ${v} = ${br(d / v)} h; em minutos, × 60.` }; }
      const vaz = um([5, 8, 10, 12, 15, 20, 25]), min = um([12, 20, 30, 40, 45, 60]);
      return { conta: `Torneira de ${vaz} L/min por ${min} min: quantos litros?`, resposta: vaz * min, mostrar: br(vaz * min), jeito: "Volume = vazão × tempo." };
    } },
    // ---------------------------------------------------------- Álgebra
    { id: "equacao", nome: "Equações rápidas", grupo: "Álgebra", gerar() {
      const x = sorteio(-9, 15), a = um([2, 3, 4, 5, 6, 7]), b = sorteio(-20, 30);
      const t = um(["axb", "paren", "frac"]);
      if (t === "axb") return { conta: `${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)} = ${br(a * x + b)}`, resposta: x, mostrar: br(x), jeito: `Desfaça na ordem contrária: ${b < 0 ? "some" : "tire"} ${Math.abs(b)} dos dois lados e divida por ${a}.` };
      if (t === "paren") { const c = sorteio(1, 9); return { conta: `${a}(x − ${c}) = ${br(a * (x - c))}`, resposta: x, mostrar: br(x), jeito: `Divida por ${a} primeiro: x − ${c} = ${br(x - c)}.` }; }
      const c = sorteio(1, 9);
      return { conta: `{x|${a}} + ${c} = {${x + a * c}|${a}}`, resposta: x, mostrar: br(x), jeito: `Tire ${c} e multiplique por ${a}.` };
    } },
    { id: "sistema", nome: "Sistemas e raízes", grupo: "Álgebra", gerar() {
      if (Math.random() < 0.5) { const x = sorteio(3, 40), y = sorteio(1, x - 1); return { conta: `x + y = ${x + y} e x − y = ${x - y}. Quanto vale x?`, resposta: x, mostrar: br(x), jeito: `Some as duas: 2x = ${2 * x}.` }; }
      const r1 = sorteio(1, 9), r2 = sorteio(1, 9), S = r1 + r2, P = r1 * r2;
      return { conta: `x² − ${S}x + ${P} = 0: qual a maior raiz?`, resposta: Math.max(r1, r2), mostrar: br(Math.max(r1, r2)), jeito: `Soma ${S} e produto ${P}: que dois números são esses?` };
    } },
    { id: "funcao", nome: "Funções de cabeça", grupo: "Álgebra", gerar() {
      const t = um(["valor", "raiz", "vertice"]);
      if (t === "valor") { const a = sorteio(-5, 6) || 2, b = sorteio(-10, 20), k = sorteio(-4, 8); return { conta: `f(x) = ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}. Quanto é f(${k})?`, resposta: a * k + b, mostrar: br(a * k + b), jeito: `Troque x por ${k}: ${a} · (${k}) ${b < 0 ? "−" : "+"} ${Math.abs(b)}.` }; }
      if (t === "raiz") { const a = um([2, 3, 4, 5]), r = sorteio(-6, 9); return { conta: `f(x) = ${a}x ${-a * r < 0 ? "−" : "+"} ${Math.abs(a * r)}. Para que x, f(x) = 0?`, resposta: r, mostrar: br(r), jeito: `${a}x = ${br(a * r)}.` }; }
      const a = um([1, -1, 2, -2]), xv = sorteio(-4, 6), c = sorteio(-10, 10); const b = -2 * a * xv;
      const termo = (k, s) => (k === 0 ? "" : ` ${k < 0 ? "−" : "+"} ${Math.abs(k) === 1 && s ? "" : Math.abs(k)}${s}`);
      return { conta: `f(x) = ${a === 1 ? "" : a === -1 ? "−" : a}x²${termo(b, "x")}${termo(c, "")}. Em que x fica o vértice?`, resposta: xv, mostrar: br(xv), jeito: `x do vértice = −b ÷ 2a = ${-b} ÷ ${2 * a}.` };
    } },
    // ------------------------------------------- Contagem e probabilidade
    { id: "fatorial", nome: "Fatorial e contagem", grupo: "Contagem e chance", gerar() {
      const t = um(["fat", "div", "comb", "anag"]);
      if (t === "fat") { const n = sorteio(3, 7); return { conta: `${n}!`, resposta: fat(n), mostrar: br(fat(n)), jeito: `${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(" × ")}.` }; }
      if (t === "div") { const n = sorteio(6, 10), k = sorteio(n - 3, n - 1); return { conta: `{${n}!|${k}!}`, resposta: fat(n) / fat(k), mostrar: br(fat(n) / fat(k)), jeito: `Corte o ${k}!: sobra ${Array.from({ length: n - k }, (_, i) => n - i).join(" × ")}.` }; }
      if (t === "comb") { const n = sorteio(4, 10), k = sorteio(2, 3); return { conta: `Escolher ${k} de ${n} (a ordem não importa)`, resposta: comb(n, k), mostrar: br(comb(n, k)), jeito: `Em ordem seriam ${Array.from({ length: k }, (_, i) => n - i).join(" × ")}; divida por ${k}! = ${fat(k)}.` }; }
      const [p, n, reps] = um([["ARARA", 5, [3, 2]], ["BANANA", 6, [3, 2]], ["CASA", 4, [2]], ["OVO", 3, [2]], ["PAPAI", 5, [2, 2]], ["ARRAS", 5, [2, 2]], ["ESSE", 4, [2, 2]]]);
      const v = fat(n) / reps.reduce((t, r) => t * fat(r), 1);
      return { conta: `Anagramas de ${p}`, resposta: v, mostrar: br(v), jeito: `${n}! dividido pelas repetições: ${reps.map((r) => r + "!").join(" · ")}.` };
    } },
    { id: "chance", nome: "Probabilidade rápida", grupo: "Contagem e chance", gerar() {
      const t = um(["dado", "moedas", "urna", "complemento"]);
      if (t === "dado") { const s = sorteio(3, 11); const casos = [1, 2, 3, 4, 5, 6].flatMap((a) => [1, 2, 3, 4, 5, 6].map((b) => a + b)).filter((x) => x === s).length; return { conta: `Dois dados: chance de a soma dar ${s}`, resposta: casos / 36, mostrar: frac(casos, 36), jeito: `São 36 pares; conte os que somam ${s}: ${casos}. Responda em fração (a/b).` }; }
      if (t === "moedas") { const n = sorteio(2, 4); return { conta: `${n} moedas: chance de sair cara em todas`, resposta: 1 / 2 ** n, mostrar: `1/${2 ** n}`, jeito: `Eventos independentes (“e”): (1/2) multiplicado ${n} vezes.` }; }
      if (t === "urna") { const a = sorteio(2, 6), v = sorteio(2, 6); return { conta: `${a} azuis e ${v} vermelhas: tirar 2 sem repor, as duas azuis`, resposta: (a / (a + v)) * ((a - 1) / (a + v - 1)), mostrar: frac(a * (a - 1), (a + v) * (a + v - 1)), jeito: `{${a}|${a + v}} × {${a - 1}|${a + v - 1}}: na segunda há uma bola a menos. Responda em fração (a/b).` }; }
      const n = sorteio(2, 3);
      return { conta: `${n} moedas: chance de sair pelo menos uma cara`, resposta: 1 - 1 / 2 ** n, mostrar: `${2 ** n - 1}/${2 ** n}`, jeito: `Pelo menos uma = 1 − nenhuma = 1 − 1/${2 ** n}.` };
    } },
    // ------------------------------------------- Sequências e financeira
    { id: "sequencias", nome: "PA e PG", grupo: "Sequências e juros", gerar() {
      const t = um(["pa", "soma", "pg"]);
      if (t === "pa") { const a1 = sorteio(-5, 20), r = sorteio(2, 9), n = sorteio(8, 30); return { conta: `PA: a₁ = ${a1}, razão ${r}. Quanto é o ${n}º termo?`, resposta: a1 + (n - 1) * r, mostrar: br(a1 + (n - 1) * r), jeito: `Do 1º ao ${n}º há ${n - 1} saltos: ${a1} + ${n - 1} × ${r}.` }; }
      if (t === "soma") { const a1 = sorteio(1, 10), r = sorteio(1, 5), n = um([10, 12, 20, 25]); const an = a1 + (n - 1) * r; return { conta: `Soma dos ${n} primeiros termos da PA ${a1}, ${a1 + r}, ${a1 + 2 * r}, …`, resposta: ((a1 + an) * n) / 2, mostrar: br(((a1 + an) * n) / 2), jeito: `Último termo: ${an}. Soma = (${a1} + ${an}) × ${n} ÷ 2.` }; }
      const a1 = um([1, 2, 3, 5]), q = um([2, 3]), n = sorteio(4, 7);
      return { conta: `PG: a₁ = ${a1}, razão ${q}. Quanto é o ${n}º termo?`, resposta: a1 * q ** (n - 1), mostrar: br(a1 * q ** (n - 1)), jeito: `${a1} × ${q}${sup(n - 1)}: são ${n - 1} multiplicações.` };
    } },
    { id: "juros", nome: "Juros", grupo: "Sequências e juros", gerar() {
      const C = um([1000, 2000, 5000, 10000]), i = um([2, 5, 10, 20]), t = um([2, 3]);
      if (Math.random() < 0.5) return { conta: `Juros simples: R$ ${br(C)} a ${i}% ao mês por ${t * 2} meses. Quanto de juro?`, resposta: (C * i * t * 2) / 100, mostrar: `R$ ${br((C * i * t * 2) / 100)}`, jeito: `Todo mês rende ${i}% do capital: ${br((C * i) / 100)} × ${t * 2}.` };
      const M = Math.round(C * (1 + i / 100) ** t * 100) / 100;
      return { conta: `Juros compostos: R$ ${br(C)} a ${i}% ao mês por ${t} meses. Montante?`, resposta: M, mostrar: `R$ ${br(M, 2)}`, jeito: `${br(C)} × ${br(1 + i / 100)}${sup(t)}: o juro de cada mês entra no seguinte.` };
    } },
    { id: "log", nome: "Logaritmos", grupo: "Sequências e juros", gerar() {
      const t = um(["direto", "props"]);
      if (t === "direto") { const [b, x] = um([[10, 1000], [10, 0.01], [10, 100000], [2, 32], [2, 64], [2, 1 / 8], [3, 81], [3, 27], [5, 125], [4, 64], [10, 1]]); const v = Math.round(Math.log(x) / Math.log(b)); return { conta: `log${b === 10 ? "" : String(b).split("").map((c) => "₀₁₂₃₄₅₆₇₈₉"[c]).join("")} ${x === 1 / 8 ? "{1|8}" : br(x)}`, resposta: v, mostrar: br(v), jeito: `A que expoente ${b} deve ser elevado para dar ${x === 1 / 8 ? "1/8" : br(x)}?` }; }
      const [txt, v, j] = um([["log 6", 0.78, "log 6 = log 2 + log 3"], ["log 4", 0.6, "log 4 = 2 · log 2"], ["log 12", 1.08, "log 12 = 2 · log 2 + log 3"], ["log 5", 0.7, "log 5 = log 10 − log 2"], ["log 1,5", 0.18, "log 1,5 = log 3 − log 2"], ["log 9", 0.96, "log 9 = 2 · log 3"], ["log 20", 1.3, "log 20 = log 2 + log 10"]]);
      return { conta: `Com log 2 = 0,30 e log 3 = 0,48: ${txt}`, resposta: v, mostrar: br(v), jeito: `${j}.` };
    } },
    // -------------------------------------------------------- Estatística
    { id: "media", nome: "Média e mediana", grupo: "Estatística", gerar() {
      const t = um(["media", "mediana", "ponderada"]);
      if (t === "media") { const n = sorteio(4, 5), m = sorteio(5, 20); const v = Array.from({ length: n - 1 }, () => m + sorteio(-4, 4)); v.push(m * n - v.reduce((a, b) => a + b, 0)); return { conta: `Média de ${v.join("; ")}`, resposta: m, mostrar: br(m), jeito: `Some tudo (${m * n}) e divida por ${n}.` }; }
      if (t === "mediana") { const n = um([5, 6, 7]), v = Array.from({ length: n }, () => sorteio(1, 30)); const s = [...v].sort((a, b) => a - b); const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; return { conta: `Mediana de ${v.join("; ")}`, resposta: med, mostrar: br(med), jeito: `Ordene (${s.join(", ")}) e pegue o meio${n % 2 ? "" : " (média dos dois do meio)"}.` }; }
      const [a, pa, b, pb] = [sorteio(4, 9), um([1, 2, 3]), sorteio(5, 10), um([1, 2, 3])]; const r = (a * pa + b * pb) / (pa + pb);
      return { conta: `Média ponderada: nota ${a} com peso ${pa} e nota ${b} com peso ${pb}`, resposta: Math.round(r * 100) / 100, mostrar: br(r, 2), jeito: `(${a} · ${pa} + ${b} · ${pb}) ÷ (${pa} + ${pb}).`, tol: 0.01 };
    } },
    // ------------------------------------------------- Geometria rápida
    { id: "geometria", nome: "Geometria de cabeça", grupo: "Geometria", gerar() {
      const t = um(["circ", "pit", "angulos", "diag", "vol"]);
      if (t === "circ") { const r = sorteio(2, 12), area = Math.random() < 0.5; return { conta: `Use π = 3. ${area ? "Área do círculo" : "Comprimento da circunferência"} de raio ${r}`, resposta: area ? 3 * r * r : 6 * r, mostrar: br(area ? 3 * r * r : 6 * r), jeito: area ? `π r² = 3 × ${r * r}.` : `2 π r = 6 × ${r}.` }; }
      if (t === "pit") { const [a, b, c] = um([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]), k = sorteio(1, 4); return { conta: `Catetos ${a * k} e ${b * k}: hipotenusa?`, resposta: c * k, mostrar: br(c * k), jeito: `Ternos que aparecem muito: 3-4-5, 5-12-13, 8-15-17 (e os múltiplos). Aqui é ${a}-${b}-${c} vezes ${k}.` }; }
      if (t === "angulos") { const n = sorteio(5, 12); return { conta: `Soma dos ângulos internos de um polígono de ${n} lados`, resposta: (n - 2) * 180, mostrar: `${br((n - 2) * 180)}°`, jeito: `Corte em ${n - 2} triângulos: (${n} − 2) × 180°.` }; }
      if (t === "diag") { const n = sorteio(5, 12); return { conta: `Número de diagonais de um polígono de ${n} lados`, resposta: (n * (n - 3)) / 2, mostrar: br((n * (n - 3)) / 2), jeito: `De cada vértice saem ${n - 3} diagonais; cada uma foi contada duas vezes: ${n} × ${n - 3} ÷ 2.` }; }
      const r = sorteio(1, 5), h = sorteio(2, 10);
      return { conta: `Use π = 3. Volume do cilindro de raio ${r} e altura ${h}`, resposta: 3 * r * r * h, mostrar: br(3 * r * r * h), jeito: `Base × altura: 3 × ${r * r} × ${h}.` };
    } },
  ];
  raiz.OFICINA_TREINO = { familias: F, br };
})(typeof window !== "undefined" ? window : globalThis);
