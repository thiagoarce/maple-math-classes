import {ADMIN_HTML,ADMIN_JS,ADMIN_CSS} from "./admin-assets.mjs";
import {authenticator} from "./auth.mjs";
const READ="SELECT o.id AS scope_id,l.id,l.unit_id,l.title,l.lesson_date,l.starts_at_minute,l.duration_minutes,l.goal,l.status,l.revision\nFROM offers o JOIN offer_staff os ON os.offer_id=o.id\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nLEFT JOIN lessons l ON l.offer_id=o.id AND l.lesson_date BETWEEN ? AND ?\nWHERE o.id=? AND s.identity_issuer=? AND s.identity_subject=?\nORDER BY l.lesson_date,l.starts_at_minute";
const WRITE="UPDATE results SET score=?,status='graded',revision=revision+1,updated_by=(\n SELECT s.id FROM staff s WHERE s.identity_issuer=? AND s.identity_subject=? AND s.active=1\n)\nWHERE offer_id=? AND assessment_id=? AND student_id=? AND revision=? AND ?<=max_score\nAND EXISTS (SELECT 1 FROM offer_staff os JOIN staff s ON s.id=os.staff_id\n WHERE os.offer_id=results.offer_id AND os.role='teacher' AND s.active=1 AND s.identity_issuer=? AND s.identity_subject=?)\nAND EXISTS (SELECT 1 FROM enrollments e WHERE e.offer_id=results.offer_id AND e.student_id=results.student_id AND e.status='active')\nAND EXISTS (SELECT 1 FROM assessments a WHERE a.id=results.assessment_id AND a.offer_id=results.offer_id AND a.status='open') RETURNING revision";
const OFFERS="SELECT o.id,o.label,o.subject_id,o.level_id,os.role FROM offers o JOIN offer_staff os ON os.offer_id=o.id JOIN staff s ON s.id=os.staff_id AND s.active=1 WHERE s.identity_issuer=? AND s.identity_subject=? ORDER BY o.label,o.id";
const RESULTS="SELECT a.id AS assessment_id,a.title,a.status AS assessment_status,r.student_id,st.display_name,r.score,r.max_score,r.status,r.revision,e.status AS enrollment_status FROM assessments a JOIN offer_staff os ON os.offer_id=a.offer_id AND os.role='teacher' JOIN staff s ON s.id=os.staff_id AND s.active=1 LEFT JOIN results r ON r.assessment_id=a.id AND r.offer_id=a.offer_id LEFT JOIN students st ON st.id=r.student_id LEFT JOIN enrollments e ON e.offer_id=r.offer_id AND e.student_id=r.student_id WHERE a.offer_id=? AND a.id=? AND s.identity_issuer=? AND s.identity_subject=? ORDER BY st.display_name,r.student_id";
const ASSESSMENTS="SELECT o.id AS scope_id,a.id,a.title,a.status,a.max_score FROM offers o JOIN offer_staff os ON os.offer_id=o.id AND os.role='teacher' JOIN staff s ON s.id=os.staff_id AND s.active=1 LEFT JOIN assessments a ON a.offer_id=o.id WHERE o.id=? AND s.identity_issuer=? AND s.identity_subject=? ORDER BY a.title,a.id";
const ROSTER="SELECT l.id AS lesson_id,l.title,l.status AS lesson_status,l.revision AS lesson_revision,l.collective_record,l.material_feedback,l.replanning,l.homework_checked,e.student_id,st.display_name,a.status,a.revision,h.status AS homework_status,h.revision AS homework_revision\nFROM lessons l JOIN offer_staff os ON os.offer_id=l.offer_id AND os.role='teacher'\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nLEFT JOIN enrollments e ON e.offer_id=l.offer_id AND e.status='active'\nLEFT JOIN students st ON st.id=e.student_id\nLEFT JOIN attendance a ON a.lesson_id=l.id AND a.offer_id=l.offer_id AND a.student_id=e.student_id\nLEFT JOIN homework_checks h ON h.lesson_id=l.id AND h.offer_id=l.offer_id AND h.student_id=e.student_id\nWHERE l.offer_id=? AND l.id=? AND s.identity_issuer=? AND s.identity_subject=?\nORDER BY st.display_name,e.student_id";
const ATTEND="INSERT INTO attendance(lesson_id,offer_id,student_id,status,revision,updated_by)\nSELECT l.id,l.offer_id,e.student_id,?,1,s.id\nFROM lessons l JOIN enrollments e ON e.offer_id=l.offer_id AND e.status='active'\nJOIN offer_staff os ON os.offer_id=l.offer_id AND os.role='teacher'\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE l.offer_id=? AND l.id=? AND e.student_id=? AND l.status='taught'\nAND s.identity_issuer=? AND s.identity_subject=?\nAND (?=0 OR EXISTS (SELECT 1 FROM attendance a WHERE a.lesson_id=l.id AND a.student_id=e.student_id AND a.revision=?))\nON CONFLICT(lesson_id,student_id) DO UPDATE SET status=excluded.status,revision=attendance.revision+1,updated_by=excluded.updated_by\nWHERE attendance.revision=?\nRETURNING revision,status";
const EVIDENCE="INSERT INTO evidence(id,lesson_id,offer_id,student_id,kind,observation,recorded_at,recorded_by)\nSELECT ?,l.id,l.offer_id,e.student_id,?,?,unixepoch(),s.id\nFROM lessons l JOIN enrollments e ON e.offer_id=l.offer_id AND e.status='active'\nJOIN offer_staff os ON os.offer_id=l.offer_id AND os.role='teacher'\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE l.offer_id=? AND l.id=? AND e.student_id=? AND l.status='taught'\nAND s.identity_issuer=? AND s.identity_subject=?\nRETURNING id";
const PROFILE="SELECT e.student_id,st.display_name,\n(SELECT count(*) FROM attendance a JOIN lessons l ON l.id=a.lesson_id AND l.offer_id=a.offer_id WHERE a.offer_id=e.offer_id AND a.student_id=e.student_id AND l.status='taught') AS recorded,\n(SELECT count(*) FROM attendance a JOIN lessons l ON l.id=a.lesson_id AND l.offer_id=a.offer_id WHERE a.offer_id=e.offer_id AND a.student_id=e.student_id AND l.status='taught' AND a.status='present') AS present,\n(SELECT count(*) FROM attendance a JOIN lessons l ON l.id=a.lesson_id AND l.offer_id=a.offer_id WHERE a.offer_id=e.offer_id AND a.student_id=e.student_id AND l.status='taught' AND a.status='absent') AS absent,\n(SELECT count(*) FROM attendance a JOIN lessons l ON l.id=a.lesson_id AND l.offer_id=a.offer_id WHERE a.offer_id=e.offer_id AND a.student_id=e.student_id AND l.status='taught' AND a.status='late') AS late,\n(SELECT count(*) FROM attendance a JOIN lessons l ON l.id=a.lesson_id AND l.offer_id=a.offer_id WHERE a.offer_id=e.offer_id AND a.student_id=e.student_id AND l.status='taught' AND a.status='excused') AS excused\nFROM enrollments e JOIN students st ON st.id=e.student_id\nJOIN offer_staff os ON os.offer_id=e.offer_id AND os.role='teacher' JOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE e.offer_id=? AND e.student_id=? AND s.identity_issuer=? AND s.identity_subject=?";
const EVIDENCE_LIST="SELECT ev.id,ev.kind,ev.observation,ev.recorded_at,l.lesson_date\nFROM evidence ev JOIN lessons l ON l.id=ev.lesson_id AND l.offer_id=ev.offer_id\nJOIN offer_staff os ON os.offer_id=ev.offer_id AND os.role='teacher'\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE ev.offer_id=? AND ev.student_id=? AND s.identity_issuer=? AND s.identity_subject=?\nORDER BY ev.recorded_at DESC,ev.id LIMIT 50";
const JOURNAL="UPDATE lessons SET status='taught',collective_record=?,material_feedback=?,replanning=?,homework_checked=?,revision=revision+1,\ndiary_updated_by=(SELECT id FROM staff WHERE identity_issuer=? AND identity_subject=? AND active=1)\nWHERE offer_id=? AND id=? AND revision=? AND status IN ('ready','taught')\nAND EXISTS (SELECT 1 FROM offer_staff os JOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE os.offer_id=lessons.offer_id AND os.role='teacher' AND s.identity_issuer=? AND s.identity_subject=?)\nAND (homework_checked=? OR NOT EXISTS(SELECT 1 FROM homework_checks h WHERE h.lesson_id=lessons.id))\nRETURNING revision,status";
const HOMEWORK="INSERT INTO homework_checks(lesson_id,offer_id,student_id,status,revision,updated_by)\nSELECT l.id,l.offer_id,e.student_id,?,1,s.id\nFROM lessons l JOIN enrollments e ON e.offer_id=l.offer_id AND e.status='active'\nJOIN attendance a ON a.lesson_id=l.id AND a.offer_id=l.offer_id AND a.student_id=e.student_id AND a.status IN ('present','late')\nJOIN offer_staff os ON os.offer_id=l.offer_id AND os.role='teacher'\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE l.offer_id=? AND l.id=? AND e.student_id=? AND l.status='taught' AND length(trim(l.homework_checked))>0\nAND s.identity_issuer=? AND s.identity_subject=?\nAND (?=0 OR EXISTS(SELECT 1 FROM homework_checks h WHERE h.lesson_id=l.id AND h.student_id=e.student_id AND h.revision=?))\nON CONFLICT(lesson_id,student_id) DO UPDATE SET status=excluded.status,revision=homework_checks.revision+1,updated_by=excluded.updated_by\nWHERE homework_checks.revision=?\nRETURNING revision,status";
const HOMEWORK_PROFILE="SELECT count(*) AS checked,\nCOALESCE(SUM(CASE h.status WHEN 'complete' THEN 2 WHEN 'half' THEN 1 ELSE 0 END),0) AS earned_half_units,\nCOALESCE(SUM(CASE h.status WHEN 'complete' THEN 1 ELSE 0 END),0) AS complete,\nCOALESCE(SUM(CASE h.status WHEN 'half' THEN 1 ELSE 0 END),0) AS half,\nCOALESCE(SUM(CASE h.status WHEN 'not_done' THEN 1 ELSE 0 END),0) AS not_done\nFROM homework_checks h\nJOIN lessons l ON l.id=h.lesson_id AND l.offer_id=h.offer_id AND l.status='taught'\nJOIN attendance a ON a.lesson_id=h.lesson_id AND a.offer_id=h.offer_id AND a.student_id=h.student_id AND a.status IN ('present','late')\nJOIN offer_staff os ON os.offer_id=h.offer_id AND os.role='teacher' JOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE h.offer_id=? AND h.student_id=? AND s.identity_issuer=? AND s.identity_subject=?";
const REQUEST_CREATE="INSERT INTO material_requests(id,offer_id,student_id,evidence_id,purpose,objective,requested_by)\nSELECT ?,e.offer_id,e.student_id,e.id,?,?,s.id\nFROM evidence e JOIN lessons l ON l.id=e.lesson_id AND l.offer_id=e.offer_id AND l.status='taught'\nJOIN enrollments en ON en.offer_id=e.offer_id AND en.student_id=e.student_id AND en.status='active'\nJOIN offer_staff os ON os.offer_id=e.offer_id AND os.role='teacher'\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE e.offer_id=? AND e.student_id=? AND e.id=? AND s.identity_issuer=? AND s.identity_subject=?\nON CONFLICT(id) DO NOTHING RETURNING id,status,revision";
const REQUEST_LIST="SELECT r.id,r.evidence_id,r.purpose,r.objective,r.status,r.revision,r.created_at,l.unit_id\nFROM material_requests r JOIN evidence ev ON ev.id=r.evidence_id AND ev.offer_id=r.offer_id AND ev.student_id=r.student_id\nJOIN lessons l ON l.id=ev.lesson_id AND l.offer_id=r.offer_id\nJOIN offer_staff os ON os.offer_id=r.offer_id AND os.role='teacher'\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE r.offer_id=? AND r.student_id=? AND s.identity_issuer=? AND s.identity_subject=?\nORDER BY r.created_at DESC,r.id LIMIT 50";
const REQUEST_CONTEXT="SELECT r.id,r.purpose,r.objective,o.subject_id,o.level_id,l.unit_id,ev.kind AS evidence_kind,ev.observation\nFROM material_requests r JOIN offers o ON o.id=r.offer_id\nJOIN evidence ev ON ev.id=r.evidence_id AND ev.offer_id=r.offer_id AND ev.student_id=r.student_id\nJOIN lessons l ON l.id=ev.lesson_id AND l.offer_id=r.offer_id AND l.status='taught'\nJOIN enrollments en ON en.offer_id=r.offer_id AND en.student_id=r.student_id AND en.status='active'\nJOIN offer_staff os ON os.offer_id=r.offer_id AND os.role='teacher'\nJOIN staff s ON s.id=os.staff_id AND s.active=1\nWHERE r.offer_id=? AND r.student_id=? AND r.id=? AND r.status='requested' AND s.identity_issuer=? AND s.identity_subject=?";
const REQUEST_CANCEL="UPDATE material_requests SET status='cancelled',revision=revision+1,cancelled_at=unixepoch(),\ncancelled_by=(SELECT id FROM staff WHERE identity_issuer=? AND identity_subject=? AND active=1)\nWHERE offer_id=? AND student_id=? AND id=? AND revision=? AND status='requested'\nAND EXISTS(SELECT 1 FROM offer_staff os JOIN staff s ON s.id=os.staff_id AND s.active=1 WHERE os.offer_id=material_requests.offer_id AND os.role='teacher' AND s.identity_issuer=? AND s.identity_subject=?)\nRETURNING id,status,revision";
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
  if(request.method==="GET"&&!url.search&&["/admin","/admin/app.js","/admin/style.css"].includes(url.pathname)){
   const allowed=await env.PRIVATE_DB.prepare(OFFERS).bind(who.issuer,who.subject).all();
   if(!allowed.success||!Array.isArray(allowed.results))return reply(503,{error:"unavailable"});
   if(!allowed.results.length)return reply(404,{error:"not_found"});
   const asset=url.pathname==="/admin"?[ADMIN_HTML,"text/html"]:url.pathname.endsWith(".js")?[ADMIN_JS,"text/javascript"]:[ADMIN_CSS,"text/css"];
   return new Response(asset[0],{headers:{...headers,"content-type":asset[1]+"; charset=utf-8","content-security-policy":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
  }
  if(request.method==="GET"&&url.pathname==="/api/v1/offers"&&!url.search){
   const q=await env.PRIVATE_DB.prepare(OFFERS).bind(who.issuer,who.subject).all();
   if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
   return reply(200,{offers:q.results});
  }
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
  if(request.method==="GET"&&parts.length===8&&parts[5]==="lessons"&&id(parts[6])&&parts[7]==="diary"&&!url.search){
   const q=await env.PRIVATE_DB.prepare(ROSTER).bind(offer,parts[6],who.issuer,who.subject).all();
   if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
   if(!q.results.length)return reply(404,{error:"not_found"});
   const l=q.results[0];
   return reply(200,{lesson:{id:l.lesson_id,title:l.title,status:l.lesson_status,revision:l.lesson_revision,collective_record:l.collective_record,material_feedback:l.material_feedback,replanning:l.replanning,homework_checked:l.homework_checked},students:q.results.filter(x=>x.student_id!==null).map(({lesson_id,title,lesson_status,lesson_revision,collective_record,material_feedback,replanning,homework_checked,...x})=>x)});
  }
  if(request.method==="PUT"&&parts.length===8&&parts[5]==="lessons"&&id(parts[6])&&parts[7]==="journal"){
   if(request.headers.get("origin")!==origin||request.headers.get("x-maple-action")!=="journal")return reply(403,{error:"forbidden"});
   if(url.search)return reply(400,{error:"invalid_request"});
   const b=await body(request);
   if(!b||Array.isArray(b)||typeof b!=="object"||Object.keys(b).sort().join(",")!=="collective_record,homework_checked,material_feedback,replanning,revision"||!Number.isSafeInteger(b.revision)||b.revision<1||b.revision>=Number.MAX_SAFE_INTEGER||!["collective_record","material_feedback","replanning","homework_checked"].every(k=>typeof b[k]==="string"&&b[k].length<=(k==="homework_checked"?300:700)))return reply(400,{error:"invalid_request"});
   const q=await env.PRIVATE_DB.prepare(JOURNAL).bind(b.collective_record.trim(),b.material_feedback.trim(),b.replanning.trim(),b.homework_checked.trim(),who.issuer,who.subject,offer,parts[6],b.revision,who.issuer,who.subject,b.homework_checked.trim()).all();
   if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
   if(!q.results.length)return reply(404,{error:"not_found_or_not_editable"});
   if(q.results.length!==1)return reply(503,{error:"unavailable"});
   return reply(200,q.results[0]);
  }
  // Material handoff is only a teacher-scoped private request, not a Drive grant or dispatch.
  if(parts[5]==="students"&&id(parts[6])&&parts[7]==="material-requests"&&[8,9,10].includes(parts.length)&&!url.search){
   const student=parts[6],args=[offer,student,who.issuer,who.subject];
   if(request.method==="GET"&&parts.length===8){
    const p=await env.PRIVATE_DB.prepare(PROFILE).bind(...args).all();
    if(!p.success||!Array.isArray(p.results))return reply(503,{error:"unavailable"});
    if(!p.results.length)return reply(404,{error:"not_found"});
    const q=await env.PRIVATE_DB.prepare(REQUEST_LIST).bind(...args).all();
    if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
    return reply(200,{requests:q.results,limit:50});
   }
   if(request.method==="GET"&&parts.length===10&&id(parts[8])&&parts[9]==="context"){
    const q=await env.PRIVATE_DB.prepare(REQUEST_CONTEXT).bind(offer,student,parts[8],who.issuer,who.subject).all();
    if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
    if(q.results.length!==1)return reply(404,{error:"not_found"});
    return reply(200,{request:q.results[0],notice:"Private context. Review and minimize before sending to an approved agent. Not anonymized. No Drive permission verified."});
   }
   if((request.method==="POST"&&parts.length===8)||(request.method==="PUT"&&parts.length===9&&id(parts[8]))){
    if(request.headers.get("origin")!==origin||request.headers.get("x-maple-action")!=="material-request")return reply(403,{error:"forbidden"});
    const b=await body(request);
    if(!b||Array.isArray(b)||typeof b!=="object")return reply(400,{error:"invalid_request"});
    let q;
    if(request.method==="POST"){
     if(Object.keys(b).sort().join(",")!=="evidence_id,id,objective,purpose"||!id(b.id)||!id(b.evidence_id)||!["recovery","extension","adaptation","feedback"].includes(b.purpose)||typeof b.objective!=="string"||!b.objective.trim()||b.objective.length>300)return reply(400,{error:"invalid_request"});
     q=await env.PRIVATE_DB.prepare(REQUEST_CREATE).bind(b.id,b.purpose,b.objective.trim(),offer,student,b.evidence_id,who.issuer,who.subject).all();
    }else{
     if(Object.keys(b).sort().join(",")!=="revision"||!Number.isSafeInteger(b.revision)||b.revision<1||b.revision>=Number.MAX_SAFE_INTEGER)return reply(400,{error:"invalid_request"});
     q=await env.PRIVATE_DB.prepare(REQUEST_CANCEL).bind(who.issuer,who.subject,offer,student,parts[8],b.revision,who.issuer,who.subject).all();
    }
    if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
    if(q.results.length!==1)return reply(404,{error:"not_found_or_not_editable"});
    return reply(request.method==="POST"?201:200,q.results[0]);
   }
   return reply(404,{error:"not_found"});
  }
  if(request.method==="GET"&&parts.length===8&&parts[5]==="students"&&id(parts[6])&&parts[7]==="profile"&&!url.search){
   const args=[offer,parts[6],who.issuer,who.subject];
   const p=await env.PRIVATE_DB.prepare(PROFILE).bind(...args).all();
   if(!p.success||!Array.isArray(p.results))return reply(503,{error:"unavailable"});
   if(!p.results.length)return reply(404,{error:"not_found"});
   const q=await env.PRIVATE_DB.prepare(EVIDENCE_LIST).bind(...args).all();
   if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
   const h=await env.PRIVATE_DB.prepare(HOMEWORK_PROFILE).bind(...args).all();
   if(!h.success||!Array.isArray(h.results)||h.results.length!==1)return reply(503,{error:"unavailable"});
   return reply(200,{student:p.results[0],evidence:q.results,homework:h.results[0],limit:50});
  }
  if(parts.length===9&&parts[5]==="lessons"&&id(parts[6])&&id(parts[8])&&["attendance","evidence","homework"].includes(parts[7])){
   const action=parts[7];
   if((["attendance","homework"].includes(action)&&request.method!=="PUT")||(action==="evidence"&&request.method!=="POST"))return reply(404,{error:"not_found"});
   if(request.headers.get("origin")!==origin||request.headers.get("x-maple-action")!==action)return reply(403,{error:"forbidden"});
   if(url.search)return reply(400,{error:"invalid_request"});
   const b=await body(request);
   if(!b||Array.isArray(b)||typeof b!=="object")return reply(400,{error:"invalid_request"});
   let q;
   if(action==="attendance"){
    if(Object.keys(b).sort().join(",")!=="revision,status"||!["present","absent","late","excused"].includes(b.status)||!Number.isSafeInteger(b.revision)||b.revision<0||b.revision>=Number.MAX_SAFE_INTEGER)return reply(400,{error:"invalid_request"});
    q=await env.PRIVATE_DB.prepare(ATTEND).bind(b.status,offer,parts[6],parts[8],who.issuer,who.subject,b.revision,b.revision,b.revision).all();
   }else if(action==="homework"){
    if(Object.keys(b).sort().join(",")!=="revision,status"||!["complete","half","not_done"].includes(b.status)||!Number.isSafeInteger(b.revision)||b.revision<0||b.revision>=Number.MAX_SAFE_INTEGER)return reply(400,{error:"invalid_request"});
    q=await env.PRIVATE_DB.prepare(HOMEWORK).bind(b.status,offer,parts[6],parts[8],who.issuer,who.subject,b.revision,b.revision,b.revision).all();
   }else{
    if(Object.keys(b).sort().join(",")!=="kind,observation"||!["solution","explanation","transfer","revision","artifact"].includes(b.kind)||typeof b.observation!=="string"||!b.observation.trim()||b.observation.length>500)return reply(400,{error:"invalid_request"});
    q=await env.PRIVATE_DB.prepare(EVIDENCE).bind(crypto.randomUUID(),b.kind,b.observation.trim(),offer,parts[6],parts[8],who.issuer,who.subject).all();
   }
   if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
   if(!q.results.length)return reply(404,{error:"not_found_or_not_editable"});
   if(q.results.length!==1)return reply(503,{error:"unavailable"});
   return reply(action==="evidence"?201:200,q.results[0]);
  }
  if(request.method==="GET"&&parts.length===6&&parts[5]==="assessments"&&!url.search){
   const q=await env.PRIVATE_DB.prepare(ASSESSMENTS).bind(offer,who.issuer,who.subject).all();
   if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
   if(!q.results.length)return reply(404,{error:"not_found"});
   return reply(200,{assessments:q.results.filter(x=>x.id!==null).map(({scope_id,...x})=>x)});
  }
  if(request.method==="GET"&&parts.length===8&&parts[5]==="assessments"&&id(parts[6])&&parts[7]==="results"&&!url.search){
   const q=await env.PRIVATE_DB.prepare(RESULTS).bind(offer,parts[6],who.issuer,who.subject).all();
   if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
   if(!q.results.length)return reply(404,{error:"not_found"});
   return reply(200,{assessment:{id:q.results[0].assessment_id,title:q.results[0].title,status:q.results[0].assessment_status},results:q.results.filter(x=>x.student_id!==null).map(({assessment_id,title,assessment_status,...x})=>x)});
  }
  if(request.method==="PUT"&&parts.length===9&&parts[5]==="assessments"&&id(parts[6])&&parts[7]==="results"&&id(parts[8])){
   if(request.headers.get("origin")!==origin||request.headers.get("x-maple-action")!=="grade")return reply(403,{error:"forbidden"});
   if(url.search)return reply(400,{error:"invalid_request"});
   const b=await body(request);
   if(!b||Array.isArray(b)||typeof b!=="object"||Object.keys(b).sort().join(",")!=="revision,score"||!Number.isSafeInteger(b.score)||b.score<0||!Number.isSafeInteger(b.revision)||b.revision<1||b.revision>=Number.MAX_SAFE_INTEGER)return reply(400,{error:"invalid_request"});
   const q=await env.PRIVATE_DB.prepare(WRITE).bind(b.score,who.issuer,who.subject,offer,parts[6],parts[8],b.revision,b.score,who.issuer,who.subject).all();
   if(!q.success||!Array.isArray(q.results))return reply(503,{error:"unavailable"});
   if(!q.results.length)return reply(404,{error:"not_found_or_not_editable"});
   if(q.results.length!==1||q.results[0].revision!==b.revision+1)return reply(503,{error:"unavailable"});
   return reply(200,{revision:q.results[0].revision});
  }
  return reply(404,{error:"not_found"});
 }catch{return reply(503,{error:"unavailable"})}
}};
