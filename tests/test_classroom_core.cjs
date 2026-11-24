/* Deterministic checks on existing classroom components. No browser or network. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "../apps/classroom");
let passed = 0;
function test(label, fn) { fn(); passed++; console.log("PASS", label); }
function load(p) { return fs.readFileSync(path.join(root, p), "utf8"); }
for (const file of fs.readdirSync(path.join(root, "core")).filter(f=>f.endsWith(".js"))) {
  test("parse " + file, () => new vm.Script(load("core/" + file)));
}
for (const file of ["index.html", "pdf.html", "projector.html"]) {
  test("local script paths " + file, () => {
    for (const m of load(file).matchAll(/<script[^>]*\bsrc="([^"]+)"/g)) {
      assert(!/^(?:[a-z]+:|\/\/)/i.test(m[1]));
      assert(fs.existsSync(path.resolve(root, m[1])), m[1]);
    }
  });
}
const shapes = load("core/shapes.js");
const geometry = new Function("crypto", shapes.slice(shapes.indexOf("  function uid()"), shapes.indexOf("  var FORMAS =")) + "\nreturn makeStroke;")({randomUUID:()=>"synthetic"});
const pt=(x,y)=>({x,y,nx:x/1000,ny:y/600,width:1000,height:600});
const surface={parent:{getBoundingClientRect:()=>({width:1000,height:600})},ink:{getWidthForTool:()=>4,getColorForTool:()=>"#000000",normalizesWidth:true}};
const types=["square","equilateral","pentagon","hexagon","octagon","circle","right-triangle","rectangle","rhombus","parallelogram","trapezoid","triangle","ellipse","line","arrow","double-arrow","axes"];
for(const type of types)test("shape "+type,()=>{
  for(const [a,b] of [[pt(100,100),pt(240,180)],[pt(240,180),pt(100,100)]]){
    const s=geometry(surface,type,a,b,{shiftKey:false});
    assert(s.points.length>=4&&s.points.length%2===0&&s.points.every(Number.isFinite));
    assert.equal(s.pressure.length,s.points.length/2);
    if(types.slice(0,5).includes(type)){
      const lengths=[];for(let i=2;i<s.points.length;i+=2)lengths.push(Math.hypot((s.points[i]-s.points[i-2])*1000,(s.points[i+1]-s.points[i-1])*600));
      assert(Math.max(...lengths)-Math.min(...lengths)<1e-8);
    }
  }
});
const handlers={},cover={hidden:false},toggles=[],parent={closed:false},intervals=[];
const win={opener:parent,addEventListener:(name,fn)=>handlers[name]=fn};
const doc={getElementById:id=>id==="cover"?cover:{classList:{toggle:(...x)=>toggles.push(x)}}};
const origin="http://localhost:8000";
new Function("window","document","location","setInterval",load("core/projection_receiver.js"))(win,doc,{origin},fn=>intervals.push(fn));
const deliver=(source,from,data)=>handlers.message({source,origin:from,data});
const valid={type:"maple-demo-board",view:"board",mode:"white"};
test("reject wrong window",()=>{deliver({},origin,valid);assert(!cover.hidden)});
test("reject wrong origin",()=>{deliver(parent,"https://foreign.test",valid);assert(!cover.hidden)});
test("reject arbitrary surface",()=>{deliver(parent,origin,{...valid,mode:"slide:private"});assert(!cover.hidden)});
test("show board",()=>{deliver(parent,origin,valid);assert(cover.hidden)});
test("black board",()=>{deliver(parent,origin,{...valid,mode:"black"});assert.equal(toggles.at(-1)[1],true)});
test("blackout",()=>{deliver(parent,origin,{...valid,view:"blackout"});assert(!cover.hidden)});
test("cover on presenter close",()=>{deliver(parent,origin,valid);parent.closed=true;intervals[0]();assert(!cover.hidden)});
console.log(passed+" checks passed");
