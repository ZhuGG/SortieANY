import {SPECIES,STRATA,FAMILIES,seededRandom,clamp} from './config.mjs';
import {FW,FH,FT} from './fluids.mjs';
const cache=new Map();
export function cellSprite(species,L={},own=false,variant=0){
 const key=species+'-'+own+'-'+Object.values(L).join(',')+'-'+variant;if(cache.has(key))return cache.get(key);
 const c=document.createElement('canvas');c.width=20;c.height=20;const x=c.getContext('2d'),s=SPECIES[species],tier=n=>n>=5?3:n>=3?2:n>0?1:0;
 const membrane=own?tier(L.membrane):0,flag=own?tier(L.flagella):species===1?1:0,div=own?tier(L.division):0,meta=own?tier(L.metabolism):0;
 x.fillStyle=s.dark;x.fillRect(6,4,8,12);x.fillRect(4,6,12,8);x.fillStyle=s.color;x.fillRect(6,5,8,10);x.fillRect(5,7,10,6);x.fillStyle=s.light;x.fillRect(6,6,3,2);x.fillRect(5,8,2,2);x.fillStyle=s.dark;x.fillRect(10,9,3,3);
 if(species===3){x.fillStyle=s.light;x.fillRect(6,3,2,3);x.fillRect(12,3,2,3);}
 if(membrane){x.strokeStyle=s.light;x.lineWidth=1;x.strokeRect(3,5,13,10);if(membrane>=2){x.fillStyle=s.color;x.fillRect(1,8,2,4);x.fillRect(17,8,2,4);}if(membrane===3){x.fillStyle='#e5b56b';x.fillRect(8,1,4,3);x.fillRect(8,16,4,3);}}
 if(flag){x.fillStyle=s.color;for(let i=0;i<flag+1;i++){const y=4+i*5;x.fillRect(1,y,4,1);x.fillRect(16,y+2,3,1);if(flag>1){x.fillRect(0,y-1,1,2);x.fillRect(19,y+1,1,3);}}}
 if(div){x.fillStyle=s.dark;x.fillRect(6,9,8,1);if(div>=2){x.fillRect(6,6,8,1);x.fillRect(6,12,8,1);}if(div===3){x.fillStyle=s.light;x.fillRect(8,15,4,3);}}
 if(meta){x.fillStyle='#a9cdb1';x.fillRect(6,10,2,2);if(meta>=2)x.fillRect(12,6,2,2);if(meta===3)x.fillRect(11,13,2,2);}
 if(own&&L.secretion){x.fillStyle='#e5b56b';x.fillRect(2,12,3,3);if(L.secretion>=3)x.fillRect(15,5,3,3);if(L.secretion>=5)x.fillRect(7,2,3,2);}
 if(own&&L.adhesion){x.fillStyle='#d2b7df';x.fillRect(0,9,4,1);x.fillRect(16,9,4,1);}
 if(own&&L.research){x.fillStyle='#f3eddd';x.fillRect(10,9,1,3);if(L.research>=3)x.fillRect(9,10,4,1);if(L.research>=5){x.fillRect(8,8,1,1);x.fillRect(13,12,1,1);}}
 if(own&&L.auto){x.fillStyle='#bca5df';x.fillRect(7,1,6,1);x.fillRect(7,18,6,1);}
 if(own&&L.impulse){x.fillStyle='#f3eddd';x.fillRect(9,3,2,2);if(L.impulse>=3){x.fillRect(4,8,2,2);x.fillRect(14,8,2,2);}if(L.impulse>=5){x.fillRect(5,1,1,1);x.fillRect(15,17,1,1);}}
 if(own){x.fillStyle='#f3eddd';x.fillRect(9,0,1,1);}cache.set(key,c);if(cache.size>2500)cache.clear();return c;
}
export class WorldRenderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.terrain=null;this.state=null;this.fluids=null;this.camera={x:0,y:0,zoom:.85};this.mode='life';this.selection={x:128,y:120,species:0};this.width=1;this.height=1;this.scale=1;this.bitmap=document.createElement('canvas');this.bitmap.width=256;this.bitmap.height=1536;this.art={};for(const name of ['filter','borer','weaver']){const im=new Image();im.src=new URL('./assets/fauna-'+name+'.png',import.meta.url);this.art[name]=im;}this.pulses=[];this.lastNow=0;this.onFrame=null;this.lastUi=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.loop=this.loop.bind(this);this.raf=requestAnimationFrame(this.loop);}
 resize(){const b=this.canvas.getBoundingClientRect();this.width=Math.round(b.width)||1;this.height=Math.round(b.height)||1;this.canvas.width=this.width;this.canvas.height=this.height;this.scale=this.width/256*this.camera.zoom;this.clamp();}
 clamp(){this.camera.y=clamp(this.camera.y,0,Math.max(0,1536-this.height/this.scale));this.camera.x=this.width/this.scale>256?(256-this.width/this.scale)/2:clamp(this.camera.x,0,256-this.width/this.scale);}
 point(x,y){return{x:clamp(x/this.scale+this.camera.x,3,253),y:clamp(y/this.scale+this.camera.y,3,1532)};}
 screen(x,y){return{x:(x-this.camera.x)*this.scale,y:(y-this.camera.y)*this.scale};}
 zoom(factor,x=this.width/2,y=this.height/2){const p=this.point(x,y);this.camera.zoom=clamp(this.camera.zoom*factor,.5,3);this.scale=this.width/256*this.camera.zoom;this.camera.x=p.x-x/this.scale;this.camera.y=p.y-y/this.scale;this.clamp();}
 home(p){this.camera.y=p.y-this.height/this.scale*.45;this.camera.x=p.x-this.width/this.scale*.5;this.clamp();}
 setTerrain(terrain,seed){this.terrain=terrain;const c=this.bitmap.getContext('2d'),rng=seededRandom(seed*13+17);c.clearRect(0,0,256,1536);
  for(let gy=0;gy<768;gy++)for(let gx=0;gx<128;gx++){const i=gy*128+gx,v=terrain[i];if(!v)continue;const y=gy*2,x=gx*2,layer=Math.min(5,gy/128|0),s=STRATA[layer],top=gy>0&&!terrain[i-128],side=gx>0&&!terrain[i-1],r=rng();c.fillStyle=r<.17?'#302937':r>.9?s.light:s.rock;c.fillRect(x,y,2,2);if(top){c.fillStyle=s.light;c.fillRect(x,y,2,1);}if(side){c.fillStyle=s.light+'88';c.fillRect(x,y,1,2);}if(v===2){c.fillStyle=layer>=4?'#e0c7ed':s.color;c.fillRect(x,y,1,1);}if(rng()<.05){c.fillStyle='#f3eddd18';c.fillRect(x,y,2,1);}
   if(top&&rng()<.23){const height=2+(rng()*8|0);c.fillStyle=layer===0?'#a9cdb1':layer===1?'#c4a3ce':layer===2?'#93b9c6':layer===3?'#d5b27d':layer===4?'#cfb7ed':'#d7977a';if(layer===4){c.fillRect(x,y-height,2,height);c.fillStyle='#edddf7';c.fillRect(x,y-height,1,height-1);}else if(layer===5){c.fillRect(x,y-height,3,height);c.fillStyle='#e5b56b';c.fillRect(x+1,y-height-1,1,2);}else{c.fillRect(x,y-height,1,height);for(let a=2;a<height;a+=3){c.fillRect(x-2,y-a,2,1);c.fillRect(x+1,y-a-1,2,1);}}}
   if(gy<767&&!terrain[i+128]&&rng()<.12){c.fillStyle=s.color+'77';const h=layer===1?5+(rng()*12|0):2+(rng()*5|0);c.fillRect(x,y+2,1,h);if(layer===1)c.fillRect(x+1,y+5,2,1);}
  }
 }
 drawFauna(c,o,now,portrait=false){const f=FAMILIES.find(f=>f.id===o.family);if(!f)return;const size=portrait?60:o.stage==='juvenile'?16:23,stage=o.gen>1?2:o.stage==='juvenile'?0:1;
  c.save();c.translate(o.x,o.y);if(o.stage==='egg'){c.fillStyle=f.color;c.fillRect(-2,-3,4,6);c.fillStyle='#f3eddd';c.fillRect(-1,-2,2,2);c.restore();return;}
  c.globalAlpha=o.stage==='corpse'?.35:1;const art=this.art[o.family];if(art?.complete&&art.naturalWidth){const breathe=this.reduced?1:1+Math.sin(now*.002+o.id)*.025;c.scale(o.angle>Math.PI*.5&&o.angle<Math.PI*1.5?-1:1,breathe);c.drawImage(art,stage*96,0,96,72,-size*.65,-size*.5,size*1.3,size);}
  else{const segments=o.family==='hunter'?5:3;c.rotate(o.angle);for(let i=segments;i>=0;i--){c.fillStyle=i%2?f.color:'#f3eddd';c.fillRect(-i*2,-2+Math.sin(now*.005+i)*.7,3,4);}c.fillStyle='#302737';c.fillRect(1,-1,1,1);}
  if(o.own){c.strokeStyle='#f3eddd66';c.lineWidth=.4;c.strokeRect(-size*.65,-size*.52,size*1.3,size*1.04);}c.restore();
 }
 draw(now){const c=this.ctx,w=this.width,h=this.height,cam=this.camera,s=this.scale,visible=h/s;if(!this.terrain){c.fillStyle='#302737';c.fillRect(0,0,w,h);return;}c.imageSmoothingEnabled=false;c.fillStyle='#272330';c.fillRect(0,0,w,h);c.save();c.scale(s,s);c.translate(-cam.x,-cam.y);
  const y0=Math.max(0,cam.y/FT|0),y1=Math.min(FH,Math.ceil((cam.y+visible)/FT));for(let layer=0;layer<6;layer++){c.fillStyle=STRATA[layer].bg;c.fillRect(0,layer*256,256,256);}
  const f=this.fluids;
  if(f)for(let gy=y0;gy<y1;gy++)for(let gx=0;gx<FW;gx++){
   const k=gy*FW+gx,water=f.water[k],cap=f.capacity[k];if(!cap)continue;const layer=Math.min(5,gy*FT/256|0),style=STRATA[layer],x=gx*FT,y=gy*FT,fill=clamp(water/cap,0,1);
   if(fill>.015){c.fillStyle=style.water;c.fillRect(x,y+FT*(1-fill),FT,FT*fill);if(fill<.9){c.fillStyle=style.color+'66';c.fillRect(x,y+FT*(1-fill),FT,.45);}}
   if(this.mode==='water'&&fill>.05){c.fillStyle='#83b4c0'+Math.round(fill*100+30).toString(16).padStart(2,'0');c.fillRect(x,y,FT,FT);}
   if(this.mode==='nutrient'&&water>.02){const n=clamp(f.nutrient[k]/water/90,0,1);c.fillStyle=`rgba(169,205,177,${n*.55})`;c.fillRect(x,y,FT,FT);}
   if(this.mode==='heat'){const temp=water>.02?f.heat[k]/water:style.temp;c.fillStyle=temp<25?`rgba(145,185,201,${clamp((25-temp)/30,.05,.5)})`:`rgba(224,160,128,${clamp((temp-15)/90,0,.65)})`;c.fillRect(x,y,FT,FT);}
   const gas=f.gasO2[k]+f.gasCO2[k]+f.gasMethane[k]+f.gasInert[k];if(this.mode==='gas'&&gas>.001){c.fillStyle=f.gasMethane[k]>gas*.12?'#e5b56b55':f.gasCO2[k]>gas*.2?'#d995a866':'#b5cdd666';c.fillRect(x,y,FT,FT);}
   if(f.film[k]>.03){c.fillStyle=`rgba(210,183,223,${f.film[k]*.35})`;c.fillRect(x,y,FT,FT);c.strokeStyle='#d2b7df88';c.lineWidth=.3;c.beginPath();c.moveTo(x,y+FT);c.lineTo(x+FT,y);c.moveTo(x,y);c.lineTo(x+FT,y+FT);c.stroke();}
   if(gas>.025&&water>.1&&k%3===0){c.strokeStyle=f.gasMethane[k]>gas*.15?'#e5b56b88':'#cfdfd177';c.lineWidth=.3;const py=y+3-((now*.001+k*.23)%3);c.strokeRect(x+1,py,Math.min(2,.6+gas),Math.min(2,.6+gas));}
   if((this.mode==='water'||this.mode==='life')&&k%9===0&&Math.abs(f.flowY[k])+Math.abs(f.flowX[k])>.008){c.strokeStyle=style.color+'55';c.lineWidth=.3;c.beginPath();c.moveTo(x+2,y+2);c.lineTo(x+2+clamp(f.flowX[k]*40,-3,3),y+2+clamp(f.flowY[k]*40,-3,3));c.stroke();}
  }
  c.drawImage(this.bitmap,0,0);if(cam.y<350){c.fillStyle='#ead9ca07';for(let i=0;i<4;i++){c.beginPath();c.moveTo(20+i*60,0);c.lineTo(28+i*60,0);c.lineTo(65+i*60,280);c.lineTo(45+i*60,280);c.fill();}}
  const state=this.state;if(state){
   if(state.links?.length&&(this.mode==='network'||this.mode==='life')){c.lineWidth=this.mode==='network'?.65:.3;c.globalAlpha=this.mode==='network'?.8:.35;for(let j=0;j<state.links.length;j+=5){if(state.links[j+1]<cam.y-10||state.links[j+1]>cam.y+visible+10)continue;c.strokeStyle=SPECIES[state.links[j+4]].color;c.beginPath();c.moveTo(state.links[j],state.links[j+1]);c.lineTo(state.links[j+2],state.links[j+3]);c.stroke();}c.globalAlpha=1;}
   const wildSprites=SPECIES.map((_,i)=>cellSprite(i,{},false)),ownSprites=SPECIES.map((_,i)=>cellSprite(i,state.lineages[i],true)),sizes=state.lineages.map(L=>5.3+Math.min(2.5,L.division*.2+L.membrane*.2));
   const cells=state.packed;for(let j=0;j<cells.length;j+=8){const x=cells[j],y=cells[j+1];if(y<cam.y-8||y>cam.y+visible+8||x<cam.x-8||x>cam.x+w/s+8)continue;const species=cells[j+2],own=!!cells[j+3],size=own?sizes[species]:3.6;c.globalAlpha=(own?1:.8)*(.5+cells[j+4]*.5);if(cam.zoom<.6){c.fillStyle=SPECIES[species].color;c.fillRect(x|0,y|0,own?2:1,own?2:1);}else c.drawImage(own?ownSprites[species]:wildSprites[species],Math.round(x-size/2),Math.round(y-size/2),size,size);if(cells[j+5]>0){c.fillStyle='#f4e5bc';c.fillRect((x+3)|0,(y-2)|0,1,1);}}c.globalAlpha=1;
   for(const o of state.organisms)if(o.y>cam.y-30&&o.y<cam.y+visible+30)this.drawFauna(c,o,now);
   for(const e of state.effects){const age=state.time-e.time;if(e.kind==='upgrade'||e.kind==='mutation'){c.strokeStyle=`rgba(243,237,221,${Math.max(0,1-age/2)})`;c.lineWidth=.5;c.strokeRect(e.x-12-age*8,e.y-12-age*8,24+age*16,24+age*16);}}
  }
  const p=this.selection;c.strokeStyle=this.selection.organismId?'#e5b56b99':'#d2b7df99';c.lineWidth=.4;c.setLineDash([2,3]);c.beginPath();c.arc(p.x,p.y,22+(state?.lineages[p.species]?.impulse||0)*2,0,Math.PI*2);c.stroke();c.setLineDash([]);
  for(let i=this.pulses.length-1;i>=0;i--){const pulse=this.pulses[i],age=(now-pulse.t)/1000;if(age>1.2){this.pulses.splice(i,1);continue;}c.strokeStyle=`rgba(243,237,221,${1-age/1.2})`;c.lineWidth=.6;c.beginPath();c.arc(pulse.x,pulse.y,pulse.radius*(.4+age*.6),0,Math.PI*2);c.stroke();}
  c.restore();if(now-this.lastUi>350){this.onFrame?.();this.lastUi=now;}
 }
 loop(now){if(!document.hidden&&now-(this.lastNow||0)>=1000/30){this.draw(now);this.lastNow=now;}this.raf=requestAnimationFrame(this.loop);}
 minimap(canvas){if(!this.terrain)return;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;for(let l=0;l<6;l++){c.fillStyle=STRATA[l].water;c.fillRect(0,l*64,64,64);}c.drawImage(this.bitmap,0,0,64,384);if(this.state)for(let j=0;j<this.state.packed.length;j+=8){c.fillStyle=this.state.packed[j+3]?'#f3eddd':SPECIES[this.state.packed[j+2]].color;c.fillRect(this.state.packed[j]/4,this.state.packed[j+1]/4,1,1);}c.strokeStyle='#f3eddd';c.lineWidth=1;c.strokeRect(Math.max(0,this.camera.x/4)+.5,this.camera.y/4+.5,Math.min(63,this.width/this.scale/4),Math.max(3,this.height/this.scale/4));}
 portrait(canvas,species,L={},organism=null,next=false){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;if(organism){c.save();c.translate(canvas.width/2,canvas.height/2);this.drawFauna(c,{...organism,x:0,y:0},performance.now(),true);c.restore();}else{const size=Math.min(canvas.width,canvas.height)*.9;c.drawImage(cellSprite(species,L,true),Math.floor((canvas.width-size)/2),Math.floor((canvas.height-size)/2),size,size);}}
}
