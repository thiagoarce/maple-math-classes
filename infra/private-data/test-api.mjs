import assert from "node:assert/strict";
import {DatabaseSync} from "node:sqlite";
import {readFileSync} from "node:fs";
import {generateKeyPair,exportJWK,SignJWT} from "jose";
import worker from "./worker.mjs";
const db=new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys=ON");
for(const name of ["0001_core.sql","0002_result_audit.sql"])db.exec(readFileSync(new URL("./migrations/"+name,import.meta.url),"utf8"));
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
const read="/api/v1/offers/o/lessons?from=2027-01-01&to=2027-01-07",write="/api/v1/offers/o/assessments/a/results/s";
let n=0;
async function req(path,expected,opts={}){
 const headers={};if(opts.token!==null)headers["cf-access-jwt-assertion"]=opts.token??teacher;
 if(opts.method==="PUT"){headers["content-type"]="application/json";headers.origin=opts.origin??origin;headers["x-maple-action"]="grade"}
 const response=await worker.fetch(new Request((opts.host||origin)+path,{method:opts.method||"GET",headers,body:opts.method==="PUT"?JSON.stringify(opts.body??{score:850,revision:1}):undefined}),env);
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
assert.equal(db.prepare("SELECT count(*) AS n FROM result_audit").get().n,0);
assert.equal((await req(write,200,{method:"PUT"})).revision,2);
await req(write,404,{method:"PUT",body:{score:100,revision:1}});
assert.equal(db.prepare("SELECT score FROM results").get().score,850);
assert.deepEqual({...db.prepare("SELECT actor_id,revision FROM result_audit").get()},{actor_id:"t",revision:2});
db.exec("UPDATE assessments SET status='closed'");
await req(write,404,{method:"PUT",body:{score:900,revision:2}});
db.exec("UPDATE assessments SET status='open'; UPDATE enrollments SET status='withdrawn'");
await req(write,404,{method:"PUT",body:{score:900,revision:2}});
assert.equal(db.prepare("SELECT count(*) AS n FROM result_audit").get().n,1);
console.log("PASS: "+n+" private API HTTP cases; audit and optimistic locking (SQLite adapter)");
db.close();
