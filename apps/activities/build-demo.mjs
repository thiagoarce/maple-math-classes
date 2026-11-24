import {readFileSync,writeFileSync} from "node:fs";
import {conferir} from "./conferir.mjs";
const file = new URL("./lessons/demo-proporcao.json",import.meta.url);
const aula=JSON.parse(readFileSync(file,"utf8"));
const {erros,avisos}=conferir(aula);
for(const a of avisos) console.warn(a);
if(erros.length){console.error(erros.join("\n"));process.exit(1)}
const {estado,versao,trecho,titulo,...dados}=aula;
const output="/* Generated from lessons/demo-proporcao.json; do not edit. */\nwindow.AULA = "+JSON.stringify({...dados,fecho:{},formulas:{}},null,2).replace(/</g,"\\u003c")+";\nwindow.AULA_FIGURAS = {};\n";
const target=new URL("./demo-proporcao.js",import.meta.url);
if(process.argv.includes("--check")){if(readFileSync(target,"utf8")!==output){console.error("Fixture divergente; rode node apps/activities/build-demo.mjs");process.exit(1)}}else writeFileSync(target,output);
