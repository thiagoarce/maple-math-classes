/* launch_logica.js — "Launch Day", o jogo da U8 (The Role of Technology).
 *
 * Cada equipe lança um negócio fictício. Em cinco rodadas decide o que a U8 ensina:
 * canal (física, app, online próprio, híbrida — LE1/LE2), tecnologia (LE1), financiamento
 * (LE2/LE3), organização da equipe (LE3) e pesquisa de mercado (LE4). Depois de cada
 * rodada um EVENTO sorteado testa as escolhas feitas até ali. Não existe receita única:
 * o efeito depende do tipo de negócio (comida, produto, serviço, projeto social), e cada
 * opção tem um ganho na hora e um risco que só aparece num evento.
 *
 * Quatro marcadores de 0 a 10: dinheiro (cash), clientes (customers), confiança (trust) e
 * equipe (team). Pontuação = soma; a empresa "fecha" se o dinheiro ou a equipe chegam a 0.
 *
 * Módulo PURO (interface comum de `jogo.js`): validarCriacao, criar, entrar, host, jogador, ver.
 */

export const CAMPOS = ["cash", "customers", "trust", "team"];
export const INICIO = { cash: 5, customers: 3, trust: 5, team: 6 };

export const TIPOS = [
  { id: "food", nome: "Food and drinks" },
  { id: "product", nome: "Products people buy" },
  { id: "service", nome: "A service people book" },
  { id: "social", nome: "A social project" },
];

/* As cinco decisões. `fx` = efeito na hora (o aluno vê só setas ↑ ↓); `tipo` ajusta pelo
   tipo de negócio; `flag` marca a escolha para os eventos. Na rodada de tecnologia a
   equipe escolhe DUAS. */
export const RODADAS = [
  { id: "channel", titulo: "Where do we sell?", unidade: "U8.1–8.2 · channels and e-commerce", escolhe: 1, opcoes: [
    { id: "physical", texto: "A physical shop or stall", fx: { cash: -1, customers: 1, trust: 1 },
      tipo: { food: { customers: 1 }, service: { trust: 1 } },
      porque: "Customers trust what they can see — but rent costs money and you only reach your street." },
    { id: "app", texto: "A big delivery or marketplace app", fx: { customers: 3, cash: 2 },
      tipo: { food: { customers: 2 }, service: { customers: -2 }, social: { customers: -1 } },
      porque: "The app brings customers fast — and takes a fee from every sale." },
    { id: "own", texto: "Our own online channel (Instagram, WhatsApp, a website)", fx: { customers: 2, team: -1 },
      tipo: { product: { customers: 1 }, social: { trust: 1 } },
      porque: "No fees, and the customer is yours — but someone has to answer every message." },
    { id: "hybrid", texto: "Hybrid: a physical place AND online", fx: { cash: -2, customers: 3, team: -1 },
      tipo: { food: { customers: 1 }, product: { customers: 1 } },
      porque: "Best of both — and two channels to run, with stock in two places." },
  ]},
  { id: "tech", titulo: "Which technology first? (choose TWO)", unidade: "U8.1 · technology in business", escolhe: 2, opcoes: [
    { id: "pix", texto: "Pix and QR payments", fx: { cash: 1 },
      porque: "Money arrives faster and without card fees." },
    { id: "stock", texto: "Stock and order control (an app or a spreadsheet)", fx: { team: 1 },
      porque: "You know what you have — fewer surprises on busy days." },
    { id: "crm", texto: "A customer list (CRM) to bring customers back", fx: { cash: -1, customers: 1, trust: 1 },
      porque: "Returning customers cost less than new ones." },
    { id: "security", texto: "Data security: passwords, backups, privacy", fx: { cash: -1 },
      porque: "Invisible on a good day — essential on a bad one." },
    { id: "chatbot", texto: "An AI chatbot that answers customers", fx: { cash: -1, team: 2 },
      porque: "It saves the team time — but nobody checks what it says." },
    { id: "ads", texto: "Paid ads on social media", fx: { cash: -1, customers: 2 },
      porque: "Customers fast, as long as you keep paying." },
  ]},
  { id: "funding", titulo: "How do we pay for the launch?", unidade: "U8.2 · funding a start-up", escolhe: 1, opcoes: [
    { id: "savings", texto: "Our own savings", fx: { cash: 2 },
      porque: "Small, but nobody else to answer to." },
    { id: "family", texto: "Money from family and friends", fx: { cash: 3 },
      porque: "Fast and kind — and mixed with the relationship." },
    { id: "loan", texto: "A bank loan", fx: { cash: 4 },
      porque: "You keep control, and you must pay it back with interest." },
    { id: "angel", texto: "An angel investor (30% of the company)", fx: { cash: 5 },
      porque: "No repayment — the investor owns part of the company and wants growth." },
    { id: "crowd", texto: "Crowdfunding: supporters pre-buy", fx: { cash: 1, customers: 1 },
      tipo: { social: { cash: 1, trust: 1 } },
      porque: "It proves people want it; how much you raise depends on how much they trust you." },
  ]},
  { id: "team", titulo: "How does our team work?", unidade: "U8.3 · leadership and teamwork", escolhe: 1, opcoes: [
    { id: "boss", texto: "One leader decides everything", fx: { customers: 2, team: -1 },
      porque: "Fast decisions — and everything depends on one person." },
    { id: "roles", texto: "Clear roles, by what each one does best", fx: { team: 1 },
      porque: "Everyone knows their job; the leader coordinates." },
    { id: "everyone", texto: "Everyone does a bit of everything", fx: { team: 1 },
      porque: "Friendly and flexible — until two people do the same task and nobody does the other." },
    { id: "manager", texto: "Hire a part-time manager", fx: { cash: -2, team: 1, trust: 1 },
      porque: "Experience costs money every month." },
  ]},
  { id: "research", titulo: "What do we check before launch day?", unidade: "U8.4 · market research", escolhe: 1, opcoes: [
    { id: "friends", texto: "Ask our friends what they think", fx: { team: 1 },
      porque: "Friends are kind — they rarely tell you what is wrong." },
    { id: "poll", texto: "An online poll with real customers", fx: { customers: 1 },
      porque: "Real answers from the people who would buy." },
    { id: "data", texto: "Official data (IBGE, City Hall) about the area", fx: { trust: 1 },
      porque: "You know the size of the market — not yet what people feel." },
    { id: "competitors", texto: "Watch competitors: prices, reviews, what is missing", fx: {},
      porque: "You find your difference before someone else shows it to you." },
    { id: "skip", texto: "No research — launch now and save the money", fx: { cash: 2 },
      porque: "Faster and cheaper — and a guess." },
  ]},
];

/* Eventos: um por rodada, sorteado do grupo daquela rodada (testa a decisão que acabou de
   ser tomada e as anteriores). `se(f, tipo)` devolve [efeito, motivo]. */
const tem = (f, ...ids) => ids.some((i) => f[i]);
export const EVENTOS = [
  // depois do canal
  { id: "rain", rodada: 0, texto: "A rainy week in João Pessoa: nobody wants to leave home.",
    se: (f) => tem(f, "app", "own", "hybrid") ? [{ customers: 1 }, "You also sell online — orders kept coming."]
      : [{ customers: -2 }, "Only a physical place: the rain kept customers away."] },
  { id: "viral", rodada: 0, texto: "A video about local businesses goes viral in the city.",
    se: (f) => tem(f, "own", "hybrid") ? [{ customers: 1, trust: 1 }, "Your own online channel caught the wave — and the customers are yours."]
      : f.app ? [{ customers: 1 }, "People found you on the app, among many others."]
      : [{}, "Without an online channel, the wave passed you by."] },
  { id: "appfee", rodada: 0, texto: "The big delivery app raises its fee.",
    se: (f) => f.app ? [{ cash: -2 }, "You depend on the app: every sale now leaves less money."]
      : [{ trust: 1 }, "You don't depend on the app — some of its customers came to you."] },
  // depois da tecnologia
  { id: "leak", rodada: 1, texto: "A data leak scandal hits small shops in the city.",
    se: (f) => f.security ? [{ trust: 2 }, "Your data was protected — customers noticed."]
      : [{ trust: -3 }, "No security: customers' data leaked, and trust fell."] },
  { id: "busy", rodada: 1, texto: "São João weekend: the busiest days of the year.",
    se: (f) => f.stock ? [{ customers: 2, cash: 1 }, "Stock control: you never ran out."]
      : [{ customers: -1, trust: -1 }, "Sold out at the worst moment — angry customers."] },
  { id: "bot", rodada: 1, texto: "A customer posts a screenshot of a strange answer from a business chatbot.",
    se: (f) => f.chatbot ? [{ trust: -2 }, "It was YOUR chatbot. Nobody was checking what it said."]
      : f.crm ? [{ trust: 1 }, "Your customers know a real person answers them."] : [{}, "Not your problem this time."] },
  { id: "cards", rodada: 1, texto: "Card machine fees go up.",
    se: (f) => f.pix ? [{ cash: 1 }, "Most of your customers pay by Pix."]
      : [{ cash: -1 }, "Every card payment now costs more."] },
  // depois do financiamento
  { id: "interest", rodada: 2, texto: "Interest rates go up.",
    se: (f) => f.loan ? [{ cash: -3 }, "Your loan instalments are bigger now."]
      : [{}, "You have no loan to pay."] },
  { id: "investor", rodada: 2, texto: "Investors want fast growth from every start-up they fund.",
    se: (f) => f.angel ? [{ team: -2, customers: 1 }, "Your investor pushes the team to grow faster than it can."]
      : [{}, "Nobody outside the team gives you orders."] },
  { id: "familyneeds", rodada: 2, texto: "Hard times: many families need their savings back.",
    se: (f) => f.family ? [{ cash: -2, team: -1 }, "Your family needed the money back — and it got tense."]
      : f.savings ? [{ cash: -1 }, "Your own savings had to cover a family emergency."] : [{}, "Your money did not come from family."] },
  { id: "crowdshare", rodada: 2, texto: "A local newspaper writes about young entrepreneurs.",
    se: (f, t, m) => f.crowd ? [{ customers: 2, trust: 1 }, "Your supporters shared the story: more pre-orders."]
      : (m && m.trust >= 6) ? [{ customers: 1 }, "Your good reputation got you a mention."] : [{}, "The article did not mention you."] },
  // depois da equipe
  { id: "burnout", rodada: 3, texto: "Exam season: everyone in the team is tired.",
    se: (f) => f.boss ? [{ team: -2 }, "Everything depended on one leader — and the leader burned out."]
      : f.everyone ? [{ team: -1 }, "Nobody knew whose task was what: things were forgotten."]
      : [{ team: 1 }, "Clear roles: each one covered their part."] },
  { id: "bigorder", rodada: 3, texto: "A school orders 200 units for next week.",
    se: (f) => (f.roles || f.manager) ? [{ cash: 1, trust: 1 }, "Clear roles: you planned it and delivered on time."]
      : f.boss ? [{ cash: 1, team: -1 }, "The leader did it — alone, up all night."]
      : [{ trust: -1 }, "Two people promised it, nobody organised it: the order was late."] },
  // depois da pesquisa
  { id: "competitor", rodada: 4, texto: "Launch day: a competitor opens nearby with lower prices.",
    se: (f) => f.competitors ? [{ customers: 1 }, "You studied the competitors: your difference was ready."]
      : (f.poll || f.data) ? [{ customers: -1 }, "You knew your market, but not your rival."]
      : [{ customers: -2, cash: -1 }, "You were surprised — and lowered your price in a hurry."] },
  { id: "fit", rodada: 4, texto: "Launch day: what do customers really think?",
    se: (f) => f.poll ? [{ customers: 1, trust: 1 }, "Your poll asked real customers: you made what they wanted."]
      : f.data ? [{ customers: 1 }, "You picked the right area — some details were off."]
      : (f.friends || f.skip) ? [{ customers: -1, trust: -1 }, "Your friends loved it. The customers didn't."]
      : [{}, "Customers liked some things, not others."] },
];

/* Custos que continuam a cada rodada depois da escolha (a taxa do app, a parcela do banco).
   Aplicados no fim de cada revelação a partir da rodada seguinte à escolha. */
const RECORRENTES = [
  { flag: "app", fx: { cash: -1 }, texto: "App fee on every sale: −1 cash." },
  { flag: "loan", fx: { cash: -1 }, texto: "Loan instalment: −1 cash." },
];

export function validarCriacao(corpo) {
  return (Array.isArray(corpo.equipes) && corpo.equipes.filter(Boolean).length >= 2) ? null : "at least 2 teams";
}

function rnd(e) {
  e.semente = (e.semente * 1103515245 + 12345) % 2147483648;
  return e.semente / 2147483648;
}

function soma(m, fx) {
  for (const [k, v] of Object.entries(fx || {})) if (k in m) m[k] += v;
  for (const k of CAMPOS) m[k] = Math.max(0, Math.min(10, m[k]));
  return m;
}

export const pontos = (m) => CAMPOS.reduce((s, k) => s + m[k], 0);
export const vivo = (m) => m.cash > 0 && m.team > 0;

export function criar(corpo, semente = Date.now()) {
  const nomes = corpo.equipes.filter(Boolean).slice(0, 6);
  const e = { fase: "lobby", rodada: -1, versao: 1, semente,
              equipes: nomes.map((n, i) => ({ id: "t" + (i + 1), nome: String(n).slice(0, 40), negocio: "", tipo: null,
                                               m: { ...INICIO }, flags: {}, escolhas: {}, rascunho: null, historico: [] })),
              jogadores: {}, pre: {}, eventos: [], resultado: null };
  for (const [aluno, m] of Object.entries(corpo.membros || {})) {
    const t = e.equipes[m.equipe];
    if (t) e.pre[aluno] = { equipe: t.id, nome: String(m.nome || "Player").slice(0, 30) };
  }
  // Um evento por rodada, sorteado do grupo daquela rodada.
  for (let r = 0; r < RODADAS.length; r++) {
    const grupo = EVENTOS.filter((x) => x.rodada === r);
    e.eventos.push(grupo[Math.floor(rnd(e) * grupo.length)].id);
  }
  return e;
}

export function entrar(e, ctx) {
  if (e.jogadores[ctx.aluno]) return e;
  const n = structuredClone(e);
  const pre = (e.pre || {})[ctx.aluno];
  n.jogadores[ctx.aluno] = { nome: String(ctx.nome || "Player").slice(0, 30), equipe: pre ? pre.equipe : null };
  n.versao++;
  return n;
}

const opcaoDe = (r, id) => RODADAS[r].opcoes.find((o) => o.id === id);

// O efeito de uma opção para um tipo de negócio (o aluno vê só o sinal; os números ficam aqui).
export function efeitoDe(r, id, tipo) {
  const op = opcaoDe(r, id);
  const fx = { ...(op.fx || {}) };
  for (const [k, v] of Object.entries((op.tipo || {})[tipo] || {})) fx[k] = (fx[k] || 0) + v;
  return fx;
}

export function host(estado, corpo) {
  const e = structuredClone(estado);
  const t = corpo.tipo;
  if (t === "reset") return criar({ equipes: e.equipes.map((x) => x.nome) }, Date.now() % 2147483647);
  if (t === "start" || (t === "next" && e.fase === "reveal")) {
    if (!["lobby", "reveal"].includes(e.fase)) throw new Error("not now");
    if (e.fase === "lobby") {
      // Equipe que não disse o tipo de negócio fica com "produto" (o mais neutro).
      for (const x of e.equipes) if (!x.tipo) x.tipo = "product";
    }
    if (e.rodada + 1 >= RODADAS.length) { e.fase = "final"; e.resultado = final(e); e.versao++; return e; }
    e.rodada += 1; e.fase = "decide";
    for (const x of e.equipes) x.rascunho = null;
    e.versao++; return e;
  }
  if (t === "reveal") {
    if (e.fase !== "decide") throw new Error("not now");
    return revelar(e);
  }
  if (t === "unlink") {
    const j = e.jogadores[corpo.aluno], pre = (e.pre || {})[corpo.aluno];
    if (!(j && j.equipe) && !pre) throw new Error("student not in a team");
    if (j) j.equipe = null;
    if (pre) delete e.pre[corpo.aluno];
    e.versao++; return e;
  }
  throw new Error("unknown action");
}

function revelar(e) {
  const r = e.rodada, def = RODADAS[r];
  const ev = EVENTOS.find((x) => x.id === e.eventos[r]);
  for (const t of e.equipes) {
    // Quem não escolheu a tempo fica com a primeira opção (ou as duas primeiras).
    let esc = t.rascunho && t.rascunho.length === def.escolhe ? t.rascunho : def.opcoes.slice(0, def.escolhe).map((o) => o.id);
    const antes = { ...t.m };
    const linhas = [];
    for (const id of esc) {
      const fx = efeitoDe(r, id, t.tipo);
      soma(t.m, fx);
      t.flags[id] = true;
      linhas.push({ tipo: "escolha", texto: opcaoDe(r, id).texto, porque: opcaoDe(r, id).porque, fx });
    }
    t.escolhas[def.id] = esc;
    const [fxEv, motivo] = ev.se(t.flags, t.tipo, t.m);
    soma(t.m, fxEv);
    linhas.push({ tipo: "evento", texto: motivo, fx: fxEv });
    for (const rec of RECORRENTES) {
      // A taxa e a parcela começam na rodada DEPOIS da escolha.
      if (t.flags[rec.flag] && !esc.includes(rec.flag)) { soma(t.m, rec.fx); linhas.push({ tipo: "custo", texto: rec.texto, fx: rec.fx }); }
    }
    const delta = {};
    for (const k of CAMPOS) delta[k] = t.m[k] - antes[k];
    t.historico.push({ rodada: r, escolhas: esc, linhas, delta });
    t.rascunho = null;
  }
  e.fase = "reveal"; e.versao++;
  return e;
}

function final(e) {
  const linhas = e.equipes.map((t) => {
    const fim = [];
    // O investidor fica com 30% do valor da empresa (aparece aqui, não antes).
    if (t.flags.angel) { soma(t.m, { cash: -2 }); fim.push("Your angel investor owns 30%: −2 cash for the investor's share."); }
    return { id: t.id, pontos: pontos(t.m), vivo: vivo(t.m), fim };
  });
  return { linhas };
}

export function jogador(estado, ctx, corpo) {
  const e = structuredClone(estado);
  const j = e.jogadores[ctx.aluno];
  if (!j) throw new Error("open the game again to join");
  const t = corpo.tipo;
  if (t === "team") {
    if (!e.equipes.some((x) => x.id === corpo.equipe)) throw new Error("unknown team");
    if (j.equipe && j.equipe !== corpo.equipe && (e.fase !== "lobby" || (e.pre || {})[ctx.aluno])) throw new Error("your team is locked — ask your teacher");
    j.equipe = corpo.equipe; e.versao++; return e;
  }
  const eq = e.equipes.find((x) => x.id === j.equipe);
  if (!eq) throw new Error("choose your team first");
  if (t === "business") {
    if (e.fase !== "lobby") throw new Error("the business is set — the game has started");
    if (typeof corpo.negocio === "string") eq.negocio = corpo.negocio.slice(0, 40);
    if (TIPOS.some((x) => x.id === corpo.tipoNegocio)) eq.tipo = corpo.tipoNegocio;
    e.versao++; return e;
  }
  if (t === "choose") {
    if (e.fase !== "decide") throw new Error("choices are closed");
    const def = RODADAS[e.rodada];
    const ids = [...new Set((Array.isArray(corpo.opcoes) ? corpo.opcoes : []).filter((id) => def.opcoes.some((o) => o.id === id)))];
    if (ids.length !== def.escolhe) throw new Error(def.escolhe === 1 ? "choose one option" : "choose exactly " + def.escolhe + " options");
    eq.rascunho = ids; e.versao++; return e;
  }
  throw new Error("unknown action");
}

/* O que cada tela vê. As escolhas de cada equipe são secretas até a revelação. As opções
   mostram só o SINAL do efeito na hora (↑ ↓), nunca os números nem os eventos. */
function publicaRodada(r, tipo) {
  if (r < 0 || r >= RODADAS.length) return null;
  const def = RODADAS[r];
  return { id: def.id, titulo: def.titulo, unidade: def.unidade, escolhe: def.escolhe, numero: r + 1, total: RODADAS.length,
           opcoes: def.opcoes.map((o) => {
             const fx = tipo ? efeitoDe(r, o.id, tipo) : (o.fx || {});
             const setas = {};
             for (const [k, v] of Object.entries(fx)) if (v) setas[k] = v > 0 ? "up" : "down";
             return { id: o.id, texto: o.texto, setas };
           }) };
}

export function ver(e, papel, ctx = {}) {
  const evento = (e.fase === "reveal" || e.fase === "final") && e.rodada >= 0
    ? EVENTOS.find((x) => x.id === e.eventos[e.rodada]) : null;
  const equipes = e.equipes.map((t) => {
    const v = { id: t.id, nome: t.nome, negocio: t.negocio, tipo: t.tipo, m: { ...t.m }, pontos: pontos(t.m), vivo: vivo(t.m),
                pronta: !!t.rascunho, membros: Object.values(e.jogadores).filter((j) => j.equipe === t.id).map((j) => j.nome) };
    if (e.fase === "reveal") v.ultima = t.historico[t.historico.length - 1] || null;
    if (e.fase === "final") {
      v.escolhas = t.escolhas;
      v.historico = t.historico;
      const fim = e.resultado && e.resultado.linhas.find((x) => x.id === t.id);
      v.fim = fim ? fim.fim : [];
    }
    return v;
  });
  const base = { fase: e.fase, versao: e.versao, rodada: e.rodada, totalRodadas: RODADAS.length, equipes, tipos: TIPOS,
                 evento: evento ? { id: evento.id, texto: evento.texto } : null,
                 rodadaInfo: e.fase === "decide" || e.fase === "reveal" ? publicaRodada(e.rodada, null) : null,
                 jogadores: Object.keys(e.jogadores).length };
  if (e.fase === "final") base.rodadas = RODADAS.map((d) => ({ id: d.id, titulo: d.titulo, unidade: d.unidade,
    opcoes: d.opcoes.map((o) => ({ id: o.id, texto: o.texto, porque: o.porque })) }));
  if (papel === "host") {
    base.alunos = Object.entries(e.jogadores).map(([aluno, j]) => ({ aluno, nome: j.nome, equipe: j.equipe, on: true }))
      .concat(Object.entries(e.pre || {}).filter(([aluno]) => !e.jogadores[aluno])
        .map(([aluno, m]) => ({ aluno, nome: m.nome, equipe: m.equipe, on: false })));
    return base;
  }
  const j = e.jogadores[ctx.aluno];
  if (!j) { base.eu = null; return base; }
  base.eu = { nome: j.nome, equipe: j.equipe, fixo: !!(e.pre || {})[ctx.aluno] };
  const minha = e.equipes.find((t) => t.id === j.equipe);
  if (minha) {
    base.minha = { id: minha.id, nome: minha.nome, negocio: minha.negocio, tipo: minha.tipo, rascunho: minha.rascunho,
                   escolhas: minha.escolhas };
    if (e.fase === "decide") base.rodadaInfo = publicaRodada(e.rodada, minha.tipo);
  }
  return base;
}
