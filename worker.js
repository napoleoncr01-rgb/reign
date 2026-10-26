// REIGN push — Cloudflare Worker (gratuit). Envoie un « réveil » Web Push à l'heure des rappels.
// Variables : VAPID_PUBLIC, VAPID_PRIVATE (secret), TOKEN (secret), SUBJECT (ex. mailto:toi@mail.com). KV : binding « KV ».
const b64u=b=>btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const ub64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const enc=s=>new TextEncoder().encode(s);
async function jwt(env,aud){
 const pub=ub64(env.VAPID_PUBLIC),jwk={kty:'EC',crv:'P-256',x:b64u(pub.slice(1,33)),y:b64u(pub.slice(33,65)),d:env.VAPID_PRIVATE};
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const h=b64u(enc(JSON.stringify({typ:'JWT',alg:'ES256'}))),p=b64u(enc(JSON.stringify({aud,exp:Math.floor(Date.now()/1e3)+43200,sub:env.SUBJECT||'mailto:reign@example.com'})));
 return h+'.'+p+'.'+b64u(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,enc(h+'.'+p)))}
async function push(env,sub){const r=await fetch(sub.endpoint,{method:'POST',headers:{TTL:'3600',Urgency:'high',Authorization:'vapid t='+await jwt(env,new URL(sub.endpoint).origin)+', k='+env.VAPID_PUBLIC}});return r.status}
export default{
async fetch(req,env){const u=new URL(req.url),cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization,Content-Type'};
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(u.pathname==='/keys'&&!env.VAPID_PRIVATE){const kp=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign']),j=await crypto.subtle.exportKey('jwk',kp.privateKey);
  return new Response(JSON.stringify({VAPID_PUBLIC:b64u(new Uint8Array([4,...ub64(j.x),...ub64(j.y)])),VAPID_PRIVATE:j.d,TOKEN:crypto.randomUUID()},null,1))}
 if(!env.TOKEN||req.headers.get('Authorization')!=='Bearer '+env.TOKEN)return new Response('non autorisé',{status:401,headers:cors});
 if(u.pathname==='/subscribe'&&req.method==='POST'){await env.KV.put('me',await req.text());return new Response('ok',{headers:cors})}
 if(u.pathname==='/test'){const raw=await env.KV.get('me');if(!raw)return new Response('aucun abonnement',{status:404,headers:cors});return new Response(String(await push(env,JSON.parse(raw).sub)),{headers:cors})}
 return new Response('REIGN push',{headers:cors})},
async scheduled(ev,env){const raw=await env.KV.get('me');if(!raw)return;const d=JSON.parse(raw),now=new Date(),
 t=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'}).format(now),day=new Date(now.toLocaleString('en-US',{timeZone:'Europe/Paris'})).getDay();
 if(d.list.some(r=>r.on&&r.t===t&&(r.d==null||r.d===day))){const s=await push(env,d.sub);if(s===404||s===410)await env.KV.delete('me')}}}
