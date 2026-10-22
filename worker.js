import {Simulation,WORLD} from './simulation.mjs';
let sim,paused=false,speed=1,last=performance.now(),accumulator=0,sendClock=0,fieldClock=0,saveClock=0;
function snapshot(){if(!sim)return;const state=sim.snapshot();self.postMessage({type:'snapshot',...state},[state.packed.buffer]);}
function ready(){self.postMessage({type:'ready',seed:sim.seed,terrain:sim.terrain,origin:sim.origin,offline:sim.offlineClaim||0});snapshot();sendFields();}
function sendFields(){if(!sim)return;self.postMessage({type:'fields',nutrient:sim.nutrient,oxygen:sim.oxygen,toxin:sim.toxin,detritus:sim.detritus});}
function persist(exported=false,requestId=null){if(sim)self.postMessage({type:'save',data:sim.serialize(),exported,requestId});}
self.onmessage=({data:d})=>{try{
  if(d.type==='init'){sim=d.save?Simulation.restore(d.save):new Simulation(d.seed||427);paused=false;speed=1;accumulator=0;last=performance.now();saveClock=0;ready();persist();return;}
  if(d.type==='import'){const restored=Simulation.restore(d.save,Date.now(),false);sim=restored;paused=false;speed=1;accumulator=0;last=performance.now();ready();persist();self.postMessage({type:'result',message:'Votre monde a été restauré.',ok:true});return;}
  if(!sim)return;let result;
  if(d.type==='stimulate'){result=paused?{ok:false,message:'Reprenez la simulation pour stimuler.'}:sim.stimulate(d.x,d.y);if(result.ok)self.postMessage({type:'impulse',...result});}
  if(d.type==='buy')result=sim.buy(d.id,d.quantity);
  if(d.type==='stabilize')result=sim.stabilize(d.id);
  if(d.type==='seed')result=sim.seedColony(d.species,d.x,d.y);
  if(d.type==='branch')result=sim.createBranch(d.species,d.a,d.b,d.x,d.y);
  if(d.type==='inspect'){self.postMessage({type:'environment',...sim.environment(d.x,d.y)});return;}
  if(d.type==='pause')paused=!!d.value;
  if(d.type==='speed'&&[1,2,4].includes(d.value))speed=d.value;
  if(d.type==='save'){persist(d.exported,d.requestId);return;}
  if(result){if(result.message)self.postMessage({type:'result',...result});if(result.ok){sim.aggregate();snapshot();if(d.type!=='stimulate')persist();}}
}catch(error){self.postMessage({type:'error',operation:d.type,message:error.message});}};
setInterval(()=>{if(!sim)return;const now=performance.now(),elapsed=Math.min((now-last)/1000,1);last=now;if(!paused){accumulator=Math.min(accumulator+elapsed*speed,.6);const start=performance.now();while(accumulator>=1/12&&performance.now()-start<38){sim.step(1/12);accumulator-=1/12;}}sendClock+=elapsed;fieldClock+=elapsed;saveClock+=elapsed;if(sendClock>.25){snapshot();sendClock=0;}if(fieldClock>1){sendFields();fieldClock=0;}if(saveClock>12){persist();saveClock=0;}},1000/30);
