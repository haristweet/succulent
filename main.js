// ── INPUT ────────────────────────────────────────────────
const hiddenInput=document.getElementById('hiddenInput');

cv.addEventListener('mousemove',e=>{
  const r=cv.getBoundingClientRect();
  mouse.x=(e.clientX-r.left)*(180/r.width);
  mouse.y=(e.clientY-r.top)*(320/r.height);
});
cv.addEventListener('click',e=>{
  const r=cv.getBoundingClientRect();
  const mx=(e.clientX-r.left)*(180/r.width);
  const my=(e.clientY-r.top)*(320/r.height);
  for(const k in _btns){const b=_btns[k];if(mx>=b.x&&mx<=b.x+b.w&&my>=b.y&&my<=b.y+b.h)b.fn();}
});

// デスクトップ: document.keydownで処理 + e.preventDefault()でhiddenInputへの挿入を防ぐ
document.addEventListener('keydown',e=>{
  if(state.screen!=='naming')return;
  if(e.isComposing||e.keyCode===229)return; // IMEコンポジション中は無視
  if(e.key==='Enter'&&state.name.length>0){confirmName();e.preventDefault();return;}
  if(e.key==='Backspace'){
    state.name=state.name.slice(0,-1);
    hiddenInput.value=state.name;
    e.preventDefault();return;
  }
  if(/^[a-zA-Z0-9]$/.test(e.key)&&state.name.length<8){
    state.name+=e.key.toUpperCase();
    hiddenInput.value=state.name;
    e.preventDefault();
  }
});
// モバイル仮想キーボード用フォールバック（isComposingでIME途中入力を除外）
hiddenInput.addEventListener('input',e=>{
  if(state.screen!=='naming')return;
  if(e.isComposing)return;
  state.name=hiddenInput.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
  hiddenInput.value=state.name;
});
cv.addEventListener('click',()=>{
  if(state.screen==='naming')hiddenInput.focus();
});
cv.addEventListener('touchstart',e=>{
  if(_view==='collection'){_collTouchY=e.touches[0].clientY;}
},{passive:true});
cv.addEventListener('touchmove',e=>{
  if(_view!=='collection')return;
  const r=cv.getBoundingClientRect();
  _collScroll+=(_collTouchY-e.touches[0].clientY)*(320/r.height);
  _collTouchY=e.touches[0].clientY;
},{passive:true});
cv.addEventListener('wheel',e=>{
  if(_view!=='collection')return;
  _collScroll+=e.deltaY*0.4;
},{passive:true});

function confirmName(){
  if(!state.name)return;
  state.screen='game';
  // 植物ごとにランダムな背景を割り当て
  state.bgType=Math.floor(Math.random()*3);
  state.bgSeed=(Math.random()*999983+1)|0;
  hiddenInput.blur();
  saveState();
}

// ── TICK ─────────────────────────────────────────────────
let lastTime=0;
function checkTick(now){
  if(now-state.lastTick>=TICK_MS){state.lastTick=now;advanceDay();}
}

// ── MAIN LOOP ─────────────────────────────────────────────
function loop(ts){
  const now=Date.now();
  const dt=lastTime?Math.min((ts-lastTime)/1000,0.1):0;
  lastTime=ts;

  if(state.screen==='game'){
    checkTick(now);
    nameCursorT+=dt;
    if(happyTimer>0)happyTimer=Math.max(0,happyTimer-1);
    if(_niceTimer>0)_niceTimer=Math.max(0,_niceTimer-dt);
    updateParticles(dt);
  }

  for(const k in _btns)delete _btns[k];
  drawBG();
  if(state.screen==='naming'){
    drawNaming();
  } else if(_view==='collection'){
    drawCollection();
  } else if(state.bloomAnimT>=0){
    drawBloomAnim(dt);
    drawDebug();
  } else {
    drawPlant();
    drawHUD();
    drawParticles();
    drawDebug();
  }
  requestAnimationFrame(loop);
}

// ── INITIALIZATION ────────────────────────────────────────
state=loadState();
// 旧セーブからの移行
if(state.newBloom===undefined)state.newBloom=false;
if(state.bloomAnimT===undefined)state.bloomAnimT=-1;
if(!state.screen)state.screen=state.name?'game':'naming';
// 旧bloomTypeを新システムへ変換
if(state.bloomType!==undefined&&state.bloomShape===undefined){
  state.bloomShape=state.bloomType>=0?state.bloomType:- 1;
  state.bloomColor=state.bloomType>=0?state.bloomType:- 1;
  state.bloomRarity=0;
  delete state.bloomType;
}
if(state.plantType===undefined)state.plantType=0;
if(state.careScore===undefined)state.careScore=0;
if(state.bgType===undefined)state.bgType=Math.floor(Math.random()*3);
if(!state.bgSeed)state.bgSeed=(Math.random()*999983+1)|0;
if(state.bloomSaved===undefined)state.bloomSaved=false;
if(state.bloomShape===undefined)state.bloomShape=-1;
if(state.bloomColor===undefined)state.bloomColor=-1;
if(state.bloomRarity===undefined)state.bloomRarity=0;
if(state.screen==='naming')hiddenInput.focus();
requestAnimationFrame(loop);
