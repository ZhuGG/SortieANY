import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,generateTerrain,WORLD,MUTATIONS} from '../simulation.mjs';

test('une graine reproduit le terrain et toute la simulation',()=>{
  assert.deepEqual(generateTerrain(427),generateTerrain(427));
  assert.notDeepEqual(generateTerrain(427),generateTerrain(428));
  const a=new Simulation(427),b=new Simulation(427);
  for(let i=0;i<120;i++){a.step();b.step();}
  assert.deepEqual(a.serialize(1000),b.serialize(1000));
});
test('chaque strate est accessible par le chenal procédural',()=>{
  for(const seed of [1,427,56812]){const sim=new Simulation(seed);for(let y=4;y<1532;y+=2){const center=128+Math.sin(y/2*.018+(seed%1000)/100)*28;assert.equal(sim.solid(center,y),false);}}
});
test('une impulsion produit de l’énergie et accélère seulement les cellules proches de la lignée',()=>{
  const sim=new Simulation(),before=sim.resources.energy,r=sim.stimulate(sim.origin.x,sim.origin.y);
  assert.ok(r.ok&&r.affected>0);assert.ok(sim.resources.energy>before);
  assert.ok(sim.cells.some(c=>c.own&&c.boost>0));assert.equal(sim.cells.some(c=>!c.own&&c.boost>0),false);
  assert.equal(sim.stimulate().ok,false,'limitation des impulsions dans le même pas de simulation');
});
test('les achats consomment la bonne ressource et refusent les soldes insuffisants',()=>{
  const sim=new Simulation();sim.resources.energy=200;const cost=sim.cost('auto');assert.ok(sim.buy('auto').ok);assert.equal(sim.resources.energy,200-cost);assert.equal(sim.upgrades.auto,1);assert.equal(sim.buy('auto').ok,false);assert.equal(sim.upgrades.auto,1);
  sim.resources.knowledge=100000;for(let i=0;i<5;i++)assert.ok(sim.buy('membrane').ok);assert.equal(sim.maxDepth,1536);assert.equal(sim.buy('membrane').ok,false);
});
test('la vie consomme, se reproduit, découvre des mutations et recycle les morts',()=>{
  const sim=new Simulation();const before=sim.resources.energy;for(let i=0;i<720;i++)sim.step();
  assert.ok(sim.resources.energy>before);assert.ok(sim.divisions>0);assert.ok(sim.discovered.includes('chlorophyll'));
  assert.ok(sim.cells.length<=WORLD.maxCells);assert.ok(sim.cells.some(c=>c.gen>1));
  const c=sim.cells.find(c=>!c.own);c.health=0;const index=sim.field(c.x,c.y),detritus=sim.detritus[index];sim.step();assert.ok(sim.detritus[index]>detritus);
  for(const f of ['nutrient','oxygen','toxin','detritus'])for(const value of sim[f])assert.ok(Number.isFinite(value)&&value>=0&&value<=100,f+' hors limites : '+value);
});
test('l’automatisation fonctionne sans clic manuel',()=>{
  const sim=new Simulation();sim.resources.energy=10000;sim.buy('auto');for(let i=0;i<73;i++)sim.step();assert.ok(sim.lastAuto>0);assert.equal(sim.totalClicks,0);assert.ok(sim.cells.some(c=>c.boost>0));
});
test('la génétique exige des découvertes et deux traits distincts',()=>{
  const sim=new Simulation();sim.resources.knowledge=5000;sim.resources.biomass=1000;sim.divisions=200;sim.discoverMutations();
  assert.ok(sim.stabilize('chlorophyll').ok);assert.ok(sim.stabilize('flagellum').ok);assert.ok(sim.unlocked.includes(1));
  assert.equal(sim.createBranch(0,1,1,100,100).ok,false);const result=sim.createBranch(1,0,1,sim.origin.x,sim.origin.y);assert.ok(result.ok);assert.equal(sim.branches.length,1);assert.ok(sim.cells.some(c=>c.own&&c.s===1&&c.genes===3));
  assert.equal(sim.seedColony(0,100,800).ok,false);
});
test('sauvegarde et retour hors ligne plafonné sans double attribution',()=>{
  const sim=new Simulation();for(let i=0;i<180;i++)sim.step();const save=sim.serialize(1_000_000),restored=Simulation.restore(save,1_000_000,false);
  assert.equal(restored.cells.length,sim.cells.length);assert.deepEqual(restored.resources,sim.resources);assert.equal(restored.seed,sim.seed);
  const later=Simulation.restore(save,1_000_000+3*86400*1000);assert.equal(later.offlineClaim,86400);assert.equal(later.resources.energy,save.resources.energy+save.rates.energy*86400);
  const again=Simulation.restore(later.serialize(4_000_000),4_000_000);assert.equal(again.resources.energy,later.resources.energy);
  assert.equal(Simulation.restore(save,500000).offlineClaim,0);
});
test('un import corrompu est refusé avant de remplacer le monde',()=>{
  const save=new Simulation().serialize();assert.throws(()=>Simulation.restore({...save,version:2}));
  const bad=structuredClone(save);bad.cells[0][1]=Infinity;assert.throws(()=>Simulation.restore(bad));
  const badFields=structuredClone(save);badFields.fields.nutrient[0]=-8;assert.throws(()=>Simulation.restore(badFields));
});
test('une extinction conserve les acquis et relance une population de secours',()=>{
  const sim=new Simulation();sim.upgrades.metabolism=3;sim.cells=sim.cells.filter(c=>!c.own);for(let i=0;i<12;i++)sim.step();assert.ok(sim.cells.some(c=>c.own));assert.equal(sim.upgrades.metabolism,3);assert.ok(sim.events.some(e=>e.kind==='crisis'));
});
