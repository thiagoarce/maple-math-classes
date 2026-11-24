import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
await import(new URL("./motor/geo.js", import.meta.url)); // globalThis.GEO, para conferir a peça "desenho"

const AQUI = dirname(fileURLToPath(import.meta.url)), RAIZ = join(AQUI, "../../..");
// First local validation profile: only plain text/table activities; no external assets.
export const FIGURA_ONDE = /^(?!)$/;
export const lerJSON = (f) => JSON.parse(readFileSync(f, "utf8"));
export const catalogo = () => ({});
export const PARADAS = ["Mexer", "Ver", "Quadro", "Praticar", "Topo"];
export const ESTADOS = ["rascunho", "conferida", "revisada", "no ar"];
// Campos de cada item: sem "?" é obrigatório. Campo fora da lista é erro (ninguém inventa campo).
// O que cada família de curva pede (peças "curva" e "ponto") e a conferência das curvas de cenário.
var FAMILIAS_PEDEM = { seno: "a b c", cosseno: "a b c", reta: "a b", parabola: "a h k", exponencial: "a b", modulo: "a h k", logaritmo: "a b", cubica: "a r s t" };
const CAMPOS = {
  texto: "texto tom?",
  palpite: "id nota? questao? texto? colunas? antes? depois? fator? opcoes? certa? seta? retorno?",
  volta: "de fecho classe?",
  setas: "nome? texto colunas antes depois fator acao opcoes seta veredito classe? erros?",
  lado_a_lado: "casos",
  guardar: "titulo texto? linhas?",
  alerta: "titulo texto contas?",
  fixo: "texto? colunas linhas setas? certa achou depois?",
  decide: "texto? pergunta? tabela? figura? equacoes? opcoes certa escrita? comentario?",
  valor: "texto figura? colunas antes depois opcoes certa comentario?",
  questao: "fonte? texto tabela? figura? alternativas certa dicas? comentario",
  exemplo: "texto colunas antes depois resposta pergunta opcoes certa erro linhas",
  video: "nome tempo? capitulos? resolve? fechou? em_gravacao?",
  folhas: "paginas",
  marcar: "texto? pergunta? figura alvos certa escrita? comentario?",
  grade: "texto? pergunta? colunas? linhas rotulos? falta opcoes certa comentario?",
  casos: "texto? pergunta? casos certos escrita? erro? comentario?",
  classificar: "texto? pergunta? caixas cartoes escrita? comentario?",
  ordenar: "texto? pergunta? itens inicio? escrita? erro? comentario?",
  matrizes: "texto? pergunta? partes falta opcoes certa comentario?",
  curva: "texto? pergunta? familia janela pi? parametros fixos? cenario? alvo mostra_alvo? escrita? erro? comentario?",
  ciclo: "texto? pergunta? certa? certas? arco? aceita? mostra? unidade? escrita? erro? comentario?",
  desenho: "texto? janela passos alt tema?",
  angulo: "texto? pergunta? certa inicio? encaixe? transferidor? leitura? escrita? erro comentario?",
  inscrito: "texto? fixos movel encaixe? mostra? alt",
  circunferencia: "texto? pergunta? janela centro raio inicio? cenario? escrita? erro comentario?",
  regiao: "texto? pergunta? janela retas lados escrita? erro comentario?",
  reta: "texto? pergunta? de ate passo divisoes? fracao? marcas? pontos? intervalo? escrita? erro comentario?",
  venn: "texto? pergunta? conjuntos regioes? dadas? banco? pinta? fora? escrita? erro comentario?",
  venn_pronto: "texto? pergunta? conjuntos regioes destaque?",
  arvore: "texto? niveis? raiz? niveis_raiz? destaque? destaque_folhas? alt",
  ponto: "texto? pergunta? janela pontos encaixe? familia? fixos? cenario? preso? na_curva? liga? fecha? mostra? alvo? exemplo? escrita? erro comentario?",
  grafico: "texto? titulo? forma categorias series eixo? rotulos? destaque? media? alt",
  barras: "texto? pergunta? tabela? categorias valores eixo inicio? escrita? erro comentario?",
  solido: "texto? pergunta? solido alt marca? vistas? inicio?",
};
const BLOCOS = {
  questao: "questao", tabela: "colunas linhas rotulos?", etiqueta: "texto", escritas: "linhas", caixa: "titulo sintese? alerta? escrita",
  dobro: "titulo pares", etapa: "n titulo sintese? conta? escritas?", sintese: "texto", tese: "texto", alerta: "texto", frases: "titulo itens", proxima: "texto",
};
// Em que parada cada item pode aparecer.
const ONDE = {
  Mexer: "texto palpite volta setas lado_a_lado guardar alerta fixo decide valor exemplo marcar grade casos classificar ordenar matrizes curva barras ponto reta circunferencia regiao angulo venn ciclo desenho solido grafico venn_pronto arvore inscrito",
  Ver: "texto video",
  Quadro: "texto folhas exemplo guardar alerta desenho solido grafico venn_pronto arvore inscrito",
  Praticar: "texto solido grafico venn_pronto arvore inscrito valor questao decide marcar grade casos classificar ordenar matrizes curva barras ponto reta circunferencia regiao angulo venn ciclo",
  Topo: "valor questao decide marcar grade casos classificar ordenar matrizes curva barras ponto reta circunferencia regiao angulo venn ciclo",
};
// Palavras que não vão para o aluno (decisões do professor; ver RECEITA.md).
const PROIBIDAS = [[/carimb/i, "não se usa \"carimbo\" com o aluno: toque, marque, responda"], [/—/, "sem travessão no texto do aluno"],
  [/\bclique\b/i, "o aluno está no celular: \"toque\", não \"clique\""], [/\bfaltam? \d+ (vídeos?|aulas?)/i, "nunca dizer quantos vídeos ou aulas faltam"]];

const NUM = "\\d+(?:[ \\u00a0\\u202f.]\\d{3})*(?:,\\d+)?";
const valor = (bruto) => Number(bruto.replace(/[   .]/g, "").replace(",", "."));
const numeros = (txt) => [...String(txt).matchAll(new RegExp(NUM, "g"))].map((m) => valor(m[0]));
const aplicar = (op, v) => { const k = Number(op.slice(1).replace(",", ".")); return { "×": v * k, "÷": v / k, "+": v + k, "−": v - k }[op[0]]; };
const igual = (a, b) => Math.abs(a - b) < 1e-9;

// Toda conta só de números escrita em qualquer texto ("30 + 2 × 10 = 50") tem que fechar.
const CONTA = new RegExp(`(${NUM}(?: [×·÷+−] ${NUM})+) = (${NUM})`, "g");
function contasErradas(txt) {
  const ruins = [];
  for (const m of txt.matchAll(CONTA)) {
    if (/[×·÷+−(\p{L}]\s*$/u.test(txt.slice(0, m.index)) && !/\b(e|ou|então|dá|são|é|que|como|por|de|em|com|a|o)\s*$/iu.test(txt.slice(0, m.index))) continue; // a conta começa antes (x · 3 + 2 = ...)
    if (/^\s*[×·÷]/.test(txt.slice(m.index + m[0].length))) continue; // o lado direito continua
    const fichas = m[1].split(/ ([×·÷+−]) /), soma = [];
    let termo = valor(fichas[0]);
    for (let i = 1; i < fichas.length; i += 2) {
      const op = fichas[i], n = valor(fichas[i + 1]);
      if (op === "×" || op === "·") termo *= n; else if (op === "÷") termo /= n; else { soma.push(termo); termo = op === "−" ? -n : n; }
    }
    const total = soma.reduce((a, b) => a + b, 0) + termo, dito = valor(m[2]), casas = (m[2].split(",")[1] || "").length;
    if (Math.abs(total - dito) > 0.5 * 10 ** -casas + 1e-9) ruins.push(`${m[0]} (dá ${String(Math.round(total * 1000) / 1000).replace(".", ",")})`);
  }
  return ruins;
}
function textos(no, achou) {
  if (typeof no === "string") achou(no);
  else if (Array.isArray(no)) no.forEach((x) => textos(x, achou));
  else if (no && typeof no === "object") for (const [k, v] of Object.entries(no)) if (!k.startsWith("_")) textos(v, achou);
}

export function conferir(aula, cat = catalogo()) {
  const erros = [], avisos = [];
  const erro = (onde, msg) => erros.push(`${onde}: ${msg}`);
  const campos = (obj, spec, onde) => {
    const lista = spec.split(" "), nomes = lista.map((c) => c.replace("?", ""));
    for (const c of lista) if (!c.endsWith("?") && obj[c] == null) erro(onde, `falta o campo "${c}"`);
    for (const k of Object.keys(obj)) if (!["tipo", "rotulo", ...nomes].includes(k)) erro(onde, `campo "${k}" não existe no molde`);
  };
  const dentro = (i, lista, onde) => { if (!(Number.isInteger(i) && Array.isArray(lista) && i >= 0 && i < lista.length)) erro(onde, "gabarito fora das opções"); };
  const distintas = (lista, onde) => { if (new Set(lista).size !== lista.length) erro(onde, "há opções repetidas"); };
  const umNumero = (txt, onde) => { if (numeros(txt).length !== 1) erro(onde, `"${txt}" precisa ter exatamente um número (o motor faz conta com ele)`); return numeros(txt)[0]; };
  // Uma opção (ou alternativa) é um texto ou uma figura: { figura: { arquivo, alt }, texto? }.
  const ehFig = (o) => !!o && typeof o === "object" && !Array.isArray(o);
  const nome = (o) => (ehFig(o) ? `figura:${o.figura?.arquivo}` : o);
  const rotulos = (it) => it.opcoes.map((o) => nome(Array.isArray(o) ? o[0] : o));
  const figurasDasOpcoes = (lista, onde) => { for (const o of lista || []) { const x = Array.isArray(o) ? o[0] : o; if (ehFig(x)) { campos(x, "figura texto?", `${onde}, opção com figura`); figura(x.figura, onde); if (x.figura == null) erro(onde, "opção com figura sem \"figura\""); } } };
  // A figura da questão (MOLDE.md, "Figura na questão"): o arquivo original, dentro do repositório, com descrição.
  const cenario = (it, onde) => { for (const q of it.cenario || []) {
    if (q && q.familia) { const pede = FAMILIAS_PEDEM[q.familia]; if (!pede) erro(onde, `cenário: família "${q.familia}" não existe`); else for (const n of pede.split(" ")) if (typeof (q.fixos || {})[n] !== "number") erro(onde, `cenário (${q.familia}): falta ${n} em "fixos"`); }
    else if (!(q && ((Array.isArray(q.circ) && q.circ.length === 3 && q.circ.every((v) => typeof v === "number") && q.circ[2] > 0) || [q.elipse, q.hiperbole].some((l) => Array.isArray(l) && l.length === 4 && l.every((v) => typeof v === "number") && l[2] > 0 && l[3] > 0)))) erro(onde, "cada curva de cenário é { familia, fixos }, { circ: [x, y, raio] }, { elipse: [x, y, a, b] } ou { hiperbole: [x, y, a, b] } (centro e semieixos)");
  } if ((it.cenario || []).length > 3) erro(onde, "até 3 curvas de cenário"); };
  const tabela = (t, onde) => {
    if (t == null) return;
    campos(t, "colunas? linhas rotulos?", `${onde}, tabela`);
    const l = Array.isArray(t.linhas) ? t.linhas : [], larg = l[0]?.length || 0;
    if (!l.length || l.length > 8 || larg < 2 || larg > 5 || l.some((x) => x.length !== larg) || (t.colunas && t.colunas.length !== larg)) erro(onde, "a tabela tem de 1 a 8 linhas e de 2 a 5 colunas, todas do mesmo tamanho (mais que isso não cabe no celular: use a figura da tabela)");
  };
  const figura = (f, onde) => {
    if (f == null) return;
    if (Array.isArray(f)) { if (f.length < 2 || f.length > 3) erro(onde, "lista de figuras: de 2 a 3"); return f.forEach((x) => figura(x, onde)); }
    campos(f, "arquivo alt", `${onde}, figura`);
    if (typeof f.arquivo !== "string" || typeof f.alt !== "string") return;
    if (!FIGURA_ONDE.test(f.arquivo)) erro(onde, `figura "${f.arquivo}": figuras externas ainda não homologadas no perfil local`);
    else if (!existsSync(join(RAIZ, f.arquivo))) erro(onde, `figura "${f.arquivo}" não existe no repositório`);
    if (f.alt.trim().length < 30) erro(onde, "a descrição da figura (alt) diz o que o gráfico mostra, para quem não vê a imagem: pelo menos 30 letras");
  };

  // ----- a aula -----
  campos(aula, "id produto estado versao trecho titulo? subtitulo? proxima? via materiais? _leia?", "aula");
  for (const [k, m] of (aula.materiais || []).entries()) {
    campos(m, "id nome descricao arquivo", `material ${k + 1}`);
    if (!["quadro", "estudo"].includes(m.id)) erro(`material ${k + 1}`, "id é quadro ou estudo");
  }
  if (!ESTADOS.includes(aula.estado)) erro("aula", `estado "${aula.estado}" não existe (${ESTADOS.join(", ")})`);
  if (aula.produto !== "maple") erro("aula", "produto deve ser maple neste perfil");
  if (!aula.titulo) erro("aula", "falta título");
  if (aula.materiais?.length) erro("aula", "materiais externos ainda não homologados");
  const via = Array.isArray(aula.via) ? aula.via : [];
  const paradas = via.map((p) => p.parada);
  if (paradas.at(-1) !== "Topo" || paradas.filter((p) => p === "Topo").length !== 1) erro("via", "a via termina no Topo, e só há um");
  if (paradas[0] !== "Mexer") erro("via", "a via começa por um Mexer: o aluno tenta antes de ver");
  if (!paradas.includes("Praticar")) erro("via", "falta a parada Praticar");
  if (via.length < 4 || via.length > 12) erro("via", `a corda aguenta de 4 a 12 pontos; esta tem ${via.length}`);

  const palpites = new Map(), resolvidos = new Set();
  via.forEach((p, i) => {
    const P = `ponto ${i + 1} (${p.parada})`;
    campos(p, "parada detalhe telas", P);
    if (!PARADAS.includes(p.parada)) return erro(P, "parada desconhecida");
    if ((p.detalhe || "").length > 34) avisos.push(`${P}: detalhe com mais de 34 letras pode quebrar na via em pé`);
    (p.telas || []).forEach((t, j) => {
      const T = `${P}, tela ${j + 1}`;
      campos(t, p.parada === "Topo" ? "nome aviso? minimo itens" : "nome aviso? botao? itens", T);
      const itens = t.itens || [];
      if (p.parada === "Topo") {
        if (p.telas.length !== 1) erro(P, "o Topo tem uma tela só");
        if (itens.length < 1 || itens.length > 6) erro(T, "o Topo tem de 1 a 6 perguntas");
        if (!(Number.isInteger(t.minimo) && t.minimo >= 1 && t.minimo <= itens.length)) erro(T, "mínimo de acertos fora do intervalo");
      }
      itens.forEach((it, n) => {
        const O = `${T}, item ${n + 1} (${it.tipo})`;
        if (!["palpite","setas","volta","exemplo","valor","decide","texto","guardar","alerta","questao","fixo"].includes(it.tipo)) return erro(O, "tipo ainda não homologado no perfil local");
        if (!CAMPOS[it.tipo]) return erro(O, "tipo de item desconhecido");
        if (!ONDE[p.parada].split(" ").includes(it.tipo)) erro(O, `este item não entra na parada ${p.parada}`);
        campos(it, CAMPOS[it.tipo], O);
        if (erros.some((e) => e.startsWith(O))) return; // sem os campos, o resto não confere
        switch (it.tipo) {
          case "palpite":
            if (palpites.has(it.id)) erro(O, `id "${it.id}" repetido`);
            palpites.set(it.id, it);
            if (it.questao) {
              campos(it.questao, "fonte? texto tabela? figura? alternativas certa", O); tabela(it.questao.tabela, O); dentro(it.questao.certa, it.questao.alternativas, O); figura(it.questao.figura, O); figurasDasOpcoes(it.questao.alternativas, O);
              if (it.retorno && it.retorno.length !== it.questao.alternativas.length) erro(O, "um retorno para cada alternativa");
            }
            else {
              for (const c of ["texto", "colunas", "antes", "depois", "fator", "opcoes", "certa", "seta", "retorno"]) if (it[c] == null) erro(O, `palpite na tabela precisa de "${c}"`);
              if (erros.some((e) => e.startsWith(O))) break;
              dentro(it.certa, it.opcoes, O); distintas(it.opcoes, O);
              if (it.retorno.length !== it.opcoes.length) erro(O, "um retorno para cada opção");
              const de = umNumero(it.antes[1], O), para = umNumero(it.opcoes[it.certa], O);
              if (!igual(aplicar(it.seta, de), para)) erro(O, `${it.antes[1]} ${it.seta} não dá ${it.opcoes[it.certa]}`);
              if (!igual(aplicar(it.fator, umNumero(it.antes[0], O)), umNumero(it.depois, O))) erro(O, `${it.antes[0]} ${it.fator} não dá ${it.depois}`);
            }
            break;
          case "volta": {
            const alvo = palpites.get(it.de);
            if (!alvo) erro(O, `"de" aponta para um palpite feito antes; "${it.de}" não existe`);
            else if (alvo.questao && !alvo.retorno) erro(O, `para voltar ao palpite "${it.de}", ele precisa de "retorno" (um comentário por alternativa)`);
            else resolvidos.add(it.de);
            break;
          }
          case "setas": {
            distintas(it.opcoes, O);
            const de = umNumero(it.antes[1], O), para = umNumero(it.depois[1], O);
            const servem = it.opcoes.filter((s) => igual(aplicar(s, de), para));
            if (servem.length !== 1 || servem[0] !== it.seta) erro(O, `de ${it.antes[1]} para ${it.depois[1]} servem [${servem.join(", ")}]; o gabarito diz ${it.seta}`);
            if (!igual(aplicar(it.fator, umNumero(it.antes[0], O)), umNumero(it.depois[0], O))) erro(O, `${it.antes[0]} ${it.fator} não dá ${it.depois[0]}`);
            if (it.opcoes.length < 2 || it.opcoes.length > 4) erro(O, "de 2 a 4 setas para escolher");
            for (const k of Object.keys(it.erros || {})) if (!it.opcoes.includes(k) || k === it.seta) erro(O, `"erros" comenta a seta ${k}, que não é uma opção errada`);
            break;
          }
          case "lado_a_lado":
            if (it.casos.length !== 2 && it.casos.length !== 4) avisos.push(`${O}: fica melhor com 2 ou 4 casos (grade de duas colunas)`);
            for (const c of it.casos) {
              campos(c, "nome colunas setas classe", O);
              const origem = p.telas.flatMap((x) => x.itens).find((x) => x.tipo === "setas" && x.nome === c.nome);
              if (!origem) erro(O, `caso "${c.nome}" não é uma tabela com setas deste ponto (confira o campo "nome")`);
              else if (origem.fator !== c.setas[0] || origem.seta !== c.setas[1] || origem.classe !== c.classe) erro(O, `caso "${c.nome}" não bate com a tabela dele`);
            }
            break;
          case "fixo": {
            if (it.linhas.length < 2 || it.linhas.length > 5) erro(O, "de 2 a 5 linhas");
            if (it.setas && it.linhas.length !== 2) erro(O, "setas nas margens só com duas linhas");
            const n = it.linhas.map((l) => l.map((c) => umNumero(c, O)));
            const fica = (op) => n.every(([a, b]) => igual(op === "÷" ? b / a : a * b, op === "÷" ? n[0][1] / n[0][0] : n[0][0] * n[0][1]));
            if (!["×", "÷"].includes(it.certa)) erro(O, "\"certa\" é × ou ÷");
            else if (!fica(it.certa) || fica(it.certa === "÷" ? "×" : "÷")) erro(O, `a conta que fica fixa não é só ${it.certa}`);
            break;
          }
          case "decide": {
            const r = rotulos(it);
            dentro(it.certa, r, O); distintas(r, O); figura(it.figura, O); figurasDasOpcoes(it.opcoes, O);
            if (!it.texto && !it.pergunta) erro(O, "falta \"texto\" ou \"pergunta\"");
            if (r.length < 2 || r.length > 4) erro(O, "de 2 a 4 opções");
            if (p.parada === "Topo") { if (!it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\""); }
            else it.opcoes.forEach((o, k) => { if (k !== it.certa && !(Array.isArray(o) && o[1])) erro(O, `falta o comentário do erro "${r[k]}"`); });
            tabela(it.tabela, O);
            if (it.equacoes && !(Array.isArray(it.equacoes) && it.equacoes.length >= 2 && it.equacoes.length <= 4)) erro(O, "\"equacoes\": de 2 a 4 equações");
            break;
          }
          case "valor": {
            const r = rotulos(it);
            dentro(it.certa, r, O); distintas(r, O); figura(it.figura, O);
            if (r.length !== 4) erro(O, "quatro valores para escolher");
            if (p.parada === "Topo") { if (!it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\""); }
            else it.opcoes.forEach((o, k) => { if (!(Array.isArray(o) && o[1])) erro(O, `falta o comentário da opção "${r[k]}"`); });
            break;
          }
          case "questao":
            dentro(it.certa, it.alternativas, O); distintas(it.alternativas.map(nome), O); figura(it.figura, O); tabela(it.tabela, O); figurasDasOpcoes(it.alternativas, O);
            if (it.alternativas.length < 4 || it.alternativas.length > 5) erro(O, "4 ou 5 alternativas");
            if (p.parada === "Praticar" && !Array.isArray(it.dicas)) erro(O, "no Praticar, a questão traz \"dicas\" (pode ser lista vazia na última)");
            if (p.parada === "Topo" && it.dicas) erro(O, "no Topo não há dica");
            break;
          case "marcar": {
            figura(it.figura, O);
            const alvos = Array.isArray(it.alvos) ? it.alvos : [];
            dentro(it.certa, alvos, O);
            if (alvos.length < 2 || alvos.length > 8) erro(O, "de 2 a 8 alvos");
            if (!it.texto && !it.pergunta) erro(O, "falta \"texto\" ou \"pergunta\"");
            alvos.forEach((a, k) => {
              campos(a, "x y nome rotulo? comentario?", `${O}, alvo ${k + 1}`);
              if (!(a.x >= 0 && a.x <= 100 && a.y >= 0 && a.y <= 100)) erro(O, `alvo ${k + 1}: x e y são porcentagens da figura (0 a 100)`);
              if (p.parada !== "Topo" && k !== it.certa && !a.comentario) erro(O, `falta o comentário do alvo errado "${a.nome}"`);
              for (const [j, b] of alvos.entries()) if (j < k && Math.hypot(a.x - b.x, a.y - b.y) < 9) erro(O, `os alvos "${b.nome}" e "${a.nome}" estão perto demais para o dedo (menos de 9% da figura)`);
            });
            distintas(alvos.map((a) => a.nome), O);
            if (p.parada === "Topo" && !it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\"");
            break;
          }
          case "grade": {
            const r = rotulos(it), linhas = Array.isArray(it.linhas) ? it.linhas : [], larg = linhas[0]?.length || 0;
            dentro(it.certa, r, O); distintas(r, O);
            if (r.length !== 4) erro(O, "quatro valores para escolher");
            if (linhas.length < 2 || linhas.length > 6 || larg < 2 || larg > 5) erro(O, "a grade tem de 2 a 6 linhas e de 2 a 5 colunas (mais que isso não cabe no celular)");
            if (linhas.some((l) => l.length !== larg) || (it.colunas && it.colunas.length !== larg)) erro(O, "todas as linhas (e o cabeçalho) têm o mesmo número de células");
            if (!(Array.isArray(it.falta) && it.falta.length === 2 && linhas[it.falta[0]]?.[it.falta[1]] != null)) erro(O, "\"falta\" é [linha, coluna] de uma célula da grade, contando de 0");
            else if (r[it.certa] !== linhas[it.falta[0]][it.falta[1]]) erro(O, `a célula que falta guarda a resposta: "${linhas[it.falta[0]][it.falta[1]]}" não é a opção certa "${r[it.certa]}"`);
            if (!it.texto && !it.pergunta) erro(O, "falta \"texto\" ou \"pergunta\"");
            if (p.parada === "Topo") { if (!it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\""); }
            else it.opcoes.forEach((o, k) => { if (!(Array.isArray(o) && o[1])) erro(O, `falta o comentário da opção "${r[k]}"`); });
            break;
          }
          case "casos": {
            const casos = Array.isArray(it.casos) ? it.casos : [], certos = Array.isArray(it.certos) ? it.certos : [];
            if (casos.length < 3 || casos.length > 24) erro(O, "de 3 a 24 casos");
            distintas(casos, O);
            if (!certos.length || certos.length === casos.length) erro(O, "pelo menos um caso entra e pelo menos um fica de fora: senão não há o que decidir");
            if (certos.some((i) => !(Number.isInteger(i) && i >= 0 && i < casos.length)) || new Set(certos).size !== certos.length) erro(O, "\"certos\" são posições dos casos, contando de 0, sem repetir");
            if (!it.texto && !it.pergunta) erro(O, "falta \"texto\" ou \"pergunta\"");
            if (p.parada === "Topo") { if (!it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\""); }
            else if (!it.erro) erro(O, "falta \"erro\": o caminho para quem marcou o conjunto errado");
            break;
          }
          case "classificar": {
            const caixas = Array.isArray(it.caixas) ? it.caixas : [], cartoes = Array.isArray(it.cartoes) ? it.cartoes : [];
            if (caixas.length < 2 || caixas.length > 4) erro(O, "de 2 a 4 caixas");
            if (cartoes.length < 3 || cartoes.length > 8) erro(O, "de 3 a 8 cartões");
            distintas(caixas, O); distintas(cartoes.map((x) => x?.[0]), O);
            cartoes.forEach((x, k) => {
              if (!(Array.isArray(x) && typeof x[0] === "string" && Number.isInteger(x[1]) && x[1] >= 0 && x[1] < caixas.length)) return erro(O, `cartão ${k + 1}: [texto, posição da caixa (de 0), comentário de quem errar]`);
              if (p.parada !== "Topo" && !x[2]) erro(O, `falta o comentário do cartão "${x[0]}" (para quem puser na caixa errada)`);
            });
            if (cartoes.length && new Set(cartoes.map((x) => x?.[1])).size < 2) erro(O, "todos os cartões vão para a mesma caixa: não há o que decidir");
            if (!it.texto && !it.pergunta) erro(O, "falta \"texto\" ou \"pergunta\"");
            if (p.parada === "Topo" && !it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\"");
            break;
          }
          case "ordenar": {
            const itens = Array.isArray(it.itens) ? it.itens : [];
            if (itens.length < 3 || itens.length > 6) erro(O, "de 3 a 6 itens, escritos na ordem certa");
            distintas(itens, O);
            if (it.inicio && (it.inicio.length !== itens.length || [...it.inicio].sort().join() !== itens.map((_, k) => k).join() || it.inicio.every((v, k) => v === k))) erro(O, "\"inicio\" é a ordem em que os itens aparecem: todas as posições, uma vez cada, e diferente da certa");
            if (!it.texto && !it.pergunta) erro(O, "falta \"texto\" ou \"pergunta\"");
            if (p.parada === "Topo") { if (!it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\""); }
            else if (!it.erro) erro(O, "falta \"erro\": o critério da ordem, para quem errou");
            break;
          }
          case "matrizes": {
            const r = rotulos(it), partes = Array.isArray(it.partes) ? it.partes : [], ms = partes.filter((x) => typeof x !== "string");
            dentro(it.certa, r, O); distintas(r, O);
            if (r.length !== 4) erro(O, "quatro valores para escolher");
            if (ms.length < 1 || ms.length > 3) erro(O, "de 1 a 3 matrizes, com sinais entre elas (\"×\", \"+\", \"=\")");
            for (const x of ms) { campos(x, "m det? linha? coluna?", `${O}, matriz`); const l = Array.isArray(x.m) ? x.m : []; if (!l.length || l.length > 4 || l.some((y) => !Array.isArray(y) || y.length !== l[0].length || y.length > 4)) erro(O, "cada matriz tem até 4 linhas e 4 colunas, todas do mesmo tamanho"); }
            if (ms.reduce((t, x) => t + (x.m?.[0]?.length || 0), 0) > 8) erro(O, "as matrizes somam mais de 8 colunas: não cabe no celular");
            const [fp, fi, fj] = Array.isArray(it.falta) ? it.falta : [], alvo = typeof partes[fp] === "object" ? partes[fp]?.m?.[fi]?.[fj] : null;
            if (alvo == null) erro(O, "\"falta\" é [parte, linha, coluna] de uma célula de matriz, contando de 0");
            else if (r[it.certa] !== alvo) erro(O, `a célula que falta guarda a resposta: "${alvo}" não é a opção certa "${r[it.certa]}"`);
            if (!it.texto && !it.pergunta) erro(O, "falta \"texto\" ou \"pergunta\"");
            if (p.parada === "Topo") { if (!it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\""); }
            else it.opcoes.forEach((o, k) => { if (!(Array.isArray(o) && o[1])) erro(O, `falta o comentário da opção "${r[k]}"`); });
            break;
          }
          case "curva": {
            const PEDE = FAMILIAS_PEDEM[it.familia];
            if (!PEDE) { erro(O, `"familia" é ${Object.keys(FAMILIAS_PEDEM).join(", ")}`); break; }
            cenario(it, O);
            const ps = Array.isArray(it.parametros) ? it.parametros : [], fixos = it.fixos || {}, alvo = it.alvo || {};
            if (ps.length < 1 || ps.length > 3) erro(O, "de 1 a 3 controles");
            for (const q of ps) {
              campos(q, "nome valores inicio rotulo?", `${O}, controle`);
              if (!(Array.isArray(q.valores) && q.valores.length >= 3 && q.valores.length <= 13 && q.valores.every((v) => typeof v === "number"))) { erro(O, `controle "${q.nome}": de 3 a 13 valores numéricos`); continue; }
              if (q.valores.some((v, k) => k > 0 && v <= q.valores[k - 1])) erro(O, `controle "${q.nome}": os valores vêm em ordem crescente (o controle corre do menor ao maior)`);
              if (!q.valores.includes(q.inicio)) erro(O, `controle "${q.nome}": o início não está entre os valores`);
              if (!q.valores.includes(alvo[q.nome])) erro(O, `controle "${q.nome}": o alvo não está entre os valores`);
            }
            for (const n of PEDE.split(" ")) if (ps.filter((q) => q.nome === n).length + (typeof fixos[n] === "number" ? 1 : 0) !== 1) erro(O, `a família ${it.familia} pede ${PEDE.replace(/ /g, ", ")}: "${n}" precisa estar uma vez, num controle ou em "fixos"`);
            if (ps.length && ps.every((q) => q.inicio === alvo[q.nome])) erro(O, "a curva já começa no alvo: não há o que ajustar");
            const j = it.janela || {};
            if (!(Array.isArray(j.x) && Array.isArray(j.y) && j.x[0] < j.x[1] && j.y[0] < j.y[1])) erro(O, "\"janela\" é { x: [de, até], y: [de, até] }");
            if (!it.texto && !it.pergunta) erro(O, "falta \"texto\" ou \"pergunta\"");
            if (p.parada === "Topo") { if (!it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\""); }
            else if (!it.erro) erro(O, "falta \"erro\": o que olhar na curva, para quem errou");
            break;
          }
          case "desenho": {
            const j = it.janela, ps = Array.isArray(it.passos) ? it.passos : [], PODE = "grade eixos ponto seg vetor reta pol circ arco setor angulo texto".split(" ");
            if (!(Array.isArray(j) && j.length === 4 && j.every((v) => typeof v === "number") && j[0] < j[1] && j[2] < j[3])) { erro(O, "\"janela\" é [x0, x1, y0, y1], como no kit GEO"); break; }
            if ((j[3] - j[2]) / (j[1] - j[0]) > 1.25) erro(O, "figura alta demais para o celular: a janela pode ter altura até 1,25 vez a largura");
            if (ps.length < 2 || ps.length > 8) erro(O, "\"passos\": de 2 a 8 (com 1 só, é figura parada; use \"figura\")");
            if (!it.alt || it.alt.length < 12) erro(O, "falta \"alt\": o que a figura pronta mostra, para leitor de tela");
            if (it.tema && it.tema !== "ilustra") erro(O, "\"tema\" só aceita ilustra");
            let antes = "", feito = [];
            for (const [i, q] of ps.entries()) {
              const Q = `${O}, passo ${i + 1}`;
              for (const k of Object.keys(q || {})) if (!["fala", "linhas", "botao"].includes(k)) erro(Q, `campo desconhecido "${k}"`);
              if (!q || typeof q.fala !== "string" || !q.fala.trim()) erro(Q, "falta \"fala\": o que a caneta escreve ao lado deste traço");
              else if (q.fala.length > 70) erro(Q, "\"fala\" com mais de 70 letras: é anotação de quadro, não parágrafo");
              if (!q || !Array.isArray(q.linhas) || !q.linhas.length || q.linhas.some((l) => typeof l !== "string")) { erro(Q, "\"linhas\" são instruções do kit GEO, uma por item"); continue; }
              for (const l of q.linhas) if (!PODE.includes(l.trim().split(/\s+/)[0])) erro(Q, `instrução "${l.trim().split(/\s+/)[0]}" não vale aqui (valem: ${PODE.join(", ")})`);
              for (const l of q.linhas) { const r = /^ponto .*\brot=(\S+)/.exec(l.trim()); if (r && !["ne", "n", "no", "o", "so", "s", "se", "l"].includes(r[1])) erro(Q, `rot=${r[1]} não existe: as direções do kit são ne, n, no, o, so, s, se, l`); }
              feito = feito.concat(q.linhas);
              try {
                const svg = globalThis.GEO.desenhar([`janela ${j.join(" ")}`, "largura 300", ...feito].join("\n"), { tema: it.tema });
                if (/NaN|undefined/.test(svg)) erro(Q, "o desenho saiu com valor inválido (ponto sem nome declarado antes?)");
                if (svg === antes) erro(Q, "este passo não muda a figura");
                antes = svg;
              } catch (e) { erro(Q, `o kit GEO não desenhou: ${e.message}`); }
            }
            break;
          }
          case "grafico": case "barras": {
            const cats = Array.isArray(it.categorias) ? it.categorias : [], n = cats.length, ex = it.eixo, numeros = (l) => Array.isArray(l) && l.length === n && l.every((v) => typeof v === "number");
            const pizza = it.forma === "setores";
            if (it.tipo === "grafico" && !["barras", "linha", "setores", "histograma"].includes(it.forma)) { erro(O, "\"forma\" é barras, linha, setores ou histograma"); break; }
            if (it.forma === "histograma" && (it.series || []).length > 1) erro(O, "histograma: uma série só");
            if (n < 2 || n > (pizza ? 6 : 8) || cats.some((x) => typeof x !== "string" || !x || x.length > (pizza ? 12 : 9))) erro(O, pizza ? "de 2 a 6 categorias, com até 12 letras" : "de 2 a 8 categorias, com até 9 letras (o nome fica embaixo da barra)");
            if (!pizza) {
              if (!ex || typeof ex.max !== "number" || typeof ex.passo !== "number" || ex.passo <= 0) { erro(O, "falta \"eixo\": { min?, max, passo, unidade?, encaixe? }"); break; }
              campos(ex, "min? max passo unidade? encaixe?", `${O}, eixo`);
              const vao = (ex.max - (ex.min || 0)) / ex.passo;
              if (Math.abs(vao - Math.round(vao)) > 1e-9 || vao < 2 || vao > 10) erro(O, "o eixo vai de min a max em 2 a 10 passos inteiros");
            } else if (it.eixo || it.media) erro(O, "gráfico de setores não tem eixo nem média");
            const cabe = (v) => pizza ? v > 0 : v >= (ex.min || 0) && v <= ex.max;
            if (it.tipo === "grafico") {
              const ss = Array.isArray(it.series) ? it.series : [];
              if (ss.length < 1 || ss.length > (pizza ? 1 : 2)) erro(O, pizza ? "setores: uma série só" : "de 1 a 2 séries");
              for (const q of ss) { campos(q, "nome? valores", `${O}, série`); if (!numeros(q.valores)) erro(O, "cada série tem um valor por categoria"); else if (!q.valores.every(cabe)) erro(O, pizza ? "setores: valores positivos" : "há valor fora do eixo"); if (ss.length > 1 && !q.nome) erro(O, "com duas séries, cada uma precisa de \"nome\""); }
              if (!it.alt || it.alt.length < 12) erro(O, "falta \"alt\": o que o gráfico mostra, para leitor de tela");
              if (it.destaque && !(Array.isArray(it.destaque) && it.destaque.every((i) => Number.isInteger(i) && i >= 0 && i < n))) erro(O, "\"destaque\" é a lista das posições (a 1ª é 0)");
            } else {
              const enc = ex.encaixe || ex.passo, noEncaixe = (v) => Math.abs((v - (ex.min || 0)) / enc - Math.round((v - (ex.min || 0)) / enc)) < 1e-9;
              if (!numeros(it.valores)) { erro(O, "\"valores\": um por categoria"); break; }
              if (!it.valores.every((v) => cabe(v) && noEncaixe(v))) erro(O, `cada valor precisa caber no eixo e ser alcançável de ${enc} em ${enc} (mude "encaixe")`);
              if (it.inicio && (!numeros(it.inicio) || !it.inicio.every((v) => cabe(v) && noEncaixe(v)))) erro(O, "\"inicio\": um valor por categoria, no eixo e no encaixe");
              if ((it.inicio || cats.map(() => ex.min || 0)).every((v, i) => v === it.valores[i])) erro(O, "as barras já começam certas: não há o que erguer");
              if (!it.tabela && !it.texto) erro(O, "de onde saem os dados? Falta \"tabela\" ou \"texto\"");
              tabela(it.tabela, O);
            }
            break;
          }
          case "ponto": {
            const j = it.janela || {}, enc = it.encaixe || 1, ps = Array.isArray(it.pontos) ? it.pontos : [], par = (q, n = 2) => Array.isArray(q) && q.length === n && q.every((x) => typeof x === "number");
            const FAM = { seno: (p, x) => p.a * Math.sin(p.b * x) + p.c, cosseno: (p, x) => p.a * Math.cos(p.b * x) + p.c, reta: (p, x) => p.a * x + p.b, parabola: (p, x) => p.a * (x - p.h) ** 2 + p.k, exponencial: (p, x) => p.a * p.b ** x,
              modulo: (p, x) => p.a * Math.abs(x - p.h) + p.k, logaritmo: (p, x) => (x > 0 ? (p.a * Math.log(x)) / Math.log(p.b) : NaN), cubica: (p, x) => p.a * (x - p.r) * (x - p.s) * (x - p.t) };
            cenario(it, O);
            if (it.familia && FAMILIAS_PEDEM[it.familia] && it.fixos) for (const n of FAMILIAS_PEDEM[it.familia].split(" ")) if (typeof it.fixos[n] !== "number") erro(O, `a família ${it.familia} pede ${FAMILIAS_PEDEM[it.familia].replace(/ /g, ", ")} em "fixos": falta ${n}`);
            if (!(par(j.x) && par(j.y) && j.x[0] < j.x[1] && j.y[0] < j.y[1] && [...j.x, ...j.y].every(Number.isInteger) && j.x[1] - j.x[0] <= 14 && j.y[1] - j.y[0] <= 14)) { erro(O, "\"janela\" é { x: [de, até], y: [de, até] }, inteiros, com até 14 unidades em cada eixo"); break; }
            if (![1, 0.5].includes(enc)) erro(O, "\"encaixe\" é 1 ou 0.5");
            if (ps.length < 1 || ps.length > (it.fecha ? 6 : 2)) { erro(O, it.fecha ? "polígono: de 3 a 6 pontos" : "de 1 a 2 pontos"); break; }
            if (it.fecha && ps.length < 3) erro(O, "\"fecha\" monta um polígono: precisa de pelo menos 3 pontos");
            if ((it.mostra || it.alvo) && !it.fecha) erro(O, "\"mostra\" e \"alvo\" só existem com \"fecha\": true");
            for (const m of it.mostra || []) if (!["area", "perimetro"].includes(m)) erro(O, "\"mostra\" aceita area e perimetro");
            if (it.alvo && !(typeof it.alvo.area === "number" || typeof it.alvo.perimetro === "number")) erro(O, "\"alvo\" é { area } ou { perimetro } (ou os dois)");
            if (it.alvo && (it.preso || it.na_curva)) erro(O, "\"alvo\" não combina com \"preso\" nem com \"na_curva\"");
            if ((it.preso || it.na_curva) && !(FAM[it.familia] && it.fixos)) { erro(O, "\"preso\" e \"na_curva\" pedem \"familia\" e \"fixos\" (os coeficientes da curva)"); break; }
            if (it.familia && !FAM[it.familia]) { erro(O, `"familia" é ${Object.keys(FAMILIAS_PEDEM).join(", ")}`); break; }
            if (it.preso && it.na_curva) erro(O, "\"preso\" e \"na_curva\" não andam juntos");
            if (it.liga && ps.length !== 2) erro(O, "\"liga\" traça a reta por dois pontos: precisa de 2");
            const f = it.familia && ((x) => FAM[it.familia](it.fixos, x)), dentro2 = (q) => q[0] >= j.x[0] && q[0] <= j.x[1] && q[1] >= j.y[0] && q[1] <= j.y[1], naGrade = (x) => Math.abs(x / enc - Math.round(x / enc)) < 1e-9;
            for (const q of ps) {
              campos(q, it.na_curva || it.alvo ? "nome? inicio" : "nome? inicio certa", `${O}, ponto`);
              if (!par(q.inicio) || !dentro2(q.inicio) || !q.inicio.every(naGrade)) erro(O, "\"inicio\" é [x, y], dentro da janela e no encaixe");
              if (it.preso && par(q.inicio) && Math.abs(f(q.inicio[0]) - q.inicio[1]) > 1e-9) erro(O, "ponto preso: o \"inicio\" precisa estar sobre a curva");
              if (it.na_curva || it.alvo) continue;
              if (!par(q.certa, it.preso ? 1 : 2)) { erro(O, it.preso ? "ponto preso: \"certa\" é [x]" : "\"certa\" é [x, y]"); continue; }
              const alvo = it.preso ? [q.certa[0], f(q.certa[0])] : q.certa;
              if (!dentro2(alvo) || !naGrade(alvo[0]) || (!it.preso && !naGrade(alvo[1]))) erro(O, "a resposta precisa estar dentro da janela e no encaixe");
              if (par(q.inicio) && q.inicio[0] === alvo[0] && (it.preso || q.inicio[1] === alvo[1])) erro(O, "o ponto já começa no lugar certo");
            }
            if (it.na_curva) {
              const ex = it.exemplo;
              if (!(Array.isArray(ex) && ex.length === ps.length && ex.every((q) => par(q) && dentro2(q) && q.every(naGrade) && Math.abs(f(q[0]) - q[1]) < 1e-9) && new Set(ex.map(String)).size === ex.length)) erro(O, "\"na_curva\" pede \"exemplo\": uma resposta certa (um [x, y] por ponto, distintos, sobre a curva, na janela e no encaixe)");
              if (ps.length && ps.every((q) => par(q.inicio) && Math.abs(f(q.inicio[0]) - q.inicio[1]) < 1e-9) && new Set(ps.map((q) => String(q.inicio))).size === ps.length) erro(O, "os pontos já começam sobre a curva");
            } else if (it.alvo) {
              const ex = it.exemplo, ok2 = Array.isArray(ex) && ex.length === ps.length && ex.every((q) => par(q) && dentro2(q) && q.every(naGrade)) && new Set(ex.map(String)).size === ex.length;
              const area = (w) => Math.abs(w.reduce((t, q, i) => { const r = w[(i + 1) % w.length]; return t + q[0] * r[1] - r[0] * q[1]; }, 0)) / 2, peri = (w) => w.reduce((t, q, i) => { const r = w[(i + 1) % w.length]; return t + Math.hypot(r[0] - q[0], r[1] - q[1]); }, 0);
              if (!ok2) erro(O, "\"alvo\" pede \"exemplo\": uma resposta certa (um [x, y] por ponto, na ordem dos vértices)");
              else { if (it.alvo.area != null && Math.abs(area(ex) - it.alvo.area) > 1e-9) erro(O, `o "exemplo" tem área ${area(ex)}, não ${it.alvo.area}`); if (it.alvo.perimetro != null && Math.abs(peri(ex) - it.alvo.perimetro) > 1e-6) erro(O, `o "exemplo" tem perímetro ${peri(ex)}, não ${it.alvo.perimetro}`); }
              const ini = ps.map((q) => q.inicio); if (ini.every((q) => par(q)) && (it.alvo.area == null || Math.abs(area(ini) - it.alvo.area) < 1e-9) && (it.alvo.perimetro == null || Math.abs(peri(ini) - it.alvo.perimetro) < 1e-6)) erro(O, "a figura já começa com a medida certa");
            } else if (it.exemplo) erro(O, "\"exemplo\" só existe com \"na_curva\" ou \"alvo\"");
            break;
          }
          case "venn": case "venn_pronto": {
            const cj = Array.isArray(it.conjuntos) ? it.conjuntos : [], n = cj.length, R = n === 2 ? ["A", "AB", "B", "fora"] : ["A", "B", "C", "AB", "AC", "BC", "ABC", "fora"], reg = it.regioes || {};
            if (n < 2 || n > 3 || cj.some((x) => typeof x !== "string" || !x || x.length > 11)) { erro(O, "\"conjuntos\": 2 ou 3 nomes, com até 11 letras"); break; }
            for (const [k, x] of Object.entries(reg)) { if (!R.includes(k)) erro(O, `região "${k}" não existe: valem ${R.join(", ")}`); else if (typeof x !== "number") erro(O, `região "${k}": o valor é um número`); }
            const lista = (l, nome) => { if (!(Array.isArray(l) && l.length && l.every((k) => R.includes(k)) && new Set(l).size === l.length)) { erro(O, `"${nome}" é uma lista de regiões (${R.join(", ")})`); return false; } return true; };
            if (it.tipo === "venn_pronto") { if (!Object.keys(reg).length) erro(O, "sem \"regioes\" não há o que ler"); if (it.destaque) lista(it.destaque, "destaque"); break; }
            if (!!it.pinta === !!it.banco) { erro(O, "escolha um gesto: \"banco\" (preencher as regiões com números) ou \"pinta\" (pintar regiões)"); break; }
            if (it.pinta) { if (lista(it.pinta, "pinta") && it.pinta.includes("fora") && it.fora === false) erro(O, "\"pinta\" inclui fora, mas \"fora\": false tira essa região do toque"); if (it.dadas) erro(O, "\"dadas\" só existe no gesto de preencher"); break; }
            const dadas = it.dadas || [], pedidas = Object.keys(reg).filter((k) => !dadas.includes(k));
            if (it.dadas && (!lista(it.dadas, "dadas") || dadas.some((k) => !(k in reg)))) erro(O, "cada região de \"dadas\" precisa ter valor em \"regioes\"");
            if (pedidas.length < 2) erro(O, "o aluno precisa preencher pelo menos 2 regiões");
            if (!(Array.isArray(it.banco) && it.banco.length >= 3 && it.banco.length <= 8 && it.banco.every((x) => typeof x === "number") && new Set(it.banco).size === it.banco.length)) erro(O, "\"banco\": de 3 a 8 números diferentes");
            else { for (const k of pedidas) if (!it.banco.includes(reg[k])) erro(O, `o valor de "${k}" (${reg[k]}) não está no banco`); if (it.banco.length <= new Set(pedidas.map((k) => reg[k])).size) erro(O, "o banco precisa de pelo menos um número que não é resposta"); }
            break;
          }
          case "arvore": {
            if (!!it.niveis === !!it.raiz) { erro(O, "escolha um: \"niveis\" (todo nó abre os mesmos ramos) ou \"raiz\" (cada nó com os seus filhos)"); break; }
            if (it.raiz) {
              const fundo = (no) => (no.filhos && no.filhos.length ? 1 + Math.max(...no.filhos.map(fundo)) : 0), conta = (no) => (no.filhos && no.filhos.length ? no.filhos.reduce((t, f) => t + conta(f), 0) : 1);
              const olha = (no, onde2) => { if (!no || typeof no.rotulo !== "string" || !no.rotulo || no.rotulo.length > 8) { erro(O, `${onde2}: cada nó é { rotulo (até 8 letras), filhos? }`); return; } if (no.filhos && (!Array.isArray(no.filhos) || no.filhos.length < 2 || no.filhos.length > 4)) erro(O, `${onde2} (${no.rotulo}): de 2 a 4 filhos`); (Array.isArray(no.filhos) ? no.filhos : []).forEach((f, i) => olha(f, `${onde2} › ${i + 1}`)); };
              olha(it.raiz, "raiz");
              if (!erros.length || true) { try { if (fundo(it.raiz) < 1 || fundo(it.raiz) > 4) erro(O, "a árvore tem de 1 a 4 níveis abaixo da raiz"); if (conta(it.raiz) > 12) erro(O, `a árvore tem ${conta(it.raiz)} folhas: no celular cabem até 12`); } catch { /* estrutura já acusada acima */ } }
              for (const l of it.niveis_raiz || []) campos(l, "nome? fala? botao?", `${O}, nível`);
              if (it.destaque) erro(O, "com \"raiz\", o destaque é \"destaque_folhas\": true (pinta as folhas)");
              if (!it.alt || it.alt.length < 12) erro(O, "falta \"alt\": o que a árvore mostra, para leitor de tela");
              break;
            }
            const N = Array.isArray(it.niveis) ? it.niveis : []; let folhas = 1, pais = 1;
            if (N.length < 1 || N.length > 3) { erro(O, "de 1 a 3 níveis"); break; }
            if (!it.alt || it.alt.length < 12) erro(O, "falta \"alt\": o que a árvore mostra, para leitor de tela");
            for (const [i, l] of N.entries()) {
              const Q = `${O}, nível ${i + 1}`; campos(l, "nome? ramos pesos? fala? botao?", Q);
              if (!(Array.isArray(l.ramos) && l.ramos.length >= 2 && l.ramos.length <= 4 && l.ramos.every((r) => typeof r === "string" && r && r.length <= 8) && new Set(l.ramos).size === l.ramos.length)) { erro(Q, "\"ramos\": de 2 a 4 nomes diferentes, com até 8 letras"); break; }
              if (l.pesos) { const um = (p) => Array.isArray(p) && p.length === l.ramos.length && p.every((x) => typeof x === "string" && x.length <= 5);
                if (!(um(l.pesos) || (Array.isArray(l.pesos) && l.pesos.length === pais && l.pesos.every(um)))) erro(Q, `"pesos": um texto curto por ramo (ex.: "1/2"), ou uma lista dessas por nó do nível anterior (${pais})`); }
              if (l.fala && l.fala.length > 70) erro(Q, "\"fala\" com mais de 70 letras");
              pais = folhas * l.ramos.length; folhas = pais;
            }
            if (folhas > 12) erro(O, `a árvore tem ${folhas} folhas: no celular cabem até 12`);
            for (const d of it.destaque || []) if (!(Array.isArray(d) && d.length === N.length && d.every((r, i) => N[i].ramos && N[i].ramos.includes(r)))) erro(O, "cada \"destaque\" é um caminho completo: um ramo de cada nível, na ordem");
            break;
          }
          case "angulo": {
            const enc = it.encaixe || 5, bom = (g) => Number.isInteger(g) && g >= 0 && g <= 180 && g % enc === 0;
            if (![1, 5, 10, 15].includes(enc)) erro(O, "\"encaixe\" é 1, 5, 10 ou 15 graus");
            if (!bom(it.certa)) erro(O, `"certa" é o ângulo em graus, de 0 a 180, múltiplo de ${enc}`);
            if (it.inicio != null && !bom(it.inicio)) erro(O, `"inicio" é um ângulo de 0 a 180, múltiplo de ${enc}`);
            if ((it.inicio ?? 30) === it.certa) erro(O, "o ângulo já começa certo");
            if (it.transferidor === false && it.leitura === false) erro(O, "sem transferidor e sem leitura o aluno não tem como saber o ângulo: ligue um dos dois");
            break;
          }
          case "inscrito": {
            const fx = it.fixos || {}, mv = it.movel || {}, grau = (g) => typeof g === "number" && g >= 0 && g < 360;
            if (!grau(fx.A) || !grau(fx.B) || fx.A === fx.B) erro(O, "\"fixos\" é { A, B }: dois ângulos diferentes, em graus de 0 a 359, que dizem onde A e B ficam na circunferência");
            if (!grau(mv.inicio) || mv.inicio === fx.A || mv.inicio === fx.B) erro(O, "\"movel\" é { nome?, inicio }: o ângulo de onde P começa, diferente de A e de B");
            if (it.encaixe && ![5, 10, 15].includes(it.encaixe)) erro(O, "\"encaixe\" é 5, 10 ou 15 graus");
            if (!it.alt || it.alt.length < 12) erro(O, "falta \"alt\": o que a figura mostra, para leitor de tela");
            break;
          }
          case "circunferencia": case "regiao": {
            const j = it.janela || {}, par = (q) => Array.isArray(q) && q.length === 2 && q.every(Number.isInteger);
            if (!(par(j.x) && par(j.y) && j.x[0] < j.x[1] && j.y[0] < j.y[1] && j.x[1] - j.x[0] <= 14 && j.y[1] - j.y[0] <= 14)) { erro(O, "\"janela\" é { x: [de, até], y: [de, até] }, inteiros, com até 14 unidades em cada eixo"); break; }
            if (it.tipo === "circunferencia") {
              const prop = (j.x[1] - j.x[0]) / (j.y[1] - j.y[0]);
              if (Math.abs(prop - 1.5) > 0.06) erro(O, "para a circunferência não sair achatada, a janela precisa ter a largura igual a 1,5 vez a altura (ex.: x de −6 a 6 e y de −4 a 4)");
              const ini = it.inicio || { centro: [0, 0], raio: 1 }, rMax = Math.floor(Math.min(j.x[1] - j.x[0], j.y[1] - j.y[0]) / 2), dentro = (q) => par(q) && q[0] >= j.x[0] && q[0] <= j.x[1] && q[1] >= j.y[0] && q[1] <= j.y[1];
              if (!dentro(it.centro) || !(Number.isInteger(it.raio) && it.raio >= 1 && it.raio <= rMax)) erro(O, `"centro" é [x, y] inteiro dentro da janela e "raio" é inteiro de 1 a ${rMax}`);
              if (!dentro(ini.centro) || !(Number.isInteger(ini.raio) && ini.raio >= 1 && ini.raio <= rMax)) erro(O, "\"inicio\" é { centro: [x, y], raio }, inteiros, dentro da janela");
              else if (par(it.centro) && ini.centro[0] === it.centro[0] && ini.centro[1] === it.centro[1] && ini.raio === it.raio) erro(O, "a circunferência já começa certa");
              cenario(it, O);
            } else {
              const R = Array.isArray(it.retas) ? it.retas : [];
              if (R.length < 1 || R.length > 2) { erro(O, "de 1 a 2 retas"); break; }
              R.forEach((r, k) => { campos(r, "a? b? x? nome? tracejada?", `${O}, reta ${k + 1}`); const vertical = typeof r.x === "number";
                if (!vertical && !(typeof r.a === "number" && typeof r.b === "number")) erro(O, `reta ${k + 1}: { a, b } para y = ax + b, ou { x } para a reta vertical`);
                const l = (it.lados || [])[k]; if (!(vertical ? ["direita", "esquerda"] : ["acima", "abaixo"]).includes(l)) erro(O, `"lados"[${k}] é ${vertical ? "direita ou esquerda" : "acima ou abaixo"} (o lado certo dessa reta)`);
                if (R.length > 1 && !r.nome) erro(O, "com duas retas, cada uma precisa de \"nome\" (r, s) para o enunciado poder citá-la"); });
              if ((it.lados || []).length !== R.length) erro(O, "\"lados\": um por reta, na ordem");
            }
            break;
          }
          case "reta": {
            const enc = it.passo / (it.divisoes || 1), n = (it.ate - it.de) / it.passo, naGrade = (x) => typeof x === "number" && x >= it.de && x <= it.ate && Math.abs((x - it.de) / enc - Math.round((x - it.de) / enc)) < 1e-9;
            if (!(typeof it.de === "number" && typeof it.ate === "number" && it.de < it.ate && it.passo > 0 && Math.abs(n - Math.round(n)) < 1e-9 && n >= 2 && n <= 20)) { erro(O, "a reta vai de \"de\" a \"ate\" em 2 a 20 passos inteiros de \"passo\""); break; }
            if (it.divisoes && ![1, 2, 3, 4, 5, 8, 10].includes(it.divisoes)) erro(O, "\"divisoes\" (partes em que cada passo é dividido) é 2, 3, 4, 5, 8 ou 10");
            if (n * (it.divisoes || 1) > 60) erro(O, "marcas demais para o celular: no máximo 60 divisões na reta inteira");
            if (!!it.pontos === !!it.intervalo) { erro(O, "escolha um: \"pontos\" (levar pontos) ou \"intervalo\" (montar um intervalo)"); break; }
            for (const m of it.marcas || []) if (!(m && typeof m.x === "number" && m.x >= it.de && m.x <= it.ate && typeof m.rotulo === "string")) erro(O, "cada marca é { x, rotulo }, dentro da reta");
            if (it.pontos) { if (it.pontos.length < 1 || it.pontos.length > 2) erro(O, "de 1 a 2 pontos");
              for (const q of it.pontos) { campos(q, "nome? inicio certa", `${O}, ponto`); if (!naGrade(q.inicio) || !naGrade(q.certa)) erro(O, "\"inicio\" e \"certa\" precisam cair numa marca da reta"); else if (q.inicio === q.certa) erro(O, "o ponto já começa no lugar certo"); } }
            else { const I = it.intervalo; campos(I, "de? ate? aberto inicio?", `${O}, intervalo`);
              if (I.de == null && I.ate == null) erro(O, "intervalo sem nenhuma ponta: pelo menos uma precisa ser número");
              for (const k of ["de", "ate"]) if (I[k] != null && (!naGrade(I[k]) || I[k] === it.de || I[k] === it.ate)) erro(O, `intervalo.${k} precisa cair numa marca de dentro da reta (a borda quer dizer infinito; use null)`);
              if (I.de != null && I.ate != null && I.de >= I.ate) erro(O, "intervalo.de vem antes de intervalo.ate");
              if (!(Array.isArray(I.aberto) && I.aberto.length === 2 && I.aberto.every((b) => typeof b === "boolean"))) erro(O, "\"aberto\" é [esquerda, direita], true para bolinha aberta");
              if (I.inicio && !(Array.isArray(I.inicio) && I.inicio.length === 2 && I.inicio.every(naGrade) && I.inicio[0] < I.inicio[1])) erro(O, "\"inicio\" é [esquerda, direita], em marcas da reta"); }
            break;
          }
          case "solido": {
            const d = it.solido || {}, pos = (v) => typeof v === "number" && v > 0, m = it.marca || {}; let nomes = [];
            if (!it.alt || it.alt.length < 12) erro(O, "falta \"alt\": o que o sólido é, para leitor de tela");
            if (d.forma === "prisma" || d.forma === "piramide") {
              const n = Array.isArray(d.base) ? 4 : d.base && d.base.lados;
              if (!(Array.isArray(d.base) ? d.base.length === 2 && d.base.every(pos) : d.base && Number.isInteger(n) && n >= 3 && n <= 8 && pos(d.base.lado))) { erro(O, "\"base\" é [largura, fundo] ou { lados: 3 a 8, lado }"); break; }
              if (!pos(d.altura)) erro(O, "falta \"altura\"");
              if (d.topo != null && !(d.forma === "piramide" && d.topo > 0 && d.topo < 1)) erro(O, "\"topo\" faz o tronco de pirâmide: a fração da base que sobra em cima, entre 0 e 1");
              nomes = [..."ABCDEFGHIJKLMNPQRSTUXYZ".slice(0, d.forma === "prisma" || d.topo ? 2 * n : n), "O", ...(d.forma === "piramide" ? [d.topo ? "P" : "V"] : [])];
            } else if (d.forma === "cilindro" || d.forma === "cone") {
              if (!pos(d.raio) || !pos(d.altura)) erro(O, "cilindro e cone pedem \"raio\" e \"altura\"");
              if (d.raio_menor != null && !(d.forma === "cone" && pos(d.raio_menor) && d.raio_menor < d.raio)) erro(O, "\"raio_menor\" faz o tronco de cone: positivo e menor que o raio");
              nomes = d.forma === "cone" && !d.raio_menor ? ["O", "A", "V"] : ["O", "A", "P", "B"];
              if (m.faces) erro(O, "sólido redondo não tem \"faces\" para marcar");
            } else if (d.forma === "esfera") { if (!pos(d.raio)) erro(O, "esfera pede \"raio\""); nomes = ["O", "A", "N"]; if (m.faces) erro(O, "esfera não tem \"faces\" para marcar");
            } else if (d.forma === "octaedro") { if (!pos(d.aresta)) erro(O, "octaedro pede \"aresta\""); nomes = ["A", "B", "C", "D", "V", "W", "O"];
            } else if (d.forma === "icosaedro" || d.forma === "dodecaedro") { if (!pos(d.aresta)) erro(O, `${d.forma} pede "aresta"`); nomes = [..."ABCDEFGHIJKLMNPQRSTUXYZ".slice(0, d.forma === "icosaedro" ? 12 : 20), "O"]; if (m.faces) erro(O, "neste sólido as faces não têm nome simples: marque segmentos e rótulos");
            } else if (d.forma === "cubinhos") {
              const p = d.pilhas;
              if (!(Array.isArray(p) && p.length >= 1 && p.length <= 5 && p.every((l) => Array.isArray(l) && l.length >= 1 && l.length <= 5 && l.every((v) => Number.isInteger(v) && v >= 0 && v <= 5)) && p.flat().some((v) => v > 0))) erro(O, "\"pilhas\": até 5 linhas (a 1ª é o fundo, a última é a frente) de até 5 alturas de 0 a 5");
              if (it.marca) erro(O, "cubinhos não aceitam \"marca\"");
              break;
            } else { erro(O, "\"forma\" é prisma, piramide, cilindro, cone, esfera, octaedro, icosaedro, dodecaedro ou cubinhos"); break; }
            if (d.dentro) { const di = d.dentro; if (!(di.forma === "esfera" ? pos(di.raio) : ["prisma", "piramide", "octaedro"].includes(di.forma))) erro(O, "\"dentro\" é um sólido desenhado por dentro: esfera (raio), prisma, piramide ou octaedro, com \"centro\": [x, y, z] opcional"); if (di.centro && !(Array.isArray(di.centro) && di.centro.length === 3 && di.centro.every((v) => typeof v === "number"))) erro(O, "\"dentro.centro\" é [x, y, z]"); }
            for (const [k, de] of Object.entries(d.pontos || {})) { if (!Array.isArray(de) || de.some((q) => !nomes.includes(q))) erro(O, `ponto "${k}": é a média de pontos que já existem (${nomes.join(", ")})`); nomes.push(k); }
            for (const k of Object.keys(m)) if (!["segmentos", "faces", "rotulos", "medidas"].includes(k)) erro(O, `"marca" não tem "${k}"`);
            for (const q of [...(m.segmentos || []).flat(), ...(m.faces || []).flat(), ...(m.rotulos || []), ...(m.medidas || []).flatMap((x) => x.slice(0, 2))]) if (!nomes.includes(q)) erro(O, `"marca" cita o ponto "${q}", que este sólido não tem (tem ${nomes.join(", ")})`);
            for (const x of m.medidas || []) if (x.length !== 3 || typeof x[2] !== "string") erro(O, "cada medida é [ponto, ponto, \"texto\"]");
            if (it.inicio && !(Array.isArray(it.inicio) && it.inicio.length === 2 && it.inicio[1] >= 0 && it.inicio[1] <= 90)) erro(O, "\"inicio\" é [giro, subida], em graus, com a subida de 0 a 90");
            break;
          }
          case "ciclo": {
            const ANG = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
            const modos = [it.certa != null, !!it.certas, !!it.arco].filter(Boolean).length;
            if (modos !== 1) erro(O, "escolha um: \"certa\" (um ângulo), \"certas\" (vários) ou \"arco\" ({ de, ate }, no sentido anti-horário)");
            else if (it.certas) { if (!(Array.isArray(it.certas) && it.certas.length >= 2 && it.certas.length <= 6 && it.certas.every((g) => ANG.includes(g)) && new Set(it.certas).size === it.certas.length)) erro(O, "\"certas\": de 2 a 6 ângulos notáveis diferentes, em graus"); if (it.aceita) erro(O, "\"aceita\" só existe com \"certa\""); }
            else if (it.arco) { if (!(ANG.includes(it.arco.de) && ANG.includes(it.arco.ate) && it.arco.de !== it.arco.ate)) erro(O, "\"arco\" é { de, ate }: dois ângulos notáveis diferentes; o arco vai de \"de\" a \"ate\" no sentido anti-horário"); if (it.aceita) erro(O, "\"aceita\" só existe com \"certa\""); }
            else if (!ANG.includes(it.certa)) erro(O, "\"certa\" é um dos 16 ângulos notáveis, em graus (0, 30, 45, 60, 90, …, 330)");
            for (const g of it.aceita || []) if (!ANG.includes(g) || g === it.certa) erro(O, "\"aceita\" são outros ângulos notáveis que também respondem");
            for (const x of it.mostra || []) if (!["seno", "cosseno", "valores", "angulos"].includes(x)) erro(O, `"mostra" aceita seno, cosseno, valores e angulos; "${x}" não`);
            if (it.unidade && !["graus", "rad"].includes(it.unidade)) erro(O, "\"unidade\" é graus ou rad");
            if (!it.texto && !it.pergunta) erro(O, "falta \"texto\" ou \"pergunta\"");
            if (p.parada === "Topo") { if (!it.comentario) erro(O, "no Topo, toda pergunta tem \"comentario\""); }
            else if (!it.erro) erro(O, "falta \"erro\": o caminho para quem marcou outro ponto");
            break;
          }
          case "exemplo":
            dentro(it.certa, it.opcoes, O);
            if (it.linhas.length < 2 || it.linhas.length > 5) erro(O, "de 2 a 5 linhas de resolução");
            if (!it.linhas.some((l) => l.includes(String(it.resposta)))) erro(O, `nenhuma linha da resolução chega em ${it.resposta}`);
            break;
          case "video":
            if (it.em_gravacao) break;
            for (const c of ["tempo", "capitulos"]) if (it[c] == null) erro(O, `vídeo gravado precisa de "${c}"`);
            if (it.resolve) {
              const alvo = palpites.get(it.resolve);
              if (!alvo || !alvo.questao) erro(O, `"resolve" aponta para uma questão que o aluno tentou antes; "${it.resolve}" não serve`);
              else { resolvidos.add(it.resolve); if (!it.fechou) erro(O, "falta \"fechou\" (a resposta em que o vídeo chega)"); }
            }
            break;
          case "folhas":
            it.paginas.forEach((pg, k) => {
              campos(pg, "titulo blocos", `${O}, página ${k + 1}`);
              (pg.blocos || []).forEach((b, m) => {
                const B = `${O}, página ${k + 1}, bloco ${m + 1} (${b.tipo})`;
                if (!BLOCOS[b.tipo]) return erro(B, "tipo de bloco desconhecido");
                campos(b, BLOCOS[b.tipo], B);
                if (b.tipo === "questao" && b.questao) { dentro(b.questao.certa, b.questao.alternativas, B); figura(b.questao.figura, B); figurasDasOpcoes(b.questao.alternativas, B); }
              });
            });
            break;
        }
      });
    });
  });
  // ----- o que a avaliação do primeiro lote ensinou (13/11/2026) -----
  const todos = via.flatMap((p) => (p.telas || []).flatMap((t) => (t.itens || []).map((it) => [p, it])));
  const provas = todos.filter(([p, it]) => ["Praticar", "Topo"].includes(p.parada) && ["valor", "questao", "decide", "marcar", "grade", "matrizes"].includes(it.tipo)).map(([, it]) => it.certa);
  for (const pos of new Set(provas)) {
    const n = provas.filter((c) => c === pos).length;
    if (provas.length >= 6 && n > provas.length / 2) erro("aula", `a resposta certa está na posição ${"ABCDE"[pos]} em ${n} de ${provas.length} questões do Praticar e do Topo: embaralhe`);
  }
  const setas = todos.filter(([, it]) => it.tipo === "setas").map(([, it]) => it), repetem = setas.filter((it) => it.seta === it.fator).length;
  if (setas.length >= 3 && repetem > setas.length / 2) erro("aula", `em ${repetem} de ${setas.length} tabelas a seta certa é igual à da esquerda: o gesto não pede decisão. Use "valor" (o aluno calcula) ou uma situação em que a seta muda`);
  const GESTOS = ["setas", "fixo", "decide", "valor", "exemplo", "marcar", "grade", "casos", "classificar", "ordenar", "matrizes", "curva", "barras", "ponto", "reta", "circunferencia", "regiao", "angulo", "venn", "ciclo"], abertura = (via[0]?.telas || []).flatMap((t) => t.itens || []).filter((it) => GESTOS.includes(it.tipo)).length;
  if (abertura > 7) erro("via", `o primeiro Mexer pede ${abertura} respostas antes da ideia; o limite é 7 (o aluno larga a aula no meio)`);
  for (const [, it] of todos) for (const o of it.opcoes || []) if (Array.isArray(o) && /^Isso\b/.test(o[1] || "")) erro("texto", `comentário de acerto não começa por "Isso": a caneta já escreve "isso!" (${o[1].slice(0, 40)})`);

  for (const [id, p] of palpites) if (!resolvidos.has(id)) erro("via", `o palpite "${id}" nunca é retomado (falta um vídeo com "resolve" ou uma "volta")`);
  // Video is optional in the local classroom profile.

  // ----- as fórmulas [[...]] -----
  const kx = katex(), SEM_KATEX = "há fórmulas [[...]] e o KaTeX não foi achado (plataforma/node_modules/katex): elas não foram conferidas";
  textos(aula, (t) => { for (const m of t.matchAll(/\[\[(.+?)\]\]/g)) { if (!kx) { erro("fórmula", "fórmulas ainda não homologadas no perfil local"); continue; } try { kx.renderToString(m[1], { output: "mathml", throwOnError: true }); } catch (e) { erro("fórmula", `[[${m[1]}]] não desenha: ${String(e.message).slice(0, 80)}`); } } });
  // ----- o texto todo -----
  const { _leia, ...resto } = aula;
  textos(resto, (t) => {
    for (const c of contasErradas(t)) erro("conta", `"${c}" em: ${t.slice(0, 80)}`);
    for (const [re, por] of PROIBIDAS) if (re.test(t)) erro("texto", `${por}: "${t.slice(0, 80)}"`);
    if (/\s{2,}|^\s|\s$/.test(t)) avisos.push(`texto com espaço sobrando: "${t.slice(0, 60)}"`);
  });
  return { erros, avisos };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cat = catalogo();
  let ruins = 0;
  for (const f of process.argv.slice(2)) {
    const aula = lerJSON(f), { erros, avisos } = conferir(aula, cat);
    console.log(`${erros.length ? "✗" : "✓"} ${aula.id} (${aula.estado})${erros.length ? "" : `: ${aula.via.length} pontos, ${aula.via.flatMap((p) => p.telas).flatMap((t) => t.itens).length} itens`}`);
    for (const e of erros) console.log(`    erro   ${e}`);
    for (const a of avisos) console.log(`    aviso  ${a}`);
    if (erros.length) ruins++;
  }
  if (!process.argv[2]) console.log("uso: node conferir.mjs aulas/<ID>.json ...");
  process.exit(ruins ? 1 : 0);
}

// Todas as figuras de uma aula (para quem monta a página trocar o arquivo pelo endereço).
export function figurasDe(aula) {
  const lista = [], um = (o) => { const x = Array.isArray(o) ? o[0] : o; if (x && typeof x === "object" && x.figura) lista.push(x.figura); };
  const ver = (q) => { if (!q) return; if (q.figura) lista.push(...(Array.isArray(q.figura) ? q.figura : [q.figura])); (q.alternativas || []).forEach(um); (q.opcoes || []).forEach(um); };
  for (const p of aula.via || []) for (const t of p.telas || []) for (const it of t.itens || []) {
    ver(it); ver(it.questao);
    for (const pg of it.paginas || []) for (const b of pg.blocos || []) ver(b.questao);
  }
  return lista;
}

// O KaTeX que desenha as fórmulas [[...]]: o da plataforma ou o da sessão remota.
var _katex;
export function katex() {
  if (_katex !== undefined) return _katex;
  const req = createRequire(import.meta.url);
  for (const onde of []) { try { return (_katex = req(onde)); } catch { /* tenta o próximo */ } }
  return (_katex = null);
}
// Cada fórmula da aula já desenhada em MathML (o navegador mostra sem folha de estilo nem fonte própria).
export function formulasDe(aula) {
  const kx = katex(), mapa = {};
  if (kx) textos(aula, (t) => { for (const m of t.matchAll(/\[\[(.+?)\]\]/g)) mapa[m[1]] ??= kx.renderToString(m[1], { output: "mathml", throwOnError: false }); });
  return mapa;
}
