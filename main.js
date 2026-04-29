// ── INPUT ────────────────────────────────────────────────
const hiddenInput=document.getElementById('hiddenInput');
let _tapCount=0,_tapLast=0;

cv.addEventListener('mousemove',e=>{
  const r=cv.getBoundingClientRect();
  mouse.x=(e.clientX-r.left)*(180/r.width);
  mouse.y=(e.clientY-r.top)*(320/r.height);
});
cv.addEventListener('click',e=>{
  const r=cv.getBoundingClientRect();
  const mx=(e.clientX-r.left)*(180/r.width);
  const my=(e.clientY-r.top)*(320/r.height);
  // 名前エリア（y=16〜32, x=30〜150）トリプルタップでデバッグトグル
  if(mx>=30&&mx<=150&&my>=16&&my<=32&&state.screen==='game'&&_view==='game'){
    const now=Date.now();
    if(now-_tapLast<600)_tapCount++;else _tapCount=1;
    _tapLast=now;
    if(_tapCount>=3){_dbgVisible=!_dbgVisible;_tapCount=0;}
  }
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
    if(_photoAnim>=0){_photoAnim+=dt;if(_photoAnim>=_PHOTO_DUR)_photoAnim=-1;}
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
    drawPhotoAnim();
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
if(state.photoColorIdx===undefined)state.photoColorIdx=-1;
if(state.screen==='naming')hiddenInput.focus();

// ── PHOTO FEATURE ─────────────────────────────────────────
const photoInput=document.createElement('input');
photoInput.type='file';photoInput.accept='image/*';
photoInput.style.cssText='position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;top:0;left:0;';
document.body.appendChild(photoInput);

function triggerPhoto(){photoInput.click();}

photoInput.addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;
  const img=new Image();
  const url=URL.createObjectURL(file);
  img.onload=()=>{
    const oc=document.createElement('canvas');
    oc.width=oc.height=64;
    const ox=oc.getContext('2d');
    ox.drawImage(img,0,0,64,64);
    state.photoColorIdx=analyzePhoto(ox.getImageData(0,0,64,64).data);
    _photoAnim=0; // 7色ラインアニメ開始
    URL.revokeObjectURL(url);
    photoInput.value='';
    saveState();
  };
  img.src=url;
});

function analyzePhoto(data){
  const hBuckets=new Array(36).fill(0);
  let totalV=0,satCount=0,count=0;
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]<128)continue;
    const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),s=max-min;
    totalV+=max;count++;
    if(s>0.18&&max>0.2){
      let h;
      if(max===r)h=((g-b)/s+6)%6;
      else if(max===g)h=(b-r)/s+2;
      else h=(r-g)/s+4;
      hBuckets[Math.floor(h*60/10)]++;satCount++;
    }
  }
  if(!count)return 4;
  const avgV=totalV/count,satRatio=satCount/count;
  if(avgV>0.82&&satRatio<0.1)return 11; // LUNAR (白・明るい)
  if(avgV<0.12)return 3;                 // VIOLET (暗い)
  if(satRatio<0.08)return 4;             // PEARL (グレー)
  let peak=0,peakVal=0;
  for(let i=0;i<36;i++)if(hBuckets[i]>peakVal){peakVal=hBuckets[i];peak=i;}
  const hue=peak*10+5;
  if(hue<15||hue>=345)return 0;  // CRIMSON
  if(hue<45)return 10;            // SCARLET
  if(hue<65)return 1;             // AMBER
  if(hue<80)return 2;             // GOLDEN
  if(hue<105)return 8;            // LIME
  if(hue<165)return 5;            // JADE
  if(hue<200)return 9;            // AQUA
  if(hue<255)return 6;            // AZURE
  if(hue<290)return 3;            // VIOLET
  if(hue<330)return 7;            // MAGENTA
  return 0;                        // CRIMSON
}

requestAnimationFrame(loop);
