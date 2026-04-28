// ── RENDER GLOBALS ───────────────────────────────────────
const PCX=90;
let happyTimer=0;
let nameCursorT=0;
let _niceTimer=0; // NICE TIMING! 表示タイマー

// ── BTN HELPER ───────────────────────────────────────────
function btn(key,label,x,y,w,h,fn,accent='#2a6'){
  _btns[key]={x,y,w,h,fn};
  const hov=mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+h;
  ctx.fillStyle=hov?accent:'#081408';ctx.fillRect(x,y,w,h);
  ctx.fillStyle=accent;
  ctx.fillRect(x,y,w,1);ctx.fillRect(x,y+h-1,w,1);
  ctx.fillRect(x,y,1,h);ctx.fillRect(x+w-1,y,1,h);
  pixText(label,x+Math.round((w-label.length*4)/2),y+Math.round((h-5)/2),hov?'#000':accent);
}

// ── NAMING SCREEN ────────────────────────────────────────
function drawNaming(){
  const CW=180;
  pixBig('SUCCULENT',Math.round((CW-9*8)/2),20,'#4caa30');

  const msg='YOUR PLANTS NAME?';
  pixText(msg,Math.round((CW-pixW(msg))/2),48,'#2a5a28');

  // 入力欄
  const bx=10,by=62,bw=160,bh=16;
  ctx.fillStyle='#0a140a';ctx.fillRect(bx,by,bw,bh);
  ctx.fillStyle='#1a4a1a';
  ctx.fillRect(bx,by,bw,1);ctx.fillRect(bx,by+bh-1,bw,1);
  ctx.fillRect(bx,by,1,bh);ctx.fillRect(bx+bw-1,by,1,bh);

  const nw=pixW(state.name);
  const nx=bx+Math.round((bw-nw)/2);
  if(state.name.length>0){
    pixText(state.name,nx,by+5,'#6ccc50');
  } else {
    pixText('TAP + TYPE',bx+Math.round((bw-pixW('TAP + TYPE'))/2),by+5,'#1a3a1a');
  }
  if(Math.floor(nameCursorT*2)%2===0){
    ctx.fillStyle='#4caa30';
    ctx.fillRect(nx+nw+(state.name.length>0?2:0),by+5,1,5);
  }

  const hint='ENTER TO START';
  pixText(hint,Math.round((CW-pixW(hint))/2),90,state.name.length>0?'#2a6a28':'#152015');

  // 植物プレビュー（中央）
  spr(POT,CW/2-7,170,'#b03810');
  spr(POT_HL,CW/2-7,170,'#d85020');
  ctx.fillStyle='#2a7a18';
  for(let i=0;i<10;i++)ctx.fillRect(CW/2-1,160+i,2,1);
  spr(BUD0,CW/2-3,153,'#3a9a28');
}

// ── PLANT DRAW ───────────────────────────────────────────

// 水分・日光の状態からサボテンの色・サイズを決定
function getPlantColors(){
  const w=state.water, s=state.sun;

  // 体の色：スイートスポット36〜65、それ以上は過水
  let body;
  if(w>85)      body='#8060a0'; // 根腐れ・紫がかる
  else if(w>70) body='#78b050'; // 過水・薄い緑
  else if(w>35) body='#3acc28'; // スイートスポット・鮮やか
  else if(w>15) body='#7a9010'; // 乾燥・黄みがかる
  else          body='#8a6818'; // 瀕死・茶色がかる

  // 茎の色も水分で変化
  const stemR=w>35?0x20:0x40;
  const stemG=w>35?Math.floor(0x7a+(w/100)*0x30):0x60;
  const stem='#'+stemR.toString(16).padStart(2,'0')+stemG.toString(16).padStart(2,'0')+'10';

  // 日光を浴びるほど先端が赤みがかる（多肉植物の日焼け）
  const tip = s>0.6 ? (w>40?'#c04060':'#a03828') : null;

  // 水分で膨らみ具合が変わる（スイートスポット内のみふっくら、過水はしおれる）
  const plump=w>=50&&w<=70;

  // 水不足 or 根腐れで垂れる
  const droopY=w<15?2:w<25?1:w>85?1:0;

  return{body,stem,tip,plump,droopY};
}

// plump時: 下に1px影を付けてふっくら見せる
function sprPlump(rows,px,py,color,tipColor,tipRows=2){
  spr(rows,px,py+1,'#1a3a10'); // 影
  spr(rows,px,py,color);
  if(tipColor)spr(rows.slice(0,tipRows),px,py,tipColor);
}

function bloomFlowerY(){
  const pt=PTYPE[state.plantType||0];
  const soilY=190, py=soilY-pt.h2, centerY=py+pt.cy2, stalkH=28;
  const sh=SHAPES[state.bloomShape>=0?state.bloomShape:0];
  const fh=sh.spr.length*2;
  return centerY-stalkH-7-fh+Math.floor(fh/2);
}

function drawPlant(){
  const prog=stageProgress();
  const pc=getPlantColors();
  const potY=188;
  const soilY=potY+2;
  const potX=PCX-7;

  // 棚
  ctx.fillStyle='#1a2a14';ctx.fillRect(30,200,120,2);
  ctx.fillStyle='#0f180a';ctx.fillRect(30,202,120,1);

  // 鉢
  spr(POT,potX,potY,'#b03810');
  spr(POT_HL,potX,potY,'#d85020');
  spr(POT_SD,potX,potY+2,'#801808');
  ctx.fillStyle='#3a1a08';ctx.fillRect(potX+2,potY,10,2);

  const dy=pc.droopY;

  if(state.stage===0){
    // SUCC_0: 8×5 tiny sprout, sits on soil
    const px=PCX-4, py=soilY-5+dy;
    if(pc.plump){
      sprPlump(SUCC_0,px,py,pc.body,pc.tip,2);
    } else {
      spr(SUCC_0,px,py,pc.body);
      if(pc.tip)spr(SUCC_0.slice(0,2),px,py,pc.tip);
    }

  } else if(state.stage===1){
    const pt=PTYPE[state.plantType||0];
    const px=PCX-Math.floor(pt.w1/2), py=soilY-pt.h1+dy;
    if(pc.plump){
      sprPlump(pt.s1,px,py,pc.body,pc.tip,2);
    } else {
      spr(pt.s1,px,py,pc.body);
      if(pc.tip)spr(pt.s1.slice(0,2),px,py,pc.tip);
    }

  } else if(state.stage===2){
    const pt=PTYPE[state.plantType||0];
    const px=PCX-Math.floor(pt.w2/2), py=soilY-pt.h2+dy;
    const centerY=py+pt.cy2;
    if(pc.plump){
      sprPlump(pt.s2,px,py,pc.body,pc.tip,2);
    } else {
      spr(pt.s2,px,py,pc.body);
      if(pc.tip)spr(pt.s2.slice(0,2),px,py,pc.tip);
    }
    const stalkH=Math.round(prog*20);
    if(stalkH>0){
      ctx.fillStyle=pc.stem;
      for(let i=1;i<=stalkH;i++)ctx.fillRect(PCX-1,centerY-i,2,1);
      if(stalkH>6){
        ctx.fillStyle='#ff8040';ctx.fillRect(PCX-1,centerY-stalkH-1,2,2);
        ctx.fillStyle='#ffb060';ctx.fillRect(PCX,centerY-stalkH-1,1,1);
      }
    }

  } else if(state.stage===3&&state.bloomShape>=0){
    const sh=SHAPES[state.bloomShape];
    const co=COLORS[state.bloomColor];
    const pt=PTYPE[state.plantType||0];
    const px=PCX-Math.floor(pt.w2/2), py=soilY-pt.h2;
    const centerY=py+pt.cy2;
    spr(pt.s2,px,py,pc.body);
    if(pc.tip)spr(pt.s2.slice(0,2),px,py,pc.tip);
    // 花茎（フル丈 28px）
    const stalkH=28;
    ctx.fillStyle=pc.stem;
    for(let i=1;i<=stalkH;i++)ctx.fillRect(PCX-1,centerY-i,2,1);
    // 萼
    const stalkTopY=centerY-stalkH;
    spr(BUD0,PCX-3,stalkTopY-7,'#2a7a18');
    // 花を2x描画
    const fh=sh.spr.length*2, fw=sh.w*2;
    const fx=PCX-Math.floor(fw/2), fy=stalkTopY-7-fh;
    ctx.save();ctx.translate(fx,fy);ctx.scale(2,2);
    spr(sh.spr,0,0,co.p);
    ctx.fillStyle=co.c;
    ctx.fillRect(Math.floor(sh.w/2)-2,Math.floor(sh.spr.length/2)-2,4,4);
    ctx.restore();
    // スパークル軌道
    if(state.newBloom){
      const t=Date.now()/180;
      const cy=fy+Math.floor(fh/2);
      for(let i=0;i<8;i++){
        const a=t+i*Math.PI/4,d=12+Math.sin(t*3+i)*3;
        ctx.fillStyle=i%2===0?co.p:co.c;
        ctx.fillRect((PCX+Math.cos(a)*d)|0,(cy+Math.sin(a)*d)|0,1,1);
      }
    }
  }
}

// ── HUD ──────────────────────────────────────────────────
function drawHUD(){
  const CW=180;

  // ── ヘッダー ──
  pixBig('SUCCULENT',Math.round((CW-9*8)/2),8,'#4caa30');
  btn('openColl','LOG',150,8,26,10,()=>{_view='collection';},'#2a4a6a');
  if(state.name){
    const mood=state.water>85?'ROOT ROT!':state.water>70?'TOO WET':state.water>35?'HAPPY':state.water>20?'OK':'THIRSTY...';
    const mc=state.water>85?'#c040e0':state.water>70?'#88cc40':state.water>35?'#4ccc30':state.water>20?'#888830':'#cc3030';
    const nameX=Math.round((CW-pixW(state.name+' '+mood))/2);
    pixText(state.name,nameX,23,'#2a6a20');
    pixText(mood,nameX+pixW(state.name)+4,23,mc);
  }
  pixText('DAY '+state.days,CW-pixW('DAY '+state.days)-6,23,'#334433');

  // ── 仕切り線 ──
  ctx.fillStyle='#1a2a1a';ctx.fillRect(8,213,CW-16,1);

  // ── 情報パネル ──
  const iy=218;

  // 水ゲージ（横幅いっぱい）— スイートスポット36〜65をハイライト
  pixText('WATER',8,iy,'#4488ff');
  const gx=42,gw=CW-50;
  // 背景
  ctx.fillStyle='#0a1020';ctx.fillRect(gx,iy,gw,6);
  // スイートスポット帯（薄く）
  const ssx=gx+Math.round(36*gw/100), ssw=Math.round((65-36)*gw/100);
  ctx.fillStyle='#0a2a10';ctx.fillRect(ssx,iy,ssw,6);
  // 水レベル
  const wLevel=Math.round(state.water*gw/100);
  const wc=state.water>85?'#a050d0':state.water>65?'#e07020':state.water>35?'#30b0ff':'#2040a0';
  ctx.fillStyle=wc;ctx.fillRect(gx,iy,wLevel,6);
  // 枠
  ctx.fillStyle='#1a2840';
  ctx.fillRect(gx,iy,gw,1);ctx.fillRect(gx,iy+5,gw,1);
  ctx.fillRect(gx,iy,1,6);ctx.fillRect(gx+gw-1,iy,1,6);
  // スイートスポット境界線（36%と65%に縦tick）
  ctx.fillStyle='#2a5a30';
  ctx.fillRect(ssx,iy,1,6);ctx.fillRect(ssx+ssw,iy,1,6);

  // 日当たり
  pixText('SUN',8,iy+12,state.sun?'#ffcc00':'#334455');
  if(state.sun){
    const st=Date.now()/2000;
    ctx.fillStyle='#ffcc00';
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+st;
      ctx.fillRect((28+Math.cos(a)*4)|0,(iy+14+Math.sin(a)*4)|0,1,1);
    }
    ctx.fillStyle='#ffcc00';ctx.fillRect(26,iy+12,4,4);
  } else {
    ctx.fillStyle='#334466';ctx.fillRect(26,iy+12,4,4);
    pixText('SHADE',34,iy+12,'#334466');
  }

  // ステージヒント / 開花名
  if(state.stage<3){
    const hints=['A TINY BUD...','THE BUD IS SWELLING.','CRACKING OPEN...'];
    pixText(hints[state.stage]||'',8,iy+24,'#1a3a18');
    const rem=Math.max(0,BLOOM_DAYS-state.days);
    if(rem>0)pixText('~'+rem+' DAYS LEFT',8,iy+32,'#152015');
  } else if(state.bloomShape>=0){
    const co=COLORS[state.bloomColor];
    if(state.bloomRarity>0)
      pixText(RARITY_NAME[state.bloomRarity],8,iy+22,RARITY_COL[state.bloomRarity]);
    pixBig(SHAPE_NAMES[state.bloomShape],8,state.bloomRarity>0?iy+30:iy+22,co.p);
    pixText(co.n,8,state.bloomRarity>0?iy+44:iy+36,'#888');
  }

  // ── ボタン（親指エリア・画面下部）──
  const by=268;
  if(state.stage<3){
    if(!state.watered){
      btn('water','WATER',8,by,76,22,()=>{
        const before=state.water;
        state.water=Math.min(100,state.water+30);
        state.watered=true;happyTimer=120;
        // スイートスポット（20〜45）で水やりするとNICE TIMING!ボーナス
        if(before>=20&&before<=45){
          state.careScore=(state.careScore||0)+1;
          _niceTimer=2.0;
        }
        addDrops(PCX,188);saveState();
      },'#2488ff');
    } else {
      ctx.fillStyle='#0a1020';ctx.fillRect(8,by,76,22);
      pixText('WATERED!',8+Math.round((76-pixW('WATERED!'))/2),by+8,'#2488ff');
    }
    btn('sun',state.sun?'SHADE':'SUNNY',96,by,76,22,()=>{
      state.sun=state.sun?0:1;saveState();
    },state.sun?'#886600':'#446600');
  } else {
    btn('share','SHARE',8,by,76,22,()=>{
      const co=COLORS[state.bloomColor];
      const fullName=SHAPE_NAMES[state.bloomShape]+' / '+co.n;
      const txt=state.name+' bloomed a '+fullName+' on day '+state.days+'! #SUCCULENT';
      if(navigator.share)navigator.share({text:txt});
      else navigator.clipboard.writeText(txt).then(()=>alert('Copied!\n'+txt));
    },'#ff6080');
    btn('replant','REPLANT',96,by,76,22,()=>{
      state.days=0;state.waterLog=[];state.sunLog=[];
      state.stage=0;state.plantType=0;
      state.bloomShape=-1;state.bloomColor=-1;state.bloomRarity=0;
      state.watered=false;state.newBloom=false;
      state.bloomAnimT=-1;state.bloomSaved=false;
      state.water=Math.min(state.water+20,60);
      state.careScore=0;
      state.name='';state.screen='naming';
      hiddenInput.value='';hiddenInput.focus();
      saveState();
    },'#2a7a40');
  }

  // 水やり後ハッピー表示
  if(happyTimer>0){
    ctx.globalAlpha=Math.min(1,happyTimer/40);
    pixText(state.name+' IS HAPPY!',Math.round((CW-pixW(state.name+' IS HAPPY!'))/2),iy-10,'#4cff60');
    ctx.globalAlpha=1;
  }
  // NICE TIMING! フェードアウト
  if(_niceTimer>0){
    ctx.globalAlpha=Math.min(1,_niceTimer);
    const niceY=iy-20;
    pixText('NICE TIMING!',Math.round((CW-pixW('NICE TIMING!'))/2),niceY,'#ffe040');
    ctx.globalAlpha=1;
  }
  // WATER NOW! 点滅アラート（水分<15 かつ未水やり）
  if(state.water<15&&!state.watered&&state.stage<3){
    if(Math.floor(Date.now()/300)%2===0){
      pixText('WATER NOW!',Math.round((CW-pixW('WATER NOW!'))/2),by-12,'#ff3030');
    }
  }
  if(state.stage===3&&state.newBloom)
    pixText('IT BLOOMED!',Math.round((CW-pixW('IT BLOOMED!'))/2),by-10,'#ffff40');
}

// ── COLLECTION SCREEN ────────────────────────────────────
function drawCollection(){
  const CW=180, ROW_H=20, LIST_TOP=38, LIST_BOT=292;

  // タイトル
  pixBig('FLOWER LOG',Math.round((CW-10*8)/2),6,'#4caa30');
  pixText(collection.length+' collected',Math.round((CW-pixW(collection.length+' collected'))/2),20,'#2a5a28');

  // ソートボタン
  const SW=60;
  [['DATE','date'],['TYPE','type'],['NAME','name']].forEach(([lbl,key],i)=>{
    const active=_collSort===key;
    btn('cs_'+key,lbl,i*SW,28,SW,10,()=>{_collSort=key;_collScroll=0;},
      active?'#4caa30':'#1a3a1a');
    if(active){ctx.fillStyle='#4caa30';ctx.fillRect(i*SW,28,SW,1);}
  });
  ctx.fillStyle='#1a2a1a';ctx.fillRect(0,39,CW,1);

  // リスト
  const sorted=sortedColl();
  const totalH=sorted.length*ROW_H;
  const listH=LIST_BOT-LIST_TOP;
  _collScroll=Math.max(0,Math.min(Math.max(0,totalH-listH),_collScroll));

  ctx.save();
  ctx.beginPath();ctx.rect(0,LIST_TOP,CW,listH);ctx.clip();

  for(let i=0;i<sorted.length;i++){
    const e=sorted[i];
    const y=LIST_TOP+i*ROW_H-_collScroll;
    if(y+ROW_H<LIST_TOP||y>LIST_BOT)continue;

    ctx.fillStyle=i%2?'#060e07':'#050d06';
    ctx.fillRect(0,y,CW,ROW_H);

    // 花スプライト（1x）
    const sh=SHAPES[e.shape], co=COLORS[e.color];
    const fx=2+Math.floor((18-sh.w)/2);
    const fy=y+Math.floor((ROW_H-sh.spr.length)/2);
    spr(sh.spr,fx,fy,co.p);
    ctx.fillStyle=co.c;
    ctx.fillRect(fx+Math.floor(sh.w/2)-1,fy+Math.floor(sh.spr.length/2)-1,2,2);

    // 左テキスト
    pixText(e.name,22,y+2,'#4ccc50');
    const rStr=e.rarity===2?'★':e.rarity===1?'*':'';
    pixText(rStr+SHAPE_NAMES[e.shape],22,y+11,e.rarity?RARITY_COL[e.rarity]:co.p);

    // 右テキスト
    const d=new Date(e.ts);
    const ds=(d.getMonth()+1)+'/'+(d.getDate());
    pixText(ds,CW-pixW(ds)-4,y+2,'#334433');
    pixText(co.n,CW-pixW(co.n)-4,y+11,'#334a33');

    ctx.fillStyle='#0d160e';ctx.fillRect(0,y+ROW_H-1,CW,1);
  }

  if(!sorted.length){
    pixText('NO FLOWERS YET.',Math.round((CW-pixW('NO FLOWERS YET.'))/2),150,'#1a3a1a');
    pixText('WATER AND WAIT!',Math.round((CW-pixW('WATER AND WAIT!'))/2),162,'#1a3a1a');
  }

  ctx.restore();

  // スクロールバー
  if(totalH>listH){
    const barH=Math.max(6,Math.round(listH*listH/totalH));
    const barY=LIST_TOP+Math.round(_collScroll*(listH-barH)/Math.max(1,totalH-listH));
    ctx.fillStyle='#1a3a18';ctx.fillRect(CW-2,LIST_TOP,2,listH);
    ctx.fillStyle='#4caa30';ctx.fillRect(CW-2,barY,2,barH);
  }

  ctx.fillStyle='#0f180a';ctx.fillRect(0,291,CW,1);
  btn('collBack','< BACK',4,294,40,16,()=>{_view='game';},'#2a6');
}

// ── BLOOM ANIMATION ──────────────────────────────────────
let _burstFired=false;
let _shake=0;

function drawBloomAnim(dt){
  const t=state.bloomAnimT;
  const co=COLORS[state.bloomColor];
  const sh=SHAPES[state.bloomShape];
  state.bloomAnimT+=dt;
  if(_shake>0)_shake=Math.max(0,_shake-dt*8);

  const sx=_shake>0?(Math.random()*_shake*4|0)-(_shake*2|0):0;
  const sy=_shake>0?(Math.random()*_shake*4|0)-(_shake*2|0):0;
  ctx.save();ctx.translate(sx,sy);

  drawPlant();

  const fr=Math.floor(t*24);
  if(fr===0||fr===1)      {ctx.fillStyle='#ffffff';ctx.fillRect(-8,-8,200,336);}
  else if(fr===2||fr===3) {ctx.fillStyle=co.p;     ctx.fillRect(-8,-8,200,336);}
  else if(fr===4)         {ctx.fillStyle='#ffffff';ctx.fillRect(-8,-8,200,336);}

  if(fr>=4&&!_burstFired){
    bigBurst(PCX,bloomFlowerY(),co.p,co.c);
    _shake=2;
    _burstFired=true;
  }
  drawParticles();
  ctx.restore();

  // タイプオン: 花の名前を1文字ずつ表示
  if(t>=0.4){
    const sh=SHAPES[state.bloomShape];
    const co=COLORS[state.bloomColor];
    const shapeName=SHAPE_NAMES[state.bloomShape];
    const chars=Math.min(shapeName.length,Math.floor((t-0.4)*14));
    const name=shapeName.slice(0,chars);
    const nx=Math.round((180-shapeName.length*8)/2);
    pixBig(name,nx,236,co.p);
    if(chars<shapeName.length&&Math.floor(t*6)%2===0){
      ctx.fillStyle=co.p;ctx.fillRect(nx+chars*8,236,4,10);
    }
    if(chars===shapeName.length){
      if(state.bloomRarity>0)
        pixText(RARITY_NAME[state.bloomRarity],Math.round((180-RARITY_NAME[state.bloomRarity].length*4)/2),250,RARITY_COL[state.bloomRarity]);
      pixText(co.n,Math.round((180-co.n.length*4)/2),state.bloomRarity>0?258:250,'#888888');
      if(Math.floor(t*4)%2===0){
        ctx.fillStyle=co.c;
        ctx.fillRect(nx-6,241,3,3);ctx.fillRect(nx+shapeName.length*8+3,241,3,3);
      }
    }
  }

  // 完了 (2.4s)
  if(t>=2.4){
    state.bloomAnimT=-1;
    _burstFired=false;
  }
}

// ── DEBUG BUTTONS ─────────────────────────────────────────
function drawDebug(){
  btn('dbgDay','+DAY',8,300,34,14,()=>{
    state.lastTick=0;checkTick(Date.now());
  },'#444');
  btn('dbgPT','TYP>',122,300,34,14,()=>{
    state.plantType=(state.plantType+1)%PTYPE.length;saveState();
  },'#464');
  if(state.stage<3){
    btn('dbgBloom','BLOOM',46,300,34,14,()=>{
      state.days=BLOOM_DAYS;state.water=60;state.sun=1;
      state.waterLog=new Array(BLOOM_DAYS).fill(60);
      state.sunLog=new Array(BLOOM_DAYS).fill(1);
      state.bloomShape=0;state.bloomColor=0;state.bloomRarity=0;
      state.stage=3;state.newBloom=true;state.bloomAnimT=0;
      _burstFired=false;saveState();
    },'#644');
  } else {
    btn('dbgS','SHP>',46,300,34,14,()=>{
      state.bloomShape=(state.bloomShape+1)%SHAPES.length;
      state.newBloom=false;state.bloomAnimT=-1;saveState();
    },'#464');
    btn('dbgC','COL>',84,300,34,14,()=>{
      state.bloomColor=(state.bloomColor+1)%COLORS.length;
      state.bloomRarity=COLORS[state.bloomColor].r;
      state.newBloom=false;state.bloomAnimT=-1;saveState();
    },'#446');
    pixText(SHAPE_NAMES[state.bloomShape]+'/'+COLORS[state.bloomColor].n,8,314,'#334');
  }
}

// ── BG ───────────────────────────────────────────────────
function drawBG(){
  ctx.fillStyle='#050d06';ctx.fillRect(0,0,180,320);
  ctx.fillStyle='#080e08';
  for(let x=0;x<180;x+=8)ctx.fillRect(x,0,1,320);
  for(let y=0;y<320;y+=8)ctx.fillRect(0,y,180,1);
}
