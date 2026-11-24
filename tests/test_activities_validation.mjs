import assert from "node:assert/strict";
import {lerJSON,conferir} from "../apps/activities/conferir.mjs";
const aula=lerJSON(new URL("../apps/activities/lessons/demo-proporcao.json",import.meta.url));
assert.deepEqual(conferir(aula).erros,[]);
for(const [name,mut] of [
 ["gabarito fora",j=>j.via[3].telas[0].itens[0].certa=9],
 ["palpite sem retomada",j=>j.via[0].telas.pop()],
 ["seta incompatível",j=>j.via[0].telas[1].itens[0].seta="×2"],
 ["tipo não suportado",j=>j.via[0].telas[0].itens[0].tipo="desenho"],
 ["fórmula não homologada",j=>j.via[0].telas[0].itens[0].texto+=" [[x^2]]"]
]){
 const clone=structuredClone(aula);mut(clone);assert(conferir(clone).erros.length>0,name);console.log("PASS:",name);
}
console.log("PASS: fixture válida e cinco regressões");
