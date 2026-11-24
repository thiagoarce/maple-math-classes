/* Fluxo de treino original, adaptado para sessão anônima e local. */
(() => {
  "use strict";
  const raiz = document.getElementById("oficina");
  const FAMILIAS = window.OFICINA_TREINO.familias;
  const treino = { feitas:0, acertos:0, revisar:[], familias:{} };
  const salvarTreino = () => {}; // No persistence or external API in this demonstration.
  let nextTimer = null;
  const el = (tag, attrs, ...children) => {
    const n=document.createElement(tag);
    for (const [k,v] of Object.entries(attrs||{})) {
      if (k==="onclick") n.addEventListener("click",v);
      else if(k==="disabled") n.disabled=!!v;
      else n.setAttribute(k,String(v));
    }
    const append=v=>{if(Array.isArray(v))v.forEach(append);else if(v!=null)n.append(v instanceof Node?v:document.createTextNode(String(v)))};
    children.forEach(append);return n;
  };
  const por = (...nos) => raiz.replaceChildren(...nos.filter(Boolean));
  // {a|b} vira fração empilhada; o resto é texto.
  const conta = (texto, classe = "") => el("span", { class: "giz " + classe }, String(texto).split(/(\{[^|}]+\|[^}]+\})/).map((p) => {
    const m = p.match(/^\{([^|}]+)\|([^}]+)\}$/);
    return m ? el("span", { class: "frac" }, el("span", null, m[1]), el("span", null, m[2])) : p;
  }));

  const numero = window.OFICINA_NUMERO;
  const prof = conteudo => el("div",{class:"of-fala",role:"status"},conteudo);
  // ------------------------------------------------------------- treino ----
  const GRUPOS = [...new Set(FAMILIAS.map((f) => f.grupo))];
  let grupo = null; // null = tudo
  let modo = "treino"; // ou "revisar"
  let seguidas = 0;
  const sessao = { feitas: 0, acertos: 0 };

  function treinar() {
    document.title = "Oficina da Conta";
    clearTimeout(nextTimer);
    window.scrollTo(0, 0);
    const chips = el("div", { class: "df-chips of-chips" }, [null, ...GRUPOS].map((g) => {
      const b = el("button", { type: "button", class: "opcao chip", "aria-pressed": String(modo === "treino" && g === grupo) }, g || "Tudo");
      b.addEventListener("click", () => { grupo = g; modo = "treino"; treinar(); });
      return b;
    }));
    const nRev = treino.revisar.length;
    const rev = el("button", { type: "button", class: "opcao chip" + (nRev ? " of-rev" : ""), "aria-pressed": String(modo === "revisar"), disabled: !nRev && modo !== "revisar" }, `Revisar (${nRev})`);
    rev.addEventListener("click", () => { modo = "revisar"; treinar(); });
    chips.append(rev);
    const placar = el("p", { class: "of-placar" });
    const pintarPlacar = () => { placar.textContent = `Seguidas: ${seguidas} · Nesta sessão: ${sessao.acertos} de ${sessao.feitas}` + (treino.feitas ? ` · No total: ${treino.acertos} de ${treino.feitas}` : ""); };
    pintarPlacar();
    const titulo = el("p", { class: "lousa-titulo" });
    const linha = el("div", { class: "lousa-linha atual of-conta" });
    const resultado = el("div", { class: "lousa-linha of-resultado" });
    const lousa = el("section", { class: "lousa of-lousa" }, titulo, el("div", { class: "lousa-linhas" }, linha, resultado), placar);
    const inp = el("input", { type: "text", inputmode: "decimal", autocomplete: "off", "aria-label": "Sua resposta", placeholder: "Sua resposta" });
    const conferir = el("button", { type: "button" }, "Conferir");
    const pular = el("button", { type: "button", class: "texto" }, "Não sei");
    const palco = el("div", { class: "of-palco" });
    por(
      el("h1", { class: "of-h1" }, "Oficina da Conta"),
      chips, lousa,
      el("div", { class: "of-eu of-resposta" }, inp, conferir, pular),
      palco);


    let atual = null;
    function proxima() {
      palco.replaceChildren();
      resultado.replaceChildren();
      lousa.classList.remove("of-acertou", "of-errou");
      inp.value = ""; inp.setCustomValidity(""); inp.disabled = false; conferir.disabled = false; pular.disabled = false;
      if (modo === "revisar") {
        if (!treino.revisar.length) {
          titulo.textContent = "Revisão";
          linha.replaceChildren(conta("Nada para revisar!", "grande"));
          inp.disabled = conferir.disabled = pular.disabled = true;
          palco.append(prof("Revisão zerada. Volta para o treino e segue aquecendo."), el("button", { type: "button", onclick: () => { modo = "treino"; treinar(); } }, "Voltar ao treino"));
          return;
        }
        atual = { ...treino.revisar[0], revisao: true };
        titulo.textContent = `Revisão · ${treino.revisar.length} para refazer`;
      } else {
        const lista = FAMILIAS.filter((f) => !grupo || f.grupo === grupo);
        const f = lista[Math.floor(Math.random() * lista.length)];
        atual = { ...f.gerar(), f: f.id };
        titulo.textContent = `${f.grupo} · ${f.nome}`;
      }
      linha.replaceChildren(conta(atual.conta, "grande"));
      inp.focus({ preventScroll: true });
    }
    function responder(desistiu) {
      if (inp.disabled) return;
      const dado = numero(inp.value);
      if (!desistiu && dado == null) { inp.setCustomValidity("Digite um número ou uma fração válida."); inp.reportValidity(); inp.focus(); return; }
      const certo = !desistiu && Math.abs(dado - atual.resposta) <= (atual.tol || 1e-6);
      inp.disabled = conferir.disabled = pular.disabled = true;
      sessao.feitas++; treino.feitas++;
      const fam = (treino.familias[atual.f] ||= { feitas: 0, acertos: 0 });
      fam.feitas++;
      if (certo) { sessao.acertos++; treino.acertos++; fam.acertos++; seguidas++; } else seguidas = 0;
      const na = treino.revisar.findIndex((r) => r.f === atual.f && r.conta === atual.conta);
      if (certo && na >= 0) treino.revisar.splice(na, 1);
      if (!certo && na < 0) treino.revisar.push({ f: atual.f, conta: atual.conta, resposta: atual.resposta, mostrar: atual.mostrar, jeito: atual.jeito, tol: atual.tol, em: Math.floor(Date.now() / 1000) });
      if (!certo && na >= 0) treino.revisar.push(...treino.revisar.splice(na, 1)); // errou de novo: vai para o fim da fila
      treino.revisar = treino.revisar.slice(-60);
      salvarTreino();
      rev.textContent = `Revisar (${treino.revisar.length})`;
      rev.disabled = !treino.revisar.length && modo !== "revisar";
      rev.classList.toggle("of-rev", treino.revisar.length > 0);
      pintarPlacar();
      resultado.replaceChildren(el("span", { class: "igual" }, "="), conta(atual.mostrar, "grande"), el("span", { class: "of-marca" }, certo ? "✓" : ""));
      lousa.classList.add(certo ? "of-acertou" : "of-errou");
      if (certo) {
        palco.append(el("p", { class: "of-certo" }, atual.revisao ? "Isso! Saiu da revisão." : seguidas >= 5 && seguidas % 5 === 0 ? `${seguidas} seguidas!` : "Isso!"));
        nextTimer = setTimeout(proxima, 700);
        return;
      }
      const prox = el("button", { type: "button", class: "grande" }, "Próxima ›");
      prox.addEventListener("click", proxima);
      palco.append(
        el("p", { class: "of-quase" }, desistiu ? `É ${atual.mostrar}.` : `Quase: é ${atual.mostrar}${inp.value ? ` (você pôs ${inp.value})` : ""}.`),
        prof(atual.jeito),
        el("p", { class: "ajuda" }, atual.revisao ? "Ela continua na revisão: volta mais tarde." : "Essa conta entrou na fila de revisão desta sessão."),
        prox);
      prox.focus({ preventScroll: true });
    }
    conferir.addEventListener("click", () => responder(false));
    pular.addEventListener("click", () => responder(true));
    inp.addEventListener("input", () => inp.setCustomValidity(""));
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") responder(false); });
    proxima();
  }


  treinar();
})();
