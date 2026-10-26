// REIGN — Phase 1. Données 100 % locales (IndexedDB), aucun serveur.
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const idb=new Promise((ok,ko)=>{const r=indexedDB.open('reign',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=ko});
const dbGet=async k=>{const d=await idb;return new Promise(ok=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>ok(q.result)})};
const dbSet=async(k,v)=>{const d=await idb;return new Promise(ok=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=ok})};
let S,tab='today',tm,rk,ri;
// --- Dates : fuseau Paris, le « jour » bascule à S.set.roll heures
const ymd=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris'}).format(d);
const today=()=>ymd(new Date(Date.now()-(S?S.set.roll:4)*36e5));
const addDays=(s,n)=>new Date(new Date(s+'T12:00:00Z').getTime()+n*864e5).toISOString().slice(0,10);
const diff=(a,b)=>Math.round((new Date(b+'T12:00:00Z')-new Date(a+'T12:00:00Z'))/864e5);
const wk=s=>addDays(s,-((new Date(s+'T12:00:00Z').getUTCDay()+6)%7));
const hm=()=>new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'}).format(new Date());
const mins=t=>{const[a,b]=t.split(':');return+a*60+ +b};
// --- État
const def=()=>({v:1,created:today(),logs:{},set:{roll:4,wake:'07:00',cut:'22:30',theme:'dark',backup:Date.now(),onb:0},habits:[
{id:'eau',name:'Boire un grand verre d\'eau',who:'Quelqu\'un qui prend soin de son corps',trg:'Au réveil, pieds par terre',full:'1 verre + air frais',min:'1 gorgée',slot:'m',ess:1},
{id:'move',name:'Mouvement 5 min',who:'Un homme fort et énergique',trg:'Juste après le verre d\'eau',full:'5 min d\'exercices',min:'1 pompe',slot:'m',ess:1},
{id:'rev',name:'Revue du soir',who:'Quelqu\'un qui apprend de chaque journée',trg:'Quand je pose mon téléphone',full:'3 questions',min:'1 phrase',slot:'s',ess:1}]});
const save=()=>dbSet('state',S);
const L=d=>S.logs[d]||(S.logs[d]={h:{},b:[{t:'',d:0},{t:'',d:0},{t:'',d:0}]});
const lvl=(d,id)=>S.logs[d]?.h[id]||0;
const any=d=>Object.values(S.logs[d]?.h||{}).some(Boolean);
const canAdd=()=>S.habits.length<3||diff(S.created,today())>=7;
// Série avec jour de grâce : 1 raté par semaine (lun-dim) ne casse pas la série
function streak(h){let cur=0,best=0,used=new Set(),t=today();for(let d=h.since||S.created;d<=t;d=addDays(d,1)){if(lvl(d,h.id))cur++;else if(d===t)continue;else{const w=wk(d);if(!used.has(w))used.add(w);else cur=0}best=Math.max(best,cur)}return{cur,best}}
const Q=['Je suis quelqu\'un qui tient ses promesses envers lui-même.','Un raté est un accident. Deux, c\'est le début d\'une habitude.','Je fais ce qui dépend de moi. Le reste, je le laisse.','Pas besoin d\'envie : juste commencer.','Chaque jour, je vote pour l\'homme que je deviens.','Version minimum, mais jamais zéro.'];
// --- Routines
const R={m:[['Un grand verre d\'eau',0],['Lumière du jour / air frais',120],['Mouvement',300],['Douche',300],['Relire mes objectifs',60],['Définir mon Big 3',60]],s:[['Sas de décompression : écrans coupés',300],['Revue du soir','r'],['Préparer demain : tenue, sac',180],['Coucher',0]]};
function run(k){rk=k;ri=0;const l=L(today());if(k==='m'&&!l.wake){l.wake=hm();save()}show()}
function show(){clearInterval(tm);const st=R[rk][ri],o=$('#ov');o.hidden=false;
 if(st[1]==='r'){o.style.justifyContent='flex-start';o.innerHTML=`<h1>Revue du soir</h1>${revForm()}<button class="b p" data-a=rev>Valider et continuer</button>`;return}
 o.style.justifyContent='center';let s=st[1];
 o.innerHTML=`<p class=mu>Étape ${ri+1}/${R[rk].length}</p><h1>${esc(st[0])}</h1>${s?'<div class=big id=cd></div>':''}<button class="b p" data-a=next>${ri==R[rk].length-1?'Terminer':'Suivant'}</button><button class=b data-a=quit>Quitter</button>`;
 if(s){const tick=()=>{$('#cd').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');if(s--<=0){clearInterval(tm);navigator.vibrate?.([200,100,200])}};tick();tm=setInterval(tick,1000)}}
function step(){ri++;if(ri>=R[rk].length){const l=L(today());if(rk==='s'&&!l.bed)l.bed=hm();save();close()}else show()}
function close(){clearInterval(tm);const o=$('#ov');o.hidden=true;o.innerHTML='';render()}
const revForm=()=>{const r=S.logs[today()]?.rev||['','',''];return['Ce qui a marché aujourd\'hui','Ce que je fais mieux demain','Gratitude : une chose dont je suis reconnaissant'].map((q,i)=>`<p class=mu style="text-align:left;margin:6px 0 2px">${q}</p><textarea id=r${i} rows=2>${esc(r[i])}</textarea>`).join('')};
async function saveRev(){const c=$('#ov').hidden?$('main'):$('#ov'),l=L(today());l.rev=[0,1,2].map(i=>c.querySelector('#r'+i).value.trim());const n=l.rev.filter(Boolean).length;if(S.habits.some(h=>h.id==='rev'))l.h.rev=n==3?2:n?1:0;await save();if(!$('#ov').hidden)step();else render()}
// --- Sauvegarde
async function exportData(){S.set.backup=Date.now();await save();const n=`reign-${today()}.json`,f=new File([JSON.stringify(S)],n,{type:'application/json'});if(navigator.canShare?.({files:[f]})){try{await navigator.share({files:[f]})}catch{}}else{const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=n;a.click()}render()}
async function imp(f){if(!f)return;try{const d=JSON.parse(await f.text());if(!Array.isArray(d.habits)||!d.logs)throw 0;if(!confirm('Remplacer toutes tes données par cette sauvegarde ?'))return;S=d;await save();render()}catch{alert('Fichier invalide : choisis une sauvegarde REIGN (.json).')}}
async function addHabit(){const v=i=>$('#'+i).value.trim();if(!v('n')||!v('m'))return alert('Il faut au moins un nom et une version minimum.');if(!canAdd())return;S.habits.push({id:'h'+Date.now(),name:v('n'),who:v('w'),trg:v('tr'),full:v('f')||v('n'),min:v('m'),slot:$('#sl').value,ess:+$('#es').value,since:today()});await save();render()}
// --- Vues
const row=(h,t)=>{const v=lvl(t,h.id);return`<div class="card row"><button class="ck ${v==2?'f':v==1?'m':''}" data-a=t data-i="${h.id}" data-l=2 aria-label="Complet">${v?'✓':''}</button><div class=grow><b>${esc(h.name)}</b><div class=mu>${esc(h.full)} · min : ${esc(h.min)}</div></div><button class=b data-a=t data-i="${h.id}" data-l=1>min</button></div>`};
const V={
today(){const t=today(),l=L(t),hs=S.habits.filter(h=>!l.hard||h.ess),sc=hs.length?Math.round(hs.reduce((a,h)=>a+(lvl(t,h.id)==2?1:lvl(t,h.id)==1?.7:0),0)/hs.length*100):0;
 const back=diff(S.created,t)>0&&!any(addDays(t,-1))&&!any(t),old=Date.now()-S.set.backup>6048e5;
 const g=(k,n)=>{const a=hs.filter(h=>h.slot===k);return a.length?`<h2>${n}</h2>`+a.map(h=>row(h,t)).join(''):''};
 return`<p class=mu>${esc(Q[Math.abs(diff('2026-01-01',t))%Q.length])}</p><div class=row><div class=score>${sc}%</div><div class=grow><b>Score du jour</b><div class=mu>${l.hard?'Mode allégé : l\'essentiel seulement':'Complet = 100 % · Min = 70 %'}</div></div></div>
 ${back?'<div class=card>Un raté ne définit rien. Reprends maintenant, version minimum.</div>':''}${old?'<div class=card>Pas de sauvegarde depuis 7 jours : exporte-la dans Moi.</div>':''}
 <h2>Big 3</h2>${l.b.map((b,i)=>`<div class=row><button class="ck ${b.d?'f':''}" data-a=big data-i=${i}>${b.d?'✓':''}</button><input value="${esc(b.t)}" placeholder="Priorité ${i+1}" data-big=${i}></div>`).join('')}
 ${g('m','Matin')}${g('d','Journée')}${g('s','Soir')}
 <h2>Routines</h2><div class=row><button class="b grow" data-a=run data-i=m>Matin</button><button class="b grow" data-a=run data-i=s>Soir</button></div>
 <br><button class="b ${l.hard?'p':''}" style="width:100%" data-a=hard>${l.hard?'Reprendre le mode complet':'Jour difficile'}</button>`},
hab(){const t=today();return'<h1>Habitudes</h1>'+S.habits.map(h=>{const s=streak(h),n=Math.min(30,diff(h.since||S.created,t)+1);let d=0,dots='';for(let i=27;i>=0;i--){const v=lvl(addDays(t,-i),h.id);dots+=`<i class="${v==2?'f':v==1?'m':''}"></i>`}for(let i=0;i<n;i++)if(lvl(addDays(t,-i),h.id))d++;
 return`<div class=card><div class=row><b class=grow>${esc(h.name)}</b><span>🔥 ${s.cur}</span><span class=mu>max ${s.best}</span></div><div class=mu>${esc(h.who)}<br>${esc(h.trg)}</div><div class=dots>${dots}</div><div class=row><span class="mu grow">Régularité : ${Math.round(d/n*100)} %</span><button class=b data-a=del data-i="${h.id}">Supprimer</button></div></div>`}).join('')+'<h2>Nouvelle habitude</h2>'+(canAdd()?`<div class=card><input id=n placeholder="Nom"><input id=w placeholder="Identité : je suis quelqu'un qui…"><input id=tr placeholder="Déclencheur : quand… je…"><input id=f placeholder="Version complète"><input id=m placeholder="Version minimum (2 min max)"><select id=sl><option value=m>Matin</option><option value=d>Journée</option><option value=s>Soir</option></select><select id=es><option value=0>Normale</option><option value=1>Essentielle (jour difficile)</option></select><button class="b p" data-a=add>Ajouter</button></div>`:`<div class="card mu">Nouvelles habitudes dans ${7-diff(S.created,t)} jour(s) : maîtrise d'abord les 3 premières.</div>`)},
me(){const t=today(),l=S.logs[t]||{},c=S.set,pts=[];for(let i=29;i>=0;i--){const w=S.logs[addDays(t,-i)]?.wake;if(w)pts.push([29-i,mins(w)])}
 let g='<p class=mu>Pas assez de données : lance ta routine du matin.</p>';
 if(pts.length>1){const tg=mins(c.wake),v=pts.map(p=>p[1]),lo=Math.min(tg,...v)-10,hi=Math.max(tg,...v)+10,y=m=>75-(m-lo)/(hi-lo)*70;g=`<svg viewBox="0 0 290 80" width=100%><line x1=0 x2=290 y1=${y(tg)} y2=${y(tg)} stroke="#e8a93a" stroke-dasharray="4"/><polyline fill=none stroke="#5fbf7a" stroke-width=2 points="${pts.map(p=>p[0]*10+','+y(p[1])).join(' ')}"/></svg><div class=mu>Réveil sur 30 jours (pointillés = cible)</div>`}
 const sel=(k,o)=>`<select data-s=${k}>${o.map(([v,n])=>`<option value="${v}" ${v==c[k]?'selected':''}>${n}</option>`).join('')}</select>`;
 return`<h1>Moi</h1><h2>Revue du soir</h2><div class=card>${revForm()}<button class="b p" data-a=rev>Enregistrer</button></div>
 <h2>Réveil et coucher</h2><div class=card><div class=row><div class=grow><span class=mu>Réveil (cible ${c.wake})</span><input type=time data-t=wake value="${l.wake||''}"></div><div class=grow><span class=mu>Coucher (cible ${c.cut})</span><input type=time data-t=bed value="${l.bed||''}"></div></div>${g}</div>
 <h2>Réglages</h2><div class=card><span class=mu>Réveil cible</span><input type=time data-s=wake value="${c.wake}"><span class=mu>Coupe-écrans</span><input type=time data-s=cut value="${c.cut}"><span class=mu>Le jour change à (heure)</span>${sel('roll',[0,1,2,3,4,5,6].map(h=>[h,h+' h']))}<span class=mu>Thème</span>${sel('theme',[['dark','Sombre'],['light','Clair']])}</div>
 <h2>Sauvegarde</h2><div class=card><p class=mu>iOS peut effacer les données d'une appli web : exporte chaque dimanche.</p><div class=row><button class="b p grow" data-a=exp>Exporter</button><button class="b grow" data-a=imp>Importer</button></div></div><input type=file id=file accept=".json" hidden>`},
focus:()=>'<h1>Focus</h1><div class=lock>🔒 Phase 2<br>Mode Deep Work</div>',
goals:()=>'<h1>Objectifs</h1><div class=lock>🔒 Phase 2<br>Piliers et objectifs à 6 mois</div>'};
const T=[['today','☀️','Aujourd\'hui'],['focus','🎯','Focus'],['hab','🔁','Habitudes'],['goals','🏔️','Objectifs'],['me','👤','Moi']];
function render(){document.documentElement.dataset.theme=S.set.theme;$('#nav').innerHTML=T.map(([k,i,n])=>`<button class="${k==tab?'on':''}" data-a=tab data-i=${k}><b>${i}</b>${n}</button>`).join('');$('#v').innerHTML=V[tab]()}
function onb(){const o=$('#ov');o.hidden=false;o.style.justifyContent='center';o.innerHTML='<h1>REIGN</h1><p>On démarre petit : 3 habitudes la première semaine. Le reste se débloque ensuite.</p><span class=mu>Réveil cible</span><input type=time id=ow value=07:00><span class=mu>Coupe-écrans</span><input type=time id=oc value=22:30><button class="b p" data-a=go>Commencer</button>'}
// --- Événements
document.addEventListener('click',async e=>{const x=e.target.closest('[data-a]');if(!x)return;const a=x.dataset.a,i=x.dataset.i,t=today();
 if(a==='tab'){tab=i;render()}
 else if(a==='t'){const h=L(t).h,n=+x.dataset.l;h[i]=h[i]===n?0:n;navigator.vibrate?.(15);await save();render()}
 else if(a==='big'){const b=L(t).b[i];b.d=b.d?0:1;navigator.vibrate?.(15);await save();render()}
 else if(a==='hard'){const l=L(t);l.hard=!l.hard;await save();render()}
 else if(a==='run')run(i);else if(a==='next')step();else if(a==='quit')close();
 else if(a==='add')addHabit();
 else if(a==='del'){if(confirm('Supprimer cette habitude ?')){S.habits=S.habits.filter(h=>h.id!==i);await save();render()}}
 else if(a==='rev')saveRev();else if(a==='exp')exportData();else if(a==='imp')$('#file').click();
 else if(a==='go'){S.set.wake=$('#ow').value||'07:00';S.set.cut=$('#oc').value||'22:30';S.set.onb=1;await save();close()}});
document.addEventListener('change',async e=>{const x=e.target,t=today();
 if(x.id==='file'){imp(x.files[0]);return}
 if(x.dataset.big!==undefined)L(t).b[x.dataset.big].t=x.value;
 else if(x.dataset.s){S.set[x.dataset.s]=x.dataset.s==='roll'?+x.value:x.value;if(x.dataset.s==='theme')render()}
 else if(x.dataset.t)L(t)[x.dataset.t]=x.value;
 await save()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S&&$('#ov').hidden&&!document.activeElement?.matches('input,textarea'))render()});
(async()=>{S=(await dbGet('state'))||def();await save();render();if(!S.set.onb)onb();navigator.storage?.persist?.();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js')})();
