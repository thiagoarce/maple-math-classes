// Confere os geradores do treino da Oficina (treino.js): gera milhares de contas de cada
// família e confere que a resposta é um número, que o texto não tem "undefined"/"NaN" e que
// a resposta mostrada ao aluno, lida como ele digitaria, bate com a resposta.
//   node oficina-da-conta/conferir-treino.mjs
import "../apps/oficina/treino.js";
import "../apps/oficina/numero.js";
const { familias } = globalThis.OFICINA_TREINO;
const ler = globalThis.OFICINA_NUMERO;
let erros = 0;
for (const [s,n] of [["1.029",1029],["1 029",1029],["2,5",2.5],["7/6",7/6],["1/0",null],["0x12",null],["1.2.3",null],["1 2",null]]) if(ler(s)!==n) { console.error("parser",s); erros++; }
for (const f of familias) {
  const vistas = new Set();
  for (let i = 0; i < 3000; i++) {
    const c = f.gerar();
    const ruim = (m) => { erros++; if (erros < 20) console.log(f.id, m, JSON.stringify(c)); };
    if (!Number.isFinite(c.resposta)) ruim("resposta não é número");
    for (const k of ["conta", "mostrar", "jeito"]) if (!c[k] || /undefined|NaN|Infinity/.test(c[k])) ruim(`campo ${k} ruim`);
    const lido = ler(c.mostrar);
    if (lido == null || Math.abs(lido - c.resposta) > (c.tol || 1e-6)) ruim(`mostrar (${c.mostrar}) não bate com ${c.resposta}`);
    vistas.add(c.conta);
  }
  console.log(`${f.id.padEnd(12)} ${String(vistas.size).padStart(5)} contas diferentes`);
}
console.log(erros ? `${erros} problemas` : "Tudo certo.");
process.exit(erros ? 1 : 0);
