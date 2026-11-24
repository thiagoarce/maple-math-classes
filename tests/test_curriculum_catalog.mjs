import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {resolve,relative} from "node:path";
const subjects=["hs-mathematics","entrepreneurship","olympiads"];
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const root=process.cwd();
const safePath=p=>typeof p==="string"&&!p.startsWith("/")&&!p.includes("..")&&!p.includes("://")&&existsSync(resolve(root,p))&&!relative(root,resolve(root,p)).startsWith("..");
const ids=new Set();
for(const subject of subjects){
 const cat=read("subjects/"+subject+"/curriculum.json");
 assert.equal(cat.subject,subject);
 assert.equal(cat.status,"candidate-inventory");
 assert.equal(cat.schema_version,1);
 assert(Array.isArray(cat.levels)&&Array.isArray(cat.units)&&cat.units.length);
 for(const u of cat.units){
  assert.match(u.id,/^[a-z][a-z0-9-]+$/);
  assert(!ids.has(u.id),u.id);ids.add(u.id);
  assert.equal(u.status,"candidate");
  assert(u.title&&u.topics.length);
  assert(u.historical_levels.every(l=>cat.levels.includes(l)),u.id);
  for(const r of u.resources)assert(safePath(r.path),r.path);
 }
}
const reg=read("subjects/shared-resources.json");
assert.equal(reg.schema_version,1);
const keys=new Set();
for(const r of reg.resources){
 assert(!keys.has(r.id),r.id);keys.add(r.id);
 assert(safePath(r.path),r.path);
 assert(r.subjects.length&&r.subjects.every(s=>subjects.includes(s)));
 assert(["prototype","technical-demo","pending-validation"].includes(r.status));
}
console.log("PASS: "+ids.size+" candidate curriculum units and "+keys.size+" shared resources");
