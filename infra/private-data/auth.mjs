import {createLocalJWKSet,jwtVerify} from "jose";
export function authenticator(env) {
 const issuer=env.ACCESS_ISSUER, audience=env.ACCESS_AUDIENCE;
 if(typeof issuer!=="string"||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)||typeof audience!=="string"||!audience.trim())throw Error("auth config");
 const jwks=JSON.parse(env.ACCESS_JWKS_JSON||"null");
 if(!jwks||!Array.isArray(jwks.keys)||!jwks.keys.length||jwks.keys.some(k=>k.kty!=="RSA"||typeof k.kid!=="string"||"d" in k))throw Error("auth keys");
 const keys=createLocalJWKSet(jwks);
 return async request=>{
  const token=request.headers.get("cf-access-jwt-assertion");
  if(!token||token.length>16384)return null;
  try{
   const {payload}=await jwtVerify(token,keys,{issuer,audience,algorithms:["RS256"],requiredClaims:["exp","iat","sub"],clockTolerance:5});
   if(typeof payload.sub!=="string"||!payload.sub||payload.sub.length>256||payload.type!=="app")return null;
   return {issuer:payload.iss,subject:payload.sub};
  }catch{return null}
 };
}
