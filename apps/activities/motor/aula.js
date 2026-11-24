/* Motor original de aulas em etapas, adaptado para demonstração local sem serviços externos. */
(function () {
  const A = window.AULA, SVG = "http://www.w3.org/2000/svg", H = null;
  const ESCALADA = false, ABERTOS_VISITANTE = 1; // spec, seção 6
  // Texto fixo da interface: igual em todas as aulas, para ninguém reescrever.
  const TX = {
    guardado: "Guardado nesta sessão.", certo: "isso!", errado: "ainda não", continuar: "Continuar",
    palpite_questao: "Circule o seu palpite, ou siga sem ele.", palpite_tabela: "Toque na sua resposta. Ela vai para a tabela.",
    valor: "Toque no valor que falta.", dica: "Travou? Abrir uma dica", outra_dica: "Outra dica",
    mudou: "mudou. Tente a outra conta.", proxima_linha: "Escrever a próxima linha", olhe: "olhe de novo",
    visto: "Já vi este trecho", video: "No protótipo o vídeo não toca. Na plataforma, ele para sozinho no fim de cada trecho.",
    gravando: "em gravação", gravando_nota: "Este vídeo ainda está em gravação. A aula funciona sem ele: siga para a prática.",
    modos: ["em branco", "montado"],
    tentar_antes: "Aqui tem uma questão para tentar antes.", pausar: "Pausar e tentar",
    video_corrido: "No protótipo o vídeo não toca. Na plataforma, ele segue do começo ao fim, sem parar.",
    visto_tudo: "Já vi a aula inteira", depois_corrido: "Agora o quadro, a prática e o topo, como no passo a passo.",
    girar: "Gire o celular para ver o vídeo maior.", tentar_proxima: "Tentar a próxima questão", continuar_vendo: "Continuar assistindo",
    so_assistir: "Prefiro só assistir à aula", jeitos: ["passo a passo", "só assistir"],
    praticar_papel: "Prefere fazer no papel?",
    prototipo_notas: "No protótipo, as anotações somem ao recarregar a página.", prototipo_duvida: "A dúvida permanece somente nesta sessão. Nada é enviado.",
    ordenar: "Toque nos itens na ordem certa.", desfazer: "Recomeçar a ordem", ajustar: "Arraste os controles até a curva azul cobrir a tracejada. Depois, confira.", ajustar_sem: "Arraste os controles até a curva ser a pedida. Depois, confira.",
    ciclo: "Toque num ponto do ciclo. Depois, confira.",
    marcar: "Toque no lugar certo da figura.", casos: "Toque em todos os que entram. Depois, confira.", conferir: "Conferir", proximo_traco: "Próximo traço", girar: "Arraste a figura para girar.", proximo_nivel: "Abrir o próximo nível", sond_feita: "feito ✓", sond_rever: "Rever o que respondi", sond_pular: "Dá para seguir sem fazer, mas vale a pena: é rápido e não vale nota.", preencher: "Toque numa região e depois no número que vai nela. Depois, confira.", pintar_v: "Toque nas regiões para pintar. Depois, confira.", abrir_a: "Arraste a ponta vermelha até abrir o ângulo certo. Depois, confira.", levar_c: "Arraste o centro até o lugar e o ponto azul até o raio certo. Depois, confira.", pintar_r: "Toque na região que serve. Depois, confira.", girar_p: "Arraste o ponto P pela circunferência.", levar_i: "Arraste as duas pontas. Toque numa ponta para abrir ou fechar a bolinha. Depois, confira.", levar: "Arraste o ponto até o lugar certo. Depois, confira.", levar2: "Arraste os pontos até o lugar certo. Depois, confira.", erguer: "Arraste cada barra até a altura certa. Depois, confira.", vistas: ["De frente", "De lado", "De cima", "Soltar"], celula: "Toque no valor que falta.",
    ampliar: "Toque para ampliar", fechar: "Fechar", arraste: "Arraste para ver os detalhes.",
    entregar: "Entregar", refazer: "Refazer o topo", passou: ESCALADA ? "Aula dominada." : "Atividade concluída.",
    treino: ESCALADA ? "Ainda em treino. Reveja a ideia e refaça." : "Ainda em treino. Reveja o quadro montado e refaça.",
    selo: ESCALADA ? "Dominada" : "Concluída",

  };
  const PONTOS = A.via, ITENS = [];
  for (const p of PONTOS) for (const t of p.telas) for (const it of t.itens) { it._k = ITENS.length; ITENS.push(it); }
  const chave = (lista) => [...lista].sort((a, b) => a - b).join(",");
  for (const it of ITENS) { // a resposta certa vira uma chave, como o "certa" dos outros gestos
    if (it.tipo === "casos") it.certa = chave(it.certos);
    if (it.tipo === "classificar") it.certa = it.cartoes.map((c) => c[1]).join(",");
    if (it.tipo === "ordenar") it.certa = it.itens.map((_, i) => i).join(",");
    if (it.tipo === "venn") it.certa = it.pinta ? it.pinta.slice().sort().join(",") : Object.keys(it.regioes).sort().map((k) => `${k}=${it.regioes[k]}`).join(",");
    if (it.tipo === "ponto" || it.tipo === "reta" || it.tipo === "circunferencia") it.certa = "certo";
    if (it.tipo === "regiao") it.certa = it.lados.join(",");
    if (it.tipo === "ciclo" && it.certas) it.certa = it.certas.slice().sort((x, y) => x - y).join(",");
    if (it.tipo === "ciclo" && it.arco) it.certa = `${it.arco.de}>${it.arco.ate}`;
    if (it.tipo === "barras") it.certa = it.valores.join(";");
    if (it.tipo === "curva") it.certa = it.parametros.map((p) => it.alvo[p.nome]).join(";");
  }
  const PALPITES = Object.fromEntries(ITENS.filter((i) => i.tipo === "palpite").map((i) => [i.id, i]));
  // O vídeo corrido: um ponto a mais, só do modo "só assistir", que junta todos os trechos gravados.
  const VIDEOS = ITENS.filter((i) => i.tipo === "video" && !i.em_gravacao);
  const inicio = (v) => v.tempo.split(" a ")[0], fimDe = (v) => v.tempo.split(" a ").pop();
  const seg = (m) => { const [a, b] = m.split(":").map(Number); return a * 60 + b; };
  const CORRIDO = VIDEOS.length ? { parada: "Ver", detalhe: `a aula inteira · ${inicio(VIDEOS[0])} a ${fimDe(VIDEOS.at(-1))}`, telas: [{ nome: "A aula inteira", aviso: "sem interrupções", itens: [{ tipo: "corrido", _k: ITENS.length }] }] } : null;
  if (CORRIDO) ITENS.push(CORRIDO.telas[0].itens[0]);
  // Onde o vídeo corrido passa por uma questão que o passo a passo manda tentar antes: minuto → o Mexer.
  const MEXER_ANTES = {};
  PONTOS.forEach((p, i) => { const ant = PONTOS[i - 1], v = p.parada === "Ver" && p.telas[0].itens.find((x) => x.tipo === "video" && !x.em_gravacao); if (v && ant && ant.parada === "Mexer") MEXER_ANTES[inicio(v)] = ant; });
  const VIAS = { passo: PONTOS, assistir: CORRIDO ? [...PONTOS.filter((p) => p.parada === "Antes"), CORRIDO, ...PONTOS.filter((p) => !["Mexer", "Ver", "Antes"].includes(p.parada))] : PONTOS };
  const estados = ITENS.map(() => ({}));
  const S = (it) => estados[it._k], K = (it, x = "") => `i${it._k}${x}`;
  const E = { modo: "passo", ponto: 0, anima: null, vistos: new Set([PONTOS[0]]), tocou: false, entregue: false, passou: false, visitante: false, avisado: false,
    formato: "automático", minuto: null, aviso: null, gaveta: null, rascunho: "", notas: [], duvida: "", duvidas: [], registro: [] };
  window.__registro = E.registro; // o que a plataforma vai gravar (spec: "O que medir")
  const V = () => VIAS[E.modo], P = () => V()[E.ponto], T = (p) => p._t || 0;

  // ---------- utilitários ----------
  function el(tag, attrs, ...filhos) {
    const no = ["svg", "path", "circle", "g", "text", "line", "rect", "defs", "filter", "feTurbulence", "feDisplacementMap", "clipPath", "mask"].includes(tag) ? document.createElementNS(SVG, tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "onclick") no.addEventListener("click", v);
      else no.setAttribute(k, v === true ? "" : v);
    }
    for (const f of filhos.flat(4)) if (f != null && f !== false) no.append(...(typeof f === "string" && f.includes("[[") ? formulas(f) : [f]));
    return no;
  }
  // Fórmula no texto: "a razão é [[\\dfrac{8}{5}]]". Quem monta a página já traz cada fórmula desenhada
  // (MathML, em A.formulas); sem isso, aparece o texto da fórmula.
  function formulas(txt) {
    return txt.split(/\[\[(.+?)\]\]/).map((parte, i) => {
      if (i % 2 === 0) return parte;
      const no = document.createElement("span"), pronta = (A.formulas || {})[parte];
      no.className = "fm";
      if (pronta) no.innerHTML = pronta; else no.textContent = parte;
      return no;
    }).filter((x) => x !== "");
  }
  const an = (chave) => (E.anima === chave ? " escreve" : "");
  // A animação fala a língua dos vídeos da Escalada: a caneta traça (.traca), pontilha (.pinga), escreve
  // (.escreve), o que entra em cena surge (.surge) e o marca-texto passa por trás (.grifa). Tudo em fila,
  // pelo atraso; quem pediu menos movimento ao aparelho vê o desenho pronto.
  // O som é discreto e sintetizado aqui mesmo (nenhum arquivo): a caneta que escreve, o acerto, o "ainda não"
  // e o selo. Liga e desliga no botão da via; a escolha fica guardada no aparelho.
  const SOM = { ligado: true, ctx: null };
  SOM.ligado = false; // preference only for this anonymous session
  function tocarSom(qual) {
    if (!SOM.ligado) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = (SOM.ctx ||= new AC()); if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime, saida = ctx.createGain(); saida.connect(ctx.destination);
      const nota = (freq, de, dura, tipo, vol) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = tipo; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t + de); g.gain.exponentialRampToValueAtTime(vol, t + de + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + de + dura); o.connect(g).connect(saida); o.start(t + de); o.stop(t + de + dura + 0.02); };
      if (qual === "certo") { nota(659, 0, 0.11, "sine", 0.05); nota(880, 0.09, 0.16, "sine", 0.05); }
      else if (qual === "nao") nota(196, 0, 0.14, "triangle", 0.05);
      else if (qual === "selo") { nota(523, 0, 0.1, "sine", 0.05); nota(659, 0.09, 0.1, "sine", 0.05); nota(784, 0.18, 0.22, "sine", 0.055); }
      else { // a caneta: um chiado curto, filtrado
        const n = Math.floor(ctx.sampleRate * 0.16), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const f = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); f.buffer = buf; bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 0.8; g.gain.value = 0.035;
        f.connect(bp).connect(g).connect(saida); f.start(t);
      }
    } catch { /* som é enfeite: se falhar, a aula segue */ }
  }
  // Que som cabe na animação que acabou de ser pedida.
  function somDe(anima) {
    if (!anima) return null;
    if (anima === "passou") return "selo";
    const mm = /^i(\d+)(\w*)$/.exec(anima); if (!mm) return null;
    if (mm[2] === "e") return "nao";
    if (mm[2]) return "caneta";
    const it = ITENS[Number(mm[1])];
    if (it.tipo === "palpite" || !RESPOSTA.includes(it.tipo)) return "caneta";
    return pronto(it) ? "certo" : S(it).m != null ? "nao" : "caneta";
  }
  const botaoSom = () => el("button", { type: "button", class: "quieto som", "aria-pressed": String(SOM.ligado), onclick: () => { SOM.ligado = !SOM.ligado; /* preference stays in this session */ if (SOM.ligado) tocarSom("certo"); pintar(); } }, SOM.ligado ? "Som: ligado" : "Som: desligado");
  const depois = (no, ms) => { if (no && no.style) no.style.animationDelay = `${ms}ms`; return no; };
  const estreia = (it) => { const s = S(it); if (s._v) return false; s._v = 1; return true; }; // a 1ª vez que o item aparece
  const traco = (classe, x1, y1, x2, y2, anima, ms) => depois(el("path", { class: classe + (anima ? " traca" : ""), d: `M${x1} ${y1}L${x2} ${y2}`, pathLength: "1" }), anima ? ms : 0);
  // Linha pontilhada que vai aparecendo, pingo por pingo.
  function pontilhado(x1, y1, x2, y2, anima, ms) {
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 2.6));
    return Array.from({ length: n + 1 }, (_, i) => depois(el("circle", { class: "pingo" + (anima ? " pinga" : ""), cx: x1 + ((x2 - x1) * i) / n, cy: y1 + ((y2 - y1) * i) / n, r: 0.55 }), anima ? ms + i * 28 : 0));
  }
  // A caneta risca um elemento de figura pronta (SVG do kit GEO): traço cheio é traçado; tracejado, texto e
  // preenchimento aparecem; ponto surge. Só com movimento permitido: sem ele, a figura já chega inteira.
  const MOVE = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
  function riscar(no, ms) {
    if (!MOVE) return no;
    const g = no.tagName.toLowerCase(), v = (a) => Number(no.getAttribute(a)), temTraco = no.getAttribute("stroke") && no.getAttribute("stroke") !== "none";
    if (!temTraco || no.hasAttribute("stroke-dasharray") || !["line", "path", "circle"].includes(g)) { no.classList.add(g === "circle" ? "surge" : "aparece"); return depois(no, ms); }
    let L = 1;
    if (g === "line") L = Math.hypot(v("x2") - v("x1"), v("y2") - v("y1")); else if (g === "circle") L = 2 * Math.PI * v("r"); else no.setAttribute("pathLength", "1");
    no.style.strokeDasharray = String(L); no.style.strokeDashoffset = String(L); no.classList.add("risca");
    return depois(no, ms);
  }
  // A figura do kit GEO vestida como nos vídeos do quadro: traço de caneta tremido, rótulo à mão, azul para o que é
  // dado e vermelho para o que se descobre (o que chega depois do 1º passo), marca-texto atrás do traço em destaque.
  // Grade, eixos e cotas continuam impressos: são o papel.
  function quadro(svg, filhos, descobertos) {
    const [, , W, H] = svg.getAttribute("viewBox").split(" "), grifos = new Map(), PAPEL = ["#dbe4ee", "#34475a", "#56626e"];
    svg.prepend(el("defs", null, el("filter", { id: "mao-d", filterUnits: "userSpaceOnUse", x: 0, y: 0, width: W, height: H },
      el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: "2", seed: "3" }), el("feDisplacementMap", { in: "SourceGraphic", scale: "2.4" }))));
    for (const x of filhos) {
      const g = x.tagName.toLowerCase(), traco = x.getAttribute("stroke"), novo = descobertos.has(x);
      if (g === "text") { if (x.getAttribute("font-size") !== "10" && x.getAttribute("fill") !== "#34475a") x.classList.add("mao-d", novo ? "d-descobre" : "d-dado"); continue; }
      if ((x.getAttribute("fill") || "").startsWith("rgba")) x.classList.add(novo ? "d-marca" : "d-vazio");
      if (!traco || PAPEL.includes(traco)) continue;
      x.classList.add("caneta-d");
      if (traco === "#173f7a") { const grifo = x.cloneNode(false); grifo.setAttribute("class", "d-grifo"); x.before(grifo); grifos.set(x, grifo); x.classList.add(novo ? "d-descobre" : "d-dado"); }
      else x.classList.add(traco === "#7f9cc4" ? "d-dado" : "d-tinta");
    }
    return grifos;
  }
  // ---------- sólidos: projeção ortográfica própria, em SVG (sem biblioteca) ----------
  // Mundo: x para a direita, y para o fundo, z para cima. A câmera gira em torno de z (a) e sobe (b, de 0 = de
  // frente a 90 = de cima). Na projeção ortográfica, "de frente", "de lado" e "de cima" são as vistas exatas.
  // Sem O, V e W, que são nomes de centro e de vértice de cima e de baixo: com 15 ou mais vértices, a letra O
  // batia com o centro (o dodecaedro perdia um vértice).
  const NOMES_V = "ABCDEFGHIJKLMNPQRSTUXYZ", GRAU = Math.PI / 180;
  // As faces de um poliedro convexo, achadas pelos vértices: um plano por três deles é face quando todos os outros
  // ficam do mesmo lado. Devolve cada face com os vértices em volta, no sentido anti-horário visto de fora.
  function facesConvexas(V) {
    const nomes = Object.keys(V), pts = nomes.map((n) => V[n]), menos3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], x3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], p3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const faces = new Map(), n = pts.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
      let nor = x3(menos3(pts[j], pts[i]), menos3(pts[k], pts[i])); const tam = Math.hypot(...nor); if (tam < 1e-9) continue; nor = nor.map((v) => v / tam);
      const ds = pts.map((p) => p3(nor, menos3(p, pts[i]))); if (!(ds.every((v) => v < 1e-7) || ds.every((v) => v > -1e-7))) continue;
      if (ds.some((v) => v > 1e-7)) nor = nor.map((v) => -v);
      const idx = ds.map((v, q) => (Math.abs(v) < 1e-7 ? q : -1)).filter((q) => q >= 0), chave = idx.join(","); if (faces.has(chave)) continue;
      const c = [0, 1, 2].map((e) => idx.reduce((s, q) => s + pts[q][e], 0) / idx.length); let u = menos3(pts[idx[0]], c); const tu = Math.hypot(...u); u = u.map((v) => v / tu); const w = x3(nor, u);
      faces.set(chave, idx.map((q) => [Math.atan2(p3(menos3(pts[q], c), w), p3(menos3(pts[q], c), u)), nomes[q]]).sort((a, b) => a[0] - b[0]).map((a) => a[1]));
    }
    return [...faces.values()];
  }
  function corpoDe(d) {
    const V = {}, faces = [], h = d.altura || 0;
    if (d.forma === "prisma" || d.forma === "piramide") {
      let base;
      if (Array.isArray(d.base)) { const [x, y] = d.base; base = [[-x / 2, -y / 2], [x / 2, -y / 2], [x / 2, y / 2], [-x / 2, y / 2]]; }
      else { const n = d.base.lados, R = d.base.lado / (2 * Math.sin(Math.PI / n)); base = Array.from({ length: n }, (_, i) => { const t = -Math.PI / 2 - Math.PI / n + (i * 2 * Math.PI) / n; return [R * Math.cos(t), R * Math.sin(t)]; }); }
      const n = base.length, B = base.map((_, i) => NOMES_V[i]);
      base.forEach(([x, y], i) => { V[B[i]] = [x, y, -h / 2]; });
      faces.push(B.slice().reverse());
      if (d.forma === "prisma") {
        const T = base.map((_, i) => NOMES_V[n + i]);
        base.forEach(([x, y], i) => { V[T[i]] = [x, y, h / 2]; });
        faces.push(T); B.forEach((_, i) => faces.push([B[i], B[(i + 1) % n], T[(i + 1) % n], T[i]]));
      } else if (d.topo) { // tronco de pirâmide: a base de cima é a de baixo encolhida
        const T = base.map((_, i) => NOMES_V[n + i]);
        base.forEach(([x, y], i) => { V[T[i]] = [x * d.topo, y * d.topo, h / 2]; });
        faces.push(T); B.forEach((_, i) => faces.push([B[i], B[(i + 1) % n], T[(i + 1) % n], T[i]])); V.P = [0, 0, h / 2];
      } else { V.V = [0, 0, h / 2]; B.forEach((_, i) => faces.push([B[i], B[(i + 1) % n], "V"])); }
      V.O = [0, 0, -h / 2];
    } else if (d.forma === "octaedro") {
      const a = d.aresta / Math.SQRT2; Object.assign(V, { A: [a, 0, 0], B: [0, a, 0], C: [-a, 0, 0], D: [0, -a, 0], V: [0, 0, a], W: [0, 0, -a], O: [0, 0, 0] });
      ["A", "B", "C", "D"].forEach((p, i, l) => { const q = l[(i + 1) % 4]; faces.push([p, q, "V"], [q, p, "W"]); });
    } else if (d.forma === "icosaedro" || d.forma === "dodecaedro") {
      const fi = (1 + Math.sqrt(5)) / 2, gira = ([x, y, z]) => [[x, y, z], [z, x, y], [y, z, x]], pm = [1, -1], lista = [];
      if (d.forma === "icosaedro") { for (const a of pm) for (const b of pm) lista.push(...gira([0, a, b * fi])); lista.forEach((p, i) => { V[NOMES_V[i]] = p.map((v) => (v * d.aresta) / 2); }); }
      else { for (const a of pm) for (const b of pm) { for (const c2 of pm) lista.push([a, b, c2]); lista.push(...gira([0, a / fi, b * fi])); } lista.forEach((p, i) => { V[NOMES_V[i]] = p.map((v) => (v * d.aresta * fi) / 2); }); }
      faces.push(...facesConvexas(V)); V.O = [0, 0, 0];
    } else if (d.forma === "esfera") {
      const r = d.raio, t0 = -30 * GRAU; V.O = [0, 0, 0]; V.A = [r * Math.cos(t0), r * Math.sin(t0), 0]; V.N = [0, 0, r];
    } else if (d.forma === "cilindro" || d.forma === "cone") {
      const r = d.raio, t0 = -30 * GRAU;
      V.O = [0, 0, -h / 2]; V.A = [r * Math.cos(t0), r * Math.sin(t0), -h / 2];
      const r2 = d.forma === "cone" ? d.raio_menor || 0 : r;
      if (!r2) V.V = [0, 0, h / 2]; else { V.P = [0, 0, h / 2]; V.B = [(V.A[0] * r2) / r, (V.A[1] * r2) / r, h / 2]; }
    }
    for (const [nome, de] of Object.entries(d.pontos || {})) V[nome] = [0, 1, 2].map((k) => de.reduce((s, q) => s + V[q][k], 0) / de.length);
    return { V, faces };
  }
  function solidoSVG(svg, it, a, b) {
    const d = it.solido, ca = Math.cos(a * GRAU), sa = Math.sin(a * GRAU), cb = Math.cos(b * GRAU), sb = Math.sin(b * GRAU), m = it.marca || {};
    const pr = ([x, y, z]) => { const x1 = x * ca - y * sa, y1 = x * sa + y * ca; return [x1, z * cb + y1 * sb, z * sb - y1 * cb]; };
    const nos = [], P = (cls, pts, fecha) => el("path", { class: cls, d: "M" + pts.map((p) => `${(p[0] * E_).toFixed(1)} ${(-p[1] * E_).toFixed(1)}`).join("L") + (fecha ? "Z" : "") });
    let E_ = 1;
    if (d.forma === "cubinhos") {
      const linhas = d.pilhas, nl = linhas.length, nc = Math.max(...linhas.map((l) => l.length)), nz = Math.max(...linhas.flat()), tem = (c, l, k) => k >= 0 && (linhas[l] || [])[c] > k;
      E_ = 250 / Math.hypot(nc, nl, nz);
      const F = [[[0, 0, 1], [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], "cima"], [[0, 0, -1], [[0, 1, 0], [1, 1, 0], [1, 0, 0], [0, 0, 0]], "cima"],
        [[0, -1, 0], [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], "frente"], [[0, 1, 0], [[1, 1, 0], [0, 1, 0], [0, 1, 1], [1, 1, 1]], "frente"],
        [[1, 0, 0], [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], "lado"], [[-1, 0, 0], [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]], "lado"]];
      const vis = [];
      linhas.forEach((linha, l) => linha.forEach((alt, c) => { for (let k = 0; k < alt; k++) for (const [n, q, tom] of F) {
        const y = nl - 1 - l; // a 1ª linha da lista é o fundo; a última, a frente
        if (tem(c + n[0], l - n[1], k + n[2])) continue;
        if (pr(n)[2] - pr([0, 0, 0])[2] < 1e-6) continue;
        const pts = q.map(([i, j, w]) => pr([c + i - nc / 2, y + j - nl / 2, k + w - nz / 2]));
        vis.push([pts.reduce((s, p) => s + p[2], 0) / 4, P("cubo-" + tom, pts, true)]);
      } }));
      vis.sort((x, y) => x[0] - y[0]); nos.push(el("g", { class: "caneta-s" }, vis.map((v) => v[1])));
    } else {
      const { V, faces } = corpoDe(d), Q = Object.fromEntries(Object.entries(V).map(([k, p]) => [k, pr(p)]));
      E_ = 125 / Math.max(...Object.values(V).map((p) => Math.hypot(...p)));
      const ocultas = [], visiveis = [], grifos = [], rot = [];
      if (d.forma === "esfera") E_ = 118 / d.raio;
      if (faces.length) {
        const frente = faces.map((f) => { let s = 0; f.forEach((n, i) => { const p = Q[n], q = Q[f[(i + 1) % f.length]]; s += p[0] * q[1] - q[0] * p[1]; }); return s > 1e-9; }), arestas = new Map();
        faces.forEach((f, i) => f.forEach((n, j) => { const o = f[(j + 1) % f.length], k = [n, o].sort().join(); arestas.set(k, (arestas.get(k) || false) || frente[i]); }));
        for (const f of m.faces || []) { const i = faces.findIndex((g) => g.length === f.length && f.every((n) => g.includes(n))); grifos.push(P("face-s" + (i >= 0 && !frente[i] ? " atras" : ""), f.map((n) => Q[n]), true)); }
        for (const [k, v] of arestas) (v ? visiveis : ocultas).push(P(v ? "aresta" : "aresta oculta", k.split(",").map((n) => Q[n])));
      } else if (d.forma === "esfera") {
        const r = d.raio, N = 60, aro = Array.from({ length: N + 1 }, (_, i) => { const t = (i / N) * 2 * Math.PI; return [t, pr([r * Math.cos(t), r * Math.sin(t), 0])]; });
        visiveis.push(P("aresta", Array.from({ length: 73 }, (_, i) => [r * Math.cos((i * Math.PI) / 36), r * Math.sin((i * Math.PI) / 36), 0]), true));
        let atual = null; for (const [t, p] of aro) { const f = Math.sin(t + a * GRAU) < 0 || sb > 0.999; if (!atual || atual.f !== f) { if (atual) atual.pts.push(p); atual = { f, pts: [] }; (f ? visiveis : ocultas).push(atual); } atual.pts.push(p); }
        [visiveis, ocultas].forEach((l, vis) => l.forEach((x, i) => { if (x.pts) l[i] = P(vis ? "aresta oculta" : "aresta fina", x.pts); }));
      } else {
        const r = d.raio, h = d.altura, N = 60, r2 = d.forma === "cone" ? d.raio_menor || 0 : r, cone = r2 !== r, k = cone ? ((r - r2) * sb) / (h * cb || 1e-9) : 0;
        const aro = (z) => Array.from({ length: N + 1 }, (_, i) => { const t = (i / N) * 2 * Math.PI; return [t, pr([r * Math.cos(t), r * Math.sin(t), z])]; });
        const naFrente = (t) => (cone ? Math.sin(t + a * GRAU) < k : Math.sin(t + a * GRAU) < 0) || sb > 0.999;
        const partes = (pts, teste) => { const out = []; let atual = null; for (const [t, p] of pts) { const v = teste(t); if (!atual || atual.v !== v) { if (atual) atual.pts.push(p); atual = { v, pts: [] }; out.push(atual); } atual.pts.push(p); } return out; };
        for (const s of partes(aro(-h / 2), naFrente)) (s.v ? visiveis : ocultas).push(P(s.v ? "aresta" : "aresta oculta", s.pts));
        if (r2) visiveis.push(P("aresta", Array.from({ length: N + 1 }, (_, i) => { const t = (i / N) * 2 * Math.PI; return pr([r2 * Math.cos(t), r2 * Math.sin(t), h / 2]); }), true));
        const tg = cone ? (Math.abs(k) < 1 ? [Math.asin(k) - a * GRAU, Math.PI - Math.asin(k) - a * GRAU] : []) : [-a * GRAU, Math.PI - a * GRAU];
        for (const t of tg) visiveis.push(P("aresta", [pr([r * Math.cos(t), r * Math.sin(t), -h / 2]), pr([r2 * Math.cos(t), r2 * Math.sin(t), h / 2])]));
      }
      const seg = (m.segmentos || []).map(([p, q]) => [P("d-grifo", [Q[p], Q[q]]), P("seg-s", [Q[p], Q[q]])]);
      const nomes = new Set([...(m.rotulos || []), ...(m.segmentos || []).flat()]);
      for (const n of nomes) { const p = Q[n], r = Math.hypot(p[0], p[1]) || 1, fx = p[0] / r, fy = p[1] / r;
        rot.push(el("circle", { class: "ponto-s", cx: p[0] * E_, cy: -p[1] * E_, r: 2.6 }), el("text", { class: "mao-d", x: p[0] * E_ + fx * 13, y: -p[1] * E_ - fy * 13 + 7, "text-anchor": "middle" }, n)); }
      for (const [p, q, txt] of m.medidas || []) { const x = (Q[p][0] + Q[q][0]) / 2, y = (Q[p][1] + Q[q][1]) / 2, dx = Q[q][0] - Q[p][0], dy = Q[q][1] - Q[p][1], L = Math.hypot(dx, dy) || 1, s = (-dy * x + dx * y) >= 0 ? 1 : -1;
        rot.push(el("text", { class: "mao-d d-descobre", x: x * E_ + (s * -dy / L) * 14, y: -y * E_ - (s * dx / L) * 14 + 7, "text-anchor": "middle" }, txt)); }
      const internos = [];
      if (d.dentro) { const di = d.dentro, c0 = di.centro || [0, 0, 0], soma = (p) => [p[0] + c0[0], p[1] + c0[1], p[2] + c0[2]];
        if (di.forma === "esfera") { const o = pr(c0), r = di.raio;
          internos.push(P("aresta dentro", Array.from({ length: 73 }, (_, i) => [o[0] + r * Math.cos((i * Math.PI) / 36), o[1] + r * Math.sin((i * Math.PI) / 36), 0]), true),
            P("aresta dentro fina", Array.from({ length: 73 }, (_, i) => pr(soma([r * Math.cos((i * Math.PI) / 36), r * Math.sin((i * Math.PI) / 36), 0]))), true));
        } else { const c2 = corpoDe(di), vistas = new Set(); for (const f of c2.faces) f.forEach((n, j) => { const o = f[(j + 1) % f.length], k = [n, o].sort().join(); if (vistas.has(k)) return; vistas.add(k); internos.push(P("aresta dentro", [pr(soma(c2.V[n])), pr(soma(c2.V[o]))])); }); } }
      nos.push(grifos, el("g", { class: "caneta-s" }, ocultas, visiveis), internos, seg, rot);
    }
    svg.replaceChildren(el("defs", null, el("filter", { id: "mao-s", filterUnits: "userSpaceOnUse", x: -160, y: -160, width: 320, height: 320 },
      el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: "2", seed: "5" }), el("feDisplacementMap", { in: "SourceGraphic", scale: "2.2" }))), ...nos.flat(4).filter(Boolean));
  }
  // ---------- gráficos feitos dos dados (barras, linha, setores), no traço do quadro ----------
  const GR = { w: 320, h: 224, e: 30, d: 8, c: 22, b: 30 };
  const filtroMao = (id, w, h) => el("defs", null, el("filter", { id, filterUnits: "userSpaceOnUse", x: 0, y: 0, width: w, height: h },
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: "2", seed: "7" }), el("feDisplacementMap", { in: "SourceGraphic", scale: "2" })));
  const barraD = (x, l, yb, yt) => `M${(x - l / 2).toFixed(1)} ${yb.toFixed(1)}V${yt.toFixed(1)}H${(x + l / 2).toFixed(1)}V${yb.toFixed(1)}`;
  function papelG(it) {
    const ex = it.eixo, y0 = ex.min || 0, y1 = ex.max, n = it.categorias.length, larg = (GR.w - GR.e - GR.d) / n, alto = GR.h - GR.c - GR.b;
    const Y = (v) => GR.c + ((y1 - v) / (y1 - y0)) * alto, X = (i) => GR.e + larg * (i + 0.5), V = (py) => y0 + ((GR.h - GR.b - py) / alto) * (y1 - y0), papel = [];
    for (let v = y0; v <= y1 + 1e-9; v += ex.passo) papel.push(el("line", { class: Math.abs(v - y0) < 1e-9 ? "eixo" : "grade-l", x1: GR.e, y1: Y(v), x2: GR.w - GR.d, y2: Y(v) }), el("text", { class: "marca", x: GR.e - 4, y: Y(v) + 3, "text-anchor": "end" }, num(Math.round(v * 1000) / 1000)));
    it.categorias.forEach((c, i) => papel.push(el("text", { class: "marca cat", x: X(i), y: GR.h - GR.b + 14, "text-anchor": "middle" }, c)));
    if (ex.unidade) papel.push(el("text", { class: "marca", x: 3, y: 9 }, ex.unidade));
    return { Y, X, V, larg, y0, y1, papel };
  }
  // ---------- conjuntos: o diagrama de Venn de 2 ou 3 conjuntos ----------
  // Regiões pelo nome das letras: "A", "AB", "ABC"… e "fora". Cada região é desenhada por recorte (dentro dos
  // círculos da chave) e máscara (fora dos outros), para poder ser pintada e tocada sozinha.
  const VENN = {
    2: { r: 70, c: { A: [120, 116], B: [200, 116] }, n: { A: [84, 122], AB: [160, 122], B: [236, 122], fora: [294, 206] }, t: { A: [92, 34, "middle"], B: [228, 34, "middle"] } },
    3: { r: 58, c: { A: [122, 84], B: [198, 84], C: [160, 150] }, n: { A: [97, 80], B: [223, 80], C: [160, 186], AB: [160, 66], AC: [128, 131], BC: [192, 131], ABC: [160, 113], fora: [24, 208] },
      t: { A: [72, 22, "middle"], B: [248, 22, "middle"], C: [220, 204, "start"] } } };
  let vennId = 0;
  const regioesDe = (n) => (n === 2 ? ["A", "AB", "B", "fora"] : ["A", "B", "C", "AB", "AC", "BC", "ABC", "fora"]);
  const nomeRegiao = (k, nomes) => { if (k === "fora") return "fora dos conjuntos"; const L = "ABC".slice(0, nomes.length).split(""), d = k.split("").map((l) => nomes[L.indexOf(l)]), f = L.filter((l) => !k.includes(l)).map((l) => nomes[L.indexOf(l)]);
    return d.length === 1 ? `só ${d[0]}` : !f.length ? (L.length === 2 ? d.join(" e ") : "os três") : `${d.join(" e ")}, sem ${f[0]}`; };
  function vennBase(n) {
    const G = VENN[n], L = Object.keys(G.c), id = `v${++vennId}`, subs = [];
    for (let m = 1; m < 1 << L.length; m++) subs.push(L.filter((_, i) => m & (1 << i)));
    const defs = el("defs", null, filtroMao(id + "f", 320, 220).firstChild, L.map((l) => el("clipPath", { id: id + "c" + l }, el("circle", { cx: G.c[l][0], cy: G.c[l][1], r: G.r }))),
      subs.map((s) => el("mask", { id: id + "m" + s.join(""), maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 320, height: 220 }, el("rect", { x: 0, y: 0, width: 320, height: 220, fill: "#fff" }), s.map((l) => el("circle", { cx: G.c[l][0], cy: G.c[l][1], r: G.r, fill: "#000" })))));
    const regiao = (k, cls) => { const dentro = k === "fora" ? [] : k.split(""), fora = L.filter((l) => !dentro.includes(l));
      let no = el("rect", { x: 5, y: 5, width: 310, height: 210, class: cls, mask: fora.length ? `url(#${id}m${fora.join("")})` : null }); for (const l of dentro) no = el("g", { "clip-path": `url(#${id}c${l})` }, no); return no; };
    const onde = (x, y) => { const k = L.filter((l) => Math.hypot(x - G.c[l][0], y - G.c[l][1]) <= G.r).join(""); return k || (x >= 5 && x <= 315 && y >= 5 && y <= 215 ? "fora" : null); };
    return { G, L, id, defs, regiao, onde };
  }
  const TREMIDO = () => el("defs", null, el("filter", { id: "tremido", x: "-5%", y: "-5%", width: "110%", height: "110%" },
    el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.9", numOctaves: "1", seed: "3", result: "r" }), el("feDisplacementMap", { in: "SourceGraphic", in2: "r", scale: "0.7" })));
  const num = (v) => String(Math.round(v * 100) / 100).replace(".", ",");
  const linha = (texto, classe, chave) => el("p", { class: `linha${classe ? " " + classe : ""}${an(chave)}` }, texto);
  const nota = (texto) => texto && el("p", { class: "nota" }, texto);
  const fala = (...f) => el("div", { class: "fala", "aria-live": "polite" }, f);
  const dado = (t) => ({ t, k: "dado" });
  const vazia = { t: "?", k: "vazia" };
  const riscado = (t) => el("span", { class: "riscado" }, t);
  const visto = () => el("span", { class: "visto", "aria-label": "certo" }, "✓");
  const botao = (texto, aoTocar, classe = "seguir", desligado) => el("button", { type: "button", class: classe, disabled: desligado, onclick: aoTocar }, texto);
  const ir = (mudar) => () => { mudar(); pintar(null, true); };
  const pares = (it) => it.opcoes.map((o) => (Array.isArray(o) ? o : [o, null]));
  // "R$ 6,00" → { v: 6, mostra(12) = "R$ 12,00" }: o motor faz a conta do erro com o número da célula.
  function ler(txt) {
    const m = /\d+(?:[   .]\d{3})*(?:,\d+)?/.exec(txt), bruto = m[0], casas = (bruto.split(",")[1] || "").length;
    return { v: Number(bruto.replace(/[   .]/g, "").replace(",", ".")),
      mostra: (x) => txt.slice(0, m.index) + (casas ? x.toFixed(casas).replace(".", ",") : num(x)) + txt.slice(m.index + bruto.length) };
  }
  const aplicar = (op, v) => { const k = Number(op.slice(1).replace(",", ".")); return { "×": v * k, "÷": v / k, "+": v + k, "−": v - k }[op[0]]; };

  function seta(lado, rotulo, f = {}) {
    const d = lado === "esq" ? "M62 28 C34 34 34 78 60 84 M60 84 l-9 -8 M60 84 l-11 4" : "M6 28 C34 34 34 78 8 84 M8 84 l9 -8 M8 84 l11 4";
    return el("div", { class: `seta ${lado}${f.espera ? " espera" : ""}${f.traca ? " traca" : ""}` },
      el("svg", { viewBox: "0 0 68 112", "aria-hidden": "true" }, el("path", { d, pathLength: "1" })),
      el("span", { class: "rotulo" + (String(rotulo).length > 2 ? " longo" : "") + (f.traca ? " escreve" : "") }, rotulo));
  }
  // linhas: [[célula, célula], ...]; célula = { t, k: dado | escrito | vazia, chave, antes (nó), depois (nó) }
  function mesa(colunas, linhas, setas) {
    return el("div", { class: "mesa" },
      el("div", { class: "col c1" }, colunas[0]), el("div", { class: "col c2" }, colunas[1]),
      linhas.map((l) => l.map((c, i) => el("div", { class: `cel c${i + 1} ${c.k}${c.chave ? an(c.chave) : ""}` }, c.antes, c.t, c.depois))),
      setas);
  }
  function botoes(lista, { marcado, rotulo, nao, aoTocar }) {
    const figs = lista.some(temFig);
    return el("div", { class: "bandeja" + (figs ? " figuras" : lista.some((s) => s.length > 3) ? " valores" : "") }, lista.map((s, i) => el("button", {
      type: "button", class: "resp" + (nao === i ? " nao" : ""), "aria-pressed": marcado == null ? null : String(marcado === i),
      "aria-label": temFig(s) ? `figura ${i + 1}: ${s.figura.alt}` : rotulo ? rotulo(s) : null, onclick: () => aoTocar(i, s),
    }, temFig(s) ? [img(s.figura, "fig-op"), el("small", null, s.texto || String(i + 1))] : s)));
  }
  // A questão com alternativas: impressa (no quadro) ou para circular a letra.
  function alternativas(q, f = {}) {
    const corpo = f.aoMarcar
      ? el("div", { class: "circular", role: "group" }, q.alternativas.map((a, i) => el("button", {
          type: "button", "aria-pressed": String(f.marcada === i), disabled: f.travada, "data-res": f.res ? f.res(i) : null, onclick: () => f.aoMarcar(i),
        }, el("span", { class: "letra" }, "ABCDE"[i]), el("span", null, temFig(a) ? [img(a.figura, "fig-op"), a.texto] : a))))
      : el("ul", { class: "alts" }, q.alternativas.map((a, i) => el("li", { class: f.circula && i === q.certa ? "certa" : null }, el("span", { class: "l" }, "ABCDE"[i]), el("span", null, temFig(a) ? [img(a.figura, "fig-op"), a.texto] : a))));
    return [q.fonte && el("p", { class: "fonte" }, q.fonte), el("p", { class: q.fonte ? "enunciado" : "situacao" }, q.texto), q.tabela && tabelao(q.tabela.colunas, q.tabela.linhas, q.tabela.rotulos), figura(q.figura), corpo];
  }
  // A figura da questão (o gráfico original da prova): inteira na largura da tela; um toque abre ampliada,
  // numa folha por cima, que rola para os lados. Fica fora do pintar(), para não fechar a cada resposta.
  const origem = (f) => f.url || (window.AULA_FIGURAS || {})[f.arquivo]; // protótipo: embutida; plataforma: endereço
  function figura(f) {
    if (!f) return null;
    if (Array.isArray(f)) return f.map(figura); // mais de uma figura na mesma questão
    return el("button", { type: "button", class: "figura", "aria-label": `${TX.ampliar}: ${f.alt}`, onclick: () => ampliar(f) },
      el("img", { src: origem(f), alt: f.alt, loading: "lazy" }), el("span", { "aria-hidden": "true" }, TX.ampliar));
  }
  // Opção que é uma figura (alternativa de questão ou botão de decisão): { figura: { arquivo, alt }, texto? }.
  const temFig = (o) => !!o && typeof o === "object" && !Array.isArray(o);
  const img = (f, classe) => el("img", { src: origem(f), alt: f.alt, class: classe, loading: "lazy" });
  const nomeDe = (o, i) => (temFig(o) ? `figura ${i + 1}` : o);
  // Tabela com mais de duas colunas (ou matriz, sem cabeçalho): só o que é dado; "cel" troca uma célula.
  function tabelao(colunas, linhas, rotulos, cel) {
    return el("div", { class: "rola" }, el("table", { class: "tq grade" + (colunas ? "" : " matriz") },
      colunas && el("thead", null, el("tr", null, colunas.map((c) => el("th", { scope: "col" }, c)))),
      el("tbody", null, linhas.map((l, i) => el("tr", null, l.map((c, j) => (cel && cel(i, j)) || el("td", { class: rotulos && j === 0 ? "rot" : null }, c)))))));
  }
  function ampliar(f) {
    const volta = document.activeElement, img = el("img", { src: origem(f), alt: f.alt });
    const fechar = () => { document.removeEventListener("keydown", tecla); lupa.remove(); if (volta && volta.focus) volta.focus(); };
    const tecla = (e) => { if (e.key === "Escape") fechar(); };
    const sair = el("button", { type: "button", class: "lupa-fechar", onclick: fechar }, TX.fechar);
    const rolo = el("div", { class: "lupa-rolo", tabindex: "0" }, img);
    const lupa = el("div", { class: "lupa", role: "dialog", "aria-modal": "true", "aria-label": f.alt }, el("div", { class: "lupa-topo" }, el("span", null, TX.arraste), sair), rolo);
    lupa.addEventListener("click", (e) => { if (e.target === lupa || e.target === rolo) fechar(); });
    document.addEventListener("keydown", tecla);
    raiz.parentNode.append(lupa);
    rolo.scrollLeft = (rolo.scrollWidth - rolo.clientWidth) / 2;
    sair.focus();
  }
  // Tocar no valor que falta numa célula (da grade ou de uma matriz): "tab" desenha a tabela com a célula no lugar.
  function celula(it, c, tab) {
    const s = S(it), ops = pares(it), m = s.m, ok = m === it.certa;
    const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta)];
    const vazia = () => el("td", { class: "falta" }, "?"), escrita = (t, extra, antes, depois) => el("td", { class: "falta escrita" + (extra || "") }, antes, t, depois);
    if (c.prova) {
      const cel = m == null ? vazia() : !c.fim ? escrita(ops[m][0], an(K(it))) : escrita(ops[it.certa][0], "", !ok && riscado(ops[m][0]), ok && visto());
      return [topo, tab(cel), !c.fim && botoes(ops.map((o) => o[0]), { marcado: m, aoTocar: (i) => { s.m = i; tocar(); pintar(K(it)); } }), c.fim && nota(it.comentario)];
    }
    const cel = ok ? escrita(ops[m][0], an(K(it)), null, visto()) : m != null ? el("td", { class: "falta" }, riscado(ops[m][0]), " ?") : vazia();
    return [topo, tab(cel), !ok && el("p", { class: "pedido" }, TX.celula),
      !ok && botoes(ops.map((o) => o[0]), { nao: E.anima === K(it) && m != null ? m : null, aoTocar: (i) => { primeira(it, i); s.m = i; tocar(); pintar(K(it)); } }),
      fala(m != null && [linha(ok ? TX.certo : TX.errado, ok ? "certo" : "corrige", K(it)), nota(ops[m][1] || (ok && it.comentario))])];
  }
  // A ordem em que os itens de "ordenar" aparecem: sempre a mesma, nunca a certa.
  function embaralha(n) { const o = Array.from({ length: n }, (_, i) => (i + Math.ceil(n / 2)) % n); if (n > 3) [o[0], o[1]] = [o[1], o[0]]; return o; }
  // O plano da "curva": janela { x: [de, até], y: [de, até] }; com pi: true, o eixo x anda em passos de π/2.
  const PL = { w: 320, h: 220, e: 26, d: 8, c: 8, b: 20 };
  const menos = (v) => num(v).replace("-", "−");
  const coef = (v) => (v === 1 ? "" : v === -1 ? "−" : menos(v));
  const mais = (v) => (v === 0 ? "" : v > 0 ? ` + ${num(v)}` : ` − ${num(-v)}`);
  const FAMILIAS = { seno: (p, x) => p.a * Math.sin(p.b * x) + p.c, cosseno: (p, x) => p.a * Math.cos(p.b * x) + p.c, reta: (p, x) => p.a * x + p.b,
    parabola: (p, x) => p.a * (x - p.h) ** 2 + p.k, exponencial: (p, x) => p.a * p.b ** x,
    modulo: (p, x) => p.a * Math.abs(x - p.h) + p.k, logaritmo: (p, x) => (x > 0 ? (p.a * Math.log(x)) / Math.log(p.b) : NaN), cubica: (p, x) => p.a * (x - p.r) * (x - p.s) * (x - p.t) };
  const LEI = { seno: (p) => `y = ${coef(p.a)}sen(${coef(p.b)}x)${mais(p.c)}`, cosseno: (p) => `y = ${coef(p.a)}cos(${coef(p.b)}x)${mais(p.c)}`,
    reta: (p) => `y = ${coef(p.a)}x${mais(p.b)}`, parabola: (p) => `y = ${coef(p.a)}(x${mais(-p.h)})²${mais(p.k)}`, exponencial: (p) => `y = ${p.a === 1 ? "" : `${menos(p.a)} · `}${num(p.b)}ˣ`,
    modulo: (p) => `y = ${coef(p.a)}|x${mais(-p.h)}|${mais(p.k)}`, logaritmo: (p) => `y = ${coef(p.a)}log de x na base ${num(p.b)}`, cubica: (p) => `y = ${coef(p.a)}(x${mais(-p.r)})(x${mais(-p.s)})(x${mais(-p.t)})` };
  const escala = (it) => { const [x0, x1] = it.janela.x, [y0, y1] = it.janela.y, k = it.pi ? Math.PI : 1;
    return { X: (x) => PL.e + ((x - x0 * k) / ((x1 - x0) * k)) * (PL.w - PL.e - PL.d), Y: (y) => PL.c + ((y1 - y) / (y1 - y0)) * (PL.h - PL.c - PL.b), x0: x0 * k, x1: x1 * k, y0, y1 }; };
  // Curvas de cenário: outras curvas no mesmo plano (duas retas, a função e a inversa) e circunferências.
  const cenarioDe = (it) => (it.cenario || []).map((q) => { if (q.familia) return el("path", { class: "curva-cen", d: tracado(it, q.fixos, q.familia) });
    const { X, Y, x0, x1, y0, y1 } = escala(it), pt = (x, y) => `${X(x).toFixed(1)} ${Y(y).toFixed(1)}`;
    if (q.hiperbole) { const [cx, cy, a, b] = q.hiperbole, ramo = (s) => { const pts = []; for (let t = -2.6; t <= 2.6001; t += 0.1) { const x = cx + s * a * Math.cosh(t), y = cy + b * Math.sinh(t); if (x >= x0 - 0.2 && x <= x1 + 0.2 && y >= y0 - 0.2 && y <= y1 + 0.2) pts.push(pt(x, y)); } return pts.length > 1 ? "M" + pts.join("L") : ""; };
      return el("path", { class: "curva-cen", d: ramo(1) + ramo(-1) }); }
    const [cx, cy, a, b] = q.elipse || [q.circ[0], q.circ[1], q.circ[2], q.circ[2]];
    return el("path", { class: "curva-cen", d: "M" + Array.from({ length: 73 }, (_, i) => pt(cx + a * Math.cos((i * Math.PI) / 36), cy + b * Math.sin((i * Math.PI) / 36))).join("L") + "Z" }); });
  function tracado(it, p, familia) {
    const { X, Y, x0, x1, y0, y1 } = escala(it), f = FAMILIAS[familia || it.familia], folga = (y1 - y0) * 0.6; let d = "", solto = true;
    for (let i = 0; i <= 160; i++) { const x = x0 + ((x1 - x0) * i) / 160, y = f(p, x); if (!(y > y0 - folga && y < y1 + folga)) { solto = true; continue; } d += `${solto ? "M" : "L"}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`; solto = false; }
    return d;
  }
  function eixos(it) {
    const { X, Y, y0, y1 } = escala(it), nos = [], [jx0, jx1] = it.janela.x, k = it.pi ? Math.PI : 1, passo = it.pi ? 0.5 : 1;
    const pi = (v) => (v === 0 ? "0" : Number.isInteger(v) ? `${coef(v)}π` : `${coef(v * 2)}π/2`);
    for (let y = Math.ceil(y0); y <= y1; y++) { nos.push(el("line", { class: y === 0 ? "eixo" : "grade-l", x1: PL.e, y1: Y(y), x2: PL.w - PL.d, y2: Y(y) })); nos.push(el("text", { class: "marca", x: PL.e - 4, y: Y(y) + 3, "text-anchor": "end" }, menos(y))); }
    for (let x = Math.ceil(jx0 / passo) * passo; x <= jx1 + 1e-9; x += passo) { nos.push(el("line", { class: Math.abs(x) < 1e-9 ? "eixo" : "grade-l", x1: X(x * k), y1: PL.c, x2: X(x * k), y2: PL.h - PL.b }));
      if (it.pi || Number.isInteger(x)) nos.push(el("text", { class: "marca", x: X(x * k), y: PL.h - 6, "text-anchor": "middle" }, it.pi ? pi(x) : menos(x))); }
    return nos;
  }
  // O ciclo: os 16 ângulos notáveis, em graus e em radianos, e os valores exatos de seno e cosseno.
  const ANGULOS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  const RADIANOS = { 0: "0", 30: "π/6", 45: "π/4", 60: "π/3", 90: "π/2", 120: "2π/3", 135: "3π/4", 150: "5π/6", 180: "π", 210: "7π/6", 225: "5π/4", 240: "4π/3", 270: "3π/2", 300: "5π/3", 315: "7π/4", 330: "11π/6" };
  function trig(g, qual) {
    const EXATO = { 0: "0", 30: "1/2", 45: "√2/2", 60: "√3/2", 90: "1" }, v = qual === "sen" ? Math.sin((g * Math.PI) / 180) : Math.cos((g * Math.PI) / 180);
    const ref = Math.round((Math.asin(Math.min(1, Math.abs(v))) * 180) / Math.PI);
    return (v < -1e-9 ? "−" : "") + EXATO[ref];
  }
  const guardar = (titulo, texto, linhas) => el("section", { class: "guardar" }, el("h3", null, titulo), texto && el("p", null, texto),
    linhas && el("ul", null, linhas.map(([a, b]) => el("li", null, el("span", null, a), el("b", null, b)))));
  const lista = (titulo, itens) => el("section", { class: "bloco" }, el("p", { class: "rotulo-bloco" }, titulo), el("ul", { class: "lista" }, itens.map(([a, b]) => el("li", null, el("small", null, a), el("span", null, b)))));

  // ---------- quando um item está resolvido (libera o que vem depois na tela) ----------
  const RESPOSTA = ["setas", "fixo", "decide", "valor", "questao", "exemplo", "marcar", "grade", "casos", "classificar", "ordenar", "matrizes", "curva", "barras", "ponto", "reta", "circunferencia", "regiao", "angulo", "venn", "ciclo"];
  function pronto(it) {
    const s = S(it);
    switch (it.tipo) {
      case "palpite": return s.m != null;
      case "setas": return s.fase === 2;
      case "fixo": return !!s.achou;
      case "decide": case "valor": case "questao": case "marcar": case "grade": case "casos": case "classificar": case "ordenar": case "matrizes": case "curva": case "barras": case "ponto": case "reta": case "circunferencia": case "regiao": case "angulo": case "venn": case "ciclo": return s.m === it.certa;
      case "exemplo": return (s.linhas || 0) >= it.linhas.length;
      case "desenho": return (s.n || 1) >= it.passos.length;
      case "arvore": { const fundo = (no) => (no.filhos && no.filhos.length ? 1 + Math.max(...no.filhos.map(fundo)) : 0); return (s.n || 1) >= (it.raiz ? fundo(it.raiz) : it.niveis.length); }
      case "video": return !!it.em_gravacao || !!s.visto;
      case "corrido": return VIDEOS.every((v) => S(v).visto);
      default: return true;
    }
  }
  const tocar = () => { E.tocou = true; };
  const primeira = (it, i) => { const s = S(it); if (s.primeira == null) s.primeira = i === it.certa; }; // "de primeira", no Praticar

  // ---------- os itens ----------
  const desenha = {
    texto: (it) => el("p", { class: it.tom === "ajuda" ? "ajuda" : it.tom === "situacao" ? "situacao" : null }, it.texto),
    guardar: (it) => guardar(it.titulo, it.texto, it.linhas),
    alerta: (it) => el("section", { class: "alerta" }, el("h3", null, it.titulo), el("p", null, it.texto), it.contas && el("div", { class: "contas" }, it.contas.map((c) => linha(c, "corrige")))),
    lado_a_lado: (it) => el("div", { class: "lados" }, it.casos.map((c) => el("section", { class: "lado" }, el("h3", null, c.nome),
      el("div", { class: "par" }, el("span", null, el("small", null, c.colunas[0]), c.setas[0]), el("span", null, el("small", null, c.colunas[1]), c.setas[1])),
      el("p", { class: "tipo" }, el("mark", null, c.classe))))),

    // O palpite: o aluno responde antes de aprender. Fica guardado, sem correção.
    palpite(it) {
      const s = S(it), marcar = (i) => { s.m = i; tocar(); pintar(K(it)); };
      const corpo = it.questao ? [alternativas(it.questao, { marcada: s.m, aoMarcar: marcar }), s.m == null && el("p", { class: "pedido" }, TX.palpite_questao)]
        : [el("p", { class: "situacao" }, it.texto),
          mesa(it.colunas, [[dado(it.antes[0]), dado(it.antes[1])], [dado(it.depois), s.m == null ? vazia : { t: it.opcoes[s.m], k: "escrito", chave: K(it) }]], [seta("esq", it.fator), seta("dir", "?", { espera: true })]),
          el("p", { class: "pedido" }, TX.palpite_tabela), botoes(it.opcoes, { marcado: s.m, aoTocar: marcar })];
      return [corpo, fala(s.m != null && [linha(TX.guardado, null, K(it)), nota(it.nota)])];
    },
    // A volta ao palpite: a resposta certa (escrita na tabela ou circulada) e o comentário do que o aluno marcou.
    volta(it) {
      const p = PALPITES[it.de], r = S(p).m, acertou = r === p.certa;
      const fecho = el("p", { class: "linha" }, it.fecho, it.classe && ": ", it.classe && el("mark", null, it.classe));
      if (p.questao) return [alternativas(p.questao, { circula: true }), r != null && el("p", null, p.retorno[r]), fecho];
      return [mesa(p.colunas, [[dado(p.antes[0]), dado(p.antes[1])], [dado(p.depois), { t: p.opcoes[p.certa], k: "escrito", antes: r != null && !acertou && riscado(p.opcoes[r]), depois: acertou && visto() }]],
        [seta("esq", p.fator), seta("dir", p.seta)]),
        r != null && el("p", null, p.retorno[r]), el("p", { class: "linha" }, it.fecho, it.classe && ": ", it.classe && el("mark", null, it.classe))];
    },
    // Tabela com setas: o aluno aplica o fator de um lado e escolhe a seta que fecha o outro.
    setas(it) {
      const s = S(it), fase = s.fase || 0, de = ler(it.antes[1]);
      const segunda = fase === 0 ? [vazia, vazia] : [{ t: it.depois[0], k: "escrito", chave: K(it, "a") }, fase === 2 ? { t: it.depois[1], k: "escrito", chave: K(it) } : vazia];
      return [el("p", { class: "situacao" }, it.texto),
        mesa(it.colunas, [[dado(it.antes[0]), dado(it.antes[1])], segunda], [
          fase > 0 && seta("esq", it.fator, { traca: E.anima === K(it, "a") }),
          fase === 1 && seta("dir", "?", { espera: true }),
          fase === 2 && seta("dir", it.seta, { traca: E.anima === K(it) })]),
        fase < 2 && el("p", { class: "pedido" }, fase === 0 ? `Toque em ${it.fator} para ${it.acao}.` : `Que seta leva de ${it.antes[1]} a ${it.depois[1]}?`),
        fase === 0 && el("div", { class: "bandeja" }, el("button", { type: "button", class: "resp unico", onclick: () => { s.fase = 1; tocar(); pintar(K(it, "a")); } }, it.fator)),
        fase === 1 && botoes(it.opcoes, { rotulo: (x) => `seta ${x}`, nao: E.anima === K(it, "e") ? it.opcoes.indexOf(s.erro) : null,
          aoTocar: (i, x) => { if (x === it.seta) { s.fase = 2; s.erro = null; pintar(K(it)); } else { s.erro = x; pintar(K(it, "e")); } } }),
        fala(fase === 2 && el("p", { class: "linha" + an(K(it)) }, it.veredito, it.classe && ": ", it.classe && el("mark", null, it.classe)),
          fase === 1 && s.erro && [linha(`${it.antes[1]} ${s.erro} dá ${de.mostra(aplicar(s.erro, de.v))}`, "corrige", K(it, "e")),
            nota((it.erros && it.erros[s.erro]) || `A tabela diz ${it.depois[1]}. Tente outra seta.`)])];
    },
    // Achar a conta que não muda: dividir ou multiplicar as duas colunas, linha por linha.
    fixo(it) {
      const s = S(it), n = it.linhas.map((l) => l.map((c) => ler(c).v)), op = s.tentou, certa = op === it.certa;
      const quantas = ["duas", "três", "quatro", "cinco"][n.length - 2];
      const contas = op && n.map(([a, b]) => (op === "÷" ? `${num(b)} ÷ ${num(a)} = ${num(b / a)}` : `${num(a)} × ${num(b)} = ${num(a * b)}`));
      return [it.texto && el("p", { class: "situacao" }, it.texto),
        mesa(it.colunas, it.linhas.map((l) => l.map(dado)), it.setas && [seta("esq", it.setas[0]), seta("dir", it.setas[1])]),
        !s.achou && el("p", { class: "pedido" }, `Que conta dá o mesmo resultado nas ${quantas} linhas?`),
        !s.achou && botoes(["÷", "×"], { rotulo: (x) => (x === "÷" ? "dividir" : "multiplicar"), aoTocar: (i, x) => { s.tentou = x; if (x === it.certa) s.achou = true; tocar(); pintar(K(it)); } }),
        fala(op && [el("div", { class: "contas" }, contas.map((c) => linha(c, certa ? null : "corrige", K(it)))),
          certa ? el("p", { class: "linha" + an(K(it)) }, `igual nas ${quantas}: `, el("mark", null, it.achou)) : linha(TX.mudou, "corrige", K(it))]),
        s.achou && (it.depois || []).map((t) => el("p", null, t))];
    },
    // Uma decisão curta: poucas opções, comentário para cada erro e a linha que a caneta escreve no acerto.
    decide(it, c) {
      const s = S(it), ops = pares(it), ok = s.m === it.certa;
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), figura(it.figura), it.equacoes && el("ol", { class: "equacoes" }, it.equacoes.map((e) => el("li", null, e))), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta),
        it.tabela && ((it.tabela.colunas || []).length === 2 ? mesa(it.tabela.colunas, it.tabela.linhas.map((l) => l.map(dado))) : tabelao(it.tabela.colunas, it.tabela.linhas, it.tabela.rotulos))];
      if (c.prova) {
        return [topo, !c.fim && botoes(ops.map((o) => o[0]), { marcado: s.m, aoTocar: (i) => { s.m = i; tocar(); pintar(); } }),
          c.fim && el("p", { class: "linha" + (ok ? " certo" : "") }, !ok && riscado(nomeDe(ops[s.m][0], s.m)), !ok && " ", nomeDe(ops[it.certa][0], it.certa), ok && " ✓"), c.fim && nota(it.comentario)];
      }
      return [topo, !ok && botoes(ops.map((o) => o[0]), { nao: E.anima === K(it, "e") ? s.erro : null,
        aoTocar: (i) => { tocar(); primeira(it, i); if (i === it.certa) { s.m = i; s.erro = null; pintar(K(it)); } else { s.erro = i; pintar(K(it, "e")); } } }),
        ok && temFig(ops[it.certa][0]) && el("div", { class: "fig-certa" }, img(ops[it.certa][0].figura, "fig-op")), // a figura escolhida fica à vista
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(ops[it.certa][1] || it.comentario)]
          : s.erro != null && [linha(TX.errado, "corrige", K(it, "e")), nota(ops[s.erro][1])])];
    },
    // Tocar no valor que falta na tabela.
    valor(it, c) {
      const s = S(it), ops = pares(it), m = s.m, ok = m === it.certa;
      const tab = (cel) => mesa(it.colunas, [[dado(it.antes[0]), dado(it.antes[1])], [dado(it.depois), cel]]);
      if (c.prova) {
        const cel = m == null ? vazia : !c.fim ? { t: ops[m][0], k: "escrito", chave: K(it) }
          : { t: ops[it.certa][0], k: ok ? "escrito" : "escrito corrigida", antes: !ok && riscado(ops[m][0]), depois: ok && visto() };
        return [el("p", { class: "situacao" }, it.texto), figura(it.figura), tab(cel),
          !c.fim && botoes(ops.map((o) => o[0]), { marcado: m, aoTocar: (i) => { s.m = i; tocar(); pintar(K(it)); } }), c.fim && nota(it.comentario)];
      }
      const cel = ok ? { t: ops[m][0], k: "escrito", chave: K(it), depois: visto() } : m != null ? { t: "?", k: "vazia", antes: riscado(ops[m][0]) } : vazia;
      return [el("p", { class: "situacao" }, it.texto), figura(it.figura), tab(cel), !ok && el("p", { class: "pedido" }, TX.valor),
        !ok && botoes(ops.map((o) => o[0]), { nao: E.anima === K(it) && m != null ? m : null, aoTocar: (i) => { primeira(it, i); s.m = i; tocar(); pintar(K(it)); } }),
        fala(m != null && [linha(ok ? TX.certo : TX.errado, ok ? "certo" : "corrige", K(it)), nota(ops[m][1] || (ok && it.comentario))])];
    },
    // Marcar na figura: os alvos são lugares da imagem (em % da largura e da altura); o aluno toca no certo.
    marcar(it, c) {
      const s = S(it), ok = s.m === it.certa, fim = !!(c.prova && c.fim);
      const res = (i) => (fim ? (i === it.certa ? "certa" : s.m === i ? "errada" : null) : c.prova ? null : ok && i === it.certa ? "certa" : s.erro === i ? "errada" : null);
      const tocarAlvo = (i) => { tocar(); if (c.prova) { s.m = i; return pintar(); } primeira(it, i); if (i === it.certa) { s.m = i; s.erro = null; pintar(K(it)); } else { s.erro = i; pintar(K(it, "e")); } };
      const nova = estreia(it);
      const palco = el("div", { class: "palco-fig" }, el("div", { class: "palco-in" }, img(it.figura), it.alvos.map((a, i) => {
        const b = depois(el("button", { type: "button", class: "alvo" + (nova ? " surge" : ""), "aria-label": a.nome, "aria-pressed": String(s.m === i), disabled: fim || (!c.prova && ok), "data-res": res(i), onclick: () => tocarAlvo(i) }, a.rotulo || ""), nova ? 250 + i * 110 : 0);
        b.style.left = `${a.x}%`; b.style.top = `${a.y}%`; // pelo CSSOM: a página não aceita atributo style
        return b;
      })));
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), palco];
      if (c.prova) return [topo, !fim && el("p", { class: "pedido" }, TX.marcar),
        fim && el("p", { class: "linha" + (ok ? " certo" : "") }, !ok && riscado(it.alvos[s.m].nome), !ok && " ", it.alvos[it.certa].nome, ok && " ✓"), fim && nota(it.comentario)];
      return [topo, !ok && el("p", { class: "pedido" }, TX.marcar),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.alvos[it.certa].comentario || it.comentario)]
          : s.erro != null && [linha(TX.errado, "corrige", K(it, "e")), nota(it.alvos[s.erro].comentario)])];
    },
    // Grade: tabela larga (ou matriz) com uma célula que falta; o aluno toca no valor.
    grade(it, c) {
      const [fi, fj] = it.falta;
      return celula(it, c, (no) => tabelao(it.colunas, it.linhas, it.rotulos, (i, j) => (i === fi && j === fj ? no : null)));
    },
    // Matrizes lado a lado, com sinais entre elas ("×", "=", "+"): produto, soma, determinante, sistema na
    // forma de matriz. Uma linha ou uma coluna pode vir destacada, e uma célula falta.
    matrizes(it, c) {
      const [fp, fi, fj] = it.falta;
      const uma = (p, k, no) => el("table", { class: "tq grade matriz" + (p.det ? " det" : "") }, el("tbody", null, p.m.map((l, i) => el("tr", null,
        l.map((v, j) => (k === fp && i === fi && j === fj ? no : el("td", { class: p.linha === i || p.coluna === j ? "luz" : null }, v)))))));
      return celula(it, c, (no) => el("div", { class: "rola" }, el("div", { class: "matrizes" }, it.partes.map((p, k) => (typeof p === "string" ? el("span", { class: "sinal" }, p) : uma(p, k, no))))));
    },
    // Casos: um conjunto de casos; o aluno marca todos os que entram (os que sobram, os que contam) e confere.
    casos(it, c) {
      const s = S(it), sel = s.sel || [], ok = s.m === it.certa, fim = !!(c.prova && c.fim), mostra = fim || (!c.prova && ok);
      const alternar = (i) => { tocar(); const n = sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]; s.sel = n; s.erro = false; if (c.prova) s.m = n.length ? chave(n) : null; pintar(); };
      const conferir = () => { const k = chave(sel); if (s.primeira == null) s.primeira = k === it.certa; if (k === it.certa) { s.m = k; pintar(K(it)); } else { s.erro = true; pintar(K(it, "e")); } };
      const quadro = el("div", { class: "casos" + (it.casos.some((t) => t.length > 3) ? " largos" : ""), role: "group", "aria-label": it.pergunta || it.texto }, it.casos.map((t, i) => el("button", {
        type: "button", "aria-pressed": String(sel.includes(i)), disabled: mostra, "data-res": mostra ? (it.certos.includes(i) ? "certa" : sel.includes(i) ? "errada" : null) : null, class: E.anima === K(it) && it.certos.includes(i) ? "surge" : null, onclick: () => alternar(i) }, t)));
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), quadro];
      if (c.prova) return [topo, !fim && el("p", { class: "pedido" }, TX.casos.split(". ")[0] + "."), fim && nota(it.comentario)];
      const sobra = sel.filter((i) => !it.certos.includes(i)).length, falta = it.certos.filter((i) => !sel.includes(i)).length;
      const conta = [sobra && (sobra === 1 ? "Há 1 marcado que não entra." : `Há ${sobra} marcados que não entram.`), falta && (falta === 1 ? "Falta 1." : `Faltam ${falta}.`)].filter(Boolean).join(" ");
      return [topo, !ok && el("p", { class: "pedido" }, TX.casos), !ok && botao(TX.conferir, conferir, "leve forte", !sel.length),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)] : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(`${conta} ${it.erro || ""}`.trim())])];
    },
    // Classificar: cada cartão vai para uma das caixas. Fora do Topo, um cartão por vez, com retorno na hora.
    classificar(it, c) {
      const s = S(it), n = it.cartoes.length, fim = !!(c.prova && c.fim);
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta)];
      if (c.prova) {
        const m = s.cl || [];
        const escolher = (i, k) => { const x = [...m]; x[i] = k; s.cl = x; s.m = it.cartoes.every((_, j) => x[j] != null) ? x.join(",") : null; tocar(); pintar(); };
        return [topo, it.cartoes.map(([t, certa], i) => el("div", { class: "cartao-l" }, el("p", null, t), el("div", { class: "bandeja mini", role: "group", "aria-label": t },
          it.caixas.map((nome, k) => el("button", { type: "button", class: "resp", "aria-pressed": String(m[i] === k), disabled: fim, "data-res": fim ? (k === certa ? "certa" : m[i] === k ? "errada" : null) : null, onclick: () => escolher(i, k) }, nome))))),
          fim && nota(it.comentario)];
      }
      const feitos = s.n || 0, ok = feitos >= n, atual = ok ? null : it.cartoes[feitos];
      const tocarCaixa = (k) => { tocar(); if (k === atual[1]) { s.n = feitos + 1; s.erro = null; if (s.n >= n) { s.m = it.certa; if (s.primeira == null) s.primeira = true; } pintar(K(it)); } else { s.primeira = false; s.erro = k; pintar(K(it, "e")); } };
      return [topo, el("div", { class: "caixas" }, it.caixas.map((nome, k) => el("section", { class: "caixa-c" }, el("h4", null, nome), el("ul", null, it.cartoes.slice(0, feitos).filter((x) => x[1] === k).map((x) => el("li", { class: E.anima === K(it) && x === it.cartoes[feitos - 1] ? "surge" : null }, x[0])))))),
        atual && el("p", { class: "cartao" + an(K(it)) }, atual[0]), atual && el("p", { class: "pedido" }, `Cartão ${feitos + 1} de ${n}: em que caixa ele vai?`),
        atual && botoes(it.caixas, { nao: E.anima === K(it, "e") ? s.erro : null, aoTocar: tocarCaixa }),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)] : s.erro != null && [linha(TX.errado, "corrige", K(it, "e")), nota(atual[2] || TX.olhe)])];
    },
    // Ordenar: os itens vêm escritos na ordem certa; a tela mostra embaralhado e o aluno toca um por um.
    ordenar(it, c) {
      const s = S(it), n = it.itens.length, ord = s.ord || [], fim = !!(c.prova && c.fim), ok = s.m === it.certa, cheio = ord.length === n;
      const mistura = it.inicio || embaralha(n), restam = mistura.filter((i) => !ord.includes(i));
      const escolher = (i) => {
        tocar(); const o = [...ord, i]; s.ord = o; s.erro = null;
        if (o.length < n) return pintar(K(it, "o"));
        const k = o.join(",");
        if (c.prova) { s.m = k; return pintar(); }
        if (s.primeira == null) s.primeira = k === it.certa;
        if (k === it.certa) { s.m = k; pintar(K(it)); } else { s.erro = o.findIndex((x, j) => x !== j); pintar(K(it, "e")); }
      };
      const desfazer = () => { s.ord = []; s.erro = null; if (c.prova) s.m = null; pintar(); };
      const res = (i, j) => (fim || ok ? (i === j ? "certa" : "errada") : s.erro != null && j === s.erro ? "errada" : null);
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta),
        ord.length > 0 && el("ol", { class: "ordem" }, ord.map((i, j) => el("li", { "data-res": res(i, j), class: j === ord.length - 1 && [K(it), K(it, "o"), K(it, "e")].includes(E.anima) ? "surge" : null }, it.itens[i]))),
        !cheio && el("p", { class: "pedido" }, ord.length ? `Agora o ${ord.length + 1}º.` : TX.ordenar),
        !cheio && el("div", { class: "ordem-opcoes" }, restam.map((i) => el("button", { type: "button", class: "resp", onclick: () => escolher(i) }, it.itens[i]))),
        ord.length > 0 && !ok && !fim && botao(TX.desfazer, desfazer, "leve")];
      if (c.prova) return [topo, fim && !ok && el("ol", { class: "ordem certa" }, it.itens.map((t) => el("li", null, t))), fim && nota(it.comentario)];
      return [topo, fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)]
        : s.erro != null && [linha(TX.errado, "corrige", K(it, "e")), nota(`O ${s.erro + 1}º não é esse. ${it.erro || ""}`.trim())])];
    },
    // Curva com parâmetros: o aluno arrasta os controles e a curva responde na hora.
    curva(it, c) {
      const s = S(it), fim = !!(c.prova && c.fim), ok = s.m === it.certa, trava = fim || (!c.prova && ok);
      const p = { ...(it.fixos || {}), ...Object.fromEntries(it.parametros.map((q) => [q.nome, q.inicio])), ...(s.p || {}) };
      const alvo = { ...(it.fixos || {}), ...it.alvo }, mostraAlvo = it.mostra_alvo !== false, chaveDe = (x) => it.parametros.map((q) => x[q.nome]).join(";");
      const nova = estreia(it), acertou = E.anima === K(it);
      const azul = depois(el("path", { class: "curva-azul" + (nova ? " traca" : acertou ? " pulsa" : ""), d: tracado(it, p), pathLength: nova ? "1" : null }), nova ? 500 : 0), lei = el("p", { class: "lei" + (acertou ? " grifa" : "") }, LEI[it.familia](p));
      if (nova) azul.addEventListener("animationend", () => { azul.classList.remove("traca"); azul.removeAttribute("pathLength"); }, { once: true });
      const controles = it.parametros.map((q) => {
        // O controle corre solto entre o menor e o maior valor: a curva acompanha o dedo, quadro a quadro.
        // Ao soltar, ele encosta no valor permitido mais próximo, e é esse que vale para a resposta.
        const perto = (v) => q.valores.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a)), uma = (v) => String(Math.round(v * 10) / 10).replace(".", ",").replace("-", "−");
        const valor = el("b", null, uma(p[q.nome]));
        const barra = el("input", { type: "range", min: String(q.valores[0]), max: String(q.valores.at(-1)), step: "any", value: String(p[q.nome]), disabled: trava, "aria-label": q.rotulo || q.nome });
        let quadro = 0;
        const desenhar = () => { quadro = 0; const vivo = { ...p, [q.nome]: Number(barra.value) }; azul.setAttribute("d", tracado(it, vivo)); lei.replaceChildren(LEI[it.familia]({ ...vivo, [q.nome]: Math.round(vivo[q.nome] * 10) / 10 })); valor.textContent = uma(vivo[q.nome]); };
        barra.addEventListener("input", () => { if (!quadro) quadro = requestAnimationFrame(desenhar); });
        barra.addEventListener("change", () => {
          p[q.nome] = perto(Number(barra.value)); s.p = Object.fromEntries(it.parametros.map((x) => [x.nome, p[x.nome]])); s.erro = false;
          if (c.prova) s.m = chaveDe(p);
          tocar(); pintar();
        });
        return el("label", { class: "controle" }, el("span", null, q.rotulo || q.nome, ": ", valor), barra);
      });
      const conferir = () => { const k = chaveDe(p); if (s.primeira == null) s.primeira = k === it.certa; if (k === it.certa) { s.m = k; pintar(K(it)); } else { s.erro = true; pintar(K(it, "e")); } };
      const desenho = el("svg", { viewBox: `0 0 ${PL.w} ${PL.h}`, class: "plano", role: "img", "aria-label": `Gráfico de ${LEI[it.familia](p)}` }, eixos(it), cenarioDe(it), (mostraAlvo || fim || ok) && el("path", { class: "curva-alvo" + (nova ? " aparece" : ""), d: tracado(it, alvo) }), azul);
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), desenho, lei, controles];
      if (c.prova) return [topo, fim && el("p", { class: "linha" + (ok ? " certo" : "") }, LEI[it.familia](alvo), ok && " ✓"), fim && nota(it.comentario)];
      const fora = it.parametros.filter((q) => p[q.nome] !== alvo[q.nome]).length;
      return [topo, !ok && el("p", { class: "pedido" }, mostraAlvo ? TX.ajustar : TX.ajustar_sem), !ok && botao(TX.conferir, conferir, "leve forte"),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)]
          : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(`${fora === 1 ? "Falta acertar 1 controle." : `Faltam ${fora} controles.`} ${it.erro || ""}`.trim())])];
    },
    // Ciclo trigonométrico: o aluno escolhe onde o ângulo termina; o desenho mostra o seno (altura) e o cosseno (sombra).
    // A figura que a caneta desenha: cada passo acrescenta linhas do kit GEO à mesma figura; só o que é novo entra riscando.
    desenho(it) {
      const s = S(it), total = it.passos.length, primeira = estreia(it), n = Math.min(total, s.n || 1), viva = primeira || E.anima === K(it, "d");
      const roteiro = (k) => [`janela ${it.janela.join(" ")}`, "largura 300", ...it.passos.slice(0, k).flatMap((p) => p.linhas)].join("\n");
      const figuraDe = (k) => { const d = document.createElement("div"); d.innerHTML = window.GEO.desenhar(roteiro(k), { tema: it.tema, rotulo: it.alt }); return d.firstElementChild; };
      const svg = figuraDe(n), filhos = [...svg.children].filter((x) => x.tagName.toLowerCase() !== "defs"); let espera = 0;
      const html = (k) => [...figuraDe(k).children].map((x) => x.outerHTML);
      const fora = (base) => filhos.filter((x) => { const i = base.indexOf(x.outerHTML); if (i < 0) return true; base.splice(i, 1); return false; });
      const novos = viva && MOVE ? (n > 1 && !primeira ? fora(html(n - 1)) : filhos) : [];
      const grifos = it.tema === "ilustra" ? new Map() : quadro(svg, filhos, new Set(n > 1 ? fora(html(1)) : []));
      if (novos.length) {
        const passo = Math.min(320, 2200 / novos.length);
        novos.forEach((x, i) => { riscar(x, i * passo); const g = grifos.get(x); if (g) { g.classList.add("aparece"); depois(g, i * passo); } }); espera = Math.min(1400, novos.length * passo);
      }
      const falas = it.passos.slice(0, n).map((p, i) => p.fala && depois(el("p", { class: "linha passo-d" + (viva && i === n - 1 ? " escreve" : "") }, total > 1 && `${i + 1}. `, p.fala), viva && i === n - 1 ? espera : 0));
      return [it.texto && el("p", { class: "situacao" }, it.texto), el("div", { class: "desenho" }, svg), fala(falas),
        n < total && botao(it.passos[n].botao || TX.proximo_traco, () => { tocar(); s.n = n + 1; pintar(K(it, "d")); }, "leve forte")];
    },
    // O sólido que gira: arrastar muda o ângulo e só o desenho é refeito (a página não é repintada a cada quadro).
    solido(it) {
      const s = S(it), ini = it.inicio || [-28, 22]; if (s.a == null) { s.a = ini[0]; s.b = ini[1]; }
      const svg = el("svg", { viewBox: "-160 -160 320 320", role: "img", "aria-label": it.alt }), palco = el("div", { class: "desenho solido" }, svg);
      const desenha = () => solidoSVG(svg, it, s.a, s.b); desenha();
      let de = null, quadro_ = 0;
      const ir_ = (a, b) => { // gira até a vista pedida
        const a0 = s.a, b0 = s.b, da = ((a - a0 + 540) % 360) - 180, t0 = performance.now();
        const passo = (agora) => { const t = MOVE ? Math.min(1, (agora - t0) / 450) : 1, e = t * t * (3 - 2 * t); s.a = a0 + da * e; s.b = b0 + (b - b0) * e; desenha(); if (t < 1) requestAnimationFrame(passo); else { s.a = a; s.b = b; if (H) H.salvar(foto()); } };
        tocar(); requestAnimationFrame(passo);
      };
      svg.addEventListener("pointerdown", (e) => { de = [e.clientX, e.clientY, s.a, s.b]; svg.setPointerCapture(e.pointerId); palco.classList.add("girando"); tocar(); });
      svg.addEventListener("pointermove", (e) => { if (!de) return; s.a = de[2] + (e.clientX - de[0]) * 0.6; s.b = Math.max(0, Math.min(90, de[3] + (e.clientY - de[1]) * 0.5)); if (!quadro_) quadro_ = requestAnimationFrame(() => { quadro_ = 0; desenha(); }); });
      const solta = () => { if (!de) return; de = null; palco.classList.remove("girando"); desenha(); if (H) H.salvar(foto()); };
      svg.addEventListener("pointerup", solta); svg.addEventListener("pointercancel", solta);
      const vistas = (it.vistas ?? it.solido.forma === "cubinhos") && el("div", { class: "vistas" }, [[0, 0], [-90, 0], [0, 90], ini].map((v, i) => botao(TX.vistas[i], () => ir_(v[0], v[1]), "leve")));
      return [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), palco, vistas, el("p", { class: "pedido" }, TX.girar)];
    },
    // O gráfico feito dos dados: quem escreve dá os números, o motor desenha (e a caneta risca na estreia).
    grafico(it) {
      const nova = estreia(it), marcas = [], textos = [], series = it.series, k = series.length, tons = ["g-a", "g-b"]; let papel = [];
      if (it.forma === "setores") {
        const vals = series[0].valores, tot = vals.reduce((a, b) => a + b, 0), R = 74, cx = GR.w / 2, cy = GR.h / 2; let ang = -Math.PI / 2;
        vals.forEach((v, i) => {
          const a0 = ang, a1 = (ang += (v / tot) * 2 * Math.PI), em = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)], [x0, y0] = em(a0, R), [x1, y1] = em(a1, R), [lx, ly] = em((a0 + a1) / 2, R + 12);
          const anc = lx > cx + 8 ? "start" : lx < cx - 8 ? "end" : "middle", pct = num(Math.round((v / tot) * 1000) / 10) + "%";
          marcas.push(el("path", { class: `fatia f${i}` + ((it.destaque || []).includes(i) ? " g-marca" : ""), d: `M${cx} ${cy}L${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z` }));
          textos.push(el("text", { class: "mao-g", x: lx, y: ly + (it.rotulos ? -2 : 5), "text-anchor": anc }, it.categorias[i]), it.rotulos && el("text", { class: "mao-g g-b", x: lx, y: ly + 14, "text-anchor": anc }, pct));
        });
      } else {
        const hist = it.forma === "histograma", g = papelG(it), lb = hist ? g.larg + 3 : Math.min(36, (g.larg * 0.72) / k); papel = g.papel;
        series.forEach((s, j) => {
          const xs = s.valores.map((_, i) => g.X(i) + (it.forma === "barras" ? (j - (k - 1) / 2) * lb : 0));
          if (it.forma === "barras" || hist) s.valores.forEach((v, i) => marcas.push(el("path", { class: `barra ${tons[j]}` + ((it.destaque || []).includes(i) ? " g-marca" : ""), d: barraD(xs[i], lb - 3, g.Y(g.y0), g.Y(v)) })));
          else { marcas.push(el("path", { class: `linha-g ${tons[j]}`, d: "M" + s.valores.map((v, i) => `${xs[i].toFixed(1)} ${g.Y(v).toFixed(1)}`).join("L") })); s.valores.forEach((v, i) => marcas.push(el("circle", { class: `ponto-g ${tons[j]}` + ((it.destaque || []).includes(i) ? " g-marca" : ""), cx: xs[i], cy: g.Y(v), r: 3.4 }))); }
          if (it.rotulos) s.valores.forEach((v, i) => textos.push(el("text", { class: `mao-g ${tons[j]}`, x: xs[i], y: g.Y(v) - 6, "text-anchor": "middle" }, num(v))));
          if (k > 1) textos.push(el("text", { class: `mao-g ${tons[j]}`, x: GR.e + 6 + j * 110, y: 12 }, s.nome));
        });
        if (it.media) { const m = series[0].valores.reduce((a, b) => a + b, 0) / series[0].valores.length;
          marcas.push(el("path", { class: "media-g", d: `M${GR.e} ${g.Y(m).toFixed(1)}H${GR.w - GR.d}` })); textos.push(el("text", { class: "mao-g g-b", x: GR.w - GR.d - 2, y: 12, "text-anchor": "end" }, `média = ${num(Math.round(m * 100) / 100)}`)); }
      }
      if (nova && MOVE) { const passo = Math.min(220, 1800 / marcas.length); marcas.forEach((x, i) => riscar(x, i * passo)); textos.filter(Boolean).forEach((x) => { x.classList.add("aparece"); depois(x, Math.min(1800, marcas.length * passo)); }); }
      return [it.texto && el("p", { class: "situacao" }, it.texto), it.titulo && el("span", { class: "etiqueta" }, it.titulo),
        el("svg", { viewBox: `0 0 ${GR.w} ${GR.h}`, class: "plano grafico", role: "img", "aria-label": it.alt }, filtroMao("mao-g", GR.w, GR.h), papel, el("g", { class: "caneta-g" }, marcas), textos)];
    },
    // O aluno ergue as barras a partir dos dados: arrasta cada uma, ela encosta no valor permitido mais próximo ao soltar.
    barras(it, c) {
      const s = S(it), fim = !!(c.prova && c.fim), ok = s.m === it.certa, trava = fim || (!c.prova && ok), g = papelG(it), enc = it.eixo.encaixe || it.eixo.passo, n = it.categorias.length;
      const v = (s.v || it.inicio || it.categorias.map(() => g.y0)).slice(), lb = Math.min(40, g.larg * 0.62), acertou = E.anima === K(it);
      const perto = (x) => Math.max(g.y0, Math.min(g.y1, Math.round((g.y0 + Math.round((x - g.y0) / enc) * enc) * 1000) / 1000));
      const marcas = v.map((x, i) => el("path", { class: "barra g-a" + (s.erro && x !== it.valores[i] ? " fora" : "") + (acertou ? " pulsa" : ""), d: barraD(g.X(i), lb, g.Y(g.y0), g.Y(x)) }));
      const rot = v.map((x, i) => el("text", { class: "mao-g", x: g.X(i), y: g.Y(x) - 6, "text-anchor": "middle" }, num(x)));
      const poe = (i, x) => { marcas[i].setAttribute("d", barraD(g.X(i), lb, g.Y(g.y0), g.Y(x))); rot[i].setAttribute("y", g.Y(x) - 6); rot[i].textContent = num(perto(x)); };
      const guarda = () => { s.v = v.slice(); s.erro = false; if (c.prova) s.m = v.join(";"); };
      const svg = el("svg", { viewBox: `0 0 ${GR.w} ${GR.h}`, class: "plano grafico" + (trava ? "" : " montar"), role: "img", "aria-label": `Gráfico de barras: ${it.categorias.map((cat, i) => `${cat} ${num(v[i])}`).join(", ")}` },
        filtroMao("mao-g", GR.w, GR.h), g.papel, el("g", { class: "caneta-g" }, marcas), rot);
      if (!trava) {
        let de = null, quadro = 0, py = 0;
        const onde = (e) => { const r = svg.getBoundingClientRect(); py = ((e.clientY - r.top) / r.height) * GR.h; return Math.max(0, Math.min(n - 1, Math.floor((((e.clientX - r.left) / r.width) * GR.w - GR.e) / g.larg))); };
        const vivo = () => { quadro = 0; if (de != null) poe(de, Math.max(g.y0, Math.min(g.y1, g.V(py)))); };
        svg.addEventListener("pointerdown", (e) => { de = onde(e); svg.setPointerCapture(e.pointerId); svg.classList.add("girando"); vivo(); });
        svg.addEventListener("pointermove", (e) => { if (de == null) return; onde(e); if (!quadro) quadro = requestAnimationFrame(vivo); });
        const solta = () => { if (de == null) return; v[de] = perto(g.V(py)); de = null; guarda(); tocar(); pintar(); };
        svg.addEventListener("pointerup", solta); svg.addEventListener("pointercancel", solta);
      }
      // Para teclado e leitor de tela: um controle por barra, fora da vista.
      const acesso = el("div", { class: "so-leitor" }, it.categorias.map((cat, i) => { const b = el("input", { type: "range", min: String(g.y0), max: String(g.y1), step: String(enc), value: String(v[i]), disabled: trava, "aria-label": cat });
        b.addEventListener("change", () => { v[i] = perto(Number(b.value)); guarda(); pintar(); }); return b; }));
      const conferir = () => { const kk = v.join(";"); if (s.primeira == null) s.primeira = kk === it.certa; if (kk === it.certa) { s.m = kk; pintar(K(it)); } else { s.erro = true; pintar(K(it, "e")); } };
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta),
        it.tabela && ((it.tabela.colunas || []).length === 2 ? mesa(it.tabela.colunas, it.tabela.linhas.map((l) => l.map(dado))) : tabelao(it.tabela.colunas, it.tabela.linhas, it.tabela.rotulos)), svg, acesso];
      const gabarito = it.categorias.map((cat, i) => `${cat}: ${num(it.valores[i])}`).join(" · ");
      if (c.prova) return [topo, fim && el("p", { class: "linha" + (ok ? " certo" : "") }, gabarito, ok && " ✓"), fim && nota(it.comentario)];
      const fora = v.filter((x, i) => x !== it.valores[i]).length;
      return [topo, !ok && el("p", { class: "pedido" }, TX.erguer), !ok && botao(TX.conferir, conferir, "leve forte"),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)]
          : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(`${fora === 1 ? "Falta acertar 1 barra (em vermelho)." : `Faltam ${fora} barras (em vermelho).`} ${it.erro || ""}`.trim())])];
    },
    // O ponto que o aluno leva: solto no plano, preso a uma curva (só anda sobre ela) ou "qualquer ponto da curva".
    ponto(it, c) {
      const s = S(it), fim = !!(c.prova && c.fim), ok = s.m === it.certa, trava = fim || (!c.prova && ok), e = escala(it), enc = it.encaixe || 1;
      const f = it.familia && ((x) => FAMILIAS[it.familia](it.fixos, x)), limpo = (x) => Math.round(x * 1000) / 1000 + 0;
      const v = (s.v || it.pontos.map((q) => q.inicio)).map((q) => q.slice());
      const perto = (x, a, b) => limpo(Math.max(Math.ceil(a / enc - 1e-9) * enc, Math.min(Math.floor(b / enc + 1e-9) * enc, Math.round(x / enc) * enc)));
      const assenta = (q) => { q[0] = perto(q[0], e.x0, e.x1); q[1] = it.preso ? limpo(f(q[0])) : perto(q[1], e.y0, e.y1); return q; };
      // Polígono pelos vértices (fecha): os pontos, na ordem, fecham uma figura; vale posição certa ou só a medida (alvo).
      const areaDe = (w) => Math.abs(w.reduce((t, q, i) => { const r = w[(i + 1) % w.length]; return t + q[0] * r[1] - r[0] * q[1]; }, 0)) / 2, periDe = (w) => w.reduce((t, q, i) => { const r = w[(i + 1) % w.length]; return t + Math.hypot(r[0] - q[0], r[1] - q[1]); }, 0);
      const certoDe = (w) => (it.alvo ? new Set(w.map(String)).size === w.length && (it.alvo.area == null || Math.abs(areaDe(w) - it.alvo.area) < 1e-9) && (it.alvo.perimetro == null || Math.abs(periDe(w) - it.alvo.perimetro) < 1e-6) : it.na_curva ? w.every((q) => Math.abs(f(q[0]) - q[1]) < 1e-9) && new Set(w.map(String)).size === w.length
        : w.every((q, i) => q[0] === it.pontos[i].certa[0] && (it.preso || q[1] === it.pontos[i].certa[1])));
      const chave = (w) => (certoDe(w) ? it.certa : w.map((q) => q.join(",")).join("|")), par = (q) => `(${menos(q[0])}; ${menos(Math.round(q[1] * 100) / 100)})`;
      const dePx = (px, py) => [e.x0 + ((px - PL.e) / (PL.w - PL.e - PL.d)) * (e.x1 - e.x0), e.y1 - ((py - PL.c) / (PL.h - PL.c - PL.b)) * (e.y1 - e.y0)];
      const ligaD = () => { // a reta pelos dois pontos, cortada na janela
        const [a, b] = v, d = [b[0] - a[0], b[1] - a[1]]; if (!d[0] && !d[1]) return ""; let t0 = -1e9, t1 = 1e9;
        [[e.x0, e.x1], [e.y0, e.y1]].forEach(([lo, hi], k) => { if (!d[k]) { if (a[k] < lo || a[k] > hi) t0 = 1e9; return; } const u = (lo - a[k]) / d[k], w = (hi - a[k]) / d[k]; t0 = Math.max(t0, Math.min(u, w)); t1 = Math.min(t1, Math.max(u, w)); });
        return t0 >= t1 ? "" : `M${e.X(a[0] + t0 * d[0]).toFixed(1)} ${e.Y(a[1] + t0 * d[1]).toFixed(1)}L${e.X(a[0] + t1 * d[0]).toFixed(1)} ${e.Y(a[1] + t1 * d[1]).toFixed(1)}`;
      };
      const acertou = E.anima === K(it), mostraCurva = f && (!it.na_curva || ok || fim);
      const polD = () => "M" + v.map((q) => `${e.X(q[0]).toFixed(1)} ${e.Y(q[1]).toFixed(1)}`).join("L") + "Z", pol = it.fecha && el("path", { class: "pol-p", d: polD() });
      const reta = it.liga && v.length === 2 && el("path", { class: "liga-p", d: ligaD() }), lei = el("p", { class: "lei" + (acertou ? " grifa" : "") });
      const bolas = v.map((q, i) => ({ halo: el("circle", { class: "halo-p", r: 13 }), miolo: el("circle", { class: "miolo-p" + (acertou ? " pulsa" : ""), r: 4.6 }), nome: el("text", { class: "mao-p", "text-anchor": "middle" }, it.pontos[i].nome || "") }));
      const poe = (i, q) => { const x = e.X(q[0]), y = e.Y(q[1]), b = bolas[i]; b.halo.setAttribute("cx", x); b.halo.setAttribute("cy", y); b.miolo.setAttribute("cx", x); b.miolo.setAttribute("cy", y); b.nome.setAttribute("x", x + 11); b.nome.setAttribute("y", y - 9); };
      const medidas = (w) => (it.mostra || []).map((m) => (m === "area" ? `área = ${num(Math.round(areaDe(w) * 100) / 100)}` : `perímetro = ${num(Math.round(periDe(w) * 100) / 100)}`));
      const escreve = (w) => lei.replaceChildren((it.fecha ? medidas(w) : w.map((q, i) => `${it.pontos[i].nome || "P"} = ${par(q)}`)).join("  ·  "));
      v.forEach((q, i) => poe(i, q)); escreve(v);
      const guarda = () => { s.v = v.map((q) => q.slice()); s.erro = false; if (c.prova) s.m = chave(v); };
      const svg = el("svg", { viewBox: `0 0 ${PL.w} ${PL.h}`, class: "plano" + (trava ? "" : " pega"), role: "img", "aria-label": `Plano cartesiano com ${v.map((q, i) => `${it.pontos[i].nome || "o ponto"} em ${par(q)}`).join(" e ")}` },
        eixos(it), cenarioDe(it), mostraCurva && el("path", { class: "curva-azul", d: tracado(it, it.fixos) }), pol, reta, bolas.map((b) => [!trava && b.halo, b.miolo, b.nome]));
      if (!trava) {
        let de = null, quadro = 0, vivo = null;
        const onde = (ev) => { const r = svg.getBoundingClientRect(), q = dePx(((ev.clientX - r.left) / r.width) * PL.w, ((ev.clientY - r.top) / r.height) * PL.h);
          q[0] = Math.max(e.x0, Math.min(e.x1, q[0])); q[1] = it.preso ? f(q[0]) : Math.max(e.y0, Math.min(e.y1, q[1])); return q; };
        const pinta = () => { quadro = 0; if (de == null) return; v[de] = vivo; poe(de, vivo); if (reta) reta.setAttribute("d", ligaD()); if (pol) pol.setAttribute("d", polD()); escreve(v.map((q, i) => (i === de ? assenta(q.slice()) : q))); };
        svg.addEventListener("pointerdown", (ev) => { const q = onde(ev); de = v.map((w, i) => [Math.hypot(e.X(q[0]) - e.X(w[0]), e.Y(q[1]) - e.Y(w[1])), i]).sort((x, y) => x[0] - y[0])[0][1];
          svg.setPointerCapture(ev.pointerId); svg.classList.add("girando"); vivo = q; pinta(); });
        svg.addEventListener("pointermove", (ev) => { if (de == null) return; vivo = onde(ev); if (!quadro) quadro = requestAnimationFrame(pinta); });
        const solta = () => { if (de == null) return; assenta(v[de]); de = null; guarda(); tocar(); pintar(); };
        svg.addEventListener("pointerup", solta); svg.addEventListener("pointercancel", solta);
      }
      const acesso = el("div", { class: "so-leitor" }, v.flatMap((q, i) => (it.preso ? [0] : [0, 1]).map((k) => { const lim = k ? [e.y0, e.y1] : [e.x0, e.x1];
        const b = el("input", { type: "range", min: String(lim[0]), max: String(lim[1]), step: String(enc), value: String(q[k]), disabled: trava, "aria-label": `${it.pontos[i].nome || "ponto"}, ${k ? "y" : "x"}` });
        b.addEventListener("change", () => { v[i][k] = Number(b.value); assenta(v[i]); guarda(); pintar(); }); return b; })));
      const conferir = () => { const acerto = certoDe(v); if (s.primeira == null) s.primeira = acerto; if (acerto) { s.m = it.certa; pintar(K(it)); } else { s.erro = true; pintar(K(it, "e")); } };
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), svg, lei, acesso];
      const gabarito = it.na_curva || it.alvo ? (it.exemplo || []).map(par).join(it.alvo ? ", " : " e ") : it.pontos.map((q) => `${q.nome || "P"} = ${par(it.preso ? [q.certa[0], f(q.certa[0])] : q.certa)}`).join("  ·  ");
      if (c.prova) return [topo, fim && el("p", { class: "linha" + (ok ? " certo" : "") }, (it.na_curva || it.alvo) && !ok ? "por exemplo, " : "", gabarito, ok && " ✓"), fim && nota(it.comentario)];
      return [topo, !ok && el("p", { class: "pedido" }, v.length > 1 ? TX.levar2 : TX.levar), !ok && botao(TX.conferir, conferir, "leve forte"),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)] : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(it.erro)])];
    },
    // Venn: o aluno preenche as regiões com números (toca na região, depois no número) ou pinta as regiões de uma operação.
    venn(it, c) {
      const ler = it.tipo === "venn_pronto", s = S(it), n = it.conjuntos.length, B = vennBase(n), fim = !!(c && c.prova && c.fim), ok = !ler && s.m === it.certa, trava = ler || fim || (!c.prova && ok);
      const pintar_ = !!it.pinta, dadas = ler ? Object.keys(it.regioes || {}) : pintar_ ? Object.keys(it.regioes || {}) : it.dadas || [], pedidas = pintar_ ? regioesDe(n).filter((k) => k !== "fora" || it.fora !== false) : Object.keys(it.regioes || {}).filter((k) => !dadas.includes(k));
      const v = { ...Object.fromEntries(dadas.map((k) => [k, it.regioes[k]])), ...(pintar_ ? {} : s.v || {}) }, p = new Set(pintar_ ? s.p || [] : ler ? it.destaque || [] : []);
      const chave = () => (pintar_ ? [...p].sort().join(",") : Object.keys(it.regioes).sort().map((k) => `${k}=${v[k] ?? ""}`).join(","));
      const errada = (k) => s.erro && (pintar_ ? p.has(k) !== it.pinta.includes(k) : pedidas.includes(k) && v[k] !== it.regioes[k]);
      const toca = (k) => { if (trava || !k || !pedidas.includes(k)) return; tocar(); s.erro = false;
        if (pintar_) { p.has(k) ? p.delete(k) : p.add(k); s.p = [...p]; if (c.prova) s.m = chave(); } else s.sel = s.sel === k ? null : k; pintar(); };
      const fundos = regioesDe(n).map((k) => { const cls = errada(k) ? "r-erro" : p.has(k) ? "r-pinta" : !pintar_ && s.sel === k && !trava ? "r-sel" : null; return cls && B.regiao(k, cls); });
      const numeros = regioesDe(n).map((k) => { const tem = v[k] != null, pede = !pintar_ && pedidas.includes(k); if (!tem && !pede) return null;
        return el("text", { class: "mao-v" + (pede ? (errada(k) ? " d-erro" : tem ? " d-descobre" : " d-vazia") : ""), x: B.G.n[k][0], y: B.G.n[k][1], "text-anchor": "middle" }, tem ? num(v[k]) : "?"); });
      const svg = el("svg", { viewBox: "0 0 320 220", class: "plano venn" + (trava ? "" : " toca"), role: "img", "aria-label": `Diagrama de Venn de ${it.conjuntos.join(", ")}` + (dadas.length ? `: ${dadas.map((k) => `${nomeRegiao(k, it.conjuntos)}, ${num(it.regioes[k])}`).join("; ")}` : "") },
        B.defs, el("rect", { class: "universo", x: 5, y: 5, width: 310, height: 210, rx: 6 }), fundos, el("g", { filter: `url(#${B.id}f)` }, B.L.map((l) => el("circle", { class: "aro", cx: B.G.c[l][0], cy: B.G.c[l][1], r: B.G.r }))),
        B.L.map((l, i) => el("text", { class: "mao-v nome-v", x: B.G.t[l][0], y: B.G.t[l][1], "text-anchor": B.G.t[l][2] }, it.conjuntos[i])), numeros);
      svg.addEventListener("click", (e) => { const r = svg.getBoundingClientRect(); toca(B.onde(((e.clientX - r.left) / r.width) * 320, ((e.clientY - r.top) / r.height) * 220)); });
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), svg];
      if (ler) return topo;
      const acesso = !trava && el("div", { class: "so-leitor" }, pedidas.map((k) => el("button", { type: "button", "data-k": k, "aria-pressed": String(pintar_ ? p.has(k) : s.sel === k), onclick: () => toca(k) }, nomeRegiao(k, it.conjuntos))));
      const banco = !pintar_ && !trava && el("div", { class: "bandeja" }, it.banco.map((x) => el("button", { type: "button", disabled: !s.sel, onclick: () => { tocar(); v[s.sel] = x; s.v = { ...(s.v || {}), [s.sel]: x }; s.sel = null; s.erro = false; if (c.prova) s.m = chave(); pintar(); } }, num(x))));
      const conferir = () => { const kk = chave(); if (s.primeira == null) s.primeira = kk === it.certa; if (kk === it.certa) { s.m = kk; pintar(K(it)); } else { s.erro = true; s.sel = null; pintar(K(it, "e")); } };
      const gabarito = pintar_ ? it.pinta.map((k) => nomeRegiao(k, it.conjuntos)).join(" · ") : pedidas.map((k) => `${nomeRegiao(k, it.conjuntos)}: ${num(it.regioes[k])}`).join(" · ");
      if (c.prova) return [topo, acesso, banco, fim && el("p", { class: "linha" + (ok ? " certo" : "") }, gabarito, ok && " ✓"), fim && nota(it.comentario)];
      const faltam = pedidas.filter((k) => (pintar_ ? p.has(k) !== it.pinta.includes(k) : v[k] !== it.regioes[k])).length, cheio = pintar_ || pedidas.every((k) => v[k] != null);
      return [topo, acesso, banco, !ok && el("p", { class: "pedido" }, pintar_ ? TX.pintar_v : TX.preencher), !ok && cheio && botao(TX.conferir, conferir, "leve forte"),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)]
          : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(`${faltam === 1 ? "1 região não bate (em vermelho)." : `${faltam} regiões não batem (em vermelho).`} ${it.erro || ""}`.trim())])];
    },
    venn_pronto(it) { return desenha.venn(it, {}); },
    // A árvore de possibilidades: abre um nível por toque; cada ramo entra riscando.
    arvore(it) {
      // Dois jeitos: "niveis" (todo nó abre os mesmos ramos: possibilidades) ou "raiz" (cada nó tem os seus filhos: fatoração).
      const rz = it.raiz, fundo = (no) => (no.filhos && no.filhos.length ? 1 + Math.max(...no.filhos.map(fundo)) : 0), conta = (no) => (no.filhos && no.filhos.length ? no.filhos.reduce((t, f) => t + conta(f), 0) : 1);
      const N = rz ? Array.from({ length: fundo(rz) }, (_, i) => (it.niveis_raiz || [])[i] || {}) : it.niveis, total = N.length, s = S(it), primeira = estreia(it), n = Math.min(total, s.n || 1), viva = (primeira || E.anima === K(it, "a")) && MOVE;
      const folhas = rz ? conta(rz) : N.reduce((a, l) => a * l.ramos.length, 1), H = Math.max(110, folhas * (N.some((l) => l.pesos) ? 38 : 23) + 30), l0 = rz ? String(rz.rotulo).length * 7.4 + 6 : 0, colW = (320 - 20 - (rz ? 40 : 64) - l0) / total, X0 = 14 + l0, nos = [], larg = (t) => Math.min(colW * 0.5, String(t).length * 7.2 + 8);
      const montaR = (no, k, y0, y1, pai) => { let y = y0; for (const f of no.filhos || []) { const h = ((y1 - y0) * conta(f)) / conta(no), filho = { k, x: X0 + colW * (k + 1), y: y + h / 2, pai, rotulo: f.rotulo, caminho: [], folha: !(f.filhos && f.filhos.length) }; nos.push(filho); montaR(f, k + 1, y, y + h, filho); y += h; } };
      const monta = (k, y0, y1, pai, caminho, idx) => { if (k === total) return; const L = N[k], m = L.ramos.length, passo = (y1 - y0) / m, pesos = L.pesos && (Array.isArray(L.pesos[0]) ? L.pesos[idx] : L.pesos);
        L.ramos.forEach((r, i) => { const no = { k, x: X0 + colW * (k + 1), y: y0 + passo * (i + 0.5), pai, rotulo: r, peso: pesos && pesos[i], caminho: [...caminho, r] }; nos.push(no); monta(k + 1, y0 + passo * i, y0 + passo * (i + 1), no, no.caminho, idx * m + i); }); };
      if (rz) montaR(rz, 0, 20, H - 6, { x: X0, y: (H + 14) / 2, rotulo: "" }); else monta(0, 20, H - 6, { x: X0, y: (H + 14) / 2, rotulo: "" }, [], 0);
      const cheia = n === total, marcado = (no) => (rz ? cheia && !!it.destaque_folhas && no.folha : cheia && (it.destaque || []).some((d) => no.caminho.every((r, i) => d[i] === r)));
      const tracos = [], grifos = [], textos = [], novosT = [], novosX = [];
      for (const no of nos.filter((q) => q.k < n)) {
        const x0 = no.pai.x + (no.pai.rotulo ? larg(no.pai.rotulo) : 4), d = `M${x0.toFixed(1)} ${no.pai.y.toFixed(1)}L${(no.x - 5).toFixed(1)} ${no.y.toFixed(1)}`, novo = viva && (primeira || no.k === n - 1);
        if (marcado(no)) grifos.push(el("path", { class: "d-grifo", d }));
        const t = el("path", { class: "ramo", d }), r = el("text", { class: "mao-a" + (marcado(no) && no.k === total - 1 ? " d-descobre" : ""), x: no.x, y: no.y + 5 }, no.rotulo); tracos.push(t); textos.push(r);
        const ps = no.peso != null && el("text", { class: "mao-a peso-a", x: x0 + (no.x - 5 - x0) * 0.5, y: no.pai.y + (no.y - no.pai.y) * 0.5 + (no.y <= no.pai.y ? -5 : 14), "text-anchor": "middle" }, String(no.peso)); if (ps) textos.push(ps);
        if (novo) { novosT.push(t); novosX.push(r); if (ps) novosX.push(ps); }
      }
      const passo = Math.min(160, 1500 / Math.max(1, novosT.length)); novosT.forEach((x, i) => riscar(x, i * passo)); novosX.forEach((x) => { x.classList.add("aparece"); depois(x, Math.min(1500, novosT.length * passo)); });
      const svg = el("svg", { viewBox: `0 0 320 ${H}`, role: "img", "aria-label": it.alt }, filtroMao("mao-a", 320, H), N.slice(0, n).map((l, k) => l.nome && el("text", { class: "marca", x: X0 + colW * (k + 1), y: 10 }, l.nome)),
        grifos, rz ? el("text", { class: "mao-a", x: X0 - 3, y: (H + 14) / 2 + 5, "text-anchor": "end" }, rz.rotulo) : el("circle", { class: "raiz", cx: X0, cy: (H + 14) / 2, r: 3 }), el("g", { class: "caneta-a" }, tracos), textos);
      const falas = N.slice(0, n).map((l, i) => l.fala && el("p", { class: "linha passo-d" + (viva && i === n - 1 ? " escreve" : "") }, l.fala));
      return [it.texto && el("p", { class: "situacao" }, it.texto), el("div", { class: "desenho arvore" }, svg), fala(falas),
        n < total && botao(N[n].botao || TX.proximo_nivel, () => { tocar(); s.n = n + 1; pintar(K(it, "a")); }, "leve forte")];
    },
    // O cartão de uma sondagem da plataforma (o "Antes da aula" do ENEM): abre em outra página e volta. Não trava a via.
    sondagem(it) {
      const feita = !!(A.feitas && A.feitas[it.id]);
      return [el("div", { class: "sondagem" + (feita ? " feita" : "") }, el("p", { class: "situacao" }, it.texto),
        el("a", { class: "botao-s" + (feita ? " leve" : ""), href: it.link }, feita ? TX.sond_rever : it.botao), feita && el("span", { class: "linha certo" }, TX.sond_feita)),
        !feita && el("p", { class: "pedido" }, TX.sond_pular)];
    },
    // A reta real: o aluno leva pontos (inteiros, decimais, frações) ou monta um intervalo, com bolinha aberta ou fechada.
    // Ponta levada até a borda da reta quer dizer "até o infinito".
    reta(it, c) {
      const s = S(it), fim = !!(c.prova && c.fim), ok = s.m === it.certa, trava = fim || (!c.prova && ok), I = it.intervalo, enc = it.passo / (it.divisoes || 1), x0 = 24, x1 = 296, yy = 58;
      const X = (v) => x0 + ((v - it.de) / (it.ate - it.de)) * (x1 - x0), V = (px) => it.de + ((px - x0) / (x1 - x0)) * (it.ate - it.de), limpo = (x) => Math.round(x * 1e6) / 1e6 + 0;
      const perto = (x) => limpo(Math.max(it.de, Math.min(it.ate, it.de + Math.round((x - it.de) / enc) * enc)));
      const mdc = (a, b) => (b ? mdc(b, a % b) : Math.abs(a)), den = Math.round(1 / enc), fr = (x) => { if (!it.fracao || Number.isInteger(x)) return menos(num(x)); const n = Math.round(x * den), g = mdc(n, den) || 1; return `${n < 0 ? "−" : ""}${Math.abs(n) / g}/${den / g}`; };
      const meio = (it.ate - it.de) / 4, v = (s.v || (I ? I.inicio || [perto(it.de + meio), perto(it.ate - meio)] : it.pontos.map((q) => q.inicio))).slice(), ab = (s.ab || [false, false]).slice();
      const inf = (k) => I && (k ? v[1] === it.ate : v[0] === it.de);
      const certoDe = () => (I ? [0, 1].every((k) => { const alvo = k ? I.ate : I.de; return alvo == null ? inf(k) : !inf(k) && v[k] === alvo && ab[k] === !!I.aberto[k]; }) : v.every((x, i) => x === it.pontos[i].certa));
      const frase = () => { if (!I) return v.map((x, i) => `${it.pontos[i].nome || "P"} = ${fr(perto(x))}`).join("  ·  "); const a = fr(perto(v[0])), b = fr(perto(v[1])), L = inf(0), R = inf(1);
        return L && R ? "todos os números" : L ? `x ${ab[1] ? "<" : "≤"} ${b}` : R ? `x ${ab[0] ? ">" : "≥"} ${a}` : `${a} ${ab[0] ? "<" : "≤"} x ${ab[1] ? "<" : "≤"} ${b}`; };
      const papel = [el("path", { class: "eixo-r", d: `M${x0 - 14} ${yy}H${x1 + 14}` }), el("path", { class: "seta-r", d: `M${x1 + 18} ${yy}l-7 -4v8zM${x0 - 18} ${yy}l7 -4v8z` })];
      for (let k = 0; k <= Math.round((it.ate - it.de) / enc); k++) { const x = limpo(it.de + k * enc), grande = k % (it.divisoes || 1) === 0;
        papel.push(el("path", { class: "eixo-r", d: `M${X(x).toFixed(1)} ${yy - (grande ? 7 : 4)}v${grande ? 14 : 8}` })); if (grande) papel.push(el("text", { class: "marca", x: X(x), y: yy + 22, "text-anchor": "middle" }, menos(num(x)))); }
      for (const m of it.marcas || []) papel.push(el("path", { class: "eixo-r", d: `M${X(m.x).toFixed(1)} ${yy - 9}v9` }), el("text", { class: "mao-p d-dado", x: X(m.x), y: yy - 13, "text-anchor": "middle" }, m.rotulo));
      const faixa = I && el("path", { class: "faixa-r" }), traco = I && el("path", { class: "liga-p" }), ponta = I && el("path", { class: "ponta-r" }), lei = el("p", { class: "lei" + (E.anima === K(it) ? " grifa" : "") });
      const alcas = v.map((_, i) => ({ halo: el("circle", { class: "halo-p", r: 13, cy: yy }), miolo: el("circle", { class: "miolo-p", r: 5.4, cy: yy }), nome: !I && el("text", { class: "mao-p", "text-anchor": "middle", y: yy - 16 }, it.pontos[i].nome || "") }));
      const poe = () => { v.forEach((x, i) => { const px = X(x), a = alcas[i]; a.halo.setAttribute("cx", px); a.miolo.setAttribute("cx", px); a.miolo.setAttribute("class", "miolo-p" + (I && ab[i] ? " aberta" : "") + (inf(i) ? " some" : "")); if (a.nome) a.nome.setAttribute("x", px); });
        if (I) { const d = `M${(X(v[0]) - (inf(0) ? 12 : 0)).toFixed(1)} ${yy}H${(X(v[1]) + (inf(1) ? 12 : 0)).toFixed(1)}`; faixa.setAttribute("d", d); traco.setAttribute("d", d);
          ponta.setAttribute("d", (inf(1) ? `M${(X(v[1]) + 19).toFixed(1)} ${yy}l-9 -5.5v11z` : "") + (inf(0) ? `M${(X(v[0]) - 19).toFixed(1)} ${yy}l9 -5.5v11z` : "")); } lei.replaceChildren(frase()); };
      poe();
      const guarda = () => { s.v = v.slice(); s.ab = ab.slice(); s.erro = false; if (c.prova) s.m = certoDe() ? it.certa : `${v.join(",")}|${ab.join(",")}`; };
      const svg = el("svg", { viewBox: "0 0 320 96", class: "plano reta-r" + (trava ? "" : " pega"), role: "img", "aria-label": `Reta numérica de ${num(it.de)} a ${num(it.ate)}: ${frase()}` }, papel, faixa, traco, ponta, alcas.map((a) => [!trava && a.halo, a.miolo, a.nome]));
      if (!trava) {
        let de = null, quadro = 0, px0 = 0, moveu = false, vivo = 0;
        const onde = (ev) => { const r = svg.getBoundingClientRect(); return ((ev.clientX - r.left) / r.width) * 320; };
        const pinta = () => { quadro = 0; if (de == null) return; v[de] = vivo; if (I) { if (de === 0) v[0] = Math.min(v[0], v[1] - enc); else v[1] = Math.max(v[1], v[0] + enc); } poe(); };
        svg.addEventListener("pointerdown", (ev) => { px0 = onde(ev); de = v.length === 1 || Math.abs(px0 - X(v[0])) <= Math.abs(px0 - X(v[1])) ? 0 : 1; moveu = false; svg.setPointerCapture(ev.pointerId); });
        svg.addEventListener("pointermove", (ev) => { if (de == null) return; const px = onde(ev); if (Math.abs(px - px0) > 4) moveu = true; if (!moveu) return; vivo = Math.max(it.de, Math.min(it.ate, V(px))); if (!quadro) quadro = requestAnimationFrame(pinta); });
        const solta = () => { if (de == null) return; if (moveu) { v[de] = perto(v[de]); if (I && v[0] >= v[1]) v[de] = de ? perto(v[0] + enc) : perto(v[1] - enc); } else if (I && !inf(de)) ab[de] = !ab[de]; de = null; guarda(); tocar(); pintar(); };
        svg.addEventListener("pointerup", solta); svg.addEventListener("pointercancel", solta);
      }
      const acesso = el("div", { class: "so-leitor" }, v.map((x, i) => { const b = el("input", { type: "range", min: String(it.de), max: String(it.ate), step: String(enc), value: String(x), disabled: trava, "aria-label": I ? (i ? "ponta direita" : "ponta esquerda") : it.pontos[i].nome || "ponto" });
        b.addEventListener("change", () => { v[i] = perto(Number(b.value)); guarda(); pintar(); }); return b; }),
        I && [0, 1].map((k) => { const b = el("input", { type: "checkbox", checked: ab[k], disabled: trava, "aria-label": `${k ? "ponta direita" : "ponta esquerda"} aberta` }); b.addEventListener("change", () => { ab[k] = b.checked; guarda(); pintar(); }); return b; }));
      const conferir = () => { const acerto = certoDe(); if (s.primeira == null) s.primeira = acerto; if (acerto) { s.m = it.certa; pintar(K(it)); } else { s.erro = true; pintar(K(it, "e")); } };
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), svg, lei, acesso];
      if (c.prova) return [topo, fim && !ok && nota(it.erro), fim && nota(it.comentario)];
      return [topo, !ok && el("p", { class: "pedido" }, I ? TX.levar_i : v.length > 1 ? TX.levar2 : TX.levar), !ok && botao(TX.conferir, conferir, "leve forte"),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)] : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(it.erro)])];
    },
    // O ângulo inscrito: A e B ficam parados, o aluno leva P pela circunferência e vê o ângulo em P não mudar
    // enquanto P fica no mesmo arco. Não pede resposta; a pergunta vem no item seguinte.
    inscrito(it) {
      const s = S(it), R = 96, cx = 160, cy = 116, rad = (a) => (a * Math.PI) / 180, P = (a, r = R) => [cx + r * Math.cos(rad(a)), cy - r * Math.sin(rad(a))], A = it.fixos.A, B = it.fixos.B, enc = it.encaixe || 5, nome = it.movel.nome || "P";
      if (s.p == null) s.p = it.movel.inicio;
      const norm = (a) => ((a % 360) + 360) % 360, arcoAB = norm(B - A), angulo = (p) => (norm(p - A) < arcoAB ? 360 - arcoAB : arcoAB) / 2, central = !(it.mostra || ["central"]).includes("central") ? null : true;
      const d2 = (a, b) => `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`, rot = (t, a, cls, r = R + 15) => el("text", { class: "mao-p " + cls, x: P(a, r)[0], y: P(a, r)[1] + 6, "text-anchor": "middle" }, t);
      const cordas = el("path", { class: "corda-i" }), bola = el("circle", { class: "miolo-p", r: 5.2 }), halo = el("circle", { class: "halo-p", r: 13 }), rp = rot(nome, s.p, ""), lei = el("p", { class: "lei" });
      const poe = (p) => { const q = P(p); cordas.setAttribute("d", d2(P(A), q) + d2(q, P(B))); bola.setAttribute("cx", q[0]); bola.setAttribute("cy", q[1]); halo.setAttribute("cx", q[0]); halo.setAttribute("cy", q[1]);
        const l = P(p, R + 15); rp.setAttribute("x", l[0]); rp.setAttribute("y", l[1] + 6); const g = angulo(p);
        lei.replaceChildren(el("span", { class: "seno-t" }, `ângulo em ${nome} = ${num(g)}°`), central ? " · " : "", central ? el("span", { class: "cosseno-t" }, `ângulo central = ${num(2 * g)}°`) : ""); };
      const svg = el("svg", { viewBox: "0 0 320 232", class: "plano pega", role: "img", "aria-label": it.alt }, el("circle", { class: "volta-i", cx, cy, r: R }),
        central && el("path", { class: "central-i", d: d2(P(A), [cx, cy]) + d2([cx, cy], P(B)) }), cordas, el("circle", { class: "ponto-s", cx, cy, r: 2.6 }), el("text", { class: "mao-p d-dado", x: cx + 9, y: cy + 16 }, "O"),
        [A, B].map((a) => el("circle", { class: "ponto-s", cx: P(a)[0], cy: P(a)[1], r: 3.4 })), rot("A", A, "d-dado"), rot("B", B, "d-dado"), halo, bola, rp);
      poe(s.p);
      let de = false, quadro = 0, vivo = s.p;
      const onde = (ev) => { const r = svg.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * 320, y = ((ev.clientY - r.top) / r.height) * 232; return norm((Math.atan2(cy - y, x - cx) * 180) / Math.PI); };
      svg.addEventListener("pointerdown", (ev) => { de = true; svg.setPointerCapture(ev.pointerId); vivo = onde(ev); poe(vivo); });
      svg.addEventListener("pointermove", (ev) => { if (!de) return; vivo = onde(ev); if (!quadro) quadro = requestAnimationFrame(() => { quadro = 0; poe(vivo); }); });
      const solta = () => { if (!de) return; de = false; let p = norm(Math.round(vivo / enc) * enc); if (p === norm(A) || p === norm(B)) p = norm(p + enc); s.p = p; poe(p); tocar(); if (H) H.salvar(foto()); };
      svg.addEventListener("pointerup", solta); svg.addEventListener("pointercancel", solta);
      return [it.texto && el("p", { class: "situacao" }, it.texto), svg, lei, el("p", { class: "pedido" }, TX.girar_p)];
    },
    // A circunferência que o aluno ajusta: leva o centro e puxa o ponto azul para acertar o raio.
    circunferencia(it, c) {
      const s = S(it), fim = !!(c.prova && c.fim), ok = s.m === it.certa, trava = fim || (!c.prova && ok), e = escala(it), ini = it.inicio || { centro: [0, 0], raio: 1 };
      const v = s.v ? { centro: s.v.centro.slice(), raio: s.v.raio } : { centro: ini.centro.slice(), raio: ini.raio }, certoDe = () => v.centro[0] === it.centro[0] && v.centro[1] === it.centro[1] && v.raio === it.raio;
      const dePx = (px, py) => [e.x0 + ((px - PL.e) / (PL.w - PL.e - PL.d)) * (e.x1 - e.x0), e.y1 - ((py - PL.c) / (PL.h - PL.c - PL.b)) * (e.y1 - e.y0)], rMax = Math.floor(Math.min(e.x1 - e.x0, e.y1 - e.y0) / 2);
      const volta = el("path", { class: "curva-azul" }), halo = el("circle", { class: "halo-p", r: 13 }), miolo = el("circle", { class: "miolo-p", r: 4.8 }), puxa = el("circle", { class: "puxa-c", r: 5.6 }), raioL = el("path", { class: "raio-c" }), lei = el("p", { class: "lei" + (E.anima === K(it) ? " grifa" : "") });
      const poe = (ct, r) => { volta.setAttribute("d", "M" + Array.from({ length: 73 }, (_, i) => `${e.X(ct[0] + r * Math.cos((i * Math.PI) / 36)).toFixed(1)} ${e.Y(ct[1] + r * Math.sin((i * Math.PI) / 36)).toFixed(1)}`).join("L") + "Z");
        for (const n of [halo, miolo]) { n.setAttribute("cx", e.X(ct[0])); n.setAttribute("cy", e.Y(ct[1])); } puxa.setAttribute("cx", e.X(ct[0] + r)); puxa.setAttribute("cy", e.Y(ct[1]));
        raioL.setAttribute("d", `M${e.X(ct[0]).toFixed(1)} ${e.Y(ct[1]).toFixed(1)}H${e.X(ct[0] + r).toFixed(1)}`); lei.replaceChildren(`centro (${menos(Math.round(ct[0]))}; ${menos(Math.round(ct[1]))})  ·  raio ${num(Math.max(1, Math.round(r)))}`); };
      poe(v.centro, v.raio);
      const guarda = () => { s.v = { centro: v.centro.slice(), raio: v.raio }; s.erro = false; if (c.prova) s.m = certoDe() ? it.certa : `${v.centro.join(",")}|${v.raio}`; };
      const svg = el("svg", { viewBox: `0 0 ${PL.w} ${PL.h}`, class: "plano" + (trava ? "" : " pega"), role: "img", "aria-label": `Circunferência de centro (${v.centro.join("; ")}) e raio ${v.raio}` }, eixos(it), cenarioDe(it), volta, raioL, !trava && halo, miolo, !trava && puxa);
      if (!trava) {
        let de = null, quadro = 0, vivo = null;
        const onde = (ev) => { const r = svg.getBoundingClientRect(); return dePx(((ev.clientX - r.left) / r.width) * PL.w, ((ev.clientY - r.top) / r.height) * PL.h); };
        const pinta = () => { quadro = 0; if (de === "c") poe(vivo, v.raio); else if (de === "r") poe(v.centro, Math.max(0.5, Math.min(rMax, vivo[0] - v.centro[0]))); };
        svg.addEventListener("pointerdown", (ev) => { const q = onde(ev), dc = Math.hypot(e.X(q[0]) - e.X(v.centro[0]), e.Y(q[1]) - e.Y(v.centro[1])), dr = Math.hypot(e.X(q[0]) - e.X(v.centro[0] + v.raio), e.Y(q[1]) - e.Y(v.centro[1])); de = dr < dc ? "r" : "c"; vivo = q; svg.setPointerCapture(ev.pointerId); });
        svg.addEventListener("pointermove", (ev) => { if (!de) return; vivo = onde(ev); if (!quadro) quadro = requestAnimationFrame(pinta); });
        const solta = () => { if (!de) return; if (de === "c") v.centro = [Math.max(e.x0, Math.min(e.x1, Math.round(vivo[0]))), Math.max(e.y0, Math.min(e.y1, Math.round(vivo[1])))]; else v.raio = Math.max(1, Math.min(rMax, Math.round(vivo[0] - v.centro[0]))); de = null; guarda(); tocar(); pintar(); };
        svg.addEventListener("pointerup", solta); svg.addEventListener("pointercancel", solta);
      }
      const acesso = el("div", { class: "so-leitor" }, [["x do centro", e.x0, e.x1, v.centro[0], (x) => { v.centro[0] = x; }], ["y do centro", e.y0, e.y1, v.centro[1], (x) => { v.centro[1] = x; }], ["raio", 1, rMax, v.raio, (x) => { v.raio = x; }]].map(([rotulo, a, b, x, poeV]) => {
        const i = el("input", { type: "range", min: String(a), max: String(b), step: "1", value: String(x), disabled: trava, "aria-label": rotulo }); i.addEventListener("change", () => { poeV(Number(i.value)); guarda(); pintar(); }); return i; }));
      const conferir = () => { const acerto = certoDe(); if (s.primeira == null) s.primeira = acerto; if (acerto) { s.m = it.certa; pintar(K(it)); } else { s.erro = true; pintar(K(it, "e")); } };
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), svg, lei, acesso];
      if (c.prova) return [topo, fim && el("p", { class: "linha" + (ok ? " certo" : "") }, `centro (${it.centro.map(menos).join("; ")}), raio ${num(it.raio)}`, ok && " ✓"), fim && nota(it.comentario)];
      return [topo, !ok && el("p", { class: "pedido" }, TX.levar_c), !ok && botao(TX.conferir, conferir, "leve forte"),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)] : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(it.erro)])];
    },
    // A região do plano: uma ou duas retas dividem o plano e o aluno toca na região que serve (inequação e sistema).
    regiao(it, c) {
      const s = S(it), fim = !!(c.prova && c.fim), ok = s.m === it.certa, trava = fim || (!c.prova && ok), e = escala(it), R = it.retas;
      const f = (r, p) => (r.x != null ? p[0] - r.x : p[1] - (r.a * p[0] + r.b)), lado = (r, p) => { const d = f(r, p); return Math.abs(d) < 1e-9 ? null : r.x != null ? (d > 0 ? "direita" : "esquerda") : d > 0 ? "acima" : "abaixo"; };
      const sinal = (r, l) => (l === "acima" || l === "direita" ? 1 : -1), escolha = fim ? it.lados : s.r;
      const recorta = (lados) => { let pol = [[e.x0, e.y0], [e.x1, e.y0], [e.x1, e.y1], [e.x0, e.y1]];
        R.forEach((r, k) => { const g = (p) => sinal(r, lados[k]) * f(r, p), novo = []; pol.forEach((p, i) => { const q = pol[(i + 1) % pol.length], gp = g(p), gq = g(q); if (gp >= 0) novo.push(p); if (gp * gq < 0) { const t = gp / (gp - gq); novo.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); } }); pol = novo; });
        return pol.length ? "M" + pol.map((p) => `${e.X(p[0]).toFixed(1)} ${e.Y(p[1]).toFixed(1)}`).join("L") + "Z" : ""; };
      const linhas = R.map((r) => { const a = r.x != null ? [[r.x, e.y0], [r.x, e.y1]] : [[e.x0, r.a * e.x0 + r.b], [e.x1, r.a * e.x1 + r.b]];
        // corta a reta na janela
        let t0 = 0, t1 = 1; const d = [a[1][0] - a[0][0], a[1][1] - a[0][1]]; [[e.x0, e.x1], [e.y0, e.y1]].forEach(([lo, hi], k) => { if (!d[k]) return; const u = (lo - a[0][k]) / d[k], w = (hi - a[0][k]) / d[k]; t0 = Math.max(t0, Math.min(u, w)); t1 = Math.min(t1, Math.max(u, w)); });
        const p0 = [a[0][0] + t0 * d[0], a[0][1] + t0 * d[1]], p1 = [a[0][0] + t1 * d[0], a[0][1] + t1 * d[1]];
        return [el("path", { class: "curva-cen" + (r.tracejada ? " tracejada" : ""), d: `M${e.X(p0[0]).toFixed(1)} ${e.Y(p0[1]).toFixed(1)}L${e.X(p1[0]).toFixed(1)} ${e.Y(p1[1]).toFixed(1)}` }),
          r.nome && el("text", { class: "mao-p d-dado", x: Math.min(PL.w - PL.d - 10, Math.max(PL.e + 10, e.X(p1[0]) - 22)), y: Math.max(PL.c + 14, Math.min(PL.h - PL.b - 6, e.Y(p1[1]) - 9)), "text-anchor": "middle" }, r.nome)]; });
      const escolher = (lados) => { if (trava || lados.includes(null)) return; tocar(); s.r = lados; s.erro = false; if (c.prova) s.m = lados.join(","); pintar(); };
      const svg = el("svg", { viewBox: `0 0 ${PL.w} ${PL.h}`, class: "plano" + (trava ? "" : " toca-r"), role: "img", "aria-label": "Plano cartesiano com " + (R.length > 1 ? "duas retas" : "uma reta") + (escolha ? `; região marcada: ${escolha.join(" e ")}` : "") },
        eixos(it), escolha && el("path", { class: "regiao-p" + (!c.prova && s.erro ? " errada" : ""), d: recorta(escolha) }), linhas);
      svg.addEventListener("click", (ev) => { const r = svg.getBoundingClientRect(), px = ((ev.clientX - r.left) / r.width) * PL.w, py = ((ev.clientY - r.top) / r.height) * PL.h;
        const p = [e.x0 + ((px - PL.e) / (PL.w - PL.e - PL.d)) * (e.x1 - e.x0), e.y1 - ((py - PL.c) / (PL.h - PL.c - PL.b)) * (e.y1 - e.y0)]; if (p[0] < e.x0 || p[0] > e.x1 || p[1] < e.y0 || p[1] > e.y1) return; escolher(R.map((q) => lado(q, p))); });
      const todas = R.reduce((l, r) => l.flatMap((x) => (r.x != null ? ["direita", "esquerda"] : ["acima", "abaixo"]).map((y) => [...x, y])), [[]]);
      const acesso = !trava && el("div", { class: "so-leitor" }, todas.map((l) => el("button", { type: "button", "data-k": l.join(","), "aria-pressed": String(!!s.r && s.r.join() === l.join()), onclick: () => escolher(l) }, l.map((x, k) => `${x} de ${R[k].nome || "reta " + (k + 1)}`).join(", "))));
      const conferir = () => { const k = (s.r || []).join(","); if (s.primeira == null) s.primeira = k === it.certa; if (k === it.certa) { s.m = k; pintar(K(it)); } else { s.erro = true; pintar(K(it, "e")); } };
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), svg, acesso];
      if (c.prova) return [topo, fim && !ok && nota(it.erro), fim && nota(it.comentario)];
      return [topo, !ok && el("p", { class: "pedido" }, TX.pintar_r), !ok && botao(TX.conferir, conferir, "leve forte", !s.r),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)] : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(it.erro)])];
    },
    // O ângulo que o aluno abre: um lado fica parado e o outro gira. Com o transferidor desenhado e sem a leitura,
    // o aluno lê na escala; sem o transferidor, estima.
    angulo(it, c) {
      const s = S(it), fim = !!(c.prova && c.fim), ok = s.m === it.certa, trava = fim || (!c.prova && ok), enc = it.encaixe || 5, cx = 160, cy = 168, R = 128, rad = (a) => (a * Math.PI) / 180, P = (a, r) => [cx + r * Math.cos(rad(a)), cy - r * Math.sin(rad(a))];
      let a = s.a == null ? it.inicio ?? 30 : s.a; const papel = [];
      if (it.transferidor !== false) { papel.push(el("path", { class: "transf", d: `M${cx - R} ${cy}A${R} ${R} 0 0 1 ${cx + R} ${cy}Z` }));
        for (let g = 0; g <= 180; g += 5) { const d = g % 30 === 0 ? 12 : g % 10 === 0 ? 8 : 4, p = P(g, R), q = P(g, R - d); papel.push(el("path", { class: "eixo-r", d: `M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}` }));
          if (g % 30 === 0) { const t = P(g, R - 22); papel.push(el("text", { class: "marca", x: t[0], y: t[1] + (g % 180 === 0 ? -5 : 3), "text-anchor": "middle" }, String(g))); } } }
      const setor = el("path", { class: "setor-a" }), lado = el("path", { class: "lado-a" }), bola = el("circle", { class: "miolo-p", r: 5.4 }), halo = el("circle", { class: "halo-p", r: 13 }), lei = el("p", { class: "lei" + (E.anima === K(it) ? " grifa" : "") });
      const poe = (g) => { const p = P(g, R + 8), q = P(g, 30); setor.setAttribute("d", `M${cx} ${cy}L${cx + 30} ${cy}A30 30 0 0 0 ${q[0].toFixed(1)} ${q[1].toFixed(1)}Z`); lado.setAttribute("d", `M${cx} ${cy}L${p[0].toFixed(1)} ${p[1].toFixed(1)}`);
        for (const n of [bola, halo]) { n.setAttribute("cx", p[0]); n.setAttribute("cy", p[1]); } if (it.leitura !== false) lei.replaceChildren(`${num(Math.round(g / enc) * enc)}°`); };
      poe(a);
      const svg = el("svg", { viewBox: "0 0 320 190", class: "plano" + (trava ? "" : " pega"), role: "img", "aria-label": `Ângulo aberto em ${a} graus` }, papel, setor, el("path", { class: "lado-fixo", d: `M${cx} ${cy}H${cx + R + 8}` }), lado, el("circle", { class: "ponto-s", cx, cy, r: 3 }), !trava && halo, !trava && bola);
      const guarda = (g) => { s.a = g; s.erro = false; if (c.prova) s.m = g; };
      if (!trava) {
        let de = false, quadro = 0, vivo = a;
        const onde = (ev) => { const r = svg.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * 320, y = ((ev.clientY - r.top) / r.height) * 190; return Math.max(0, Math.min(180, (Math.atan2(Math.max(0, cy - y), x - cx) * 180) / Math.PI)); };
        svg.addEventListener("pointerdown", (ev) => { de = true; svg.setPointerCapture(ev.pointerId); vivo = onde(ev); poe(vivo); });
        svg.addEventListener("pointermove", (ev) => { if (!de) return; vivo = onde(ev); if (!quadro) quadro = requestAnimationFrame(() => { quadro = 0; poe(vivo); }); });
        const solta = () => { if (!de) return; de = false; guarda(Math.round(vivo / enc) * enc); tocar(); pintar(); };
        svg.addEventListener("pointerup", solta); svg.addEventListener("pointercancel", solta);
      }
      const acesso = el("div", { class: "so-leitor" }, (() => { const b = el("input", { type: "range", min: "0", max: "180", step: String(enc), value: String(a), disabled: trava, "aria-label": "abertura do ângulo, em graus" }); b.addEventListener("change", () => { guarda(Number(b.value)); pintar(); }); return b; })());
      const conferir = () => { const acerto = a === it.certa; if (s.primeira == null) s.primeira = acerto; if (acerto) { s.m = it.certa; pintar(K(it)); } else { s.erro = true; pintar(K(it, "e")); } };
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), svg, it.leitura !== false && lei, acesso];
      if (c.prova) return [topo, fim && el("p", { class: "linha" + (ok ? " certo" : "") }, `${it.certa}°`, ok && " ✓"), fim && nota(it.comentario)];
      return [topo, !ok && el("p", { class: "pedido" }, TX.abrir_a), !ok && botao(TX.conferir, conferir, "leve forte"),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)] : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(`${a < it.certa ? "Abra mais." : "Feche um pouco."} ${it.erro || ""}`.trim())])];
    },
    ciclo(it, c) {
      const s = S(it), fim = !!(c.prova && c.fim), aceitos = [it.certa, ...(it.aceita || [])], ok = s.m === it.certa, trava = fim || (!c.prova && ok);
      const a = s.a, mostra = it.mostra || ["seno", "cosseno"], R = 38, rad = (g) => (g * Math.PI) / 180, px = (g) => 50 + R * Math.cos(rad(g)), py = (g) => 50 - R * Math.sin(rad(g));
      const nomeAng = (g) => (it.unidade === "rad" ? RADIANOS[g] : `${g}°`);
      // Três jeitos: um ângulo (certa), vários ângulos (certas: toca para marcar e desmarcar) ou um arco (arco: toca o
      // começo e o fim; o arco vai no sentido anti-horário, e "Outro lado" troca).
      const varios = !!it.certas, emArco = !!it.arco, marcados = new Set(s.as || []), ar = s.ar || [];
      const chave = () => (varios ? [...marcados].sort((x, y) => x - y).join(",") : emArco ? (ar.length === 2 ? `${ar[0]}>${ar[1]}` : "") : aceitos.includes(s.a) ? it.certa : s.a);
      const tocarPonto = (g) => { tocar(); s.a = g; s.erro = false;
        if (varios) { marcados.has(g) ? marcados.delete(g) : marcados.add(g); s.as = [...marcados]; }
        const nv = ar.length === 1 && ar[0] !== g ? [ar[0], g] : [g]; if (emArco) s.ar = nv;
        if (c.prova) s.m = emArco ? (nv.length === 2 ? `${nv[0]}>${nv[1]}` : "") : chave(); pintar(K(it, "p")); };
      const outroLado = () => { tocar(); s.ar = [ar[1], ar[0]]; s.erro = false; if (c.prova) s.m = `${ar[1]}>${ar[0]}`; pintar(); };
      const conferir = () => { const certo = varios || emArco ? chave() === it.certa : aceitos.includes(a); if (s.primeira == null) s.primeira = certo; if (certo) { s.m = it.certa; pintar(K(it)); } else { s.erro = true; pintar(K(it, "e")); } };
      // Ao tocar num ponto, a caneta desenha em fila: o arco do ângulo, o raio, os pontilhados até os eixos,
      // e por cima deles a altura (seno) e a sombra (cosseno).
      const viva = E.anima === K(it, "p"), temS = mostra.includes("seno"), temC = mostra.includes("cosseno");
      const arco = a ? depois(el("path", { class: "arco" + (viva ? " traca" : ""), pathLength: "1", d: a === 360 ? "" : `M59 50A9 9 0 ${a > 180 ? 1 : 0} 0 ${50 + 9 * Math.cos(rad(a))} ${50 - 9 * Math.sin(rad(a))}` }), 0) : null;
      const desenho = el("svg", { viewBox: "0 0 100 100", "aria-hidden": "true" }, TREMIDO(), el("line", { class: "eixo", x1: 4, y1: 50, x2: 96, y2: 50 }), el("line", { class: "eixo", x1: 50, y1: 4, x2: 50, y2: 96 }),
        el("circle", { class: "volta", cx: 50, cy: 50, r: R }),
        emArco && (fim ? [it.arco.de, it.arco.ate] : ar).length === 2 && (() => { const [d0, d1] = fim ? [it.arco.de, it.arco.ate] : ar, giro = ((d1 - d0 + 360) % 360) || 360, dd = `M${px(d0)} ${py(d0)}A${R} ${R} 0 ${giro > 180 ? 1 : 0} 0 ${px(d1)} ${py(d1)}`;
          return [el("path", { class: "arco-grifo", d: dd }), el("path", { class: "arco-marcado", d: dd })]; })(),
        a != null && !emArco && el("g", { class: "caneta-c" }, arco, traco("raio", 50, 50, px(a), py(a), viva, 250),
          temS && a % 180 !== 0 && pontilhado(px(a), py(a), 50, py(a), viva, 600), temC && a % 180 !== 90 && pontilhado(px(a), py(a), px(a), 50, viva, 600),
          temC && traco("cosseno", 50, 50, px(a), 50, viva, 1050), temS && traco("seno", px(a), 50, px(a), py(a), viva, 1300)));
      const pontos = ANGULOS.map((g) => {
        const meu = varios ? marcados.has(g) : emArco ? ar.includes(g) : a === g, dela = varios ? it.certas.includes(g) : emArco ? [it.arco.de, it.arco.ate].includes(g) : aceitos.includes(g);
        const res = fim ? (dela ? "certa" : meu ? "errada" : null) : !c.prova && ok && meu ? "certa" : !c.prova && s.erro && meu && (varios ? !dela : true) ? "errada" : null;
        const b = el("button", { type: "button", class: "ponto-c", "data-a": g, "aria-label": nomeAng(g), "aria-pressed": String(meu), disabled: trava, "data-res": res, onclick: () => tocarPonto(g) });
        b.style.left = `${px(g)}%`; b.style.top = `${py(g)}%`;
        return b;
      });
      const rotulos = mostra.includes("angulos") && ANGULOS.filter((g) => g % 30 === 0).map((g) => { const t = el("span", { class: "rot-c" }, nomeAng(g)); t.style.left = `${50 + (R + 9.5) * Math.cos(rad(g))}%`; t.style.top = `${50 - (R + 9.5) * Math.sin(rad(g))}%`; return t; });
      const leitura = a != null && mostra.includes("valores") && depois(el("p", { class: "lei" + (E.anima === K(it, "p") ? " escreve" : "") }, `${nomeAng(a)}: `, el("span", { class: "seno-t" }, `sen = ${trig(a, "sen")}`), " · ", el("span", { class: "cosseno-t" }, `cos = ${trig(a, "cos")}`)), E.anima === K(it, "p") ? 1600 : 0);
      const topo = [it.texto && el("p", { class: "situacao" }, it.texto), it.pergunta && el("span", { class: "etiqueta" }, it.pergunta), el("div", { class: "ciclo" }, desenho, rotulos, pontos),
        el("p", { class: "legenda-c" }, mostra.includes("seno") && el("span", { class: "seno-t" }, "seno: a altura"), mostra.includes("seno") && mostra.includes("cosseno") && " · ", mostra.includes("cosseno") && el("span", { class: "cosseno-t" }, "cosseno: a sombra no eixo")), leitura];
      const troca = emArco && ar.length === 2 && !trava && botao("Outro lado", outroLado, "leve"), gab = varios ? it.certas.map(nomeAng).join(" e ") : emArco ? `de ${nomeAng(it.arco.de)} a ${nomeAng(it.arco.ate)}` : null;
      const pedido = varios ? "Toque em todos os pontos que servem. Depois, confira." : emArco ? "Toque onde o arco começa e onde termina (sentido anti-horário). Depois, confira." : TX.ciclo;
      if (c.prova) return [topo, troca, !fim && el("p", { class: "pedido" }, pedido.split(". ")[0] + "."), fim && el("p", { class: "linha" + (ok ? " certo" : "") }, gab || [!ok && a != null && riscado(nomeAng(a)), !ok && " ", nomeAng(it.certa)], ok && " ✓"), fim && nota(it.comentario)];
      const q = (g) => (g % 90 === 0 ? "sobre um eixo" : `no ${Math.floor(g / 90) + 1}º quadrante`);
      return [topo, troca, !ok && el("p", { class: "pedido" }, pedido), !ok && botao(TX.conferir, conferir, "leve forte", varios ? !marcados.size : emArco ? ar.length < 2 : a == null),
        fala(ok ? [linha(it.escrita || TX.certo, it.escrita ? null : "certo", K(it)), nota(it.comentario)]
          : s.erro && [linha(TX.errado, "corrige", K(it, "e")), nota(`${varios || emArco ? "" : `Você marcou ${q(a)}. `}${it.erro || ""}`.trim())])];
    },
    // Questão com alternativas (de prova ou autoral): circular a letra; dicas na prática.
    questao(it, c) {
      const s = S(it), m = s.m, ok = m === it.certa, abertas = s.dicas || 0, dicas = it.dicas || [];
      if (c.prova) {
        return [alternativas(it, { marcada: m, travada: c.fim, res: c.fim ? (i) => (i === it.certa ? "certa" : m === i ? "errada" : null) : null, aoMarcar: (i) => { s.m = i; tocar(); pintar(); } }),
          c.fim && nota(it.comentario)];
      }
      return [alternativas(it, { marcada: m, travada: ok, res: (i) => (m === i ? (ok ? "certa" : "errada") : null), aoMarcar: (i) => { primeira(it, i); s.m = i; tocar(); pintar(K(it)); } }),
        abertas > 0 && el("ul", { class: "dicas" }, dicas.slice(0, abertas).map((d) => el("li", null, d))),
        !ok && abertas < dicas.length && botao(abertas ? TX.outra_dica : TX.dica, () => { s.dicas = abertas + 1; pintar(); }, "leve"),
        fala(m != null && [linha(ok ? TX.certo : TX.errado, ok ? "certo" : "corrige", K(it)), ok && nota(it.comentario)])];
    },
    // Exemplo resolvido: o aluno toma a decisão e a caneta escreve a resolução, uma linha por toque.
    exemplo(it) {
      const s = S(it), n = s.linhas || 0, fim = n >= it.linhas.length;
      return [el("p", { class: "situacao" }, it.texto),
        mesa(it.colunas, [[dado(it.antes[0]), dado(it.antes[1])], [dado(it.depois), fim ? { t: it.resposta, k: "escrito", chave: K(it) } : vazia]]),
        !s.ok && el("p", { class: "pedido" }, it.pergunta),
        !s.ok && botoes(it.opcoes, { nao: E.anima === K(it, "e") ? s.erro : null,
          aoTocar: (i) => { tocar(); if (i === it.certa) { s.ok = true; s.linhas = 1; pintar(K(it)); } else { s.erro = i; pintar(K(it, "e")); } } }),
        fala(!s.ok && s.erro != null && [linha(TX.olhe, "corrige", K(it, "e")), nota(it.erro)],
          it.linhas.slice(0, n).map((t, i) => el("p", { class: "linha" + (i === n - 1 ? an(K(it)) : "") }, t))),
        s.ok && !fim && botao(TX.proxima_linha, () => { s.linhas = n + 1; pintar(K(it)); }, "leve")];
    },
    // O trecho do vídeo que resolve a questão que o aluno já tentou.
    video(it) {
      const s = S(it), p = it.resolve && PALPITES[it.resolve], pal = p && S(p).m;
      if (it.em_gravacao) return [el("div", { class: "video", role: "img", "aria-label": `${it.nome}, ${TX.gravando}` }, el("span", null, TX.gravando)), nota(TX.gravando_nota)];
      return [player(it.nome, it.tempo, capitulos(it.capitulos)),
        !s.visto && !H && [nota(TX.video), botao(TX.visto, () => { s.visto = true; tocar(); pintar(K(it)); }, "leve")],
        s.visto && p && fala(linha(`fechou em ${"ABCDE"[p.questao.certa]}: ${it.fechou}`, null, K(it)),
          pal != null && nota(pal === p.questao.certa ? "Seu palpite bateu." : `Seu palpite era ${"ABCDE"[pal]}. É para isso que ele serve.`))];
    },
    // O vídeo corrido (modo "só assistir"): todos os capítulos; onde havia uma questão para tentar antes,
    // um aviso discreto que não interrompe.
    corrido() {
      const linhas = VIDEOS.flatMap((v) => v.capitulos.map((c) => capitulo(c, true)));
      const visto = VIDEOS.every((v) => S(v).visto), alvo = E.aviso && MEXER_ANTES[E.aviso];
      const aviso = alvo && el("div", { class: "aviso-video", role: "status" }, el("span", null, TX.tentar_antes),
        el("button", { type: "button", class: "leve forte", onclick: () => { E.aviso = null; trocarModo("passo", alvo); } }, TX.pausar),
        el("button", { type: "button", class: "quieto", onclick: () => { E.aviso = null; pintar(); } }, "Seguir"));
      return [player("A aula inteira", `${inicio(VIDEOS[0])} a ${fimDe(VIDEOS.at(-1))}`, el("ul", { class: "capitulos" }, linhas), aviso),
        H ? (visto && nota(TX.depois_corrido)) : !visto ? [nota(TX.video_corrido), botao(TX.visto_tudo, () => { for (const v of VIDEOS) S(v).visto = true; tocar(); pintar(); }, "leve")] : nota(TX.depois_corrido)];
    },
    // O quadro da aula em páginas, em branco e montado.
    folhas(it) {
      const s = S(it), pg = it.paginas[s.pagina || 0], total = it.paginas.length, i = s.pagina || 0;
      return [el("div", { class: "alternar", role: "group", "aria-label": "Estado do quadro" }, TX.modos.map((m, j) => el("button", {
        type: "button", "aria-pressed": String(!!s.montado === (j === 1)), onclick: () => { const muda = !!s.montado !== (j === 1); s.montado = j === 1; tocar(); pintar(muda && j === 1 ? K(it, "m") : null); } }, m))),
        el("section", { class: "pagina" }, el("h3", null, pg.titulo), el("div", { class: "corpo" }, (() => { let n = 0; const vivo = E.anima === K(it, "m"), pena = (no) => (vivo && no ? depois(Object.assign(no, { className: `${no.className} escreve`.trim() }), n++ * 160) : no); return pg.blocos.map((b) => folha(b, !!s.montado, pena)); })())),
        el("div", { class: "folhear" },
          el("button", { type: "button", "aria-label": "Página anterior", disabled: i === 0, onclick: ir(() => { s.pagina = i - 1; }) }, "‹"),
          el("span", null, `página ${i + 1} de ${total}`),
          el("button", { type: "button", "aria-label": "Próxima página", disabled: i === total - 1, onclick: ir(() => { s.pagina = i + 1; }) }, "›")),
        material("quadro")];
    },
  };
  // ---------- o player e o que vai com ele ----------
  function player(nome, tempo, caps, aviso) {
    if (H) return [caps]; // o player de verdade fica acima da parada, com os controles dele
    const vertical = E.formato === "vertical";
    return [el("div", { class: "video" + (vertical ? " vertical" : ""), role: "group", "aria-label": `${nome}, ${tempo}` }, el("span", null, tempo),
        el("button", { type: "button", class: "cheia", "aria-label": "Tela cheia" }, "⤢"), aviso),
      el("p", { class: "controles", role: "group", "aria-label": "Formato do vídeo" }, "Formato: ",
        ["automático", "horizontal", "vertical"].map((f, i) => [i ? " · " : "", el("button", { type: "button", "aria-pressed": String(E.formato === f), onclick: () => { E.formato = f; pintar(); } }, f)])),
      el("p", { class: "girar" }, TX.girar), caps,
      el("div", { class: "marcar" }, el("button", { type: "button", class: "leve", onclick: marcarMinuto }, `Marcar o minuto (${minutoAtual()})`))];
  }
  const capitulo = ([h, nome, prova], corrido) => el("li", { class: "c" }, el("button", { type: "button", class: "cap" + (E.minuto === h ? " aqui" : ""), onclick: () => {
      E.minuto = h;
      if (H) return void H.irPara(nome);
      E.aviso = corrido && MEXER_ANTES[h] ? h : null; pintar(); } },
    el("time", null, h), el("span", null, nome, prova && el("small", null, prova))));
  const capitulos = (lista) => el("ul", { class: "capitulos" }, lista.map(capitulo));
  function material(qual) {
    const m = (A.materiais || []).find((x) => x.id === qual);
    if (!m) return null;
    const corpo = [el("b", null, m.nome), el("span", null, m.descricao), el("i", null, "PDF")];
    return m.url ? el("a", { class: "material curto", href: m.url, target: "_blank", rel: "noopener" }, corpo) : el("button", { type: "button", class: "material curto" }, corpo);
  }
  // Os blocos de uma página do quadro: o impresso aparece sempre; a caneta, só no montado.
  function folha(b, montado, pena = (no) => no) {
    const escrita = (t) => pena(el("p", { class: "linha" }, t));
    const pen = (linhas) => (montado ? el("div", { class: "escritas" }, linhas.map(escrita)) : el("div", { class: "espaco" }));
    switch (b.tipo) {
      case "questao": return alternativas(b.questao, { circula: montado });
      case "tabela":
        return el("table", { class: "tq" }, el("thead", null, el("tr", null, b.colunas.map((c) => el("th", { scope: "col" }, c)))),
          el("tbody", null, b.linhas.map((l) => el("tr", null, l.map((c, i) => (b.rotulos && i === 0 ? el("td", { class: "rot" }, c) : el("td", null, montado ? pena(el("span", { class: "na-cel" }, c)) : "")))))));
      case "etiqueta": return el("span", { class: "etiqueta" }, b.texto);
      case "escritas": return pen(b.linhas);
      case "caixa": return el("section", { class: "guardar" }, el("h3", null, b.titulo), el("div", { class: "corpo" },
        b.sintese && el("p", { class: "sintese" }, b.sintese), b.alerta && el("p", { class: "amarelo" }, b.alerta), montado && escrita(b.escrita)));
      case "dobro": return [el("p", { class: "barra" }, b.titulo), el("p", { class: "pares" }, b.pares.map(([a, u, v]) => el("span", null, `${a} → ${u} `, montado ? pena(el("b", null, v)) : el("b", null, " "))))];
      case "etapa": return el("section", { class: "etapa" }, el("p", { class: "pilula" }, el("i", null, String(b.n)), b.titulo),
        b.sintese && el("p", { class: "sintese" }, b.sintese), b.conta && el("p", { class: "conta" }, b.conta), b.escritas && pen(b.escritas));
      case "sintese": return el("p", { class: "sintese" }, b.texto);
      case "tese": return el("p", { class: "tese" }, b.texto);
      case "alerta": return el("p", { class: "amarelo" }, b.texto);
      case "frases": return [el("p", { class: "rotulo-bloco" }, b.titulo), el("ul", { class: "frases" }, b.itens.map(([f, r]) => el("li", null, el("span", null, f), montado ? pena(el("span", { class: "linha" }, r)) : el("span", { class: "linha" }, ""))))];
      case "proxima": return el("p", { class: "proxima" }, el("span", null, "Próxima aula"), b.texto);
    }
    return null;
  }

  // ---------- a tela ----------
  const cab = (nome, lado) => el("div", { class: "titulo-passo" }, el("h2", null, nome), lado && el("span", null, lado));
  const SOLTO = ["texto"]; // sem moldura de bloco
  const MOSTRADOS = new Set(); // o que já entrou em cena não entra de novo
  function caixa(it, rotulo, c) {
    const corpo = desenha[it.tipo](it, c || {}), novo = !MOSTRADOS.has(it._k);
    MOSTRADOS.add(it._k);
    if (SOLTO.includes(it.tipo)) { if (novo && corpo.classList) corpo.classList.add("chega"); return corpo; }
    return el("section", { class: "bloco" + (novo ? " chega" : ""), "data-k": it._k }, rotulo && el("p", { class: "rotulo-bloco" }, rotulo), corpo);
  }
  const pontoFeito = (p) => (p.parada === "Topo" ? E.passou : H && p.parada === "Praticar" ? E.vistos.has(p) : E.vistos.has(p) && p.telas.every((t) => t.itens.every(pronto)));
  const ULTIMO_MEXER = PONTOS.filter((p) => p.parada === "Mexer").at(-1);
  function avancar() {
    const p = P();
    if (T(p) < p.telas.length - 1) p._t = T(p) + 1;
    else if (E.ponto < V().length - 1) { E.ponto++; P()._t = 0; }
  }
  // Trocar de jeito não perde nada: as respostas ficam nos itens; o aluno vai para o ponto equivalente.
  function trocarModo(novo, alvo) {
    if (novo === E.modo && !alvo) return;
    const de = P(), antes = E.modo;
    E.modo = novo;
    let i = alvo ? V().indexOf(alvo) : V().indexOf(de);
    if (i < 0) i = novo === "assistir" ? 0 : Math.max(0, PONTOS.findIndex((p) => ["Mexer", "Ver"].includes(p.parada) && !pontoFeito(p)));
    E.ponto = i;
    E.registro.push({ evento: "modo", de: antes, para: novo, ponto: `${de.parada} · ${de.detalhe}` });
    pintar(null, true);
  }
  const questoesDe = (p) => p.telas.flatMap((t) => t.itens).filter((it) => ["valor", "questao", "decide", "marcar", "grade", "casos", "classificar", "ordenar", "matrizes", "curva", "barras", "ponto", "reta", "circunferencia", "regiao", "angulo", "venn", "ciclo"].includes(it.tipo));
  function tela() {
    const p = P(), t = p.telas[T(p)];
    if (p.parada === "Topo") return topo(t);
    const questoes = t.itens.filter((it) => ["valor", "questao", "marcar", "grade", "casos", "classificar", "ordenar", "matrizes", "curva", "barras", "ponto", "reta", "circunferencia", "regiao", "angulo", "venn", "ciclo"].includes(it.tipo)), numera = p.parada === "Praticar" && questoes.length > 1;
    const vis = []; let aberto = true, q = 0;
    if (H && p.parada === "Praticar") return [cab(t.nome, t.aviso)]; // a atividade e o "continuar" são da plataforma, logo abaixo
    if (p.parada === "Praticar" && material("estudo")) vis.push(el("div", { class: "papel" }, el("span", null, TX.praticar_papel), material("estudo")));
    for (const it of t.itens) {
      if (!aberto) break;
      let rotulo = it.rotulo;
      if (numera && questoes.includes(it)) { q++; rotulo = it.rotulo ? `${q} · ${it.rotulo}` : `Questão ${q} de ${questoes.length}`; }
      vis.push(caixa(it, rotulo));
      if (!pronto(it) && !["video", "corrido"].includes(it.tipo)) aberto = false;
    }
    const faltam = t.itens.filter((it) => RESPOSTA.includes(it.tipo) && !pronto(it)).length;
    const fim = E.ponto === V().length - 1 && T(p) === p.telas.length - 1;
    let aviso = t.aviso;
    if (p.parada === "Praticar") { const n = questoesDe(p).filter((it) => S(it).primeira).length; if (questoesDe(p).some((it) => S(it).primeira != null)) aviso = `${n} de primeira`; }
    // Fim de um trecho do vídeo: duas saídas do mesmo peso.
    const v = p.parada === "Ver" && E.modo === "passo" && t.itens.find((it) => it.tipo === "video" && !it.em_gravacao);
    const prox = PONTOS[E.ponto + 1], verAdiante = PONTOS.findIndex((x, j) => j > E.ponto && x.parada === "Ver");
    const duas = v && S(v).visto && prox && prox.parada === "Mexer" && verAdiante > 0;
    return [cab(t.nome, aviso), vis,
      E.modo === "passo" && E.ponto === 0 && T(p) === 0 && CORRIDO && el("button", { type: "button", class: "quieto", onclick: () => trocarModo("assistir") }, TX.so_assistir),
      el("div", { class: "acoes" + (duas ? " duas" : "") }, el("span", { class: "falta" }, faltam ? (faltam === 1 ? "Falta 1 resposta." : `Faltam ${faltam} respostas.`) : ""),
        duas ? [botao(TX.tentar_proxima, ir(avancar)), botao(TX.continuar_vendo, ir(() => { E.ponto = verAdiante; P()._t = 0; }), "seguir alt")]
          : !fim && botao(t.botao || TX.continuar, ir(avancar)))];
  }
  // O Topo: tudo à vista, sem dica, correção só na entrega. É a única parada que exige responder tudo.
  function topo(t) {
    const fim = E.entregue, acertos = t.itens.filter((it) => S(it).m === it.certa).length, faltam = t.itens.filter((it) => S(it).m == null).length;
    const blocos = t.itens.map((it, k) => caixa(it, `Pergunta ${k + 1} de ${t.itens.length}`, { prova: true, fim }));
    if (!fim) {
      return [cab(t.nome, t.aviso || "correção só no fim"), el("p", { class: "ajuda" }, `Sem dica. Você pode trocar a resposta até entregar. Com ${t.minimo} acertos a aula fica ${ESCALADA ? "dominada" : "concluída"}.`), blocos,
        el("div", { class: "acoes" }, el("span", { class: "falta" }, faltam ? (faltam === 1 ? "Falta 1 resposta." : `Faltam ${faltam} respostas.`) : "Tudo respondido."),
          botao(TX.entregar, () => { E.entregue = true; E.passou = acertos >= t.minimo; if (E.passou && H) H.concluir(); pintar(E.passou ? "passou" : null, true); }, "seguir", faltam > 0))];
    }
    const F = A.fecho;
    return [cab(t.nome, `${acertos} de ${t.itens.length}`), blocos,
      el("div", { class: "fala" }, linha(`${acertos} de ${t.itens.length}`, E.passou ? "certo" : "corrige"), nota(E.passou ? TX.passou : TX.treino)),
      !E.passou && botao(TX.refazer, ir(() => { for (const it of t.itens) for (const k of Object.keys(S(it))) delete S(it)[k]; E.entregue = false; }), "leve"),
      E.passou && F.proxima && el("p", { class: "proxima" }, el("span", null, "Próxima aula"), F.proxima),
      E.passou && el("p", {class:"ajuda"}, "Resultado desta tentativa. Não é certificação de domínio nem nota.")];
  }

  // ---------- a via: corda com grampos (celular) e a mesma via em pé (tela larga) ----------
  const passou = (i) => pontoFeito(V()[i]) || i < E.ponto;
  const irPara = (i) => ir(() => { if (i !== E.ponto) V()[i]._t = 0; E.ponto = i; });
  // O que a via mostra ao lado do nome: "4 de 9" no Praticar; "3 de 4" no Topo entregue.
  function conta(p) {
    if (H && p.parada === "Praticar") return H.contaPraticar();
    if (p.parada === "Praticar") { const q = questoesDe(p), c = q.filter(pronto).length; return (c || E.vistos.has(p)) && `${c} de ${q.length}`; }
    if (p.parada === "Topo" && E.entregue) { const it = p.telas[0].itens; return `${it.filter((x) => S(x).m === x.certa).length} de ${it.length}`; }
    return null;
  }
  function via() {
    const pts = V(), n = pts.length, passo = n > 1 ? 316 / (n - 1) : 0;
    const xs = pts.map((_, i) => 22 + i * passo), y = (i) => (i % 2 ? 19 : 13);
    const corda = (ate) => "M" + xs.slice(0, ate + 1).map((x, i) => `${x} ${y(i)}`).join(" L");
    return el("svg", { viewBox: "0 0 360 52", preserveAspectRatio: "xMinYMid meet" },
      el("path", { class: "corda", d: corda(n - 1) }), E.ponto > 0 && el("path", { class: "feita", d: corda(E.ponto) }),
      xs.map((x, i) => {
        const fechado = E.visitante && i >= ABERTOS_VISITANTE, vai = irPara(i);
        const g = el("g", { role: "button", tabindex: "0", "aria-label": `Ponto ${i + 1}: ${pts[i].parada}`, "aria-current": i === E.ponto ? "step" : null, onclick: vai },
          el("circle", { class: "grampo" + (i === E.ponto ? " aqui" : passou(i) ? " passou" : "") + (fechado ? " fechado" : ""), cx: x, cy: y(i), r: i === E.ponto ? 7 : 5 }),
          el("text", { class: i === E.ponto ? "aqui" : null, x, y: i % 2 ? 49 : 37, "text-anchor": "middle" }, pts[i].parada),
          el("circle", { class: "toque", cx: x, cy: 26, r: 19 }));
        g.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); vai(); } });
        return g;
      }));
  }
  function trilha() {
    return el("ol", { class: "trilha" }, V().map((p, i) => el("li", null, el("button", {
      type: "button", "aria-current": i === E.ponto ? "step" : null, "data-feita": String(passou(i)), onclick: irPara(i),
    }, el("b", null, p.parada, conta(p) && el("em", null, conta(p))), el("span", null, p.detalhe)))));
  }
  const jeitos = () => CORRIDO && !E.visitante && el("div", { class: "jeitos", role: "group", "aria-label": "Jeito de fazer a aula" },
    TX.jeitos.map((j, i) => el("button", { type: "button", "aria-pressed": String((E.modo === "assistir") === (i === 1)), onclick: () => trocarModo(i ? "assistir" : "passo") }, j)));

  // ---------- os acompanhantes: materiais, anotações e dúvida ----------
  function minutoAtual() {
    const p = P();
    if (p === CORRIDO) return E.minuto || inicio(VIDEOS[0]);
    const v = p.parada === "Ver" && p.telas[0].itens.find((x) => x.tipo === "video" && !x.em_gravacao);
    if (!v) return null;
    return E.minuto && seg(E.minuto) >= seg(inicio(v)) && seg(E.minuto) < seg(fimDe(v)) ? E.minuto : inicio(v);
  }
  function marcarMinuto() {
    const m = minutoAtual();
    if (!m) return;
    E.rascunho = (E.rascunho && !E.rascunho.endsWith("\n") ? E.rascunho + "\n" : E.rascunho) + `[${m}] `;
    if (matchMedia("(max-width: 59.99rem)").matches) E.gaveta = "anotacoes"; // no celular, marcar abre a gaveta já com o minuto
    pintar();
    const campo = [...document.querySelectorAll("textarea.anotar")].find((x) => x.offsetParent);
    if (campo) { campo.focus({ preventScroll: true }); campo.setSelectionRange(campo.value.length, campo.value.length); }
  }
  // Tocar numa anotação leva ao trecho daquele minuto.
  function abrirNota(n) {
    E.gaveta = null;
    if (n.min && E.modo === "assistir") { E.ponto = 0; E.minuto = n.min; }
    else if (n.min) {
      const i = PONTOS.findIndex((p) => p.parada === "Ver" && p.telas[0].itens.some((v) => v.tipo === "video" && !v.em_gravacao && seg(n.min) >= seg(inicio(v)) && seg(n.min) < seg(fimDe(v))));
      if (i >= 0) { E.ponto = i; E.minuto = n.min; }
    } else if (V().includes(n.de)) E.ponto = V().indexOf(n.de);
    pintar(null, true);
  }
  function campo(valor, aoMudar, attrs) {
    const t = el("textarea", attrs);
    t.value = valor;
    t.addEventListener("input", () => aoMudar(t.value));
    return t;
  }
  const lugar = () => { const p = P(), m = minutoAtual(); return [p.parada, p.telas[T(p)].nome, m && `vídeo ${m}`].filter(Boolean).join(" · "); };
  const painel = {
    materiais: () => [(A.materiais || []).map((m) => el("button", { type: "button", class: "material" }, el("b", null, m.nome), el("span", null, m.descricao), el("i", null, "PDF"))),
      nota("No protótipo, os PDFs não baixam."),
      CORRIDO && !E.visitante && el("p", { class: "jeito-texto" }, "Fazer a aula: ", TX.jeitos.map((j, i) => [i ? " · " : "",
        el("button", { type: "button", class: "quieto", "aria-pressed": String((E.modo === "assistir") === (i === 1)), onclick: () => { E.gaveta = null; trocarModo(i ? "assistir" : "passo"); } }, j)]))],
    anotacoes: () => {
      const m = minutoAtual();
      return [campo(E.rascunho, (v) => { E.rascunho = v; }, { class: "anotar", rows: "3", "aria-label": "Sua anotação", placeholder: "Escreva o que quiser guardar desta aula." }),
        el("div", { class: "linha-botoes" },
          el("button", { type: "button", class: "leve", disabled: !m, onclick: marcarMinuto }, m ? `Marcar o minuto (${m})` : "Marcar o minuto do vídeo"),
          el("button", { type: "button", class: "leve forte", onclick: () => {
            const texto = E.rascunho.trim();
            if (!texto) return;
            const achou = /\[(\d+:\d\d)\]/.exec(texto);
            E.notas.unshift({ min: achou && achou[1], texto: texto.replace(/\[\d+:\d\d\]\s*/g, "").trim(), de: P() });
            E.rascunho = ""; pintar();
          } }, "Salvar")),
        E.notas.length > 0 && el("ul", { class: "notas" }, E.notas.map((n) => el("li", null, el("button", { type: "button", onclick: () => abrirNota(n) },
          n.min && el("time", null, n.min), el("span", null, n.texto || "(só o minuto)"))))),
        nota(TX.prototipo_notas)];
    },
    duvida: () => [campo(E.duvida, (v) => { E.duvida = v; }, { class: "duvidar", rows: "3", "aria-label": "Sua dúvida", placeholder: "O que não ficou claro?" }),
      el("p", { class: "contexto" }, "Vai junto: ", el("b", null, lugar())),
      el("button", { type: "button", class: "leve forte", onclick: () => { if (!E.duvida.trim()) return; E.duvidas.unshift({ texto: E.duvida.trim(), onde: lugar() }); E.duvida = ""; pintar(); } }, "Guardar dúvida nesta sessão"),
      E.duvidas.length > 0 && el("ul", { class: "notas" }, E.duvidas.map((d) => el("li", null, el("span", null, el("small", null, d.onde), d.texto)))),
      nota(TX.prototipo_duvida)],
  };
  const NOMES = { materiais: "Materiais", anotacoes: "Anotações", duvida: "Dúvida" };
  const lista3 = () => Object.keys(NOMES).filter((k) => k !== "materiais" || (A.materiais || []).length);
  const atalhos = () => el("div", { class: "atalhos" },
    lista3().map((k) => el("button", { type: "button", "aria-expanded": String(E.gaveta === k), onclick: () => { E.gaveta = k; pintar(); } },
    NOMES[k], k === "anotacoes" && E.notas.length > 0 && el("em", null, String(E.notas.length)))));
  const acomp = () => el("div", { class: "acomp" }, lista3().map((k) => el("section", null, el("h3", null, NOMES[k]), painel[k]())));
  function gaveta() {
    if (!E.gaveta) return [];
    const fecha = () => { E.gaveta = null; pintar(); };
    const fundo = el("div", { class: "gaveta" }, el("section", { class: "folha-gaveta", role: "dialog", "aria-label": NOMES[E.gaveta] },
      el("div", { class: "topo-gaveta" }, el("h3", null, NOMES[E.gaveta]), el("button", { type: "button", class: "leve", onclick: fecha }, "Fechar")), painel[E.gaveta]()));
    fundo.addEventListener("click", (ev) => { if (ev.target === fundo) fecha(); });
    return [fundo];
  }

  // ---------- a página ----------
  const raiz = document.getElementById("passo"), viaNo = document.getElementById("via"), gavetaNo = document.getElementById("gaveta");
  // O que o aluno fez, para guardar e retomar (na plataforma, em <aula>:paradas).
  const foto = () => ({ v: 1, modo: E.modo, ponto: E.modo === "assistir" && P() === CORRIDO ? -1 : PONTOS.indexOf(P()), telas: PONTOS.map(T),
    estados, entregue: E.entregue, passou: E.passou, tocou: E.tocou, vistos: PONTOS.map((p, i) => (E.vistos.has(p) ? i : -1)).filter((i) => i >= 0), registro: E.registro });
  if (A.salvo && A.salvo.v === 1 && A.salvo.estados?.length === estados.length) {
    const s = A.salvo;
    s.estados.forEach((x, i) => Object.assign(estados[i], x));
    PONTOS.forEach((p, i) => { p._t = Math.min(s.telas?.[i] || 0, p.telas.length - 1); });
    for (const i of s.vistos || []) if (PONTOS[i]) E.vistos.add(PONTOS[i]);
    Object.assign(E, { entregue: !!s.entregue, passou: !!s.passou, tocou: !!s.tocou });
    E.registro.push(...(s.registro || []));
    if (s.modo === "assistir" && CORRIDO) { E.modo = "assistir"; E.ponto = s.ponto === -1 ? 0 : Math.max(0, VIAS.assistir.indexOf(PONTOS[s.ponto])); }
    else E.ponto = Math.max(0, Math.min(s.ponto || 0, PONTOS.length - 1));
  }
  const estadoNo = document.getElementById("estado"), cantoNo = document.getElementById("canto"), papelNo = document.getElementById("papel");
  function pintar(anima, subir) {
    E.anima = anima || null;
    const som = somDe(E.anima); if (som) tocarSom(som);
    E.vistos.add(P());
    raiz.replaceChildren(...tela().flat(6).filter(Boolean));
    viaNo.replaceChildren(...[via(), trilha(), jeitos(), !H && atalhos(), !H && acomp(), botaoSom()].filter(Boolean));
    if (gavetaNo) gavetaNo.replaceChildren(...gaveta());
    if (estadoNo) estadoNo.replaceChildren(...(E.visitante ? [] : [E.passou ? el("span", { class: "selo" + (E.anima === "passou" ? " bate" : "") }, TX.selo) : el("span", { class: "estado" }, E.tocou ? "em treino" : "não vista")]));
    if (cantoNo) cantoNo.textContent = `${E.ponto + 1} / ${V().length}`;
      E.anima = null;
    if (subir) window.scrollTo(0, 0);
    // A plataforma mostra, abaixo da parada, o que é dela: vídeo (acima), atividade, retorno, "quer mexer mais?".
    if (H) { H.aoPintar({ ponto: P(), parada: P().parada, corrido: P() === CORRIDO, modo: E.modo, mexerMais: P() === ULTIMO_MEXER && T(P()) === P().telas.length - 1 }); H.salvar(foto()); }
  }
  // O que a plataforma usa do motor: trocar de jeito, marcar um trecho como visto, as questões do corrido.
  if (H) window.AULA_MOTOR = {
    trocarModo, pintar, seguir: () => { avancar(); pintar(null, true); },
    verTrecho: (it) => { if (!S(it).visto) { S(it).visto = true; tocar(); pintar(K(it)); } },
    verTudo: () => { for (const v of VIDEOS) S(v).visto = true; tocar(); pintar(); },
    // Onde o vídeo corrido passa por uma questão para tentar antes: o capítulo em que o trecho começa e o Mexer.
    questoes: PONTOS.flatMap((p, i) => { const ant = PONTOS[i - 1], v = p.parada === "Ver" && p.telas[0].itens.find((x) => x.tipo === "video" && !x.em_gravacao);
      return v && ant && ant.parada === "Mexer" ? [{ capitulo: v.capitulos[0][1], mexer: ant }] : []; }),
    modo: () => E.modo,
  };
  pintar();
})();
