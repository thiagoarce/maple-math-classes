import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import "../apps/planning/core.js";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const p=read("apps/planning/demo-week.json"),reg=read("subjects/shared-resources.json"),cats=["hs-mathematics","entrepreneurship","olympiads"].map(s=>read("subjects/"+s+"/curriculum.json"));
assert.deepEqual(PlanningCore.validate(p,cats,reg),[]);
for(const mutate of [x=>x.synthetic=false,x=>x.lessons[0].duration++,x=>x.lessons[0].unit="unknown",x=>x.lessons[0].resources.push("private"),x=>x.lessons[0].level="unknown",x=>x.lessons[1].id=x.lessons[0].id]){
 const x=structuredClone(p);mutate(x);assert(PlanningCore.validate(x,cats,reg).length>0);
}
assert(PlanningCore.exportText(p.lessons[1],reg).includes("Success Criteria"));
console.log("PASS: planning contract, six invalid cases and export");
