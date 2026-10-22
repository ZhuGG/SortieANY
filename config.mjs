export const WORLD={width:256,height:1536,tile:2,gridWidth:128,gridHeight:768,maxCells:20000,maxOrganisms:128};
export const STRATA=[
{name:'Le berceau',subtitle:'Bassins de lumière',color:'#b7cead',rock:'#6e7562',light:'#cbd4ad',water:'#3e5350',bg:'#272f31',architecture:'bassins',temp:19},
{name:'Les jardins inversés',subtitle:'Racines suspendues',color:'#c5a3ce',rock:'#66516c',light:'#b391bd',water:'#493a59',bg:'#2b2435',architecture:'racines',temp:16},
{name:'La faille bleue',subtitle:'Colonnes et courants',color:'#91b9c9',rock:'#465e70',light:'#8baec0',water:'#2d465d',bg:'#202c3d',architecture:'failles',temp:10},
{name:'La mémoire des sols',subtitle:'Terrasses sédimentaires',color:'#d4b07a',rock:'#80684f',light:'#d3af79',water:'#514b3d',bg:'#332c2b',architecture:'terrasses',temp:15},
{name:'Les cathédrales',subtitle:'Géodes et arches',color:'#bcace3',rock:'#63527f',light:'#c4b1e7',water:'#3f355d',bg:'#292238',architecture:'geodes',temp:29},
{name:'Le cœur du monde',subtitle:'Cheminées thermales',color:'#e0a080',rock:'#825554',light:'#e0a780',water:'#593b42',bg:'#38252f',architecture:'cheminees',temp:62},
];
export const SPECIES=[
{name:'Primordiales',color:'#d2b7df',dark:'#82638e',light:'#f3eddd',kind:'photo',trait:'Photosynthèse',speed:.7,ideal:120},
{name:'Flagellaires',color:'#a9cdb1',dark:'#638d7d',light:'#e1ead4',kind:'grazer',trait:'Mobilité',speed:2.4,ideal:330},
{name:'Recycleuses',color:'#e5b56b',dark:'#9b7859',light:'#f4e4bd',kind:'decomposer',trait:'Décomposition',speed:.6,ideal:740},
{name:'Prédatrices',color:'#d995a8',dark:'#96516f',light:'#f0c6cc',kind:'predator',trait:'Prédation',speed:2.9,ideal:540},
{name:'Symbiotiques',color:'#b7a6df',dark:'#716393',light:'#e8dafa',kind:'symbiont',trait:'Coopération',speed:1,ideal:920},
{name:'Chimiotrophes',color:'#93c6ca',dark:'#54868d',light:'#d3ece0',kind:'chemo',trait:'Chimiosynthèse',speed:.7,ideal:1130},
{name:'Thermophiles',color:'#e0a282',dark:'#9e635c',light:'#f6d6ab',kind:'thermo',trait:'Thermorésistance',speed:.8,ideal:1410},
];
export const UPGRADES=[
{id:'impulse',name:'Impulsion vitale',description:'+5 énergie / clic · portée +2 m',anatomy:'Organes pulsants',cost:35,resource:'energy',icon:'ϟ'},
{id:'metabolism',name:'Chloroplastes',description:'+25 % de rendement biologique',anatomy:'Pigments et organelles',cost:60,resource:'biomass',icon:'❋'},
{id:'division',name:'Segmentation',description:'+20 % de vitesse de division',anatomy:'Corps segmenté',cost:95,resource:'biomass',icon:'◈'},
{id:'auto',name:'Résonance autonome',description:'Une impulsion toutes les 5 s',anatomy:'Anneaux rythmiques',cost:130,resource:'energy',icon:'◎',max:12},
{id:'membrane',name:'Membrane adaptative',description:'Profondeur accessible +256 m',anatomy:'Carapace et nervures',cost:70,resource:'knowledge',icon:'⬡',max:5},
{id:'flagella',name:'Flagelles',description:'+30 % de mobilité · recherche de nourriture',anatomy:'Appendices articulés',cost:80,resource:'biomass',icon:'≋'},
{id:'adhesion',name:'Adhésion cellulaire',description:'Filaments · partage des réserves',anatomy:'Ponts entre cellules',cost:65,resource:'knowledge',icon:'⋈'},
{id:'secretion',name:'Glandes sécrétrices',description:'Acides · biofilms · capacités biologiques',anatomy:'Glandes ambrées',cost:110,resource:'knowledge',icon:'◒'},
{id:'research',name:'Mémoire du vivant',description:'+35 % de connaissances produites',anatomy:'Noyau ramifié',cost:100,resource:'energy',icon:'⌘'},
];
export const MUTATIONS=[
{id:'chlorophyll',name:'Chlorophylle mauve',description:'Photosynthèse +40 % · respiration du milieu',cost:40,requirement:12,unlock:0},
{id:'flagellum',name:'Flagelle spiralé',description:'Une branche mobile capable de suivre la nourriture',cost:75,requirement:55,unlock:1},
{id:'recycle',name:'Digestion externe',description:'Transformer les restes en nutriments',cost:110,requirement:120,unlock:2},
{id:'predation',name:'Capture membranaire',description:'Une nouvelle maille dans la chaîne alimentaire',cost:180,requirement:200,unlock:3},
{id:'symbiosis',name:'Réseau symbiotique',description:'Échanger des réserves entre voisines',cost:240,requirement:320,unlock:4},
{id:'chemo',name:'Chimiosynthèse',description:'Exploiter les minéraux sans lumière',cost:350,requirement:500,unlock:5},
{id:'thermal',name:'Protéines thermiques',description:'Vivre au contact des sources chaudes',cost:520,requirement:750,unlock:6},
];
export const FAMILIES=[
{id:'filter',name:'Filtrant',plural:'Filtrants',color:'#a9cdb1',role:'Filtration',description:'Concentre les particules du courant en biomasse.',ability:'Couronne filtrante',cost:450,knowledge:100,unlockAt:1800,trait:'adhesion',icon:'❋'},
{id:'borer',name:'Foreur',plural:'Foreurs',color:'#e5b56b',role:'Excavation',description:'Dissout les roches et ouvre de nouveaux passages.',ability:'Percée enzymatique',cost:650,knowledge:150,unlockAt:2100,trait:'secretion',icon:'⋗'},
{id:'weaver',name:'Tisseur',plural:'Tisseurs',color:'#d2b7df',role:'Architecture',description:'Tisse des abris poreux qui ralentissent le courant.',ability:'Réseau de biofilm',cost:800,knowledge:180,unlockAt:2400,trait:'adhesion',icon:'⋈'},
{id:'grazer',name:'Brouteur',plural:'Brouteurs',color:'#d3be8e',role:'Herbivorie',description:'Broute les colonies et recycle leurs tissus.',wild:true,icon:'◌'},
{id:'hunter',name:'Chasseur',plural:'Chasseurs',color:'#ce92ab',role:'Prédation',description:'Régule la microfaune et poursuit les juvéniles.',wild:true,icon:'⋎'},
];
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function seededRandom(seed){let s=seed>>>0;const f=()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};f.state=()=>s>>>0;f.restore=n=>s=n>>>0;return f;}
export function generateTerrain(seed){
 const map=new Uint8Array(128*768),rng=seededRandom(seed),phase=seed%777/71;
 for(let gy=0;gy<768;gy++)for(let x=0;x<128;x++){
  const layer=gy/128|0,y=gy%128,edge=3+Math.sin(gy*.13+phase)*2;let rock=x<edge||x>124-edge;
  if(layer===0){const bent=y+Math.sin(x*.065+phase)*5;rock||=bent%37>29&&Math.abs(x-40-Math.sin(gy*.08)*15)>12&&Math.abs(x-95)>13;}
  if(layer===1){const root=Math.sin(x*.16+phase)+Math.sin(x*.37)*.35;rock||=root>.65&&y%66<20+Math.sin(x*.15)*14;rock||=(y+Math.sin(x*.08)*10)%57>50&&x%45>15;}
  if(layer===2){const col=(x+Math.sin(gy*.045)*4)%29;rock||=col<8&&y%87<68;rock||=(y+Math.sin(x*.06)*9)%72>67;}
  if(layer===3){rock||=(y+(x/18|0)*4)%25>16&&((x+Math.sin(gy*.08)*15)%68)>17;}
  if(layer===4){const cx=(x%54)-27,cy=(y%58)-29,d=(cx*cx)/625+(cy*cy)/625;rock||=d>.77&&d<1.3;rock||=y%59>54&&x%54<6;}
  if(layer===5){const shaft=(x+Math.sin(gy*.07)*3)%34;rock||=shaft<8&&y%81>18;rock||=(y+Math.sin(x*.04)*10)%64>55&&x%61>20;}
  if(gy>2&&(gy%128)<2)rock||=x<25||x>100;
  if(rock)map[gy*128+x]=rng()<.09?2:1;
 }
 // A winding central channel connects all six architectural regions.
 for(let y=2;y<767;y++){const x=64+Math.sin(y*.018+phase)*9|0;for(let dx=-4;dx<=4;dx++)map[y*128+x+dx]=0;}
 for(let x=0;x<128;x++)map[767*128+x]=1;
 return map;
}
