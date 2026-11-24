/* Teste do avaliador da calculadora do Modo Aula.
 *
 *     node tests/test_classroom_calculator.cjs
 *
 * A calculadora não usa `eval` — a expressão passa por um shunting-yard próprio em
 * `calculator.js`. Um parser escrito à mão erra em três lugares clássicos:
 * precedência, unário e associatividade da potência. Como o resultado dele vai para a
 * PAREDE, na frente da turma, o erro não é discreto: é uma conta errada projetada.
 *
 * O arquivo é um IIFE que se registra em `window.ModoAulaCalcMotor`, então o teste monta
 * um `window` de mentira e executa o módulo dentro dele.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const fonte = fs.readFileSync(
  path.join(__dirname, "..", "apps", "classroom", "core", "calculator.js"), "utf8");

/* Ambiente mínimo: o módulo só toca em `document`/`localStorage` depois do
   DOMContentLoaded, e aqui `readyState` fica em "loading" para nada disso rodar. */
const janela = {
  location: { search: "", href: "https://exemplo.test/x", pathname: "/x" },
  URLSearchParams,
  localStorage: { getItem: () => null, setItem: () => {} },
  addEventListener: () => {},
  document: {
    readyState: "loading",
    addEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    createElement: () => ({ style: {}, classList: { add() {}, toggle() {} }, appendChild() {} }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} }
  }
};
janela.window = janela;
vm.createContext(janela);
vm.runInContext(fonte, janela);

const { avaliar } = janela.ModoAulaCalcMotor;

let falhas = 0;
function T(expr, esperado, graus = true) {
  let obtido;
  try { obtido = avaliar(expr, graus); }
  catch (erro) { obtido = "ERRO: " + erro.message; }
  const perto = typeof esperado === "number" && typeof obtido === "number"
    && Math.abs(obtido - esperado) < 1e-9;
  const ok = perto || obtido === esperado;
  if (!ok) falhas++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${expr.padEnd(24)} = ${obtido}${ok ? "" : "   (esperado " + esperado + ")"}`);
}

console.log("-- aritmética e precedência");
T("2+3", 5);
T("2+3*4", 14);              // precedência, não 20
T("(2+3)*4", 20);
T("10/4", 2.5);
T("2*3+4*5", 26);
T("100-10-5", 85);           // associatividade à esquerda

console.log("\n-- potência");
T("2^3", 8);
T("2^3^2", 512);             // à DIREITA: 2^(3^2), não (2^3)^2 = 64
T("2^-2", 0.25);             // unário depois do operador
T("-2^2", -4);               // o unário é mais fraco que a potência

console.log("\n-- unário e parênteses");
T("-5+3", -2);
T("-(5+3)", -8);
T("3*-2", -6);
T("+7", 7);
T("((2))", 2);

console.log("\n-- raiz, que é a exigência dele para a calculadora normal");
T("√9", 3);
T("√(16)", 4);
T("√2*√2", 2);
T("2+√25", 7);

console.log("\n-- porcentagem");
T("50%", 0.5);
T("200*10%", 20);

console.log("\n-- científica: trigonometria em GRAUS (padrão)");
T("sin(30)", 0.5);
T("cos(60)", 0.5);
T("tan(45)", 1);
T("asin(0.5)", 30);

console.log("\n-- científica: trigonometria em RADIANOS");
T("sin(0)", 0, false);
T("cos(0)", 1, false);

console.log("\n-- logaritmos e constantes");
T("log(100)", 2);
T("ln(e)", 1);
T("π", Math.PI);
T("2*π", 2 * Math.PI);

console.log("\n-- símbolos de tecla (× ÷ −) chegam como vieram do botão");
T("6×7", 42);
T("84÷2", 42);
T("10−3", 7);

console.log("\n-- erro tem que ser erro, não número errado");
T("2+", "ERRO: falta número");
T("(2+3", "ERRO: parêntese aberto");
T("2+3)", "ERRO: parêntese sobrando");
T("2$3", "ERRO: símbolo solto: $");
T("banana(2)", "ERRO: não conheço banana");

console.log(`\n${falhas ? falhas + " falha(s)" : "tudo certo"}`);
process.exit(falhas ? 1 : 0);
