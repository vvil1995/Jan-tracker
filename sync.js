(()=>{
const URL='https://ziwvpewawnabgovkaehz.supabase.co', KEY='sb_publishable_ItqHJZqPT_iFagQZkJiVSA_ADxW8-f7';
const client=window.supabase?.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
if(!client){alert('No s’ha pogut carregar la connexió amb Supabase.');return}
let ready=false,busy=false,queued=false,known=new Set(),lastSnapshot='',suppress=false;
const status=document.createElement('div');status.style.cssText='font-size:12px;text-align:center;padding:8px;color:#4269e8';status.textContent='☁️ Connectant…';document.querySelector('header').after(status);
const overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;background:#f5f7fb;z-index:9999;display:none;align-items:center;justify-content:center;padding:20px';
overlay.innerHTML='<div class="card" style="width:min(420px,100%)"><h2>👶 Jan Tracker</h2><p>Inicia la sessió una vegada per compartir els registres entre els dos mòbils.</p><form id="janLogin"><label>Correu electrònic</label><input id="janEmail" type="email" autocomplete="username" required><label>Contrasenya</label><input id="janPass" type="password" autocomplete="current-password" required><p><button class="primary" type="submit" style="width:100%">Entrar</button></p><small id="janLoginError"></small></form></div>';document.body.append(overlay);
document.getElementById('janLogin').addEventListener('submit',async e=>{e.preventDefault();let email=document.getElementById('janEmail').value,password=document.getElementById('janPass').value;const {error}=await client.auth.signInWithPassword({email,password});document.getElementById('janLoginError').textContent=error?error.message:'';if(!error)await initialize()});
const originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){originalSet.call(this,k,v);if(this===localStorage&&k==='jan-tracker-v1'&&!suppress&&ready)queue()};
function snapshot(){return JSON.stringify({records:state.records,sleep:state.sleep,breast:state.breast})}
function queue(){queued=true;setTimeout(push,250)}
async function push(){if(!ready||busy||!queued)return;busy=true;queued=false;status.textContent='☁️ Desant…';try{
 const records=state.records||[],ids=new Set(records.map(r=>r.id)),removed=[...known].filter(id=>!ids.has(id));
 if(removed.length){let {error}=await client.from('jan_records').delete().in('id',removed);if(error)throw error}
 if(records.length){let {error}=await client.from('jan_records').upsert(records.map(r=>({id:r.id,type:r.type,data:r,updated_at:new Date().toISOString()})));if(error)throw error}
 for(let type of ['sleep','breast']){let value=state[type];if(value){let {error}=await client.from('jan_active').upsert({type,data:value,updated_at:new Date().toISOString()});if(error)throw error}else{let {error}=await client.from('jan_active').delete().eq('type',type);if(error)throw error}}
 known=ids;lastSnapshot=snapshot();status.textContent='☁️ Sincronitzat';
 }catch(e){status.textContent='⚠️ Sincronització pendent · '+(e?.message||'Error desconegut')+(e?.code?' ('+e.code+')':'');queued=true;console.error('Jan Tracker sync push:',e)}finally{busy=false}}
async function pull(){if(!ready||busy||queued)return;busy=true;try{const [r,a]=await Promise.all([client.from('jan_records').select('id,data'),client.from('jan_active').select('type,data')]);if(r.error||a.error)throw(r.error||a.error);let records=r.data.map(x=>x.data),sleep=a.data.find(x=>x.type==='sleep')?.data||null,breast=a.data.find(x=>x.type==='breast')?.data||null;let next=JSON.stringify({records,sleep,breast});if(next!==lastSnapshot){state.records=records;state.sleep=sleep;state.breast=breast;known=new Set(records.map(x=>x.id));lastSnapshot=next;suppress=true;originalSet.call(localStorage,'jan-tracker-v1',JSON.stringify(state));suppress=false;render()}status.textContent='☁️ Sincronitzat'}catch(e){status.textContent='⚠️ Error en llegir dades · '+(e?.message||'Error desconegut');console.error('Jan Tracker sync pull:',e)}finally{busy=false}}
async function initialize(){ready=false;const {data:{session}}=await client.auth.getSession();if(!session){overlay.style.display='flex';status.textContent='🔒 Inicia sessió';return}overlay.style.display='none';status.textContent='☁️ Carregant dades…';try{
 const [r,a]=await Promise.all([client.from('jan_records').select('id,data'),client.from('jan_active').select('type,data')]);if(r.error||a.error)throw(r.error||a.error);
 const remote=r.data.map(x=>x.data),local=state.records||[];known=new Set(remote.map(x=>x.id));
 state.records=[...remote,...local.filter(x=>!known.has(x.id))];state.sleep=a.data.find(x=>x.type==='sleep')?.data||state.sleep||null;state.breast=a.data.find(x=>x.type==='breast')?.data||state.breast||null;
 suppress=true;originalSet.call(localStorage,'jan-tracker-v1',JSON.stringify(state));suppress=false;render();ready=true;lastSnapshot=snapshot();
 if(local.some(x=>!known.has(x.id))||((state.sleep||state.breast)&&a.data.length===0))queue();else status.textContent='☁️ Sincronitzat';
 }catch(e){status.textContent='⚠️ No s’ha pogut connectar: '+e.message;overlay.style.display='flex';document.getElementById('janLoginError').textContent=e.message;console.error(e)}}
client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){ready=false;overlay.style.display='flex'}});
initialize();setInterval(()=>{if(queued)push();else pull()},5000);
})();