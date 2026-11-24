// Kit de desenho geométrico da Escalada (GEO).
//
// Um só arquivo para a figura impressa (quadro, estudo, PDF) e para o "Mexer" da
// plataforma. Escreve SVG com estilo embutido, sem depender de CSS da página.
// Coordenadas são as da matemática (y para cima); a escala sai da janela.
//
// Uso no Node:      await import("./geo.js"); const { GEO } = globalThis;
// Uso no navegador: <script src="/geo.js"></script> → window.GEO
//
// Duas portas de entrada:
//   GEO.figura({ x: [-1, 7], y: [-1, 5], larg: 300 })  → construtor com métodos
//   GEO.desenhar(texto)                                → mesmo resultado a partir de um
//                                                         roteiro de linhas (ver `DSL`)
//
// Hierarquia visual (a mesma em toda figura):
//   base       traço principal, azul            · destaque  azul-escuro mais grosso
//   aux        construção auxiliar, tracejado   · b / c     segunda e terceira cor
//   Preenchimentos são sempre translúcidos; o contorno carrega a forma.
(function (raiz) {
  const COR_P = {
    base: "#2763bb", destaque: "#173f7a", aux: "#7f9cc4", b: "#0f766e", c: "#9333ea",
    vet: "#c2410c", tinta: "#232323", eixo: "#34475a", grade: "#dbe4ee", num: "#56626e",
  };
  const PREENCHE_P = { a: "rgba(39,99,187,.14)", b: "rgba(15,118,110,.15)", c: "rgba(147,51,234,.13)", cinza: "rgba(52,71,90,.10)" };
  // tema "ilustra": a paleta das miniaturas (marinho e dourado), traço mais grosso e
  // preenchimento cheio. Para ilustração de conceito; dado de questão fica no tema padrão.
  const COR_IL = {
    base: "#13284f", destaque: "#e09b00", aux: "#5d7398", b: "#2763bb", c: "#b9461f",
    vet: "#e09b00", tinta: "#13284f", eixo: "#13284f", grade: "#e6ebf3", num: "#3d4f6e", branco: "#ffffff",
  };
  const PREENCHE_IL = { a: "rgba(255,194,75,.62)", b: "rgba(39,99,187,.30)", c: "rgba(185,70,31,.22)", cinza: "rgba(19,40,79,.12)", marinho: "rgba(19,40,79,.9)", branco: "rgba(255,255,255,.92)" };
  const FONTE = "Escalada, 'Gotham', Arial, sans-serif";
  const r2 = (v) => Math.round(v * 100) / 100;
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function figura(op = {}) {
    const ilustra = op.tema === "ilustra";
    const COR = ilustra ? COR_IL : COR_P, PREENCHE = ilustra ? PREENCHE_IL : PREENCHE_P, G = ilustra ? 1.45 : 1;
    const [x0, x1] = op.x || [0, 10];
    const [y0, y1] = op.y || [0, 10];
    const larg = op.larg || 320;                 // largura do desenho em px do viewBox
    const u = larg / (x1 - x0);                  // px por unidade
    const m = op.margem ?? 18;
    const W = larg + 2 * m, H = (y1 - y0) * u + 2 * m;
    const X = (x) => m + (x - x0) * u;
    const Y = (y) => m + (y1 - y) * u;
    const fundo = [], corpo = [], topo = [];
    const pts = {};                               // nome → {x, y}
    const obst = [];                              // amostras de pixels ocupados (para rótulos)
    const rotulos = [];                           // rótulos já postos (px)
    const pend = [];                              // rótulos de ponto em "auto", resolvidos no fim
    const P = (p) => (typeof p === "string" ? pts[p] : Array.isArray(p) ? { x: p[0], y: p[1] } : p);
    const amostra = (ax, ay, bx, by, n = 12) => { for (let k = 0; k <= n; k++) obst.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n]); };
    const traco = (tipo) => {
      const c = COR[tipo] || COR.base;
      const larguraT = (tipo === "destaque" ? 3.2 : tipo === "aux" ? 1.8 : 2.4) * G;
      return `stroke="${c}" stroke-width="${larguraT}" stroke-linecap="round" stroke-linejoin="round"${tipo === "aux" ? ' stroke-dasharray="6 5"' : ""}`;
    };
    const f = {
      X, Y, u, pts, COR, W: () => W, H: () => H,
      inv: (px, py) => ({ x: x0 + (px - m) / u, y: y1 - (py - m) / u }),
      grade(passo = 1) {
        for (let x = Math.ceil(x0 / passo) * passo; x <= x1 + 1e-9; x += passo) fundo.push(`<line x1="${r2(X(x))}" y1="${r2(Y(y0))}" x2="${r2(X(x))}" y2="${r2(Y(y1))}" stroke="${COR.grade}" stroke-width="1"/>`);
        for (let y = Math.ceil(y0 / passo) * passo; y <= y1 + 1e-9; y += passo) fundo.push(`<line x1="${r2(X(x0))}" y1="${r2(Y(y))}" x2="${r2(X(x1))}" y2="${r2(Y(y))}" stroke="${COR.grade}" stroke-width="1"/>`);
        return f;
      },
      eixos({ nums = false, passo = 1, nomes = ["x", "y"] } = {}) {
        if (y0 <= 0 && 0 <= y1) {
          fundo.push(`<line x1="${r2(X(x0) - 6)}" y1="${r2(Y(0))}" x2="${r2(X(x1) + 8)}" y2="${r2(Y(0))}" stroke="${COR.eixo}" stroke-width="1.6"/>`,
            `<path d="M${r2(X(x1) + 12)} ${r2(Y(0))} l-9 -4.5 v9z" fill="${COR.eixo}"/>`,
            `<text x="${r2(X(x1) + 6)}" y="${r2(Y(0) - 8)}" font-family="${FONTE}" font-size="13" font-style="italic" fill="${COR.eixo}">${nomes[0]}</text>`);
          amostra(X(x0), Y(0), X(x1), Y(0), 30);
        }
        if (x0 <= 0 && 0 <= x1) {
          fundo.push(`<line x1="${r2(X(0))}" y1="${r2(Y(y0) + 6)}" x2="${r2(X(0))}" y2="${r2(Y(y1) - 8)}" stroke="${COR.eixo}" stroke-width="1.6"/>`,
            `<path d="M${r2(X(0))} ${r2(Y(y1) - 12)} l-4.5 9 h9z" fill="${COR.eixo}"/>`,
            `<text x="${r2(X(0) + 8)}" y="${r2(Y(y1) - 4)}" font-family="${FONTE}" font-size="13" font-style="italic" fill="${COR.eixo}">${nomes[1]}</text>`);
          amostra(X(0), Y(y0), X(0), Y(y1), 30);
        }
        if (nums) {
          const t = (x, y, s, a) => rotulos.push([x, y - 4]) && fundo.push(`<text x="${r2(x)}" y="${r2(y)}" font-family="${FONTE}" font-size="10" fill="${COR.num}" text-anchor="${a}">${s}</text>`);
          if (y0 <= 0 && 0 <= y1) for (let x = Math.ceil(x0 / passo) * passo; x <= x1 + 1e-9; x += passo) if (Math.abs(x) > 1e-9) t(X(x), Y(0) + 13, r2(x).toLocaleString("pt-BR"), "middle");
          if (x0 <= 0 && 0 <= x1) for (let y = Math.ceil(y0 / passo) * passo; y <= y1 + 1e-9; y += passo) if (Math.abs(y) > 1e-9) t(X(0) - 6, Y(y) + 3.5, r2(y).toLocaleString("pt-BR"), "end");
          if (x0 <= 0 && 0 <= x1 && y0 <= 0 && 0 <= y1) t(X(0) - 6, Y(0) + 13, "0", "end");
        }
        return f;
      },
      // ponto(nome, x, y, { rot: "ne"|"n"|…|"auto", oculto, cor, rotulo })
      ponto(nome, x, y, o = {}) {
        pts[nome] = { x, y };
        if (o.oculto) return f;
        topo.push(`<circle cx="${r2(X(x))}" cy="${r2(Y(y))}" r="${o.raio || 3.6}" fill="${COR[o.cor] || COR.tinta}"/>`);
        if (o.rotulo !== "") pend.push({ texto: o.rotulo ?? nome, px: X(x), py: Y(y), rot: o.rot || "auto", cor: o.cor });
        return f;
      },
      // seg(A, B, { tipo, marcas: n tracinhos de lados iguais, cota: "texto", lado: 1|-1 })
      seg(a, b, o = {}) {
        const A = P(a), B = P(b);
        const ax = X(A.x), ay = Y(A.y), bx = X(B.x), by = Y(B.y);
        corpo.push(`<line x1="${r2(ax)}" y1="${r2(ay)}" x2="${r2(bx)}" y2="${r2(by)}" ${traco(o.tipo)}/>`);
        amostra(ax, ay, bx, by);
        if (o.marcas) f._marcas(ax, ay, bx, by, o.marcas, o.tipo);
        if (o.cota) f._cota(ax, ay, bx, by, o.cota, o.lado || 1);
        if (o.seta) f._ponta(ax, ay, bx, by, o.tipo === "aux" ? COR.aux : COR[o.tipo] || COR.base);
        return f;
      },
      vetor(a, b, o = {}) { return f.seg(a, b, { ...o, tipo: o.tipo || "vet", seta: true }); },
      // reta que passa por A e B, cortada na janela
      reta(a, b, o = {}) {
        const A = P(a), B = P(b);
        const dx = B.x - A.x, dy = B.y - A.y;
        const ts = [];
        if (Math.abs(dx) > 1e-12) for (const xx of [x0, x1]) ts.push((xx - A.x) / dx);
        if (Math.abs(dy) > 1e-12) for (const yy of [y0, y1]) ts.push((yy - A.y) / dy);
        const dentro = ts.map((t) => ({ x: A.x + t * dx, y: A.y + t * dy, t })).filter((q) => q.x >= x0 - 1e-9 && q.x <= x1 + 1e-9 && q.y >= y0 - 1e-9 && q.y <= y1 + 1e-9).sort((p, q) => p.t - q.t);
        if (dentro.length >= 2) {
          const p = dentro[0], q = dentro[dentro.length - 1];
          corpo.push(`<line x1="${r2(X(p.x))}" y1="${r2(Y(p.y))}" x2="${r2(X(q.x))}" y2="${r2(Y(q.y))}" ${traco(o.tipo)}/>`);
          amostra(X(p.x), Y(p.y), X(q.x), Y(q.y), 30);
          if (o.nome) pend.push({ texto: o.nome, px: X(q.x), py: Y(q.y), rot: "auto", italico: true });
        }
        return f;
      },
      // pol([A, B, C], { tipo, preench: "a"|"b"|"c"|"cinza"|"", hach })
      pol(lista, o = {}) {
        const Q = lista.map(P);
        const d = Q.map((q) => `${r2(X(q.x))},${r2(Y(q.y))}`).join(" ");
        const pre = o.preench === "" ? "none" : PREENCHE[o.preench || "a"];
        if (o.hach) f._hachura(d);
        corpo.push(`<polygon points="${d}" fill="${o.hach ? "url(#geo-hach)" : pre}" ${traco(o.tipo)}/>`);
        Q.forEach((q, i) => { const r = Q[(i + 1) % Q.length]; amostra(X(q.x), Y(q.y), X(r.x), Y(r.y)); });
        return f;
      },
      // circ(C, r | ponto da circunferência, { tipo, preench })
      circ(c, r, o = {}) {
        const C = P(c);
        const R = typeof r === "number" ? r : Math.hypot(P(r).x - C.x, P(r).y - C.y);
        corpo.push(`<circle cx="${r2(X(C.x))}" cy="${r2(Y(C.y))}" r="${r2(R * u)}" fill="${o.preench ? PREENCHE[o.preench] : "none"}" ${traco(o.tipo)}/>`);
        for (let k = 0; k < 48; k++) obst.push([X(C.x + R * Math.cos(k * Math.PI / 24)), Y(C.y + R * Math.sin(k * Math.PI / 24))]);
        return f;
      },
      // arco(C, r, a0, a1) em graus, anti-horário; setor fecha no centro
      arco(c, r, a0, a1, o = {}) { return f._arco(c, r, a0, a1, o, false); },
      setor(c, r, a0, a1, o = {}) { return f._arco(c, r, a0, a1, { preench: "a", ...o }, true); },
      _arco(c, r, a0, a1, o, fechado) {
        const C = P(c), rad = (g) => g * Math.PI / 180;
        const px = (g) => X(C.x + r * Math.cos(rad(g))), py = (g) => Y(C.y + r * Math.sin(rad(g)));
        const grande = ((a1 - a0) % 360 + 360) % 360 > 180 ? 1 : 0;
        const d = `${fechado ? `M${r2(X(C.x))} ${r2(Y(C.y))} L` : "M"}${r2(px(a0))} ${r2(py(a0))} A${r2(r * u)} ${r2(r * u)} 0 ${grande} 0 ${r2(px(a1))} ${r2(py(a1))}${fechado ? "Z" : ""}`;
        corpo.push(`<path d="${d}" fill="${fechado ? PREENCHE[o.preench] : "none"}" ${traco(o.tipo)}/>`);
        for (let k = 0; k <= 16; k++) { const g = a0 + ((((a1 - a0) % 360) + 360) % 360) * k / 16; obst.push([px(g), py(g)]); }
        return f;
      },
      // angulo(A, V, B, { rot: "θ", n: 1|2 arcos, reto: true|false|undefined(auto), raio })
      angulo(a, v, b, o = {}) {
        const A = P(a), V = P(v), B = P(b);
        const vx = X(V.x), vy = Y(V.y);
        let t1 = Math.atan2(Y(A.y) - vy, X(A.x) - vx), t2 = Math.atan2(Y(B.y) - vy, X(B.x) - vx);
        let d = t2 - t1; while (d <= -Math.PI) d += 2 * Math.PI; while (d > Math.PI) d -= 2 * Math.PI;
        const reto = o.reto ?? Math.abs(Math.abs(d) - Math.PI / 2) < 0.01;
        const cor = COR[o.cor] || COR.tinta;
        for (let k = 0; k <= 8; k++) { const g = t1 + d * k / 8, rr = (reto ? 14 : (o.raio || 20)); obst.push([vx + rr * Math.cos(g), vy + rr * Math.sin(g)]); }
        if (reto) {
          const s = o.raio || 11, ux = Math.cos(t1) * s, uy = Math.sin(t1) * s, wx = Math.cos(t1 + d) * s, wy = Math.sin(t1 + d) * s;
          topo.push(`<path d="M${r2(vx + ux)} ${r2(vy + uy)} L${r2(vx + ux + wx)} ${r2(vy + uy + wy)} L${r2(vx + wx)} ${r2(vy + wy)}" fill="none" stroke="${cor}" stroke-width="1.4"/>`);
        } else {
          const R = o.raio || 20;
          for (let k = 0; k < (o.n || 1); k++) {
            const rr = R + k * 4;
            topo.push(`<path d="M${r2(vx + rr * Math.cos(t1))} ${r2(vy + rr * Math.sin(t1))} A${rr} ${rr} 0 0 ${d > 0 ? 1 : 0} ${r2(vx + rr * Math.cos(t1 + d))} ${r2(vy + rr * Math.sin(t1 + d))}" fill="none" stroke="${cor}" stroke-width="1.4"/>`);
          }
          if (o.preench) topo.unshift(`<path d="M${r2(vx)} ${r2(vy)} L${r2(vx + R * Math.cos(t1))} ${r2(vy + R * Math.sin(t1))} A${R} ${R} 0 0 ${d > 0 ? 1 : 0} ${r2(vx + R * Math.cos(t1 + d))} ${r2(vy + R * Math.sin(t1 + d))}Z" fill="${PREENCHE[o.preench]}"/>`);
        }
        if (o.rot) {
          const meio = t1 + d / 2, dist = (reto ? 20 : (o.raio || 20) + 4 * ((o.n || 1) - 1)) + 10;
          f._texto(o.rot, vx + dist * Math.cos(meio), vy + dist * Math.sin(meio) + 4, "middle", { italico: true, tam: 12.5, cor: o.cor });
        }
        return f;
      },
      // texto livre em coordenadas da figura
      texto(t, x, y, o = {}) { f._texto(t, X(x), Y(y), o.anc || "middle", o); return f; },
      // gráfico de função y = fn(x)
      funcao(fn, o = {}) {
        const de = o.de ?? x0, ate = o.ate ?? x1, n = o.n || 160;
        let d = "", aberto = false;
        for (let k = 0; k <= n; k++) {
          const x = de + (ate - de) * k / n, y = fn(x);
          if (!Number.isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { aberto = false; continue; }
          d += `${aberto ? "L" : "M"}${r2(X(x))} ${r2(Y(y))}`; aberto = true;
          if (y >= y0 && y <= y1) obst.push([X(x), Y(y)]);
        }
        corpo.push(`<path d="${d}" fill="none" ${traco(o.tipo)}/>`);
        return f;
      },
      // ---- peças internas
      _texto(t, px, py, anc, o = {}) {
        rotulos.push([px, py - 4]);
        topo.push(`<text x="${r2(px)}" y="${r2(py)}" font-family="${FONTE}" font-size="${o.tam || 13.5}" font-weight="${o.italico ? 400 : 700}"${o.italico ? ' font-style="italic"' : ""} fill="${COR[o.cor] || COR.tinta}" text-anchor="${anc}" paint-order="stroke" stroke="${o.cor === "branco" ? "#13284f" : "#fff"}" stroke-width="3.5" stroke-linejoin="round">${esc(t)}</text>`);
      },
      _marcas(ax, ay, bx, by, n, tipo) {
        const mx = (ax + bx) / 2, my = (ay + by) / 2, L = Math.hypot(bx - ax, by - ay) || 1;
        const tx = (bx - ax) / L, ty = (by - ay) / L, nx = -ty, ny = tx;
        for (let k = 0; k < n; k++) {
          const off = (k - (n - 1) / 2) * 4.5;
          const cx = mx + tx * off, cy = my + ty * off;
          topo.push(`<line x1="${r2(cx - nx * 6)}" y1="${r2(cy - ny * 6)}" x2="${r2(cx + nx * 6)}" y2="${r2(cy + ny * 6)}" stroke="${COR[tipo] || COR.base}" stroke-width="1.8"/>`);
        }
      },
      _cota(ax, ay, bx, by, texto, lado) {
        const L = Math.hypot(bx - ax, by - ay) || 1, tx = (bx - ax) / L, ty = (by - ay) / L;
        const nx = ty * lado, ny = -tx * lado, d = 14;
        const p = [ax + nx * d, ay + ny * d], q = [bx + nx * d, by + ny * d];
        topo.push(`<line x1="${r2(p[0])}" y1="${r2(p[1])}" x2="${r2(q[0])}" y2="${r2(q[1])}" stroke="${COR.num}" stroke-width="1"/>`,
          `<line x1="${r2(ax + nx * 6)}" y1="${r2(ay + ny * 6)}" x2="${r2(ax + nx * 19)}" y2="${r2(ay + ny * 19)}" stroke="${COR.num}" stroke-width=".9"/>`,
          `<line x1="${r2(bx + nx * 6)}" y1="${r2(by + ny * 6)}" x2="${r2(bx + nx * 19)}" y2="${r2(by + ny * 19)}" stroke="${COR.num}" stroke-width=".9"/>`);
        amostra(p[0], p[1], q[0], q[1]);
        f._ponta(q[0], q[1], p[0], p[1], COR.num, 6); f._ponta(p[0], p[1], q[0], q[1], COR.num, 6);
        f._texto(texto, (p[0] + q[0]) / 2 + nx * 9, (p[1] + q[1]) / 2 + ny * 9 + 4, "middle", { tam: 12, cor: "num" });
      },
      _ponta(ax, ay, bx, by, cor, s = 9) {
        const L = Math.hypot(bx - ax, by - ay) || 1, tx = (bx - ax) / L, ty = (by - ay) / L;
        topo.push(`<path d="M${r2(bx)} ${r2(by)} L${r2(bx - tx * s - ty * s * .45)} ${r2(by - ty * s + tx * s * .45)} L${r2(bx - tx * s + ty * s * .45)} ${r2(by - ty * s - tx * s * .45)}Z" fill="${cor}"/>`);
      },
      _hachura() { f._temHach = true; },
      // ---- saída
      svg(o = {}) {
        // rótulos de ponto: escolhe, entre 8 direções, a mais longe de traços e rótulos
        const dirs = { ne: [1, -1], n: [0, -1.2], no: [-1, -1], o: [-1.25, 0], so: [-1, 1.1], s: [0, 1.35], se: [1, 1.1], l: [1.25, 0] };
        for (const r of pend) {
          let melhor = r.rot !== "auto" ? r.rot : null;
          if (!melhor) {
            let nota = -1;
            for (const [k, [dx, dy]] of Object.entries(dirs)) {
              const cx = r.px + dx * 12, cy = r.py + dy * 12;
              let dmin = 1e9;
              for (const [ox, oy] of obst) dmin = Math.min(dmin, Math.hypot(ox - cx, oy - cy));
              for (const [ox, oy] of rotulos) dmin = Math.min(dmin, Math.hypot(ox - cx, oy - cy) * 0.8);
              const fora = cx < 6 || cx > W - 6 || cy < 10 || cy > H - 4 ? -40 : 0;
              const pref = k === "ne" ? 1.5 : 0;     // empate: nordeste, como no caderno
              if (dmin + fora + pref > nota) { nota = dmin + fora + pref; melhor = k; }
            }
          }
          const [dx, dy] = dirs[melhor] || dirs.ne;
          const anc = dx > 0.3 ? "start" : dx < -0.3 ? "end" : "middle";
          f._texto(r.texto, r.px + dx * 8, r.py + dy * 9 + 5, anc, { italico: r.italico, cor: r.cor });
        }
        pend.length = 0;
        const defs = f._temHach ? `<defs><pattern id="geo-hach" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="${PREENCHE.a}"/><line x1="0" y1="0" x2="0" y2="7" stroke="${COR.base}" stroke-width="1.2" opacity=".55"/></pattern></defs>` : "";
        const estilo = o.larguraMM ? ` style="width:${o.larguraMM}mm;height:auto;display:block;margin:0 auto"` : "";
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(W)} ${r2(H)}" role="img"${o.rotulo ? ` aria-label="${esc(o.rotulo)}"` : ""}${estilo}>${defs}${fundo.join("")}${corpo.join("")}${topo.join("")}</svg>`;
      },
    };
    return f;
  }

  // ---- DSL: uma instrução por linha. Nomes de pontos podem ser usados no lugar de números.
  //   janela -1 7 -1 5        (x0 x1 y0 y1)      largura 300   (px do viewBox)
  //   grade [passo]   eixos [nums]
  //   ponto A 0 0 [rot=ne] [cor=b] [oculto]
  //   seg A B [tipo=aux] [marcas=2] [cota="6 cm"] [lado=-1]
  //   vetor A B       reta A B [tipo=…] [nome=r]
  //   pol A B C [tipo=…] [preench=b] [hach]
  //   circ O 2 | circ O A     arco O 2 0 90     setor O 2 0 90 [preench=c]
  //   angulo B A C [rot="θ"] [n=2] [reto]        texto "h" 3 2 [anc=start]
  const DSL = `janela · largura · grade · eixos · ponto · seg · vetor · reta · pol · circ · arco · setor · angulo · texto`;
  function desenhar(texto, extra = {}) {
    const linhas = texto.split(/\n|;/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    // No papel, 1 px do desenho ≈ 0,25 mm: rótulo de 13,5 px sai com uns 9,5 pt, como o texto.
    let jan = [0, 10, 0, 10], larg = extra.larguraMM ? Math.round(extra.larguraMM * 4 - 36) : 320;
    for (const l of linhas) {
      const [cmd, ...r] = l.split(/\s+/);
      if (cmd === "janela") jan = r.slice(0, 4).map(Number);
      if (cmd === "largura") larg = Number(r[0]);
    }
    const tema = linhas.includes("tema ilustra") ? "ilustra" : extra.tema;
    const f = figura({ x: [jan[0], jan[1]], y: [jan[2], jan[3]], larg, tema });
    for (const l of linhas) {
      const tokens = [...l.matchAll(/(\w+)="([^"]*)"|"([^"]*)"|(\S+)/g)].map((m) => (m[1] ? { k: m[1], v: m[2] } : m[3] != null ? { s: m[3] } : { t: m[4] }));
      const cmd = tokens[0].t;
      // "x,y" vale como ponto sem nome
      const pos = tokens.slice(1).filter((x) => x.t != null && !x.t.includes("=")).map((x) => (/^-?[\d.]+,-?[\d.]+$/.test(x.t) ? x.t.split(",").map(Number) : x.t));
      const op = {};
      for (const x of tokens.slice(1)) {
        if (x.k) op[x.k] = x.v;
        else if (x.t && x.t.includes("=")) { const [k, v] = x.t.split("="); op[k] = v; }
      }
      const str = tokens.slice(1).find((x) => x.s != null)?.s;
      const num = (v) => (v in f.pts ? v : Number(v));
      if (op.marcas) op.marcas = Number(op.marcas);
      if (op.lado) op.lado = Number(op.lado);
      if (op.n) op.n = Number(op.n);
      if (op.raio) op.raio = Number(op.raio);
      const flag = (n) => pos.includes(n);
      switch (cmd) {
        case "grade": f.grade(pos[0] ? Number(pos[0]) : 1); break;
        case "eixos": f.eixos({ nums: flag("nums"), passo: op.passo ? Number(op.passo) : 1 }); break;
        case "ponto": f.ponto(pos[0], ...(Array.isArray(pos[1]) ? pos[1] : [Number(pos[1]), Number(pos[2])]), { rot: op.rot, cor: op.cor, oculto: flag("oculto"), rotulo: op.rotulo }); break;
        case "seg": f.seg(pos[0], pos[1], op); break;
        case "vetor": f.vetor(pos[0], pos[1], op); break;
        case "reta": f.reta(pos[0], pos[1], op); break;
        case "pol": f.pol(pos.filter((p) => p !== "hach"), { ...op, hach: flag("hach") }); break;
        case "circ": f.circ(pos[0], num(pos[1]), op); break;
        case "arco": f.arco(pos[0], Number(pos[1]), Number(pos[2]), Number(pos[3]), op); break;
        case "setor": f.setor(pos[0], Number(pos[1]), Number(pos[2]), Number(pos[3]), op); break;
        case "angulo": f.angulo(pos[0], pos[1], pos[2], { ...op, reto: flag("reto") ? true : flag("agudo") ? false : undefined }); break;
        case "texto": f.texto(str, Number(pos[0]), Number(pos[1]), op); break;
        // funcao "Math.sin(x)" [de=… ate=…]: expressão em x, escrita no próprio repositório
        case "funcao": f.funcao(new Function("x", `with (Math) { return (${str}); }`), { ...op, de: op.de != null ? Number(op.de) : undefined, ate: op.ate != null ? Number(op.ate) : undefined }); break;
        default: break;
      }
    }
    return f.svg(extra);
  }

  raiz.GEO = { figura, desenhar, COR: COR_P, PREENCHE: PREENCHE_P, COR_IL, PREENCHE_IL, DSL };
})(typeof globalThis !== "undefined" ? globalThis : window);
