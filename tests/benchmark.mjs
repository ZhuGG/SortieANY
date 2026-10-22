import {Simulation} from '../ecosystem.mjs';
const s=new Simulation(427);while(s.cells.length<10000){const p=s.findWater(10+s.rng()*236,25+s.rng()*1470);s.addCell(s.rng()*7|0,p.x,p.y,false);}
while(s.organisms.length<128){const p=s.findWater(15+s.rng()*226,100+s.rng()*1300);s.addOrganism(['filter','borer','weaver','grazer','hunter'][s.organisms.length%5],p.x,p.y,false,'adult');}
const measured=[];for(let i=0;i<240;i++){const t=performance.now();s.step();if(i>=120)measured.push(performance.now()-t);}measured.sort((a,b)=>a-b);
console.log(JSON.stringify({requestedCells:10000,cells:s.cells.length,organisms:s.organisms.length,meanMs:Math.round(measured.reduce((a,b)=>a+b,0)/measured.length),medianMs:Math.round(measured[measured.length/2|0]),p95Ms:Math.round(measured[measured.length*.95|0]),budgetMs:83,physicsHz:4},null,2));
