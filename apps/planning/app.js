(async()=>{
"use strict";
const $=id=>document.getElementById(id),names={"hs-mathematics":"Matemática HS","entrepreneurship":"Entrepreneurship","olympiads":"Olimpíadas"};
const read=async path=>{const r=await fetch(path,{credentials:"omit",redirect:"error"});if(!r.ok)throw Error("Recurso ausente");return r.json()};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
const opt=(value,text)=>{const n=el("option",text);n.value=value;return n};
try{
 const [plan,reg,...cats]=await Promise.all([read("demo-week.json"),read("../../subjects/shared-resources.json"),...Object.keys(names).map(s=>read("../../subjects/"+s+"/curriculum.json"))]);
 const errors=PlanningCore.validate(plan,cats,reg);if(errors.length)throw Error(errors.join("; "));
 $("week").textContent=plan.week_label;
 for(const [id,name] of Object.entries(names))$("subject").append(opt(id,name));
 const levels=()=>{const selected=$("subject").value;$("level").replaceChildren(opt("","Todos"));for(const l of new Set(cats.filter(c=>!selected||c.subject===selected).flatMap(c=>c.levels)))$("level").append(opt(l,l))};
 function section(host,title,items){host.append(el("h2",title));const ul=el("ul");items.forEach(x=>ul.append(el("li",x)));host.append(ul)}
 function detail(l){
  const host=$("detail-content");host.replaceChildren(el("h2",l.title),el("p",l.goal));
  section(host,"Critérios de sucesso",l.criteria);
  host.append(el("h2","Roteiro · "+l.duration+" min"));
  l.steps.forEach(s=>{const t="("+s.minutes+" min) "+s.action;const n=el("div",null,"plano-bloco "+PlanningFormat.tipoDoBloco(s.action));n.innerHTML=PlanningFormat.htmlDoSegmento(t);host.append(n)});
  section(host,"Rotina do quadro",l.routine);
  section(host,"Evidência / tarefa",[l.evidence,l.homework||"Sem tarefa"]);
  host.append(el("h2","Recursos de demonstração"));
  const list=el("ul");
  for(const id of l.resources){const r=reg.resources.find(x=>x.id===id);const li=el("li");const a=el("a",id+" · abrir demonstração");a.href="../../"+r.path;a.target="_blank";a.rel="noopener noreferrer";li.append(a);list.append(li)}host.append(list);
  const btn=el("button","Preparar texto para Toddle");btn.id="export";const output=el("textarea");output.readOnly=true;output.hidden=true;output.setAttribute("aria-label","Texto de planejamento");btn.addEventListener("click",()=>{output.value=PlanningCore.exportText(l,reg);output.hidden=false;output.focus();output.select()});host.append(btn,output);$("detail").showModal();
 }
 function render(){const selected=$("subject").value,level=$("level").value;const lessons=plan.lessons.filter(l=>(!selected||l.subject===selected)&&(!level||l.level===level));$("status").textContent=lessons.length+" encontros fictícios · "+lessons.reduce((n,l)=>n+l.duration,0)+" min";$("lessons").replaceChildren();for(let day=1;day<=5;day++){const group=lessons.filter(l=>l.day===day);if(!group.length)continue;const col=el("section",null,"day");col.append(el("h2",PlanningCore.days[day-1]));for(const l of group){const card=el("article",null,"lesson");card.append(el("small",names[l.subject]+(l.level?" · "+l.level:"")+" · "+l.duration+" min"),el("h3",l.title),el("p",l.goal));const b=el("button","Ver planejamento");b.addEventListener("click",()=>detail(l));card.append(b);col.append(card)}$("lessons").append(col)}}
 $("subject").addEventListener("change",()=>{levels();render()});$("level").addEventListener("change",render);$("close").addEventListener("click",()=>$("detail").close());levels();render();
}catch(e){$("status").textContent="Não foi possível abrir a demonstração: "+e.message;}
})();
