import {Simulation} from './ecosystem.mjs';
let sim,paused=false,speed=1,last=performance.now(),accumulator=0,snapshotClock=0,fluidClock=0,saveClock=0,lastTerrain=-1,averageMs=0;
function snapshot(){if(!sim)return;const state=sim.snapshot();self.postMessage({type:'snapshot',...state,averageMs},[state.packed.buffer,state.links.buffer]);if(lastTerrain!==sim.terrainRevision){lastTerrain=sim.terrainRevision;self.postMessage({type:'terrain',terrain:sim.terrain,revision:lastTerrain});}}
function fluids(){if(!sim)return;const f=sim.fluids,keys=['water','capacity','nutrient','oxygen','detritus','heat','gasO2','gasCO2','gasMethane','gasInert','film','signal','flowX','flowY'];const data={};for(const k of keys)data[k]=f[k];self.postMessage({type:'fluids',...data,ledger:f.ledger});}
function save(exported=false,manual=false){if(sim)self.postMessage({type:'save',data:sim.serialize(),exported,manual});}
function ready(){lastTerrain=-1;paused=false;speed=1;last=performance.now();accumulator=0;saveClock=0;self.postMessage({type:'ready',seed:sim.seed,origin:sim.origin,offline:sim.offlineClaim});snapshot();fluids();}
self.onmessage=({data:d})=>{try{
 if(d.type==='init'){sim=d.save?Simulation.restore(d.save):new Simulation(d.seed??427);ready();save();return;}
 if(d.type==='import'){const restored=Simulation.restore(d.save,Date.now(),false);sim=restored;ready();save(false,true);return;}
 if(!sim)return;let r;
 if(d.type==='select'&&sim.unlocked.includes(d.species))sim.activeSpecies=d.species;
 if(d.type==='stimulate'){r=paused?{ok:false,message:'Reprenez la simulation.'}:sim.stimulate(d.x,d.y,false,d.species);if(r.ok)self.postMessage({type:'impulse',...r});}
 if(d.type==='buy')r=sim.buy(d.id,d.quantity,d.species);
 if(d.type==='stabilize')r=sim.stabilize(d.id);
 if(d.type==='seed')r=sim.seedColony(d.species,d.x,d.y);
 if(d.type==='branch')r=sim.createBranch(d.species,d.a,d.b,d.x,d.y);
 if(d.type==='hatch')r=sim.hatch(d.family,d.x,d.y);
 if(d.type==='ability')r=paused?{ok:false,message:'Reprenez la simulation.'}:sim.ability(d.id,d.x,d.y,d.species,d.organismId);
 if(d.type==='inspect'){const organism=d.organismId?sim.organisms.find(o=>o.id===d.organismId):null;self.postMessage({type:'environment',...sim.environment(d.x,d.y),organism});return;}
 if(d.type==='pause')paused=!!d.value;
 if(d.type==='speed'&&[1,2,4].includes(d.value))speed=d.value;
 if(d.type==='save'){save(d.exported,d.manual);return;}
 if(r){if(r.message)self.postMessage({type:'result',...r});if(r.ok&&d.type!=='stimulate'){sim.aggregate();snapshot();fluids();save();}}
 }catch(error){self.postMessage({type:'error',operation:d.type,message:error.message});}};
setInterval(()=>{if(!sim)return;const now=performance.now(),elapsed=Math.min((now-last)/1000,.5);last=now;if(!paused){accumulator=Math.min(accumulator+elapsed*speed,.5);const start=performance.now();while(accumulator>=1/12&&performance.now()-start<40){const t=performance.now();sim.step(1/12);averageMs=averageMs*.95+(performance.now()-t)*.05;accumulator-=1/12;}}snapshotClock+=elapsed;fluidClock+=elapsed;saveClock+=elapsed;if(snapshotClock>.25){snapshot();snapshotClock=0;}if(fluidClock>.65){fluids();fluidClock=0;}if(saveClock>15){save();saveClock=0;}},1000/30);
