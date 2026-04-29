// ── SHARED GLOBALS ───────────────────────────────────────
let state;
const _btns={};
const mouse={x:0,y:0};

// ── BLOOM / PLANT TYPE ───────────────────────────────────
function determineBloom(waterLog,sunLog){
  const n=waterLog.length;
  const avgW=waterLog.reduce((a,b)=>a+b,0)/n;
  const avgS=sunLog.reduce((a,b)=>a+b,0)/n;
  const varW=waterLog.reduce((a,b)=>a+(b-avgW)**2,0)/n;
  const consistent=varW<300;
  const neglected=waterLog.some(w=>w<5);
  const rescued=neglected&&waterLog[n-1]>60;
  let maxStreak=0,streak=0;
  for(const w of waterLog){w>40?maxStreak=Math.max(maxStreak,++streak):streak=0;}
  // 36〜65がスイートスポット。それ以上は過水
  const overWateredDays=waterLog.filter(w=>w>75).length;
  const inSweetSpot=waterLog.filter(w=>w>=36&&w<=65).length;
  const perfect=inSweetSpot>=n*0.8&&overWateredDays===0&&sunLog.every(s=>s===1);

  // 形（お世話パターンで8種）
  let si;
  if(avgW>70&&avgS>0.8)         si=0; // ROSE: 豊富な水＋強い日光
  else if(avgW<30&&avgS>0.7)    si=1; // STAR: 乾燥＋日光
  else if(avgS<0.3)             si=2; // IRIS: 日陰
  else if(avgW>55&&avgS<0.35)   si=3; // PEARL: 水多め＋日陰
  else if(consistent&&avgW>55)  si=4; // DAISY: 安定したお世話
  else if(consistent&&avgS>0.7) si=5; // CROWN: 安定した日光
  else if(rescued)              si=6; // BELL: 瀕死から回復
  else if(maxStreak>=5)         si=7; // SPIKE: 長期連続
  else si=Math.min(3,Math.floor(avgW/25));

  // 色（細かい条件で12色）— 写真で上書き可
  let ci;
  if(state.photoColorIdx!=null&&state.photoColorIdx>=0){
    ci=state.photoColorIdx; // 写真から決定した色を優先
  } else if(perfect)            ci=11; // LUNAR: 完璧ケア
  else if(rescued)              ci=10; // SCARLET: 瀕死から回復
  else if(avgS<0.2&&avgW>60)    ci=9;  // AQUA: 深い日陰＋多水
  else if(avgW>65&&avgS>0.7)    ci=0;  // CRIMSON
  else if(avgW>50&&avgS>0.7)    ci=1;  // AMBER
  else if(avgW<35&&avgS>0.6)    ci=2;  // GOLDEN
  else if(avgS<0.5&&avgW>45)    ci=3;  // VIOLET
  else if(consistent&&avgW>55)  ci=5;  // JADE
  else if(avgS>0.6)             ci=6;  // AZURE
  else if(avgS<0.5&&avgW>35)    ci=7;  // MAGENTA
  else if(avgW<30)              ci=8;  // LIME
  else                          ci=4;  // PEARL

  // ケアスコアでレアリティ上乗せ、過水が多いと下げる
  let rarity=COLORS[ci].r;
  if((state.careScore||0)>=5&&overWateredDays===0) rarity=Math.min(2,rarity+1);
  if(overWateredDays>3) rarity=Math.max(0,rarity-1);
  return{si,ci,rarity};
}

function determinePlantType(){
  const n=state.waterLog.length;
  if(!n) return 0;
  const avgW=state.waterLog.reduce((a,b)=>a+b,0)/n;
  const avgS=state.sunLog.reduce((a,b)=>a+b,0)/n;
  if(avgS>0.65&&avgW<45) return 1; // Star: 乾燥+日当たり
  if(avgW>55&&avgS<0.4)  return 2; // Narrow: 多水+日陰
  return 0;                         // Round: デフォルト
}

function sortedColl(){
  const c=[...collection];
  if(_collSort==='type') c.sort((a,b)=>a.shape-b.shape||a.color-b.color);
  else if(_collSort==='name') c.sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:b.ts-a.ts);
  else c.sort((a,b)=>b.ts-a.ts);
  return c;
}

// ── GAME STATE ───────────────────────────────────────────
const SAVE_KEY='succulent-v2';
const COLL_KEY='succulent-coll';
const TICK_MS=60*1000;
const BLOOM_DAYS=7;

function loadColl(){try{const r=localStorage.getItem(COLL_KEY);if(r)return JSON.parse(r);}catch(e){}return[];}
function saveColl(){localStorage.setItem(COLL_KEY,JSON.stringify(collection));}
let collection=loadColl();
let _view='game'; // 'game'|'collection'
let _collSort='date';
let _collScroll=0;
let _collTouchY=0;

function defaultState(){
  return{
    screen:'naming',   // 'naming' | 'game'
    name:'',
    days:0,water:40,sun:1,
    waterLog:[],sunLog:[],
    stage:0,plantType:0,bloomShape:-1,bloomColor:-1,bloomRarity:0,
    lastTick:Date.now(),
    watered:false,
    newBloom:false,
    bloomAnimT:-1,
    bloomSaved:false,
    careScore:0,
    bgType:0,
    bgSeed:1,
    photoColorIdx:-1,  // -1=未撮影, 0-11=写真から決定した色
  };
}
function loadState(){
  try{const r=localStorage.getItem(SAVE_KEY);if(r)return JSON.parse(r);}catch(e){}
  return defaultState();
}
function saveState(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));}

function advanceDay(){
  state.waterLog.push(state.water);
  state.sunLog.push(state.sun);
  state.water=Math.max(0,state.water-20);
  state.watered=false;
  state.days++;
  if(state.stage<3){
    const d=state.days;
    const prevStage=state.stage;
    state.stage=Math.max(state.stage,d<2?0:d<4?1:d<BLOOM_DAYS?2:2);
    if(prevStage===0&&state.stage===1) state.plantType=determinePlantType();
    if(d>=BLOOM_DAYS){
      const n=state.waterLog.length;
      const avgW=state.waterLog.reduce((a,b)=>a+b,0)/n;
      const avgS=state.sunLog.reduce((a,b)=>a+b,0)/n;
      if(avgW>25){
        state.stage=3;state.newBloom=true;state.bloomAnimT=0;
        const bd=determineBloom(state.waterLog,state.sunLog);
        state.bloomShape=bd.si;state.bloomColor=bd.ci;state.bloomRarity=bd.rarity;
        if(!state.bloomSaved){
          collection.push({shape:bd.si,color:bd.ci,rarity:bd.rarity,
            plantType:state.plantType||0,name:state.name,
            day:state.days,ts:Date.now()});
          saveColl();state.bloomSaved=true;
        }
      }
    }
  }
  saveState();
}

// 今日のステージ内進捗（0.0〜1.0）: 毎日微妙に変化させるため
function stageProgress(){
  const bands=[[0,1],[2,3],[4,6],[7,99]];
  const [s,e]=bands[Math.min(state.stage,3)];
  const span=Math.max(1,e-s);
  return Math.min(1,(state.days-s)/span);
}
