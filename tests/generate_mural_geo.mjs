// Fixed authorial fixture, not a user-input DSL interpreter.
import "../apps/activities/motor/geo.js";
import {mkdirSync,writeFileSync} from "node:fs";
import assert from "node:assert/strict";
const fig=globalThis.GEO.desenhar(`janela -1 6 -1 5
largura 320
grade
eixos nums
ponto A 1 1
ponto B 5 3
ponto C 5 1
seg A C tipo=aux
seg C B tipo=aux
seg A B tipo=destaque
texto "4" 3 .6
texto "2" 5.4 2`,{tema:"ilustra",rotulo:"A(1,1), B(5,3), C(5,1); deslocamentos horizontal 4 e vertical 2"});
assert(!/NaN|Infinity|<script/.test(fig));
assert(fig.includes("A(1,1)")&&fig.includes("viewBox"));
mkdirSync("test-artifacts/murals",{recursive:true});
writeFileSync("test-artifacts/murals/slope-geo.svg",fig);
console.log("PASS: GEO fixture, rise 2 and run 4");
