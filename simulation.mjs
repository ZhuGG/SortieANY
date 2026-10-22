export const WORLD = { width:256, height:1536, tile:2, gridWidth:128, gridHeight:768, fieldWidth:32, fieldHeight:192, fieldTile:8, maxCells:20000 };
export const STRATA = [
  {name:'Eaux primordiales',short:'Eaux primordiales',color:'#b6cfae',temp:19},
  {name:'Jardins suspendus',short:'Jardins suspendus',color:'#b8a0ca',temp:15},
  {name:'Les eaux silencieuses',short:'Eaux silencieuses',color:'#94b8ba',temp:11},
  {name:'Sédiments oubliés',short:'Sédiments oubliés',color:'#d0ad7f',temp:14},
  {name:'Cathédrales minérales',short:'Cathédrales minérales',color:'#b89bc9',temp:28},
  {name:'Le cœur thermique',short:'Cœur thermique',color:'#db9c83',temp:64},
];
export const SPECIES = [
  {name:'Primordiales',color:'#c9acd9',dark:'#866695',light:'#f0e1ec',trait:'Photosynthèse · Aquatique',kind:'photo',speed:.8,ideal:110,depth:0},
  {name:'Flagellaires',color:'#a7c9b0',dark:'#668c7e',light:'#e1ead4',trait:'Mobilité · Assimilation',kind:'grazer',speed:2.7,ideal:320,depth:1},
  {name:'Recycleuses',color:'#dcbb85',dark:'#9b7859',light:'#f4e4bd',trait:'Décomposition · Recyclage',kind:'decomposer',speed:.5,ideal:650,depth:2},
  {name:'Prédatrices',color:'#d8939d',dark:'#96516f',light:'#f0c6cc',trait:'Prédation · Mobilité',kind:'predator',speed:3,ideal:600,depth:2},
  {name:'Symbiotiques',color:'#b7a6df',dark:'#716393',light:'#e8dafa',trait:'Symbiose · Coopération',kind:'symbiont',speed:1.1,ideal:850,depth:3},
  {name:'Chimiotrophes',color:'#93c6ca',dark:'#54868d',light:'#d3ece0',trait:'Chimiosynthèse · Obscurité',kind:'chemo',speed:.7,ideal:1120,depth:4},
  {name:'Thermophiles',color:'#e0a282',dark:'#9e635c',light:'#f6d6ab',trait:'Thermorésistance · Minéraux',kind:'thermo',speed:.9,ideal:1400,depth:5},
];
export const UPGRADES = [
  {id:'impulse',name:'Impulsion vitale',description:'+6 énergie par clic · rayon +3 m',cost:45,resource:'energy',icon:0},
  {id:'metabolism',name:'Métabolisme',description:'+25 % de production passive',cost:70,resource:'biomass',icon:1},
  {id:'division',name:'Division cellulaire',description:'+20 % de vitesse de division',cost:110,resource:'biomass',icon:2},
  {id:'auto',name:'Résonance autonome',description:'Stimule vos colonies toutes les 5 s',cost:160,resource:'energy',icon:3,max:12},
  {id:'membrane',name:'Membrane adaptative',description:'Résistance accrue · profondeur +256 m',cost:85,resource:'knowledge',icon:4,max:5},
  {id:'research',name:'Mémoire du vivant',description:'+35 % de connaissances produites',cost:145,resource:'energy',icon:5},
];
export const MUTATIONS = [
  {id:'chlorophyll',name:'Chlorophylle mauve',description:'Photosynthèse +45 %. Les cellules consomment 15 % de nutriments en plus.',cost:45,requirement:8,unlock:0},
  {id:'flagellum',name:'Flagelle spiralé',description:'Débloque les Flagellaires. Mobilité ×1,5, entretien +10 %.',cost:85,requirement:35,unlock:1},
  {id:'recycle',name:'Digestion extracellulaire',description:'Débloque les Recycleuses. Transforme les restes en nutriments.',cost:135,requirement:85,unlock:2},
  {id:'predation',name:'Capture membranaire',description:'Débloque les Prédatrices. Une nouvelle chaîne alimentaire apparaît.',cost:195,requirement:150,unlock:3},
  {id:'symbiosis',name:'Réseau symbiotique',description:'Débloque les Symbiotiques. Les voisines partagent leur énergie.',cost:280,requirement:250,unlock:4},
  {id:'chemo',name:'Voie chimiosynthétique',description:'Débloque les Chimiotrophes. Produit de l’énergie sans lumière.',cost:420,requirement:400,unlock:5},
  {id:'thermal',name:'Protéines thermiques',description:'Débloque les Thermophiles. Exploite la chaleur des profondeurs.',cost:650,requirement:600,unlock:6},
];
export function seededRandom(seed){let s=seed>>>0;const f=()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296};f.state=()=>s>>>0;f.restore=n=>s=n>>>0;return f;}
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function generateTerrain(seed){
  const {gridWidth:w,gridHeight:h}=WORLD,rng=seededRandom(seed),map=new Uint8Array(w*h),phase=(seed%1000)/100;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const wy=y*2,edge=3+Math.sin(y*.047+phase)*2+Math.sin(y*.12)*1.5;
    const bent=wy+Math.sin(x*.075+phase)*13+Math.sin(x*.19)*4;
    const band=((bent+11)%83+83)%83;
    const gapA=34+Math.sin(wy*.017+phase)*22,gapB=92+Math.sin(wy*.012)*17;
    const shelf=wy>39&&band<(9+Math.sin(wy*.008)*3)&&Math.abs(x-gapA)>9&&Math.abs(x-gapB)>8;
    const island=Math.sin(x*.11+phase)*Math.cos(y*.065)+Math.sin(x*.21-y*.09)*.33>1.06;
    if(x<edge||x>w-edge-1||y===h-1||shelf||island)map[y*w+x]=rng()<.075?2:1;
  }
  // A connected, winding water channel keeps every stratum reachable.
  for(let y=0;y<h-1;y++){const mid=Math.floor(w*.5+Math.sin(y*.018+phase)*14);for(let x=mid-4;x<=mid+4;x++)map[y*w+x]=0;}
  return map;
}
export class Simulation{
  constructor(seed=427){
    this.seed=seed;this.rng=seededRandom(seed+41);this.terrain=generateTerrain(seed);this.time=0;this.tickCount=0;this.cells=[];this.nextId=1;
    this.resources={energy:145,biomass:90,knowledge:36};this.rates={energy:0,biomass:0,knowledge:0};this.upgrades=Object.fromEntries(UPGRADES.map(u=>[u.id,0]));
    this.discovered=[];this.stabilized=[];this.unlocked=[0];this.branches=[];this.events=[];this.divisions=0;this.totalClicks=0;this.combo=0;this.lastClick=-20;this.lastAuto=0;this.maxDepth=256;this.deepest=0;this.lastWarning=-100;this.lastExtinction=-100;this.won=false;this.offlineClaim=0;
    const n=WORLD.fieldWidth*WORLD.fieldHeight;this.nutrient=new Float32Array(n);this.oxygen=new Float32Array(n);this.toxin=new Float32Array(n);this.detritus=new Float32Array(n);this.density=new Uint16Array(n);this.flow=new Float32Array(n);this.fieldMask=new Uint8Array(n);this.spatialHeads=new Int32Array(n);this.spatialLinks=new Int32Array(WORLD.maxCells);
    for(let i=0;i<n;i++){const x=(i%32)*8+4,y=Math.floor(i/32)*8+4;this.nutrient[i]=55+this.rng()*40;this.oxygen[i]=clamp(90-y*.052,12,95);this.detritus[i]=this.rng()*12;this.flow[i]=Math.sin(y*.035+x*.07)*.55;this.fieldMask[i]=this.solid(x,y)?1:0;}
    for(let s=0;s<7;s++)for(let group=0;group<8;group++){
      const center=this.findWater(20+this.rng()*216,clamp(SPECIES[s].ideal+(this.rng()-.5)*240,20,1520));
      for(let j=0;j<72;j++){const p=this.findWater(center.x+(this.rng()-.5)*32,center.y+(this.rng()-.5)*28);this.addCell(s,p.x,p.y,false);}
    }
    this.origin=this.findWater(126,114);
    for(let i=0;i<420;i++){const p=this.findWater(this.origin.x+(this.rng()-.5)*48,this.origin.y+(this.rng()-.5)*35);this.addCell(0,p.x,p.y,true);}
    this.event('Une première cellule, une infinité de possibles.','discovery');this.event('Votre lignée prend racine dans les eaux primordiales.','birth');this.aggregate();
  }
  solid(x,y){return x<2||x>=254||y<2||y>=1534||!!this.terrain[clamp(Math.floor(y/2),0,767)*128+clamp(Math.floor(x/2),0,127)];}
  field(x,y){return clamp(Math.floor(y/8),0,191)*32+clamp(Math.floor(x/8),0,31);}
  findWater(x,y){x=clamp(x,5,251);y=clamp(y,5,1530);if(!this.solid(x,y))return{x,y};for(let r=2;r<60;r+=2)for(let j=0;j<12;j++){const a=j*Math.PI/6,nx=clamp(x+Math.cos(a)*r,5,251),ny=clamp(y+Math.sin(a)*r,5,1530);if(!this.solid(nx,ny))return{x:nx,y:ny};}return{x:128+Math.sin(y/2*.018+(this.seed%1000)/100)*28,y};}
  addCell(s,x,y,own=false,gen=1,genes=0){if(this.cells.length>=WORLD.maxCells)return;this.cells.push({id:this.nextId++,x,y,s,own,gen,genes,age:this.rng()*30,reserve:10+this.rng()*7,health:1,angle:this.rng()*Math.PI*2,boost:0});}
  event(text,kind='info'){this.events.unshift({text,kind,time:this.time,id:this.tickCount+'-'+this.nextId+'-'+this.events.length});this.events=this.events.slice(0,40);}
  cost(id,quantity=1){const u=UPGRADES.find(x=>x.id===id);if(!u)return Infinity;let cost=0;for(let i=0;i<quantity;i++)cost+=Math.ceil(u.cost*Math.pow(1.58,this.upgrades[id]+i));return cost;}
  buy(id,quantity=1){const u=UPGRADES.find(x=>x.id===id);if(!u||![1,10].includes(quantity))return{ok:false,message:'Amélioration inconnue.'};let bought=0;for(let i=0;i<quantity;i++){if(this.upgrades[id]>=(u.max||100))break;const price=this.cost(id);if(this.resources[u.resource]<price)break;this.resources[u.resource]-=price;this.upgrades[id]++;bought++;}if(!bought)return{ok:false,message:'Ressources insuffisantes.'};this.maxDepth=Math.min(1536,256*(1+this.upgrades.membrane));this.event(u.name+' · niveau '+this.upgrades[id]+'.','upgrade');return{ok:true,message:u.name+' amélioré'+(bought>1?' ×'+bought:'')+'.'};}
  stimulate(x=this.origin.x,y=this.origin.y,automated=false){
    if(!Number.isFinite(x)||!Number.isFinite(y))return{ok:false};
    if(!automated){if(this.time-this.lastClick<.075)return{ok:false};this.combo=this.time-this.lastClick<2.4?Math.min(this.combo+1,20):1;this.lastClick=this.time;this.totalClicks++;}
    const multiplier=automated?1:1+this.combo*.05,energy=(8+this.upgrades.impulse*6)*multiplier*(automated?.5:1),radius=23+this.upgrades.impulse*3;let affected=0;
    this.resources.energy+=energy;
    for(const c of this.cells)if(c.own&&(c.x-x)**2+(c.y-y)**2<radius*radius){c.boost=Math.max(c.boost,3+this.upgrades.impulse*.3);affected++;}
    return{ok:true,energy,affected,radius,multiplier,x,y,auto:automated};
  }
  stabilize(id){const m=MUTATIONS.find(x=>x.id===id);if(!m||!this.discovered.includes(id)||this.stabilized.includes(id))return{ok:false,message:'Mutation indisponible.'};if(this.resources.knowledge<m.cost)return{ok:false,message:'Connaissances insuffisantes.'};this.resources.knowledge-=m.cost;this.stabilized.push(id);if(!this.unlocked.includes(m.unlock))this.unlocked.push(m.unlock);this.event('Mutation stabilisée : '+m.name+'.','mutation');return{ok:true,message:m.name+' stabilisée.'};}
  discoverMutations(){for(const m of MUTATIONS)if(this.divisions>=m.requirement&&!this.discovered.includes(m.id)){this.discovered.push(m.id);this.event('Mutation découverte : '+m.name+'.','mutation');}}
  seedColony(s,x,y,genes=0,free=false){
    if(!this.unlocked.includes(s))return{ok:false,message:'Stabilisez la mutation de cette branche.'};
    if(y>this.maxDepth)return{ok:false,message:'Améliorez la membrane pour coloniser cette profondeur.'};
    if(this.cells.length+24>WORLD.maxCells)return{ok:false,message:'Capacité de ce monde atteinte : 20 000 cellules.'};
    if(!free&&this.resources.biomass<35)return{ok:false,message:'Il faut 35 biomasse pour implanter une colonie.'};
    const p=this.findWater(x,y);if(p.y>this.maxDepth)return{ok:false,message:'Aucune poche d’eau accessible à cette profondeur.'};if(!free)this.resources.biomass-=35;
    for(let j=0;j<24;j++){const q=this.findWater(p.x+(this.rng()-.5)*14,p.y+(this.rng()-.5)*12);this.addCell(s,q.x,q.y,true,1,genes);}
    this.deepest=Math.max(this.deepest,p.y);this.event(SPECIES[s].name+' : une nouvelle colonie à '+Math.round(p.y)+' m.','birth');return{ok:true,message:'24 cellules implantées.',x:p.x,y:p.y};
  }
  createBranch(s,a,b,x,y){
    if(this.stabilized.length<2)return{ok:false,message:'Stabilisez deux mutations pour ouvrir l’éditeur.'};
    if(![0,1,2,3].includes(a)||![0,1,2,3].includes(b)||a===b)return{ok:false,message:'Choisissez deux traits différents.'};
    if(this.resources.knowledge<120||this.resources.biomass<35)return{ok:false,message:'Il faut 120 connaissances et 35 biomasse.'};
    const genes=(1<<a)|(1<<b),result=this.seedColony(s,x,y,genes);if(!result.ok)return result;this.resources.knowledge-=120;this.branches.push({s,genes,created:this.time});this.event('Une branche hybride vient de naître.','mutation');return{...result,message:'Branche hybride implantée : deux traits, un nouveau chemin.'};
  }
  diffuse(){
    const w=32,n=this.nutrient.length,dt=1/12;
    for(const [field,d] of [[this.nutrient,.8],[this.oxygen,1.1],[this.toxin,.5]]){
      const copy=field.slice();for(let i=33;i<n-33;i++){if(i%w===0||i%w===31||this.fieldMask[i])continue;let sum=0,count=0;for(const k of [i-1,i+1,i-w,i+w])if(!this.fieldMask[k]){sum+=copy[k];count++;}field[i]=clamp(copy[i]+(sum-count*copy[i])*d*dt,0,100);}
    }
    for(let i=0;i<n;i++){const y=(i/32|0)*8;this.nutrient[i]=Math.min(100,this.nutrient[i]+dt*(.1+(y>1024?.35:.04)));this.oxygen[i]=clamp(this.oxygen[i]+dt*(y<32?1:.002),0,100);this.toxin[i]=Math.max(0,this.toxin[i]-dt*.025);}
  }
  step(dt=1/12){
    this.time+=dt;this.tickCount++;if(this.time-this.lastClick>2.4)this.combo=0;
    if(this.tickCount%4===0)this.diffuse();this.density.fill(0);this.spatialHeads.fill(-1);for(let i=0;i<this.cells.length;i++){const c=this.cells[i],k=this.field(c.x,c.y);this.density[k]++;this.spatialLinks[i]=this.spatialHeads[k];this.spatialHeads[k]=i;}
    const births=[],dead=new Set();let energy=0,biomass=0,knowledge=0;
    // Stagger individual metabolism across three cohorts. Each cell receives the full
    // elapsed time at 4 Hz, while the world clock and spatial field remain at 12 Hz.
    const tickDt=dt;dt*=3;
    for(let index=0;index<this.cells.length;index++){
      if(dead.has(index))continue;const c=this.cells[index],species=SPECIES[c.s],k=this.field(c.x,c.y),density=this.density[k],own=c.own;
      if(c.health<=0){dead.add(index);this.detritus[k]=Math.min(100,this.detritus[k]+3);continue;}
      if(c.id%3!==this.tickCount%3)continue;
      c.age+=dt;c.boost=Math.max(0,c.boost-dt);const boosted=c.boost>0?2.5:1,light=Math.max(.015,1-c.y/450),temp=this.temperature(c.x,c.y),geneEff=c.genes&1?1.2:1;
      let food=0;
      if(species.kind==='photo'){
        const chlorophyll=own&&this.stabilized.includes('chlorophyll')?1.45:1;
        const consumption=chlorophyll>1?1.15:1;food=Math.min(this.nutrient[k]/consumption,.9*light*chlorophyll*geneEff*boosted*dt);this.nutrient[k]=Math.max(0,this.nutrient[k]-food*consumption);this.oxygen[k]=Math.min(100,this.oxygen[k]+food*.65);
      }else if(species.kind==='decomposer'){
        food=Math.min(this.detritus[k],.8*boosted*dt);this.detritus[k]-=food;this.nutrient[k]=Math.min(100,this.nutrient[k]+food*.8);food+=Math.min(this.nutrient[k],.12*dt);this.nutrient[k]=Math.max(0,this.nutrient[k]-.12*dt);
      }else if(species.kind==='predator'){
        let examined=0;if(c.reserve<20)for(let preyIndex=this.spatialHeads[k];preyIndex!==-1&&examined<32;preyIndex=this.spatialLinks[preyIndex],examined++){const prey=this.cells[preyIndex];if(preyIndex===index||prey.s===c.s||dead.has(preyIndex))continue;if((prey.x-c.x)**2+(prey.y-c.y)**2<10&&this.rng()<.05*dt){dead.add(preyIndex);food+=5;this.detritus[k]=Math.min(100,this.detritus[k]+1);break;}}
        food+=Math.min(this.nutrient[k],.05*dt);this.nutrient[k]=Math.max(0,this.nutrient[k]-.05*dt);
      }else if(species.kind==='chemo'||species.kind==='thermo'){
        const match=species.kind==='thermo'?Math.max(.1,(temp-15)/40):(.3+c.y/1200);
        food=Math.min(this.nutrient[k],.55*match*boosted*dt*geneEff);this.nutrient[k]-=food;this.toxin[k]=Math.min(100,this.toxin[k]+food*.08);
      }else{
        food=Math.min(this.nutrient[k],.5*boosted*dt*geneEff);this.nutrient[k]-=food;
        if(species.kind==='symbiont'){let neighborIndex=this.spatialHeads[k];if(neighborIndex===index)neighborIndex=this.spatialLinks[index];const neighbor=neighborIndex===-1?null:this.cells[neighborIndex];if(neighbor&&!dead.has(neighborIndex)&&c.reserve>neighbor.reserve+2){const transfer=Math.min(.12*dt,c.reserve-2);c.reserve-=transfer;neighbor.reserve+=transfer;}food*=1.15;}
      }
      if(species.kind!=='photo'&&species.kind!=='chemo'&&species.kind!=='thermo')this.oxygen[k]=Math.max(0,this.oxygen[k]-food*.2);
      const upkeep=(.16+(density>75?(density-75)*.003:0))*(c.genes&1?1.15:1)*(c.genes&2?1.1:1)*dt;
      c.reserve+=food-upkeep;
      const membrane=own?this.upgrades.membrane:Math.floor(c.y/256),heatTolerance=species.kind==='thermo'?85:38+(c.genes&4?20:0)+membrane*4;
      const stress=Math.max(0,temp-heatTolerance)*.0015+Math.max(0,this.toxin[k]-45)*.0006+(!['chemo','thermo','photo'].includes(species.kind)?Math.max(0,12-this.oxygen[k])*.002:0)+(own&&c.y>this.maxDepth?.025:0);
      c.health=c.health<=0?0:clamp(c.health+(c.reserve>2?.016:-.045)*dt-stress*dt,0,1);
      if(c.health<=0||c.reserve<-.8||c.age>180+this.rng()*180){dead.add(index);this.detritus[k]=Math.min(100,this.detritus[k]+3);this.nutrient[k]=Math.min(100,this.nutrient[k]+.4);continue;}
      if(Math.floor(this.tickCount/3)%3===0)c.angle+=(this.rng()-.5)*1.6;
      let angle=c.angle,speed=species.speed*(c.genes&2?1.5:1)*(own&&this.stabilized.includes('flagellum')?1.5:1);
      if(species.kind==='predator'){let examined=0;for(let targetIndex=this.spatialHeads[k];targetIndex!==-1&&examined<32;targetIndex=this.spatialLinks[targetIndex],examined++){const p=this.cells[targetIndex];if(p.s!==c.s&&!dead.has(targetIndex)){angle=Math.atan2(p.y-c.y,p.x-c.x);break;}}}
      const nx=c.x+(Math.cos(angle)*speed+this.flow[k]*.5)*dt,ny=c.y+(Math.sin(angle)*speed+(species.kind==='decomposer'?.45:.05))*dt;
      if(!this.solid(nx,ny)){c.x=nx;c.y=ny;}else c.angle+=Math.PI*.65;
      const threshold=own?20/(1+this.upgrades.division*.12):21;
      if(c.reserve>threshold&&density<105&&this.cells.length+births.length-dead.size<WORLD.maxCells&&this.rng()<dt*.24*(own?1+this.upgrades.division*.2:1)){
        const nx=c.x+(this.rng()-.5)*5,ny=c.y+(this.rng()-.5)*5;
        if(!this.solid(nx,ny)){c.reserve*=.52;births.push({...c,id:this.nextId++,x:nx,y:ny,age:0,gen:c.gen+1,angle:this.rng()*Math.PI*2,boost:0});if(own){this.divisions++;knowledge+=.15*(1+this.upgrades.research*.35);if(this.rng()<.025){const genes=c.genes|(1<<Math.floor(this.rng()*4));births[births.length-1].genes=genes;}}}
      }
      if(own){const productivity=Math.max(.1,c.health)*(1+this.upgrades.metabolism*.25)*(c.boost>0?1.8:1);energy+=.009*productivity*dt;biomass+=.0035*productivity*dt;knowledge+=.0008*productivity*(1+this.upgrades.research*.35)*dt;this.deepest=Math.max(this.deepest,c.y);}
    }
    if(dead.size)this.cells=this.cells.filter((_,i)=>!dead.has(i));this.cells.push(...births);
    this.resources.energy+=energy;this.resources.biomass+=biomass;this.resources.knowledge+=knowledge;
    const smoothing=.07;for(const [key,gain]of Object.entries({energy,biomass,knowledge}))this.rates[key]=this.rates[key]*(1-smoothing)+gain/tickDt*smoothing;
    if(this.tickCount%12===0){this.discoverMutations();this.aggregate();if(this.population.owned===0&&this.time-this.lastExtinction>30){this.lastExtinction=this.time;this.seedColony(0,this.origin.x,this.origin.y,0,true);this.event('La colonie s’éteint. Les spores de secours relancent votre lignée.','crisis');}if(this.population.owned>0&&this.population.health<.45&&this.time-this.lastWarning>45){this.lastWarning=this.time;this.event('Votre lignée est fragilisée. Cherchez un milieu plus riche.','crisis');}}
    if(this.upgrades.auto>0&&this.time-this.lastAuto>5/Math.sqrt(this.upgrades.auto)){
      this.lastAuto=this.time;const owned=this.cells.filter(c=>c.own);const c=owned[Math.floor(this.rng()*owned.length)];if(c)this.stimulate(c.x,c.y,true);
    }
    if(!this.won&&this.deepest>1480){this.won=true;this.resources.knowledge+=2000;this.event('Le cœur du monde est vivant. Votre lignée a traversé les six strates ! +2 000 connaissances.','discovery');}
  }
  temperature(x,y){const layer=Math.min(5,y/256|0);return STRATA[layer].temp+Math.sin(x*.08+y*.02)*3;}
  aggregate(){const bySpecies=Array.from({length:7},()=>({total:0,owned:0,health:0,gen:1,x:0,y:0}));let owned=0,health=0;for(const c of this.cells){const s=bySpecies[c.s];s.total++;s.health+=c.health;s.gen=Math.max(s.gen,c.gen);if(c.own){s.owned++;s.x+=c.x;s.y+=c.y;owned++;health+=c.health;}}for(const s of bySpecies){s.health=s.total?s.health/s.total:0;s.x=s.owned?s.x/s.owned:128;s.y=s.owned?s.y/s.owned:100;}this.population={total:this.cells.length,owned,health:owned?health/owned:0,bySpecies};}
  environment(x,y){const k=this.field(x,y);return{nutrient:this.nutrient[k],oxygen:this.oxygen[k],toxin:this.toxin[k],detritus:this.detritus[k],temp:this.temperature(x,y),light:Math.max(0,100-y/4.5)};}
  snapshot(){const packed=new Float32Array(this.cells.length*7);for(let i=0;i<this.cells.length;i++){const c=this.cells[i],j=i*7;packed[j]=c.x;packed[j+1]=c.y;packed[j+2]=c.s;packed[j+3]=c.own?1:0;packed[j+4]=c.health;packed[j+5]=c.boost;packed[j+6]=c.genes;}return{packed,time:this.time,resources:{...this.resources},rates:{...this.rates},upgrades:{...this.upgrades},population:this.population,discovered:[...this.discovered],stabilized:[...this.stabilized],unlocked:[...this.unlocked],branches:this.branches.length,divisions:this.divisions,totalClicks:this.totalClicks,combo:this.combo,maxDepth:this.maxDepth,deepest:this.deepest,events:this.events.slice(0,12),won:this.won};}
  serialize(now=Date.now()){return{version:1,seed:this.seed,savedAt:now,rng:this.rng.state(),time:this.time,tickCount:this.tickCount,nextId:this.nextId,resources:this.resources,rates:this.rates,upgrades:this.upgrades,discovered:this.discovered,stabilized:this.stabilized,unlocked:this.unlocked,branches:this.branches,events:this.events,divisions:this.divisions,totalClicks:this.totalClicks,maxDepth:this.maxDepth,deepest:this.deepest,origin:this.origin,won:this.won,cells:this.cells.map(c=>[c.id,...['x','y','s','own','gen','genes','age','reserve','health','angle','boost'].map(k=>typeof c[k]==='number'?Math.round(c[k]*1000)/1000:c[k])]),fields:Object.fromEntries(['nutrient','oxygen','toxin','detritus'].map(k=>[k,Array.from(this[k],v=>Math.round(v*100)/100)]))};}
  static restore(data,now=Date.now(),offline=true){
    if(!data||data.version!==1||!Number.isInteger(data.seed)||data.seed<0||data.seed>4294967295||!Number.isFinite(data.savedAt)||!Number.isFinite(data.time)||data.time<0||!Array.isArray(data.cells)||data.cells.length>WORLD.maxCells)throw new Error('Sauvegarde incompatible ou endommagée.');
    for(const k of ['energy','biomass','knowledge'])if(!Number.isFinite(data.resources?.[k])||data.resources[k]<0||!Number.isFinite(data.rates?.[k])||data.rates[k]<0)throw new Error('Ressources invalides.');
    for(const u of UPGRADES)if(!Number.isInteger(data.upgrades?.[u.id])||data.upgrades[u.id]<0||data.upgrades[u.id]>(u.max||100))throw new Error('Améliorations invalides.');
    const allowedIds=MUTATIONS.map(m=>m.id);for(const key of ['discovered','stabilized'])if(!Array.isArray(data[key])||data[key].some(id=>!allowedIds.includes(id)))throw new Error('Génome invalide.');
    if(!Array.isArray(data.unlocked)||!data.unlocked.includes(0)||data.unlocked.some(s=>!Number.isInteger(s)||s<0||s>6)||!Array.isArray(data.branches)||data.branches.some(b=>!Number.isInteger(b.s)||!Number.isInteger(b.genes)))throw new Error('Lignées invalides.');
    if(!Number.isFinite(data.divisions)||data.divisions<0||!Number.isFinite(data.totalClicks)||!Number.isFinite(data.deepest)||!Number.isFinite(data.origin?.x)||!Number.isFinite(data.origin?.y)||!Number.isInteger(data.nextId)||!Number.isInteger(data.tickCount)||!Number.isInteger(data.rng))throw new Error('État du monde invalide.');
    const sim=new Simulation(data.seed);for(const k of ['time','tickCount','nextId','resources','rates','upgrades','discovered','stabilized','unlocked','branches','divisions','totalClicks','deepest','origin','won'])sim[k]=structuredClone(data[k]);
    sim.events=Array.isArray(data.events)?data.events.filter(e=>typeof e.text==='string'&&Number.isFinite(e.time)).slice(0,40):[];
    sim.maxDepth=Math.min(1536,256*(1+sim.upgrades.membrane));sim.rng.restore(data.rng);sim.lastAuto=sim.time;sim.lastClick=sim.time-20;
    sim.cells=data.cells.map(row=>{if(!Array.isArray(row)||row.length!==12||row.some((v,i)=>i!==4&&!Number.isFinite(v))||typeof row[4]!=='boolean'||row[1]<0||row[1]>=256||row[2]<0||row[2]>=1536||!Number.isInteger(row[3])||row[3]<0||row[3]>6||row[9]<0||row[9]>1||row[8]<-1)throw new Error('Cellules invalides.');return Object.fromEntries(['id','x','y','s','own','gen','genes','age','reserve','health','angle','boost'].map((k,i)=>[k,row[i]]));});
    for(const k of ['nutrient','oxygen','toxin','detritus']){if(!Array.isArray(data.fields?.[k])||data.fields[k].length!==6144||data.fields[k].some(v=>!Number.isFinite(v)||v<0||v>100))throw new Error('Milieu invalide.');sim[k]=Float32Array.from(data.fields[k]);}
    sim.offlineClaim=offline?clamp((now-data.savedAt)/1000,0,86400):0;for(const k of ['energy','biomass','knowledge'])sim.resources[k]+=sim.rates[k]*sim.offlineClaim;
    if(sim.offlineClaim>30)sim.event('Pendant votre absence : '+Math.floor(sim.offlineClaim/60)+' min de production préservée.','offline');sim.aggregate();return sim;
  }
}
