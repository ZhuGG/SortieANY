import {WORLD,STRATA,SPECIES,UPGRADES,MUTATIONS,seededRandom,clamp} from './simulation.mjs';

const $=id=>document.getElementById(id),storageKey='strate.world.v1';
const worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});
const canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false});
const terrainCanvas=document.createElement('canvas'),terrainCtx=terrainCanvas.getContext('2d');terrainCanvas.width=WORLD.width;terrainCanvas.height=WORLD.height;
const mini=$('minimap'),miniCtx=mini.getContext('2d'),history={energy:[],biomass:[],knowledge:[]};
let state=null,terrain=null,fields=null,seed=427,origin={x:126,y:114},camera={x:0,y:0,zoom:1},width=800,height=600,scale=3,view='life',selectedSpecies=0,selectedOwned=true,selectedPoint={...origin},activeTab='upgrades',buyMode=1,paused=false,speed=1,frame=0,lastUi=0,lastMini=0,lastHistory=0,lastStateAt=0,lastSave=null,saving=false,ready=false,initial=true,toastTimer,pointer=null,dragged=false,raf=0;
const pulses=[],sprites=[],sparks=[],geneticChoice={species:0,a:0,b:1};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const nf=new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0});
const fmt=n=>n>=1e9?(n/1e9).toFixed(1).replace('.',',')+' Md':n>=1e6?(n/1e6).toFixed(1).replace('.',',')+' M':n>=10000?(n/1000).toFixed(1).replace('.',',')+' k':nf.format(Math.floor(n||0));
const rate=n=>'+'+(n<10?n.toFixed(1).replace('.',','):fmt(n))+' / s';
const iconForResource=r=>({energy:'ϟ',biomass:'❋',knowledge:'⌘'}[r]);
const safeText=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4200);}
function post(type,data={}){worker.postMessage({type,...data});}
function readSave(){try{const raw=localStorage.getItem(storageKey);return raw?JSON.parse(raw):null;}catch{return null;}}
function storeSave(data){try{localStorage.setItem(storageKey,JSON.stringify(data));lastSave=data;$('save-status').textContent='SAUVEGARDÉ';setTimeout(()=>{$('save-status').textContent='MONDE VIVANT'},1600);return true;}catch{$('save-status').textContent='EXPORT CONSEILLÉ';if(!saving){toast('Sauvegarde locale indisponible ou saturée. Exportez votre monde dans les options.');saving=true;}return false;}}
function exportSave(data){const blob=new Blob([JSON.stringify(data)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='strate-monde-'+data.seed+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Votre monde a été exporté.');}
worker.onmessage=({data:d})=>{
  if(d.type==='ready'){seed=d.seed;terrain=d.terrain;origin=d.origin;selectedPoint={...origin};camera={x:0,y:0,zoom:1};paused=false;speed=1;$('pause-button').textContent='Ⅱ';$('pause-button').classList.remove('active');$('speed-button').textContent='×1';selectedSpecies=0;selectedOwned=true;fields=null;state=null;ready=true;$('seed-label').textContent='MONDE #'+String(seed).padStart(4,'0');$('world-loading').classList.add('hidden');bakeTerrain();resize();if(d.offline>30)toast('Bon retour. '+Math.floor(d.offline/60)+' min de production récupérées.');}
  if(d.type==='snapshot'){state=d;lastStateAt=performance.now();if(initial){initial=false;renderShop(true);renderLineage();}updateUI();}
  if(d.type==='fields')fields=d;
  if(d.type==='impulse'){pulses.push({x:d.x,y:d.y,r:d.radius,t:performance.now()});if(!reducedMotion){const p=worldToScreen(d.x,d.y);floater(p.x,p.y,'+'+fmt(d.energy)+' ϟ',d.affected?d.affected+' cellules stimulées':'Impulsion vitale');}}
  if(d.type==='result'){if(d.message)toast(d.message);if(d.ok){renderShop(true);renderLineage();}}
  if(d.type==='environment')renderEnvironment(d);
  if(d.type==='save'){storeSave(d.data);if(d.exported)exportSave(d.data);}
  if(d.type==='error'){if(d.operation==='init'){toast('Sauvegarde illisible. Exportez-la avant de recréer un monde.');$('world-loading').textContent='Sauvegarde incompatible';$('settings-dialog').showModal();}else toast(d.message);}
};
worker.onerror=()=>{toast('Le moteur n’a pas pu démarrer. Rechargez la page ou vérifiez que les scripts sont autorisés.');$('sim-status').textContent='MOTEUR INTERROMPU';};
post('init',{save:readSave(),seed});

function makeSprite(s,own=false){
  const out=document.createElement('canvas');out.width=12;out.height=12;const c=out.getContext('2d'),sp=SPECIES[s];
  c.fillStyle=sp.dark;const patterns=[[[4,2,4,1],[2,4,1,4],[9,4,1,4],[4,9,4,1],[3,3,6,6]],[[3,3,6,5],[2,4,1,3],[8,2,2,2]],[[4,2,4,2],[2,4,8,4],[4,8,4,2]],[[3,2,2,2],[7,2,2,2],[2,4,8,4],[4,8,4,2]],[[2,3,4,5],[6,4,4,5]],[[4,1,4,2],[2,3,8,5],[4,8,4,2]],[[3,2,6,2],[2,4,8,4],[4,8,5,2]]][s];
  for(const r of patterns)c.fillRect(...r);c.fillStyle=sp.color;c.fillRect(3,4,6,3);c.fillRect(4,3,4,5);c.fillStyle=sp.light;c.fillRect(4,4,2,1);c.fillRect(3,5,1,1);c.fillStyle=sp.dark;c.fillRect(6,5,2,2);if(s===1){c.fillStyle=sp.color;c.fillRect(9,6,2,1);c.fillRect(10,7,1,3);}if(s===3){c.fillStyle=sp.light;c.fillRect(4,2,1,2);c.fillRect(7,2,1,2);}if(own){c.fillStyle='#f5ead4';c.fillRect(5,0,1,1);c.fillRect(0,5,1,1);}
  return out;
}
for(let s=0;s<7;s++){sprites[s]=[makeSprite(s),makeSprite(s,true)];}
function drawIcon(canvas,s=0,own=false){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;const p=(canvas.width-36)/2;c.drawImage(sprites[s][own?1:0],p,p,36,36);}
function drawUpgradeIcon(c,id){const cx=c.getContext('2d');cx.clearRect(0,0,c.width,c.height);cx.fillStyle='#a483b4';const patterns=[[[13,2,5,8],[9,9,8,6],[12,15,4,9]],[[5,7,5,10],[20,7,5,10],[10,3,10,4],[10,17,10,4],[12,9,6,6]],[[3,9,9,10],[18,9,9,10],[12,12,6,3],[6,6,5,3],[20,6,5,3]],[[5,5,20,3],[22,8,3,12],[5,20,20,3],[3,8,3,12],[11,10,8,8]],[[9,2,12,3],[4,5,4,17],[22,5,4,17],[9,22,12,3],[13,9,5,10]],[[6,3,5,22],[19,3,5,22],[11,5,8,3],[11,12,8,3],[11,19,8,3]]];for(const r of patterns[id])cx.fillRect(...r);cx.fillStyle='#e8d8ed';cx.fillRect(11,9,3,3);}

function bakeTerrain(){
  if(!terrain)return;sparks.length=0;const r=seededRandom(seed*7+19),c=terrainCtx,w=256,h=1536;
  const water=['#383143','#353044','#302d40','#35303c','#302b40','#3b2d37'];
  for(let y=0;y<h;y++){const stratum=Math.min(5,y/256|0),next=Math.min(5,stratum+1),blend=(y%256)/256;const a=hex(water[stratum]),b=hex(water[next]);c.fillStyle=`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*blend)).join(',')})`;c.fillRect(0,y,w,1);}
  // Pixel dust, sediment flecks, light refractions.
  for(let i=0;i<21000;i++){const x=r()*w|0,y=r()*h|0;if(terrain[(y/2|0)*128+(x/2|0)])continue;c.fillStyle=r()<.25?'#c7a7cc12':'#d9d1b409';c.fillRect(x,y,r()<.06?2:1,1);}
  for(let i=0;i<95;i++){const x=r()*w|0,y=r()*h|0;c.fillStyle='#ac91bb0c';c.fillRect(x,y,12+r()*34,1);c.fillRect(x+3,y+2,6+r()*10,1);}
  const rockBase=['#5b4c5d','#55475d','#4d4358','#61505c','#58485f','#66505a'],rockLight=['#9c8491','#927a94','#887491','#ab8b91','#a286a7','#b48c8c'];
  for(let y=0;y<768;y++)for(let x=0;x<128;x++){
    const i=y*128+x,t=terrain[i];if(!t)continue;const layer=Math.min(5,y/128|0),top=y>0&&!terrain[i-128],left=x>0&&!terrain[i-1],shade=r();
    c.fillStyle=shade<.18?'#423747':shade>.85?'#716075':rockBase[layer];c.fillRect(x*2,y*2,2,2);
    if(top){c.fillStyle=rockLight[layer];c.fillRect(x*2,y*2,2,1);c.fillStyle='#d5b6bc55';if(r()<.35)c.fillRect(x*2,y*2-1,1,1);}
    if(left){c.fillStyle='#837085';c.fillRect(x*2,y*2,1,2);}
    if(t===2){c.fillStyle=layer>3?'#d3acba':'#aebfa0';c.fillRect(x*2,y*2,1,1);}
    if(!top&&r()<.055){c.fillStyle='#c6acb52b';c.fillRect(x*2,y*2,2,1);}
    if(top&&r()<.23){const px=x*2,py=y*2,ph=2+(r()*8|0),colors=layer<2?['#a3b395','#b7c8a6','#a88bb9']:layer<4?['#b6a1c3','#c5ac99','#95b8ab']:['#c49bc9','#c8aea4','#daa98c'];const col=colors[r()*3|0];c.fillStyle=col;c.fillRect(px,py-ph,1,ph);for(let a=2;a<ph;a+=3){c.fillRect(px-2,py-a,2,1);c.fillRect(px+1,py-a-1,2,1);}c.fillStyle='#e5d4c0';if(ph>6)c.fillRect(px,py-ph-1,1,1);}
    if(top&&layer>=4&&r()<.1){const px=x*2,py=y*2,ph=4+(r()*7|0);c.fillStyle=layer===5?'#c89678':'#b294c6';c.fillRect(px,py-ph,2,ph);c.fillStyle=layer===5?'#e7b491':'#dbc4e4';c.fillRect(px,py-ph,1,ph-1);}
    if(y<767&&!terrain[i+128]&&r()<.08){c.fillStyle='#69546f';c.fillRect(x*2,y*2+2,1,3+(r()*4|0));}
  }
  // Surface is a horizontal mineral shelf, with an open central basin.
  c.fillStyle='#7a6378';c.fillRect(0,0,256,4);c.fillStyle='#b69aa7';c.fillRect(0,3,256,1);c.fillStyle='#d6b7c733';c.fillRect(9,8,238,1);
  for(let i=0;i<180;i++)sparks.push({x:r()*256,y:r()*1536,size:r()<.1?2:1,phase:r()*6.28});
  renderMinimap();
}
function hex(s){return[s.slice(1,3),s.slice(3,5),s.slice(5,7)].map(x=>parseInt(x,16));}
function resize(){const box=$('world-viewport').getBoundingClientRect();width=Math.max(1,Math.round(box.width));height=Math.max(1,Math.round(box.height));canvas.width=width;canvas.height=height;ctx.imageSmoothingEnabled=false;scale=width/256*camera.zoom;clampCamera();renderRuler();}
function clampCamera(){const visible=height/scale;camera.y=clamp(camera.y,0,Math.max(0,1536-visible));camera.x=width/scale>256?(256-width/scale)/2:clamp(camera.x,0,256-width/scale);}
function screenToWorld(x,y){return{x:clamp(x/scale+camera.x,2,254),y:clamp(y/scale+camera.y,2,1533)};}
function worldToScreen(x,y){return{x:(x-camera.x)*scale,y:(y-camera.y)*scale};}
function zoomBy(factor,anchorX=width/2,anchorY=height/2){const p=screenToWorld(anchorX,anchorY);camera.zoom=clamp(camera.zoom*factor,.55,3);scale=width/256*camera.zoom;camera.x=p.x-anchorX/scale;camera.y=p.y-anchorY/scale;clampCamera();$('zoom-label').textContent=Math.round(camera.zoom*100)+' %';renderRuler();}
function goDepth(layer){camera.y=layer*256;clampCamera();renderRuler();renderLineage();}
function renderRuler(){if(!ready)return;const visible=height/scale,step=camera.zoom<.7?100:50;let html='';for(let y=Math.ceil(camera.y/step)*step;y<camera.y+visible;y+=step)html+='<span class="depth-tick" style="top:'+((y-camera.y)*scale)+'px">'+(y?'−'+y:'0')+'</span>';$('depth-ruler').innerHTML=html;const layer=Math.min(5,(camera.y+visible*.35)/256|0);$('biome-label').textContent=String(layer+1).padStart(2,'0')+' / '+STRATA[layer].name.toLocaleUpperCase('fr');$('environment-summary').textContent=STRATA[layer].temp+' °C · '+(layer<2?'lumière '+(layer?'diffuse':'abondante'):layer===5?'sources hydrothermales':'pression '+Math.round(1+(camera.y+visible*.5)/10)+' atm');document.querySelectorAll('.stratum-button').forEach((b,i)=>b.classList.toggle('active',i===layer));}
function drawWorld(now){
  if(!terrain){raf=requestAnimationFrame(drawWorld);return;}
  frame++;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#211c29';ctx.fillRect(0,0,width,height);
  const visibleH=height/scale,visibleW=width/scale;
  ctx.drawImage(terrainCanvas,camera.x,camera.y,visibleW,visibleH,0,0,width,height);
  ctx.save();ctx.translate(-camera.x*scale,-camera.y*scale);ctx.scale(scale,scale);
  // Broad, stepped shafts of light are confined to the upper water.
  if(camera.y<430){ctx.fillStyle='#e6ccdb06';for(let i=0;i<4;i++){const x=34+i*52;ctx.beginPath();ctx.moveTo(x,5);ctx.lineTo(x+6,5);ctx.lineTo(x+48,360);ctx.lineTo(x+21,360);ctx.closePath();ctx.fill();}}
  if(view!=='life'&&fields){const data=fields[view==='heat'?'nutrient':view];const top=Math.max(0,camera.y/8|0),bottom=Math.min(192,Math.ceil((camera.y+visibleH)/8));for(let y=top;y<bottom;y++)for(let x=0;x<32;x++){const v=view==='heat'?clamp((STRATA[Math.min(5,y/32|0)].temp-5)/70,0,1):clamp(data?.[y*32+x]/100||0,0,1);ctx.fillStyle=view==='nutrient'?`rgba(174,206,160,${v*.4})`:view==='oxygen'?`rgba(132,190,207,${v*.4})`:`rgba(225,149,109,${v*.43})`;ctx.fillRect(x*8,y*8,8,8);}}
  if(state){
    const cells=state.packed;for(let j=0;j<cells.length;j+=7){const x=cells[j],y=cells[j+1];if(y<camera.y-5||y>camera.y+visibleH+5||x<camera.x-5||x>camera.x+visibleW+5)continue;const s=cells[j+2],own=cells[j+3],health=cells[j+4],boost=cells[j+5],genes=cells[j+6];ctx.globalAlpha=(own?1:.78)*(.5+health*.5);let size=own?5.2:3.5;if(s===3)size*=1.2;if(camera.zoom<.65){ctx.fillStyle=SPECIES[s].color;ctx.fillRect(x|0,y|0,own?2:1,own?2:1);}else{ctx.drawImage(sprites[s][own?1:0],Math.round(x-size/2),Math.round(y-size/2),size,size);if(boost>0){ctx.fillStyle='#f0ddbe';ctx.fillRect((x+3)|0,(y-2)|0,1,1);}if(genes&&own&&frame%45<25){ctx.fillStyle='#f1e3ec';ctx.fillRect(x|0,(y-4)|0,1,1);}}}ctx.globalAlpha=1;
  }
  ctx.fillStyle='#e0ccd98a';for(const p of sparks){if(p.y<camera.y||p.y>camera.y+visibleH)continue;const drift=reducedMotion?0:Math.sin(now*.00025+p.phase)*2;ctx.globalAlpha=.2+Math.sin(now*.001+p.phase)*.15;ctx.fillRect(Math.round(p.x+drift),Math.round(p.y+(reducedMotion?0:now*.0008)%7),p.size,p.size);}ctx.globalAlpha=1;
  for(let i=pulses.length-1;i>=0;i--){const p=pulses[i],age=(now-p.t)/1000;if(age>1.3){pulses.splice(i,1);continue;}ctx.strokeStyle=`rgba(234,214,239,${1-age/1.3})`;ctx.lineWidth=.65;ctx.setLineDash([2,2]);ctx.beginPath();ctx.arc(p.x,p.y,p.r*(.55+age*.5),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  // Permanent colony selection ring.
  ctx.strokeStyle='#d8bfdf88';ctx.lineWidth=.45;ctx.setLineDash([2,3]);ctx.beginPath();ctx.arc(selectedPoint.x,selectedPoint.y,23+(state?.upgrades.impulse||0)*3,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  // Colonisation frontier is visible without preventing exploration.
  if(state&&state.maxDepth<1536&&state.maxDepth>=camera.y&&state.maxDepth<camera.y+visibleH){ctx.strokeStyle='#e3bc8077';ctx.lineWidth=.4;ctx.setLineDash([2,4]);ctx.beginPath();ctx.moveTo(0,state.maxDepth);ctx.lineTo(256,state.maxDepth);ctx.stroke();ctx.setLineDash([]);ctx.font='3px monospace';ctx.fillStyle='#e3bc80';ctx.fillText('MEMBRANE ADAPTATIVE REQUISE',12,state.maxDepth-3);}
  ctx.restore();
  const p=worldToScreen(selectedPoint.x,selectedPoint.y);$('colony-tag').style.display=p.y>-20&&p.y<height-40&&p.x>20&&p.x<width?'flex':'none';$('colony-tag').style.left=clamp(p.x+18,45,width-210)+'px';$('colony-tag').style.top=clamp(p.y-72,65,height-70)+'px';
  if(now-lastMini>500){renderMinimap();lastMini=now;}if(now-lastUi>700){renderRuler();lastUi=now;}if(state&&now-lastHistory>1400){for(const k of ['energy','biomass','knowledge']){history[k].push(state.resources[k]);if(history[k].length>42)history[k].shift();drawSpark(k);}lastHistory=now;}
  raf=requestAnimationFrame(drawWorld);
}
function drawSpark(key){const c=$('spark-'+key),cx=c.getContext('2d'),values=history[key];cx.clearRect(0,0,70,24);if(values.length<2)return;const min=Math.min(...values),max=Math.max(...values),range=Math.max(1,max-min);cx.strokeStyle={energy:'#c5a574',biomass:'#88a687',knowledge:'#a98ab6'}[key];cx.lineWidth=1;cx.beginPath();values.forEach((v,i)=>{const x=i/(values.length-1)*68,y=22-(v-min)/range*19;i?cx.lineTo(x,y):cx.moveTo(x,y);});cx.stroke();}
function renderMinimap(){if(!terrain)return;miniCtx.imageSmoothingEnabled=false;miniCtx.drawImage(terrainCanvas,0,0,128,256);if(state){const p=state.packed;for(let j=0;j<p.length;j+=7){miniCtx.fillStyle=p[j+3]?'#e0c2e7':SPECIES[p[j+2]].color;miniCtx.fillRect(p[j]/2,p[j+1]/6,1,1);}}miniCtx.strokeStyle='#f4e9d7';miniCtx.lineWidth=1;miniCtx.strokeRect(camera.x/2+.5,camera.y/6+.5,Math.min(127,width/scale/2),Math.max(3,height/scale/6));}
function floater(x,y,text,sub=''){const el=document.createElement('div');el.className='floater';el.style.left=clamp(x,50,width-60)+'px';el.style.top=clamp(y,70,height-40)+'px';el.append(document.createTextNode(text));if(sub){const s=document.createElement('small');s.textContent=sub;el.append(s);}$('floaters').append(el);setTimeout(()=>el.remove(),1100);}

let oldLineageKey='',shopStructureKey='',lastEventsKey='';
function renderLineage(){if(!state)return;const key=state.unlocked.join(',')+'-'+selectedSpecies+'-'+selectedOwned;if(key===oldLineageKey)return;oldLineageKey=key;$('lineage-list').innerHTML=SPECIES.map((s,i)=>{const unlocked=state.unlocked.includes(i);return '<button class="lineage-item '+(selectedSpecies===i?'selected ':'')+(!unlocked?'locked':'')+'" data-species="'+i+'" title="'+(unlocked?'Observer votre branche':'Espèce sauvage : stabilisez sa mutation pour l’intégrer')+'"><canvas class="organism-icon" width="44" height="44" data-organism="'+i+'"></canvas><span><strong>'+s.name+'</strong><small id="lineage-pop-'+i+'">'+(unlocked?'Votre lignée':'Branche à découvrir')+'</small></span><span class="branch-number">'+(unlocked?'↗':'◇')+'</span></button>';}).join('');document.querySelectorAll('[data-organism]').forEach(c=>drawIcon(c,Number(c.dataset.organism)));$('branch-count').textContent=String(state.unlocked.length).padStart(2,'0')+' / 07';drawIcon($('specimen'),selectedSpecies,true);}
function updateUI(){if(!state)return;for(const k of ['energy','biomass','knowledge']){$(k).textContent=fmt(state.resources[k]);$(k+'-rate').textContent=rate(state.rates[k]);}
  renderLineage();for(let i=0;i<7;i++){const el=$('lineage-pop-'+i);if(el){const p=state.population.bySpecies[i];el.textContent=state.unlocked.includes(i)?fmt(p.owned)+' cellules':'Espèce sauvage';}}
  $('world-pop').textContent=fmt(state.population.total);$('world-clock').textContent='CYCLE '+String(1+Math.floor(state.time/60)).padStart(3,'0')+' · '+String(Math.floor(state.time/60)).padStart(2,'0')+':'+String(Math.floor(state.time%60)).padStart(2,'0');
  $('click-power').innerHTML='+'+fmt((8+state.upgrades.impulse*6)*(1+state.combo*.05))+' énergie <span>/ clic</span>';$('combo-value').textContent='×'+(1+state.combo*.05).toFixed(1).replace('.',',');$('combo-fill').style.width=(state.combo/20*100)+'%';$('stim-detail').textContent='Rayon '+(23+state.upgrades.impulse*3)+' m · '+(state.upgrades.auto?'impulsions automatiques':'cliquez dans votre colonie');
  const p=state.population.bySpecies[selectedSpecies],count=selectedOwned?p.owned:p.total;$('inspect-name').textContent=SPECIES[selectedSpecies].name;$('inspect-traits').textContent=SPECIES[selectedSpecies].trait;$('inspect-status').textContent=selectedOwned?'● Votre lignée':'◇ Population sauvage';$('inspect-pop').textContent=fmt(count);$('inspect-health').textContent=Math.round(p.health*100)+' %';$('inspect-gen').textContent=String(p.gen).padStart(2,'0');$('colony-name').textContent=selectedSpecies===0&&selectedOwned?'Colonie originelle':SPECIES[selectedSpecies].name;$('colony-tag-info').textContent=fmt(count)+' cellules · '+(selectedOwned?'votre lignée':'espèce sauvage');$('selected-id').textContent=String.fromCharCode(65+selectedSpecies)+'—'+String(1+state.branches).padStart(3,'0');
  $('seed-colony').disabled=!state.unlocked.includes(selectedSpecies)||state.resources.biomass<35;
  const newCount=state.discovered.filter(id=>!state.stabilized.includes(id)).length;$('mutation-badge').textContent=newCount;
  if(!state.upgrades.auto){const percent=clamp(state.resources.energy/160*100,0,100);$('objective-title').textContent='Une lignée autonome';$('objective-copy').textContent='Débloquez votre première impulsion automatique.';$('objective-fill').style.width=percent+'%';$('objective-percent').textContent=Math.floor(percent)+' %';}
  else if(state.maxDepth<1536){const percent=state.upgrades.membrane/5*100;$('objective-title').textContent='L’appel des profondeurs';$('objective-copy').textContent='Adaptez vos membranes : '+state.maxDepth+' / 1 536 m colonisables.';$('objective-fill').style.width=percent+'%';$('objective-percent').textContent=Math.floor(percent)+' %';}
  else{$('objective-title').textContent=state.won?'Le monde vous appartient':'Atteindre le cœur du monde';$('objective-copy').textContent=state.won?'Six strates. Une lignée. Mille possibles.':'Implantez une branche adaptée au-delà de 1 480 m.';$('objective-fill').style.width=clamp(state.deepest/1480*100,0,100)+'%';$('objective-percent').textContent=Math.floor(clamp(state.deepest/1480*100,0,100))+' %';}
  const eventKey=state.events.map(e=>e.id).join('|');if(eventKey!==lastEventsKey){lastEventsKey=eventKey;$('event-list').innerHTML=state.events.slice(0,3).map(e=>'<div class="event-row"><time>'+String(Math.floor(e.time/60)).padStart(2,'0')+':'+String(Math.floor(e.time%60)).padStart(2,'0')+'</time><span>'+safeText(e.text)+'</span></div>').join('');$('event-count').textContent=state.events.length+' ÉVÉNEMENTS';}
  renderShop();post('inspect',selectedPoint);
}
function renderEnvironment(e){const rows=[['Nutriments',e.nutrient,'#a8ba9d'],['Oxygène',e.oxygen,'#9aabbc'],['Toxicité',e.toxin,'#c295a3']];$('env-bars').innerHTML=rows.map(([name,v,col])=>'<div class="env-bar"><span>'+name+'</span><i><b style="width:'+clamp(v,0,100)+'%;background:'+col+'"></b></i><span>'+Math.round(v)+' %</span></div>').join('');$('inspect-hint').textContent=e.nutrient<15?'Pénurie locale. Implantez une autre colonie.':e.toxin>45?'Milieu toxique. Cherchez une zone plus saine.':'Un milieu riche favorise les divisions.';}
function upgradePrice(u,q=1){let cost=0;for(let i=0;i<q;i++)cost+=Math.ceil(u.cost*Math.pow(1.58,state.upgrades[u.id]+i));return cost;}
function renderShop(force=false){if(!state)return;const structureKey=activeTab+'|'+state.discovered.join(',')+'|'+state.stabilized.join(',')+'|'+state.unlocked.join(',')+'|'+buyMode;
  if(force||structureKey!==shopStructureKey){shopStructureKey=structureKey;
    if(activeTab==='upgrades'){$('shop-content').innerHTML='<div class="shop-controls"><span>ÉVOLUTIONS PERMANENTES</span><div class="buy-modes"><button data-buy-mode="1" class="'+(buyMode===1?'active':'')+'">×1</button><button data-buy-mode="10" class="'+(buyMode===10?'active':'')+'">×10</button></div></div>'+UPGRADES.map(u=>'<article class="upgrade-row"><canvas width="30" height="30" data-upgrade-icon="'+u.icon+'" aria-hidden="true"></canvas><div><h3>'+u.name+'</h3><p>'+u.description+'</p></div><div><span class="upgrade-level" id="level-'+u.id+'">NIV. 0</span><button class="buy-button" data-buy="'+u.id+'" title="Acheter '+safeText(u.name)+'"></button></div></article>').join('')+'<p class="shop-note">LES PETITES ADAPTATIONS FONT LES GRANDES LIGNÉES.</p>';document.querySelectorAll('[data-upgrade-icon]').forEach(c=>drawUpgradeIcon(c,Number(c.dataset.upgradeIcon)));}
    if(activeTab==='mutations'){$('shop-content').innerHTML='<div class="mutation-counter">'+fmt(state.divisions)+' DIVISIONS · '+state.stabilized.length+' MUTATIONS STABILISÉES<br>Les divisions révèlent de nouveaux possibles.</div>'+MUTATIONS.map(m=>{const known=state.discovered.includes(m.id),stable=state.stabilized.includes(m.id);return '<article class="mutation-card '+(!known?'locked':'')+'"><div><h3>'+m.name+'</h3><span class="new-tag">'+(stable?'ACQUISE':known?'NOUVELLE':'LATENTE')+'</span></div><p>'+(known?m.description:'Apparaît après '+m.requirement+' divisions de votre lignée.')+'</p><button class="buy-button" data-mutation="'+m.id+'">'+(stable?'Mutation stabilisée':known?'Stabiliser · '+m.cost+' ⌘':m.requirement+' divisions requises')+'</button></article>';}).join('');}
    if(activeTab==='genetics'){const open=state.stabilized.length>=2;$('shop-content').innerHTML='<p class="genetics-copy">'+(open?'Combinez deux traits et implantez une branche hybride dans la zone observée. Chaque avantage a un coût biologique.':'Stabilisez deux mutations pour ouvrir l’éditeur génétique. Vous pourrez combiner les traits de vos branches.')+'</p><div class="gene-field"><label for="gene-species">BRANCHE PARENTE</label><select id="gene-species" '+(!open?'disabled':'')+'>'+state.unlocked.map(s=>'<option value="'+s+'" '+(s===geneticChoice.species?'selected':'')+'>'+SPECIES[s].name+'</option>').join('')+'</select></div>'+['a','b'].map(key=>'<div class="gene-field"><label for="gene-'+key+'">TRAIT '+(key==='a'?'01':'02')+'</label><select id="gene-'+key+'" '+(!open?'disabled':'')+'>'+['Assimilation +20 % / entretien +15 %','Mobilité +50 % / entretien +10 %','Tolérance thermique +20 °C','Réserve génétique · marqueur héritable'].map((s,i)=>'<option value="'+i+'" '+(i===geneticChoice[key]?'selected':'')+'>'+s+'</option>').join('')+'</select></div>').join('')+'<div class="gene-recipe">BRANCHE '+String(state.branches+1).padStart(2,'0')+'<br>Deux traits distincts · transmis à la descendance<br>Implantation à '+Math.round(selectedPoint.y)+' m<br>Coût : 120 ⌘ + 35 ❋</div><button class="buy-button" id="create-branch" style="width:100%" '+(!open?'disabled':'')+'>Créer une branche hybride →</button><p class="shop-note">LA DIVERSITÉ EST UNE FORCE.</p>';}
  }
  if(activeTab==='upgrades')for(const u of UPGRADES){const b=document.querySelector('[data-buy="'+u.id+'"]'),level=state.upgrades[u.id],max=level>=(u.max||100),price=upgradePrice(u);$('level-'+u.id).textContent='NIV. '+String(level).padStart(2,'0');b.disabled=max||state.resources[u.resource]<price;b.textContent=max?'MAX':fmt(buyMode===10?upgradePrice(u,Math.min(10,(u.max||100)-level)):price)+' '+iconForResource(u.resource);b.title=buyMode===10?'Acheter jusqu’à 10 niveaux, selon vos ressources':'Acheter un niveau de '+u.name;}
  if(activeTab==='mutations')for(const m of MUTATIONS){const b=document.querySelector('[data-mutation="'+m.id+'"]');b.disabled=!state.discovered.includes(m.id)||state.stabilized.includes(m.id)||state.resources.knowledge<m.cost;}
  if(activeTab==='genetics'){const b=$('create-branch');if(b)b.disabled=state.stabilized.length<2||state.resources.knowledge<120||state.resources.biomass<35;}
}

$('strata-list').innerHTML=STRATA.map((s,i)=>'<button class="stratum-button '+(i===0?'active':'')+'" data-stratum="'+i+'">'+s.short+'<span>−'+i*256+' m</span></button>').join('');
$('strata-list').addEventListener('click',e=>{const b=e.target.closest('[data-stratum]');if(b)goDepth(Number(b.dataset.stratum));});
$('lineage-list').addEventListener('click',e=>{const b=e.target.closest('[data-species]');if(!b||!state)return;selectedSpecies=Number(b.dataset.species);selectedOwned=state.unlocked.includes(selectedSpecies);const p=state.population.bySpecies[selectedSpecies];if(selectedOwned&&p.owned){selectedPoint={x:p.x,y:p.y};camera.y=p.y-height/scale*.45;clampCamera();}else{const packed=state.packed;for(let j=0;j<packed.length;j+=7)if(packed[j+2]===selectedSpecies){selectedPoint={x:packed[j],y:packed[j+1]};camera.y=packed[j+1]-height/scale*.45;clampCamera();break;}}renderLineage();renderRuler();updateUI();});
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.classList.toggle('active',x===b));}));
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{activeTab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',String(x===b));});$('shop-content').setAttribute('aria-labelledby',b.id);renderShop(true);}));
$('shop-content').addEventListener('click',e=>{const buy=e.target.closest('[data-buy]'),mutation=e.target.closest('[data-mutation]'),mode=e.target.closest('[data-buy-mode]');if(buy)post('buy',{id:buy.dataset.buy,quantity:buyMode});if(mutation)post('stabilize',{id:mutation.dataset.mutation});if(mode){buyMode=Number(mode.dataset.buyMode);renderShop(true);}if(e.target.closest('#create-branch'))post('branch',{species:geneticChoice.species,a:geneticChoice.a,b:geneticChoice.b,...selectedPoint});});
$('shop-content').addEventListener('change',e=>{if(e.target.id==='gene-species')geneticChoice.species=Number(e.target.value);if(e.target.id==='gene-a')geneticChoice.a=Number(e.target.value);if(e.target.id==='gene-b')geneticChoice.b=Number(e.target.value);});
function stimulate(p=selectedPoint){if(!ready)return;post('stimulate',p);}
$('stimulate-button').addEventListener('click',()=>stimulate());
canvas.addEventListener('wheel',e=>{e.preventDefault();if(e.shiftKey||e.ctrlKey){const b=canvas.getBoundingClientRect();zoomBy(e.deltaY>0?.91:1.1,e.clientX-b.left,e.clientY-b.top);}else{camera.y+=e.deltaY/scale*.85;camera.x+=e.deltaX/scale*.85;clampCamera();renderRuler();}},{passive:false});
canvas.addEventListener('pointerdown',e=>{canvas.focus({preventScroll:true});pointer={x:e.clientX,y:e.clientY,cameraY:camera.y,cameraX:camera.x,alt:e.altKey};dragged=false;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)+Math.abs(dy)>6)dragged=true;if(dragged){camera.y=pointer.cameraY-dy/scale;camera.x=pointer.cameraX-dx/scale;clampCamera();renderRuler();}});
canvas.addEventListener('pointerup',e=>{if(!pointer)return;if(!dragged){const b=canvas.getBoundingClientRect(),p=screenToWorld(e.clientX-b.left,e.clientY-b.top);if(pointer.alt&&state){let closest=null,distance=Infinity;const a=state.packed;for(let j=0;j<a.length;j+=7){const dist=(p.x-a[j])**2+(p.y-a[j+1])**2;if(dist<distance){distance=dist;closest=j;}}if(closest!==null&&distance<900){selectedSpecies=a[closest+2];selectedOwned=!!a[closest+3];selectedPoint={x:a[closest],y:a[closest+1]};renderLineage();updateUI();}}else{selectedPoint=p;stimulate(p);post('inspect',p);}}pointer=null;});
canvas.addEventListener('pointercancel',()=>pointer=null);
mini.addEventListener('click',e=>{const b=mini.getBoundingClientRect();camera.y=(e.clientY-b.top)/b.height*1536-height/scale/2;clampCamera();renderRuler();});
$('zoom-in').addEventListener('click',()=>zoomBy(1.2));$('zoom-out').addEventListener('click',()=>zoomBy(1/1.2));
$('home-colony').addEventListener('click',()=>{const p=state?.population.bySpecies[selectedSpecies];selectedPoint=p?.owned?{x:p.x,y:p.y}:{...origin};camera.y=selectedPoint.y-height/scale*.45;camera.x=selectedPoint.x-width/scale/2;clampCamera();renderRuler();});
function setPaused(value){paused=value;post('pause',{value});$('pause-button').textContent=value?'▶':'Ⅱ';$('pause-button').title=value?'Reprendre la simulation':'Mettre en pause';$('pause-button').setAttribute('aria-label',$('pause-button').title);$('pause-button').classList.toggle('active',value);$('sim-status').textContent=value?'MONDE EN PAUSE':'SIMULATION ACTIVE';}
$('pause-button').addEventListener('click',()=>setPaused(!paused));
$('speed-button').addEventListener('click',()=>{speed=speed===4?1:speed*2;post('speed',{value:speed});$('speed-button').textContent='×'+speed;$('sim-performance').textContent=12*speed+' cycles/s';});
$('seed-colony').addEventListener('click',()=>post('seed',{species:selectedSpecies,...selectedPoint}));
document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON','A'].includes(document.activeElement?.tagName)||$('settings-dialog').open||$('help-dialog').open)return;if(e.code==='Space'){e.preventDefault();if(!e.repeat)stimulate();}if(e.code==='ArrowDown'){e.preventDefault();camera.y+=40;clampCamera();renderRuler();}if(e.code==='ArrowUp'){e.preventDefault();camera.y-=40;clampCamera();renderRuler();}if(e.code==='KeyP')setPaused(!paused);});
$('settings-button').addEventListener('click',()=>$('settings-dialog').showModal());
$('export-save').addEventListener('click',()=>{if(ready)post('save',{exported:true});else{const save=readSave();if(save)exportSave(save);}});
$('manual-save').addEventListener('click',()=>{post('save');toast('Sauvegarde demandée.');});
$('import-save').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>12_000_000)throw new Error('Ce fichier est trop volumineux.');const data=JSON.parse(await file.text());post('import',{save:data});}catch(err){toast(err.message);}e.target.value='';});
$('help-button').addEventListener('click',()=>{$('settings-dialog').close();$('help-dialog').showModal();});
$('new-world').addEventListener('click',()=>{if(!confirm('Créer un nouveau monde remplacera votre sauvegarde locale. Exportez-la d’abord si vous souhaitez la conserver. Continuer ?'))return;seed=Math.floor(Math.random()*999999)+1;initial=true;oldLineageKey='';shopStructureKey='';lastEventsKey='';selectedSpecies=0;selectedOwned=true;fields=null;history.energy=[];history.biomass=[];history.knowledge=[];pulses.length=0;sparks.length=0;post('init',{seed});$('settings-dialog').close();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)post('save');});
window.addEventListener('pagehide',()=>{if(lastSave&&state){const latest={...lastSave,savedAt:Date.now(),resources:state.resources,rates:state.rates};storeSave(latest);}});
new ResizeObserver(resize).observe($('world-viewport'));
resize();raf=requestAnimationFrame(drawWorld);

// Remove caches from the previous application hosted at the same GitHub Pages path.
if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(registrations=>{const scope=new URL('./',location.href).href;for(const r of registrations)if(r.scope===scope)r.unregister();}).catch(()=>{});
