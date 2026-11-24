// Revisão cega: outro modelo resolve as questões da aula sem ver o gabarito, e este script compara.
// É o que pega resposta marcada errada, coisa que a conferência automática não vê.
//
// Uso (dentro de producao/):
//   node revisao.mjs prova lessons/demo-proporcao.json                    imprime as questões, sem gabarito nem comentário
//   node revisao.mjs comparar lessons/demo-proporcao.json respostas.txt   compara (uma linha por questão: "Q3: B")
import { readFileSync } from "node:fs";
import { lerJSON } from "./conferir.mjs";

const [modo, arquivo, respostas] = process.argv.slice(2);
if (!["prova", "comparar"].includes(modo) || !arquivo) { console.log("uso: node revisao.mjs prova|comparar aulas/<ID>.json [respostas.txt]"); process.exit(1); }
const aula = lerJSON(arquivo), fig = (o) => (o && typeof o === "object" && !Array.isArray(o) ? `[Figura: abra a imagem ${o.figura.arquivo}]${o.texto ? " " + o.texto : ""}` : o), rot = (o) => fig(Array.isArray(o) ? o[0] : o), tab = (it) => `Tabela: ${it.colunas[0]} ${it.antes[0]} → ${it.colunas[1]} ${it.antes[1]}; ${it.colunas[0]} ${it.depois} → ${it.colunas[1]} ?`;
const questoes = [], fora = [];
aula.via.forEach((p, i) => p.telas.forEach((t) => t.itens.forEach((it) => {
  const onde = `ponto ${i + 1} (${p.parada})`;
  if (it.tipo === "palpite" && it.questao) questoes.push({ onde, texto: it.questao.texto, tabela: it.questao.tabela, figura: it.questao.figura, opcoes: it.questao.alternativas.map(fig), certa: it.questao.certa });
  else if (it.tipo === "palpite") questoes.push({ onde, texto: `${it.texto}\n${tab(it)}`, opcoes: it.opcoes, certa: it.certa });
  else if (it.tipo === "questao") questoes.push({ onde, texto: it.texto, tabela: it.tabela, figura: it.figura, opcoes: it.alternativas.map(fig), certa: it.certa });
  else if (it.tipo === "valor") questoes.push({ onde, texto: `${it.texto}\n${tab(it)}`, figura: it.figura, opcoes: it.opcoes.map(rot), certa: it.certa });
  else if (it.tipo === "grade") questoes.push({ onde, opcoes: it.opcoes.map(rot), certa: it.certa,
    texto: [it.texto, it.pergunta, `Tabela${it.colunas ? ` (${it.colunas.join(" | ")})` : ""}: ${it.linhas.map((l, i) => l.map((c, j) => (i === it.falta[0] && j === it.falta[1] ? "?" : c)).join(" | ")).join("; ")}`].filter(Boolean).join("\n") });
  else if (it.tipo === "matrizes") questoes.push({ onde, opcoes: it.opcoes.map(rot), certa: it.certa,
    texto: [it.texto, it.pergunta, it.partes.map((p, k) => (typeof p === "string" ? p : `${p.det ? "det" : ""}[${p.m.map((l, i) => l.map((c, j) => (k === it.falta[0] && i === it.falta[1] && j === it.falta[2] ? "?" : c)).join(" ")).join(" ; ")}]`)).join(" ")].filter(Boolean).join("\n") });
  else if (it.tipo === "marcar") questoes.push({ onde, figura: it.figura, opcoes: it.alvos.map((a) => a.nome), certa: it.certa, texto: [it.texto, it.pergunta].filter(Boolean).join("\n") });
  else if (it.tipo === "exemplo") questoes.push({ onde, texto: `${it.texto}\n${it.pergunta}`, opcoes: it.opcoes, certa: it.certa });
  else if (it.tipo === "decide") questoes.push({ onde, certa: it.certa, opcoes: it.opcoes.map(rot),
    texto: [it.texto, (it.equacoes || []).map((e, i) => `(${["I", "II", "III", "IV"][i]}) ${e}`).join("\n"), it.pergunta, it.tabela && `Tabela (${it.tabela.colunas.join(" | ")}): ${it.tabela.linhas.map((l) => l.join(" | ")).join("; ")}`].filter(Boolean).join("\n") });
  // ---- peças de 14/11/2026: nem toda resposta é uma letra (ver "modo")
  else if (it.tipo === "classificar") it.cartoes.forEach((c) => questoes.push({ onde, opcoes: it.caixas, certa: c[1], texto: [it.texto, it.pergunta, `Cartão: “${c[0]}”. Em que caixa ele vai?`].filter(Boolean).join("\n") }));
  else if (it.tipo === "casos") questoes.push({ onde, modo: "conjunto", opcoes: it.casos, certa: it.certos, texto: [it.texto, it.pergunta].filter(Boolean).join("\n") });
  else if (it.tipo === "ordenar") { const ord = it.itens.map((x, i) => [String(x), i]).sort((a, b) => a[0].localeCompare(b[0], "pt"));
    questoes.push({ onde, modo: "ordem", opcoes: ord.map((x) => x[0]), certa: it.itens.map((_, i) => ord.findIndex((o) => o[1] === i)), texto: [it.texto, it.pergunta].filter(Boolean).join("\n") }); }
  else if (it.tipo === "venn") { const n = it.conjuntos.length, R = n === 2 ? ["A", "AB", "B", "fora"] : ["A", "B", "C", "AB", "AC", "BC", "ABC", "fora"], L = "ABC".slice(0, n).split("");
    const nome = (k) => { if (k === "fora") return "fora dos conjuntos"; const d = k.split("").map((l) => it.conjuntos[L.indexOf(l)]), f = L.filter((l) => !k.includes(l)).map((l) => it.conjuntos[L.indexOf(l)]); return d.length === 1 ? `só ${d[0]}` : !f.length ? d.join(" e ") : `${d.join(" e ")}, sem ${f[0]}`; };
    const base = [it.texto, it.pergunta, `Diagrama de Venn dos conjuntos: ${it.conjuntos.join(", ")}.`].filter(Boolean).join("\n"), dadas = (it.dadas || []).map((k) => `${nome(k)} = ${it.regioes[k]}`).join("; ");
    if (it.pinta) questoes.push({ onde, modo: "conjunto", opcoes: R.filter((k) => k !== "fora" || it.fora !== false).map(nome), certa: it.pinta.map((k) => R.filter((x) => x !== "fora" || it.fora !== false).indexOf(k)), texto: `${base}\nQuais regiões devem ser pintadas?` });
    else for (const k of Object.keys(it.regioes).filter((x) => !(it.dadas || []).includes(x))) questoes.push({ onde, opcoes: it.banco.map(String), certa: it.banco.indexOf(it.regioes[k]), texto: `${base}${dadas ? `\nJá escrito no diagrama: ${dadas}.` : ""}\nQue número vai na região “${nome(k)}”?` }); }
  else if (it.tipo === "barras") questoes.push({ onde, modo: "numeros", certa: it.valores, tabela: it.tabela, texto: [it.texto, it.pergunta, `Diga a altura de cada barra, nesta ordem: ${it.categorias.join(", ")}.`].filter(Boolean).join("\n") });
  else if (it.tipo === "ponto" && !it.na_curva && !it.alvo) questoes.push({ onde, modo: "numeros", certa: it.pontos.flatMap((q) => q.certa),
    texto: [it.texto, it.pergunta, it.preso && `O ponto só anda sobre a curva (${it.familia}, coeficientes ${JSON.stringify(it.fixos)}).`, `Diga ${it.preso ? "o x" : "x e y"} de ${it.pontos.map((q) => q.nome || "P").join(" e de ")}, nesta ordem.`].filter(Boolean).join("\n") });
  else if (it.tipo === "ciclo") questoes.push({ onde, modo: "numeros", certa: it.certas ? it.certas.slice().sort((x, y) => x - y) : it.arco ? [it.arco.de, it.arco.ate] : [it.certa],
    texto: [it.texto, it.pergunta, it.certas ? "Responda com todos os ângulos que servem, em graus, de 0 a 359, em ordem crescente." : it.arco ? "Responda com o arco: o ângulo onde começa e o ângulo onde termina, no sentido anti-horário, em graus." : "Responda com o ângulo em graus, de 0 a 359."].filter(Boolean).join("\n") });
  else if (it.tipo === "curva" && it.mostra_alvo === false) questoes.push({ onde, modo: "numeros", certa: it.parametros.map((q) => it.alvo[q.nome]),
    texto: [it.texto, it.pergunta, `Família: ${it.familia}${it.fixos ? `, com ${JSON.stringify(it.fixos)} fixos` : ""}. Diga os valores de ${it.parametros.map((q) => q.rotulo || q.nome).join(" e de ")}, nesta ordem.`].filter(Boolean).join("\n") });
  else if (it.tipo === "angulo") questoes.push({ onde, modo: "numeros", certa: [it.certa], texto: [it.texto, it.pergunta, "Responda com o ângulo, em graus."].filter(Boolean).join("\n") });
  else if (it.tipo === "circunferencia") questoes.push({ onde, modo: "numeros", certa: [...it.centro, it.raio], texto: [it.texto, it.pergunta, "Diga o x do centro, o y do centro e o raio, nesta ordem."].filter(Boolean).join("\n") });
  else if (it.tipo === "regiao") { const ops = it.retas.reduce((l, r) => l.flatMap((x) => (r.x != null ? ["à direita", "à esquerda"] : ["acima", "abaixo"]).map((y) => [...x, y])), [[]]), chave = it.lados.map((l) => (l === "direita" ? "à direita" : l === "esquerda" ? "à esquerda" : l));
    questoes.push({ onde, opcoes: ops.map((l) => l.map((x, k) => `${x} de ${it.retas[k].nome || "a reta"}`).join(" e ")), certa: ops.findIndex((l) => l.join() === chave.join()),
      texto: [it.texto, it.pergunta, "Retas no plano: " + it.retas.map((r) => `${r.nome ? r.nome + ": " : ""}${r.x != null ? `x = ${r.x}` : `y = ${r.a}x + ${r.b}`}`).join("; ") + ". Que região serve?"].filter(Boolean).join("\n") }); }
  else if (["ponto", "curva"].includes(it.tipo)) fora.push(`${onde}: ${it.tipo} (${it.alvo ? "vale qualquer figura com a medida pedida" : it.na_curva ? "vale qualquer ponto da curva" : "a resposta está à vista na figura"})`);
})));

// Como cada modo de resposta é pedido e comparado.
const MODO = {
  letra: { pede: "uma letra", le: (t) => (t.match(/[A-H?]/) || [""])[0], certa: (q) => "ABCDEFGH"[q.certa], mostra: (q, r) => (r === "?" ? "?" : `${r} (${q.opcoes["ABCDEFGH".indexOf(r)]})`) },
  conjunto: { pede: "todas as letras que servem, por exemplo `B, D`", le: (t) => [...new Set(t.toUpperCase().match(/[A-H]/g) || [])].sort().join(""), certa: (q) => q.certa.map((i) => "ABCDEFGH"[i]).sort().join(""), mostra: (q, r) => r },
  ordem: { pede: "as letras na ordem pedida, por exemplo `C A D B`", le: (t) => (t.toUpperCase().match(/[A-H]/g) || []).join(""), certa: (q) => q.certa.map((i) => "ABCDEFGH"[i]).join(""), mostra: (q, r) => r },
  numeros: { pede: "os números na ordem pedida, por exemplo `40; 60; 30`", le: (t) => (t.match(/-?\d+(?:[.,]\d+)?/g) || []).map((x) => Number(x.replace(",", "."))).join(";"), certa: (q) => q.certa.join(";"), mostra: (q, r) => r },
};
const modoDe = (q) => MODO[q.modo || "letra"];

if (modo === "prova") {
  console.log(`# Revisão cega · ${aula.id}\n\nResolva cada questão por conta própria, mostrando a conta. Depois responda numa linha por questão, no formato \`Q1: B\`.\nSe nenhuma opção estiver certa, ou se mais de uma servir, responda \`Q1: ?\` e diga por quê. Se o enunciado for ambíguo ou tiver dado faltando, avise.\n`);
  questoes.forEach((q, k) => console.log(`## Q${k + 1} · ${q.onde}\n\n${q.texto}${q.tabela ? `\n\nTabela${q.tabela.colunas ? ` (${q.tabela.colunas.join(" | ")})` : ""}: ${q.tabela.linhas.map((l) => l.join(" | ")).join("; ")}` : ""}${[].concat(q.figura || []).map((f) => `\n\n[Figura: abra a imagem ${f.arquivo}]`).join("")}\n\n${(q.opcoes || []).map((o, i) => `${"ABCDEFGH"[i]}) ${o}`).join("\n")}${q.modo ? `\n\nResposta: ${modoDe(q).pede}.` : ""}\n`));
  if (fora.length) console.log(`## Fora da revisão cega (conferir nos prints)\n\n${fora.map((f) => `- ${f}`).join("\n")}\n`);
} else {
  const dito = Object.fromEntries([...readFileSync(respostas, "utf8").matchAll(/^\s*Q(\d+)\s*:\s*(.+)$/gm)].map((m) => [m[1], m[2]]));
  let ruins = 0;
  questoes.forEach((q, k) => {
    const M = modoDe(q), r = dito[k + 1] == null ? null : M.le(dito[k + 1]), certa = M.certa(q);
    if (r === certa) return;
    ruins++;
    console.log(`✗ Q${k + 1} · ${q.onde}: o gabarito diz ${certa}${q.modo ? "" : ` (${q.opcoes[q.certa]})`}; a revisão ${r ? `disse ${M.mostra(q, r)}` : "não respondeu"}.`);
  });
  console.log(ruins ? `${aula.id}: ${ruins} de ${questoes.length} questões para olhar.` : `✓ ${aula.id}: as ${questoes.length} questões batem com o gabarito.`);
  process.exit(ruins ? 1 : 0);
}
