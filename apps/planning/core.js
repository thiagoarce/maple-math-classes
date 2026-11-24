/* Structured planning: no HTML from private cards, no persistence. */
(function(root){
"use strict";
const days=["Segunda","Terça","Quarta","Quinta","Sexta"];
function validate(plan,cats,registry){
 const errors=[];
 if(plan.synthetic!==true)errors.push("Apenas demonstrações sintéticas");
 const ids=new Set();
 for(const l of plan.lessons){
  const cat=cats.find(c=>c.subject===l.subject);
  if(ids.has(l.id))errors.push("ID repetido: "+l.id);ids.add(l.id);
  if(!cat||!cat.units.some(u=>u.id===l.unit))errors.push("Unidade inválida: "+l.id);
  if(l.level!==null&&(!cat||!cat.levels.includes(l.level)))errors.push("Nível inválido: "+l.id);
  if(!Number.isInteger(l.day)||l.day<1||l.day>5)errors.push("Dia inválido: "+l.id);
  if(!Number.isInteger(l.duration)||l.duration<=0||!l.steps.length||l.steps.some(s=>!Number.isInteger(s.minutes)||s.minutes<=0||!s.action.trim())||l.steps.reduce((n,s)=>n+s.minutes,0)!==l.duration)errors.push("Duração incompatível: "+l.id);
  if(!l.goal||!l.criteria.length||!l.routine.length||!l.evidence)errors.push("Planejamento incompleto: "+l.id);
  for(const r of l.resources)if(!registry.resources.some(x=>x.id===r&&x.subjects.includes(l.subject)))errors.push("Recurso inválido: "+r);
 }
 return errors;
}
function exportText(l,registry){
 const en=l.subject==="entrepreneurship";
 const R=en?["Learning Goal","In class","Success Criteria","Resources","Assessment / Homework","Routine","No homework"]:["Objetivo","Roteiro da aula","Entendo que aprendi quando…","Recursos","Avaliação / Tarefa","Rotina","Sem tarefa"];
 return [l.title,R[0]+"\n"+l.goal,R[1]+"\n"+l.steps.map((s,i)=>(i+1)+". ("+s.minutes+" min) "+s.action).join("\n"),R[2]+"\n"+l.criteria.map(x=>"- "+x).join("\n"),R[3]+"\n"+l.resources.map(id=>"- "+id+" (demonstração local)").join("\n"),R[4]+"\n"+l.evidence+"\n"+(l.homework||R[6]),R[5]+"\n"+l.routine.map(x=>"- "+x).join("\n")].join("\n\n");
}
root.PlanningCore={days,validate,exportText};
})(typeof window!=="undefined"?window:globalThis);
