import {authenticator} from "./auth.mjs";
const READ="SELECT o.id AS scope_id,l.id,l.unit_id,l.title,l.lesson_date,l.starts_at_minute,l.duration_minutes,l.goal,l.status,l.revision\nFROM offers o JOIN offer_staff os ON os.offer_id=o.id\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nLEFT JOIN lessons l ON l.offer_id=o.id AND l.lesson_date BETWEEN ? AND ?\nWHERE o.id=? AND s.identity_issuer=? AND s.identity_subject=?\nORDER BY l.lesson_date,l.starts_at_minute";
const WRITE="UPDATE results SET score=?,status='graded',revision=revision+1,updated_by=(\n SELECT s.id FROM staff s WHERE s.identity_issuer=? AND s.identity_subject=? AND s.active=1\n)\nWHERE offer_id=? AND assessment_id=? AND student_id=? AND revision=? AND ?<=max_score\nAND EXISTS (SELECT 1 FROM offer_staff os JOIN staff s ON s.id=os.staff_id\n WHERE os.offer_id=results.offer_id AND os.role='teacher' AND s.active=1 AND s.identity_issuer=? AND s.identity_subject=?)\nAND EXISTS (SELECT 1 FROM enrollments e WHERE e.offer_id=results.offer_id AND e.student_id=results.student_id AND e.status='active')\nAND EXISTS (SELECT 1 FROM assessments a WHERE a.id=results.assessment_id AND a.offer_id=results.offer_id AND a.status='open')";
const headers={"content-type":"application/json; charset=utf-8","cache-control":"private, no-store, max-age=0","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-security-policy":"default-src 'none'; frame-ancestors 'none'"};
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
const id=s=>typeof s==="string"&&/^[a-zA-Z0-9_-]{1,80}$/.test(s);
const date=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+"T00:00:00Z"))&&new Date(s+"T00:00:00Z").toISOString().slice(0,10)===s;
async function body(request){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type")||"")||!request.body)return null;
 const reader=request.body.getReader(),parts=[];let length=0;
 try{while(true){const r=await reader.read();if(r.done)break;length+=r.value.byteLength;if(length>4096){await reader.cancel();return null}parts.push(r.value)}
 const bytes=new Uint8Array(length);let p=0;for(const a of parts){bytes.set(a,p);p+=a.byteLength}
 return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
 }catch{return null}finally{reader.releaseLock()}
}
export default {async fetch(request,env){
 try{
  const origin=env.PRIVATE_ORIGIN;
  if(typeof origin!=="string"||!origin.startsWith("https://")||new URL(origin).origin!==origin||!env.PRIVATE_DB)return reply(503,{error:"unavailable"});
  const url=new URL(request.url);
  if(url.origin!==origin)return reply(404,{error:"not_found"});
  const who=await authenticator(env)(request);
  if(!who)return reply(401,{error:"unauthenticated"});
  const parts=url.pathname.split("/");
  if(parts[1]!=="api"||parts[2]!=="v1"||parts[3]!=="offers"||!id(parts[4]))return reply(404,{error:"not_found"});
  const offer=parts[4];
  if(request.method==="GET"&&parts.length===6&&parts[5]==="lessons"){
   const from=url.searchParams.get("from"),to=url.searchParams.get("to");
   if([...url.searchParams.keys()].some(k=>!["from","to"].includes(k))||url.searchParams.getAll("from").length!==1||url.searchParams.getAll("to").length!==1||!date(from)||!date(to)||from>to||Date.parse(to)-Date.parse(from)>31*86400000)return reply(400,{error:"invalid_range"});
   const q=await env.PRIVATE_DB.prepare(READ).bind(from,to,offer,who.issuer,who.subject).all();
   if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
   if(!q.results.length)return reply(404,{error:"not_found"});
   return reply(200,{lessons:q.results.filter(x=>x.id!==null).map(({scope_id,...x})=>x)});
  }
  if(request.method==="PUT"&&parts.length===9&&parts[5]==="assessments"&&id(parts[6])&&parts[7]==="results"&&id(parts[8])){
   if(request.headers.get("origin")!==origin||request.headers.get("x-maple-action")!=="grade")return reply(403,{error:"forbidden"});
   if(url.search)return reply(400,{error:"invalid_request"});
   const b=await body(request);
   if(!b||Array.isArray(b)||typeof b!=="object"||Object.keys(b).sort().join(",")!=="revision,score"||!Number.isSafeInteger(b.score)||b.score<0||!Number.isSafeInteger(b.revision)||b.revision<1||b.revision>=Number.MAX_SAFE_INTEGER)return reply(400,{error:"invalid_request"});
   const q=await env.PRIVATE_DB.prepare(WRITE).bind(b.score,who.issuer,who.subject,offer,parts[6],parts[8],b.revision,b.score,who.issuer,who.subject).run();
   if(!q.success)return reply(503,{error:"unavailable"});
   if(q.meta?.changes!==1)return reply(404,{error:"not_found_or_not_editable"});
   return reply(200,{revision:b.revision+1});
  }
  return reply(404,{error:"not_found"});
 }catch{return reply(503,{error:"unavailable"})}
}};
