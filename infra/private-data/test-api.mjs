import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {generateKeyPair,exportJWK,SignJWT} from "jose";
import worker from "./worker.mjs";
import {Miniflare} from "miniflare";
import {build} from "esbuild";
import {fileURLToPath} from "node:url";

const useD1=process.argv.includes("--d1");
const db=new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys=ON");
for(const name of ["0001_core.sql","0002_result_audit.sql","0003_diary.sql"])db.exec(readFileSync(new URL("./migrations/"+name,import.meta.url),"utf8"));
db.exec(`
INSERT INTO academic_years VALUES ('y',2027);
INSERT INTO staff VALUES ('t','https://demo.cloudflareaccess.com','teacher',1),('v','https://demo.cloudflareaccess.com','viewer',1),('x','https://demo.cloudflareaccess.com','disabled',0);
INSERT INTO students VALUES ('s','Synthetic student');
INSERT INTO offers VALUES ('o','y','hs-mathematics','Y11','Demo'),('other','y','olympiads','N1','Other'),('empty','y','hs-mathematics','Y11','Empty');
INSERT INTO offer_staff VALUES ('o','t','teacher'),('o','v','viewer'),('o','x','teacher'),('empty','t','teacher');
INSERT INTO enrollments VALUES ('o','s','active');
INSERT INTO lessons VALUES ('l','o','hs-matrices','Synthetic lesson','2027-01-04',480,50,'Goal','draft',1);
INSERT INTO assessments VALUES ('a','o','Demo',1000,'open');
INSERT INTO results(assessment_id,offer_id,student_id,max_score,score,status) VALUES ('a','o','s',1000,NULL,'pending');
`);
const adapter={prepare(sql){return {bind(...args){return {async all(){return {success:true,results:db.prepare(sql).all(...args)}},async run(){return {success:true,meta:{changes:Number(db.prepare(sql).run(...args).changes)}}}}}}}};
const {publicKey,privateKey}=await generateKeyPair("RS256",{extractable:true});
const other=await generateKeyPair("RS256");
const jwk={...await exportJWK(publicKey),kid:"demo",alg:"RS256",use:"sig"};
const issuer="https://demo.cloudflareaccess.com",origin="https://private.example.invalid",aud="demo-aud";
const env={ACCESS_ISSUER:issuer,ACCESS_AUDIENCE:aud,ACCESS_JWKS_JSON:JSON.stringify({keys:[jwk]}),PRIVATE_ORIGIN:origin,PRIVATE_DB:adapter};
async function token(subject="teacher",opts={}){
 return new SignJWT({type:opts.type||"app"}).setProtectedHeader({alg:"RS256",kid:opts.kid||"demo"}).setIssuer(opts.issuer||issuer).setAudience(opts.aud||aud).setSubject(subject).setIssuedAt().setExpirationTime(opts.exp||"5m").sign(opts.key||privateKey)
}
const teacher=await token(),viewer=await token("viewer"),disabled=await token("disabled");
let mf,d1;
if(useD1){
 const bundle=await build({entryPoints:[fileURLToPath(new URL("./worker.mjs",import.meta.url))],bundle:true,format:"esm",platform:"browser",write:false,target:"es2022"});
 mf=new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:"2026-07-30",cf:false,d1Databases:{PRIVATE_DB:"maple-disposable-test"},d1Persist:false,bindings:{ACCESS_ISSUER:issuer,ACCESS_AUDIENCE:aud,ACCESS_JWKS_JSON:JSON.stringify({keys:[jwk]}),PRIVATE_ORIGIN:origin}});
 try{
 d1=await mf.getD1Database("PRIVATE_DB");
 // SQLite parser in Python preserves the trigger body as one statement.
 const {execFileSync}=await import("node:child_process");
 const statements=JSON.parse(execFileSync("python",["-c","import sqlite3,sys,json\ns=sys.stdin.read(); out=[]; buf=''\nfor ch in s:\n buf+=ch\n if ch==';' and sqlite3.complete_statement(buf):\n  out.append(buf.strip());buf=''\nif buf.strip(): raise ValueError('Incomplete SQL')\nprint(json.dumps(out))"],{input:["0001_core.sql","0002_result_audit.sql","0003_diary.sql"].map(n=>readFileSync(new URL("./migrations/"+n,import.meta.url),"utf8")).join("\n")+"\n"+"\nINSERT INTO academic_years VALUES ('y',2027);\nINSERT INTO staff VALUES ('t','https://demo.cloudflareaccess.com','teacher',1),('v','https://demo.cloudflareaccess.com','viewer',1),('x','https://demo.cloudflareaccess.com','disabled',0);\nINSERT INTO students VALUES ('s','Synthetic student');\nINSERT INTO offers VALUES ('o','y','hs-mathematics','Y11','Demo'),('other','y','olympiads','N1','Other'),('empty','y','hs-mathematics','Y11','Empty');\nINSERT INTO offer_staff VALUES ('o','t','teacher'),('o','v','viewer'),('o','x','teacher'),('empty','t','teacher');\nINSERT INTO enrollments VALUES ('o','s','active');\nINSERT INTO lessons VALUES ('l','o','hs-matrices','Synthetic lesson','2027-01-04',480,50,'Goal','draft',1);\nINSERT INTO assessments VALUES ('a','o','Demo',1000,'open');\nINSERT INTO results(assessment_id,offer_id,student_id,max_score,score,status) VALUES ('a','o','s',1000,NULL,'pending');\n",encoding:"utf8"}));
 for(const sql of statements)await d1.prepare(sql).run();
 }catch(e){await mf.dispose();throw e}
}
const first=async sql=>useD1?await d1.prepare(sql).first():db.prepare(sql).get();
const exec=async sql=>{if(useD1){for(const statement of sql.split(";").filter(s=>s.trim()))await d1.prepare(statement).run()}else db.exec(sql)};
try{
const read="/api/v1/offers/o/lessons?from=2027-01-01&to=2027-01-07",write="/api/v1/offers/o/assessments/a/results/s";
let n=0;
async function req(path,expected,opts={}){
 const headers={};if(opts.token!==null)headers["cf-access-jwt-assertion"]=opts.token??teacher;
 if(["PUT","POST"].includes(opts.method)){headers["content-type"]="application/json";headers.origin=opts.origin??origin;headers["x-maple-action"]=opts.action??"grade"}
 const url=(opts.host||origin)+path,init={method:opts.method||"GET",headers,body:["PUT","POST"].includes(opts.method)?JSON.stringify(opts.body??{score:850,revision:1}):undefined};
 const response=useD1?await mf.dispatchFetch(url,init):await worker.fetch(new Request(url,init),env);
 assert.equal(response.status,expected,path);
 assert.match(response.headers.get("cache-control"),/no-store/);
 assert.equal(response.headers.get("access-control-allow-origin"),null);
 n++;return response.json();
}
assert.equal((await req(read,200)).lessons.length,1);
assert.equal((await req(read,200,{token:viewer})).lessons.length,1);
assert.equal((await req(read.replace("/o/","/empty/"),200)).lessons.length,0);
await req(read,401,{token:null});
await req(read,401,{token:await token("teacher",{key:other.privateKey})});
await req(read,401,{token:await token("teacher",{aud:"wrong"})});
await req(read,401,{token:await token("teacher",{issuer:"https://bad.cloudflareaccess.com"})});
await req(read,401,{token:await token("teacher",{exp:Math.floor(Date.now()/1000)-60})});
await req(read,401,{token:await token("teacher",{type:"org"})});
await req(read,401,{token:await token("teacher",{kid:"unknown"})});
await req(read,404,{token:disabled});
await req(read.replace("/o/","/other/"),404);
await req(read,404,{host:"https://preview.example.invalid"});
await req(read.replace("2027-01-01","2027-02-30"),400);
await req(read.replace("2027-01-07","2027-03-01"),400);
await req(write,403,{method:"PUT",origin:"https://other.example.invalid"});
await req(write,404,{method:"PUT",token:viewer});
await req(write,404,{method:"PUT",token:disabled});
await req(write.replace("/o/","/other/"),404,{method:"PUT"});
await req(write,400,{method:"PUT",body:{score:8.5,revision:1}});
await req(write,400,{method:"PUT",body:{score:850,revision:1,actor:"t"}});
await req(write,404,{method:"PUT",body:{score:1001,revision:1}});
assert.equal((await first("SELECT count(*) AS n FROM result_audit")).n,0);
assert.equal((await req(write,200,{method:"PUT"})).revision,2);
await req(write,404,{method:"PUT",body:{score:100,revision:1}});
assert.equal((await first("SELECT score FROM results")).score,850);
assert.deepEqual({...await first("SELECT actor_id,revision FROM result_audit")},{actor_id:"t",revision:2});
await exec("UPDATE assessments SET status='closed'");
await req(write,404,{method:"PUT",body:{score:900,revision:2}});
await exec("UPDATE assessments SET status='open'; UPDATE enrollments SET status='withdrawn'");
await req(write,404,{method:"PUT",body:{score:900,revision:2}});
assert.equal((await first("SELECT count(*) AS n FROM result_audit")).n,1);
assert.equal((await req("/api/v1/offers",200)).offers.length,2);
assert.equal((await req("/api/v1/offers/o/assessments",200)).assessments.length,1);
await req("/api/v1/offers/o/assessments",404,{token:viewer});
await req("/api/v1/offers/o/assessments/a/results",404,{token:viewer});
const grades=await req("/api/v1/offers/o/assessments/a/results",200);
assert.equal(grades.results[0].score,850);
assert.equal(grades.results[0].revision,2);
// Diary: no implicit absence; only taught encounters and active membership can be written.
await exec("UPDATE enrollments SET status='active'");
const diary="/api/v1/offers/o/lessons/l/diary",att="/api/v1/offers/o/lessons/l/attendance/s",ev="/api/v1/offers/o/lessons/l/evidence/s",prof="/api/v1/offers/o/students/s/profile";
const attOpts={method:"PUT",action:"attendance",body:{status:"present",revision:0}};
const evOpts={method:"POST",action:"evidence",body:{kind:"explanation",observation:"Synthetic explanation"}};
assert.equal((await req(diary,200)).students[0].status,null);
await req(diary,404,{token:viewer});
await req(att,404,attOpts);
await req(ev,404,evOpts);
await exec("UPDATE lessons SET status='taught'");
await req(att,404,{...attOpts,token:viewer});
await req(att,403,{...attOpts,origin:"https://other.example.invalid"});
await req(att.replace("/o/","/other/"),404,attOpts);
await req(att,400,{...attOpts,body:{status:"unknown",revision:0}});
assert.equal((await req(att,200,attOpts)).revision,1);
await req(att,404,attOpts);
assert.equal((await req(att,200,{...attOpts,body:{status:"late",revision:1}})).revision,2);
assert.equal((await first("SELECT count(*) AS n FROM attendance_audit")).n,2);
await req(ev,404,{...evOpts,token:viewer});
await req(ev,400,{...evOpts,body:{kind:"diagnosis",observation:"Synthetic"}});
await req(ev,201,evOpts);
await req(prof,404,{token:viewer});
const profile=await req(prof,200);
assert.equal(profile.student.recorded,1);
assert.equal(profile.student.late,1);
assert.equal(profile.student.absent,0);
assert.equal(profile.evidence.length,1);
await exec("UPDATE enrollments SET status='withdrawn'");
await req(att,404,{...attOpts,body:{status:"absent",revision:2}});
await req(ev,404,evOpts);
for(const path of ["/admin","/admin/app.js","/admin/style.css"]){
 const dispatch=async token=>{const headers=token?{"cf-access-jwt-assertion":token}:{};return useD1?await mf.dispatchFetch(origin+path,{headers}):await worker.fetch(new Request(origin+path,{headers}),env)};
 assert.equal((await dispatch(null)).status,401);
 assert.equal((await dispatch(disabled)).status,404);
 const r=await dispatch(teacher);assert.equal(r.status,200);assert.match(r.headers.get("cache-control"),/no-store/);assert(!(await r.text()).includes("Synthetic student"));
}
console.log("PASS: "+n+" private API JSON cases + protected UI assets; "+(useD1?"local D1/workerd":"SQLite adapter"));
}finally{if(mf)await mf.dispose();db.close()}
