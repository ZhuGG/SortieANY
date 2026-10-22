import {STRATA,clamp} from './config.mjs';
export const FW=32,FH=192,FT=8,FN=FW*FH;
export const WATER_FIELDS=['nutrient','oxygen','carbon','detritus','heat'];
export const GAS_FIELDS=['gasO2','gasCO2','gasMethane','gasInert'];
export const FLUID_FIELDS=['water',...WATER_FIELDS,...GAS_FIELDS,'film','signal'];
export class Fluids{
 constructor(terrain,{populate=true,sources=true}={}){
  this.terrain=terrain;this.sources=sources;this.tick=0;this.capacity=new Float32Array(FN);this.openDown=new Float32Array(FN);this.openRight=new Float32Array(FN);this.flowX=new Float32Array(FN);this.flowY=new Float32Array(FN);this.exchangeCount=0;this.ledger={waterIn:0,gasIn:0,gasOut:0};
  for(const key of FLUID_FIELDS)this[key]=new Float32Array(FN);this.refresh();
  if(populate)for(let i=0;i<FN;i++){
   const x=i%FW,y=i/FW|0,cap=this.capacity[i];if(!cap)continue;
   const dry=y*FT<20||((x*FT<68||x*FT>192)&&(y%32<3));const fill=dry?.04:.97;
   this.water[i]=cap*fill;this.nutrient[i]=this.water[i]*(70+Math.sin(x*.8+y*.3)*15);this.oxygen[i]=this.water[i]*Math.max(15,85-y*.34);this.carbon[i]=this.water[i]*30;this.detritus[i]=this.water[i]*(3+y*.04);this.heat[i]=this.water[i]*STRATA[Math.min(5,y*FT/256|0)].temp;
   const air=cap-this.water[i];this.gasO2[i]=air*.21;this.gasInert[i]=air*.7896;this.gasCO2[i]=air*.0004;
  }
 }
 index(x,y){return clamp(y/FT|0,0,FH-1)*FW+clamp(x/FT|0,0,FW-1);}
 refresh(){const span=FT/2;for(let y=0;y<FH;y++)for(let x=0;x<FW;x++){const i=y*FW+x;let open=0,down=0,right=0;for(let dy=0;dy<span;dy++)for(let dx=0;dx<span;dx++)if(!this.terrain[(y*span+dy)*128+x*span+dx])open++;for(let d=0;d<span;d++){if(y<FH-1&&!this.terrain[(y*span+span-1)*128+x*span+d]&&!this.terrain[(y*span+span)*128+x*span+d])down++;if(x<FW-1&&!this.terrain[(y*span+d)*128+x*span+span-1]&&!this.terrain[(y*span+d)*128+x*span+span])right++;}this.capacity[i]=open/(span*span);this.openDown[i]=down/span;this.openRight[i]=right/span;}}
 temperature(i){return this.water[i]>.001?this.heat[i]/this.water[i]:STRATA[Math.min(5,(i/FW|0)*FT/256|0)].temp;}
 concentration(field,i){return this.water[i]>.002?this[field][i]/this.water[i]:0;}
 gases(i){return this.gasO2[i]+this.gasCO2[i]+this.gasMethane[i]+this.gasInert[i];}
 permeability(a,b){const face=Math.abs(a-b)===FW?this.openDown[Math.min(a,b)]:this.openRight[Math.min(a,b)];return face*Math.max(.015,1-Math.max(this.film[a],this.film[b])*.97);}
 transferWater(a,b,amount){
  if(a<0||b<0||a>=FN||b>=FN||!this.capacity[a]||!this.capacity[b]||this.water[a]<=0||!this.permeability(a,b))return 0;
  amount=Math.min(amount,this.water[a],Math.max(0,this.capacity[b]*1.04-this.water[b]));if(amount<=1e-8)return 0;
  const fraction=amount/this.water[a];for(const key of WATER_FIELDS){const moved=this[key][a]*fraction;this[key][a]-=moved;this[key][b]+=moved;}
  this.water[a]-=amount;this.water[b]+=amount;
  const dx=(b%FW)-(a%FW),dy=(b/FW|0)-(a/FW|0);this.flowX[a]+=dx*amount;this.flowX[b]+=dx*amount;this.flowY[a]+=dy*amount;this.flowY[b]+=dy*amount;return amount;
 }
 transferGas(a,b,amount){const total=this.gases(a);if(total<=1e-9||!this.capacity[b])return 0;amount=Math.min(total,Math.max(0,amount))*this.permeability(a,b);const f=amount/total;for(const key of GAS_FIELDS){const moved=this[key][a]*f;this[key][a]-=moved;this[key][b]+=moved;}return amount;}
 inject(x,y,kind,amount){const i=this.index(x,y);if(!this.capacity[i])return 0;if(kind==='water'){const gain=Math.min(amount,Math.max(0,this.capacity[i]*1.04-this.water[i]));this.water[i]+=gain;this.heat[i]+=gain*STRATA[Math.min(5,y/256|0)].temp;this.nutrient[i]+=gain*70;this.oxygen[i]+=gain*70;this.ledger.waterIn+=gain;return gain;}if(GAS_FIELDS.includes(kind)){this[kind][i]+=amount;this.ledger.gasIn+=amount;return amount;}return 0;}
 step(dt=1/12,{sources=this.sources,atmosphere=true}={}){
  this.tick++;this.flowX.fill(0);this.flowY.fill(0);
  // Conservative pairwise mass transfers. Closed boundaries never discard water.
  for(let y=FH-1;y>=0;y--)for(let xx=0;xx<FW;xx++){
   const x=this.tick%2?xx:FW-1-xx,i=y*FW+x;if(!this.capacity[i]||this.water[i]<1e-5)continue;const below=i+FW;
   if(this.capacity[below]&&this.water[below]<this.capacity[below]*1.015-.0001)this.transferWater(i,below,Math.min(this.water[i],this.capacity[below]*1.015-this.water[below])*this.permeability(i,below)*Math.min(1,dt*9));
   const j=i+1;if(x<FW-1&&this.capacity[j]){const level=this.water[i]/this.capacity[i]-this.water[j]/this.capacity[j];if(Math.abs(level)>.005){const amount=Math.abs(level)*Math.min(this.capacity[i],this.capacity[j])*.25*this.permeability(i,j)*Math.min(1,dt*10);if(level>0)this.transferWater(i,j,amount);else this.transferWater(j,i,amount);}}
  }
  // Gas rises through cavities and displaces an equal volume of water to form bubbles.
  for(let y=1+(this.tick%2);y<FH;y+=2)for(let x=0;x<FW;x++){
   const i=y*FW+x,up=i-FW;let total=this.gases(i);if(!this.capacity[i]||total<.00002)continue;
   if(this.water[i]>.08){const dissolved=Math.min(this.gasO2[i],Math.max(0,this.water[i]*90-this.oxygen[i])*.00003);this.gasO2[i]-=dissolved;this.oxygen[i]+=dissolved*1000;const carbon=Math.min(this.gasCO2[i],Math.max(0,this.water[i]*60-this.carbon[i])*.00005);this.gasCO2[i]-=carbon;this.carbon[i]+=carbon*1000;this.ledger.gasOut+=dissolved+carbon;total=this.gases(i);}
   if(this.capacity[up]){
    const space=Math.max(.003,this.capacity[up]-this.water[up]),free=Math.max(.003,this.capacity[i]-this.water[i]);
    let push=Math.max(0,(total/free-this.gases(up)/space)*.012*dt*12);
    if(total>.06&&this.water[up]>.7*this.capacity[up]){const moved=this.transferWater(up,i,Math.min(total*.18,.025)*this.permeability(up,i));push+=moved;if(moved>0)this.exchangeCount++;}
    if(push>.00001)this.transferGas(i,up,Math.min(total*.3,push)*this.permeability(i,up));
   }
   if(x<FW-1&&this.capacity[i+1]){const j=i+1,a=total/Math.max(.02,this.capacity[i]-this.water[i]),b=this.gases(j)/Math.max(.02,this.capacity[j]-this.water[j]);if(a>b+.02)this.transferGas(i,j,(a-b)*.003*dt*12);else if(b>a+.02)this.transferGas(j,i,(b-a)*.003*dt*12);}
  }
  // Thermal exchange and buoyancy: paired parcel exchange conserves transported material.
  if(this.tick%3===0)for(let i=FW;i<FN;i++){
   const j=i-FW;if(this.water[i]<.15||this.water[j]<.15||!this.capacity[j])continue;
   const a=this.temperature(i),b=this.temperature(j),conduct=(a-b)*.0006;
   const heat=conduct*Math.min(this.water[i],this.water[j]);this.heat[i]-=heat;this.heat[j]+=heat;
   if(a>b+5){const amount=Math.min(.008,(a-b)*.00015)*this.permeability(i,j);const ai=this.water[i],aj=this.water[j];for(const key of WATER_FIELDS){const exchange=(this[key][i]/ai-this[key][j]/aj)*amount;this[key][i]-=exchange;this[key][j]+=exchange;}this.flowY[i]-=amount*4;this.flowY[j]-=amount*4;}
  }
  if(sources&&this.tick%6===0){for(const [x,y]of [[128,28],[34,370],[204,800],[112,1420]])this.inject(x,y,'water',.007);for(const [x,y]of [[60,1450],[184,1490]]){const i=this.index(x,y);if(this.water[i]>.1){this.heat[i]+=Math.max(0,78-this.temperature(i))*.0015;this.nutrient[i]+=.012;}}}
  if(atmosphere)for(let i=0;i<FW;i++){const lost=this.gases(i)*.06;const total=this.gases(i);if(total>0){for(const key of GAS_FIELDS)this[key][i]*=.94;this.ledger.gasOut+=lost;}}
  if(this.tick%12===0)for(let i=0;i<FN;i++){this.signal[i]*=.96;if(this.film[i]>0)this.film[i]=Math.max(0,this.film[i]-.00015);}
 }
 totals(){const sum=a=>a.reduce((v,n)=>v+n,0);return Object.fromEntries(['water',...WATER_FIELDS,...GAS_FIELDS].map(k=>[k,sum(this[k])]))}
 serialize(){return{fields:Object.fromEntries(FLUID_FIELDS.map(k=>[k,Array.from(this[k])])),tick:this.tick,ledger:{...this.ledger},sources:this.sources};}
 static restore(terrain,data){if(!data?.fields)throw Error('Fluides absents.');const f=new Fluids(terrain,{populate:false,sources:data.sources!==false});for(const key of FLUID_FIELDS){const a=data.fields[key];if(!Array.isArray(a)||a.length!==FN||a.some(v=>!Number.isFinite(v)||v<0||v>1e8))throw Error('Fluides invalides : '+key);f[key].set(a);}f.tick=Number.isInteger(data.tick)?data.tick:0;f.ledger=data.ledger&&Object.values(data.ledger).every(Number.isFinite)?{...data.ledger}:{waterIn:0,gasIn:0,gasOut:0};return f;}
}
