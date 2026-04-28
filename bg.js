// ── BACKGROUND RENDERER ──────────────────────────────────
// state.sun === 1 → daytime sky / state.sun === 0 → night sky
// Structure positions (buildings, hills, mountains) stay consistent
// across day/night by pre-consuming sky rng calls first.

const BG_NAMES=['CITY','RURAL','WILD'];

function mkRng(seed){
  let s=(seed^0x5a5a5a5a)>>>0||1;
  return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/0x100000000;};
}

function fillCirc(cx,cy,r){
  for(let dy=-r;dy<=r;dy++)
    for(let dx=-r;dx<=r;dx++)
      if(dx*dx+dy*dy<=r*r)ctx.fillRect(cx+dx,cy+dy,1,1);
}

function _drawSun(sx,sy){
  ctx.fillStyle='#ffe040';fillCirc(sx,sy,8);
  ctx.fillStyle='#ffcc00';fillCirc(sx,sy,5);
  ctx.fillStyle='#ffee80';
  for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.fillRect((sx+Math.cos(a)*12)|0,(sy+Math.sin(a)*12)|0,2,2);}
}

function _drawCloud(cx,cy){
  ctx.fillStyle='#c8d8ec';
  fillCirc(cx-5,cy,3);fillCirc(cx,cy-2,5);fillCirc(cx+5,cy,4);fillCirc(cx+2,cy+2,3);
}

function drawBG(){
  const rng=mkRng(state.bgSeed||1);
  switch(state.bgType||0){
    case 1: _bgRural(rng); break;
    case 2: _bgWild(rng);  break;
    default:_bgCity(rng);  break;
  }
}

// ── CITY ─────────────────────────────────────────────────
function _bgCity(rng){
  // Pre-consume sky params (same count day & night → buildings stay put)
  const stars=Array.from({length:20},()=>[rng()>.65,Math.floor(rng()*180),Math.floor(rng()*80)]);
  const mx=30+Math.floor(rng()*80), my=12+Math.floor(rng()*18);
  const cx1=20+Math.floor(rng()*130), cy1=15+Math.floor(rng()*20);
  const cx2=30+Math.floor(rng()*120), cy2=20+Math.floor(rng()*18);

  if(state.sun){
    // Day: blue gradient sky
    for(let y=0;y<195;y++){
      const t=y/195;
      ctx.fillStyle=`rgb(${(0x0c+t*0x12)|0},${(0x1e+t*0x1a)|0},${(0x42+t*0x10)|0})`;
      ctx.fillRect(0,y,180,1);
    }
    _drawSun(mx,my);
    _drawCloud(cx1,cy1);_drawCloud(cx2,cy2);
  } else {
    // Night
    ctx.fillStyle='#050a1c';ctx.fillRect(0,0,180,320);
    ctx.fillStyle='#060b1e';
    for(let x=0;x<180;x+=8)ctx.fillRect(x,0,1,195);
    for(let y=0;y<195;y+=8)ctx.fillRect(0,y,180,1);
    for(const [bright,sx,sy] of stars){
      ctx.fillStyle=bright?'#ccddee':'#667799';ctx.fillRect(sx,sy,1,1);
    }
    ctx.fillStyle='#e0dcc4';fillCirc(mx,my,7);
    ctx.fillStyle='#050a1c';fillCirc(mx-4,my-3,5);
  }

  // Buildings (identical placement day/night, colors differ)
  let bx=-2;
  while(bx<182){
    const bw=10+Math.floor(rng()*22);
    const bh=30+Math.floor(rng()*110);
    const by=193-bh;
    ctx.fillStyle=state.sun?(rng()>.5?'#1a1e38':'#161a30'):(rng()>.5?'#09091e':'#0b0b22');
    ctx.fillRect(bx,by,bw,bh+12);
    ctx.fillStyle=state.sun?'#222640':'#14142e';ctx.fillRect(bx,by,bw,1);
    if(rng()>.55){
      ctx.fillStyle=state.sun?'#282c48':'#181830';
      const ah=Math.floor(rng()*10+3);
      ctx.fillRect(bx+Math.floor(bw/2),by-ah,1,ah);
    }
    for(let wy=by+4;wy<190;wy+=5)
      for(let wx=bx+2;wx<bx+bw-2;wx+=5){
        const r=rng();
        // Day: sky reflection or dark; Night: warm lit windows
        if(state.sun) ctx.fillStyle=r>.75?'#7aa0c8':'#202e48';
        else ctx.fillStyle=r>.55?(r>.8?'#ffcc60':r>.65?'#ffe090':'#ddaa50'):'#111228';
        ctx.fillRect(wx,wy,2,2);
      }
    bx+=bw+Math.floor(rng()*3);
  }

  ctx.fillStyle=state.sun?'#151828':'#090912';ctx.fillRect(0,193,180,12);
  ctx.fillStyle=state.sun?'#1e2238':'#13131a';ctx.fillRect(0,193,180,1);

  // Street lights: on at night, off in day
  for(let i=0;i<3;i++){
    const lx=18+Math.floor(rng()*28)+i*52;
    ctx.fillStyle=state.sun?'#1a1e30':'#1e1e2c';
    ctx.fillRect(lx,175,1,18);ctx.fillRect(lx,175,6,1);
    if(!state.sun){
      ctx.fillStyle='#ffe870';ctx.fillRect(lx+4,174,2,2);
      ctx.fillStyle='#443200';ctx.fillRect(lx+3,173,4,1);ctx.fillRect(lx+3,176,4,1);
    }
  }

  _hudPanel();
}

// ── RURAL ────────────────────────────────────────────────
function _bgRural(rng){
  const stars=Array.from({length:42},()=>[rng()>.5,Math.floor(rng()*180),Math.floor(rng()*95)]);
  const mx=110+Math.floor(rng()*50), my=15+Math.floor(rng()*18);
  const cx1=20+Math.floor(rng()*130), cy1=18+Math.floor(rng()*22);
  const cx2=40+Math.floor(rng()*110), cy2=14+Math.floor(rng()*18);

  if(state.sun){
    // Day: warm blue sky
    for(let y=0;y<100;y++){
      const t=y/100;
      ctx.fillStyle=`rgb(${(0x10+t*0x18)|0},${(0x28+t*0x18)|0},${(0x48+t*0x10)|0})`;
      ctx.fillRect(0,y,180,1);
    }
    ctx.fillStyle='#283840';ctx.fillRect(0,100,180,120);
    _drawSun(mx,my);
    _drawCloud(cx1,cy1);_drawCloud(cx2,cy2);
  } else {
    // Night: dusk-to-dark
    const tR=0x20,tG=0x08,tB=0x28, bR=0x06,bG=0x03,bB=0x10;
    for(let y=0;y<100;y++){
      const t=y/100;
      ctx.fillStyle=`rgb(${(tR*(1-t)+bR*t)|0},${(tG*(1-t)+bG*t)|0},${(tB*(1-t)+bB*t)|0})`;
      ctx.fillRect(0,y,180,1);
    }
    ctx.fillStyle='#060310';ctx.fillRect(0,100,180,120);
    for(const [bright,sx,sy] of stars){
      ctx.fillStyle=bright?'#eeeeff':'#9999bb';ctx.fillRect(sx,sy,1,1);
    }
    ctx.fillStyle='#e8e4cc';fillCirc(mx,my,8);
    ctx.fillStyle='#0d0618';fillCirc(mx-3,my-4,6);
  }

  // Far hill
  const ph1=rng()*Math.PI*2;
  ctx.fillStyle=state.sun?'#1c2e18':'#111810';
  for(let x=0;x<180;x++){const h=22+Math.sin(x*.04+ph1)*10;ctx.fillRect(x,Math.floor(152-h),1,Math.floor(h)+22);}
  // Mid hill
  const ph2=rng()*Math.PI*2;
  ctx.fillStyle=state.sun?'#243820':'#182014';
  for(let x=0;x<180;x++){const h=14+Math.sin(x*.07+ph2)*7;ctx.fillRect(x,Math.floor(163-h),1,Math.floor(h)+17);}

  // Oak trees
  const nt=4+Math.floor(rng()*5);
  for(let i=0;i<nt;i++){
    const tx=Math.floor(rng()*160)+10;
    const th=18+Math.floor(rng()*14);
    ctx.fillStyle=state.sun?'#1a1408':'#0e0c08';
    ctx.fillRect(tx,170-th+Math.floor(th*.62),2,Math.floor(th*.4));
    ctx.fillStyle=state.sun?'#1e3018':'#121a10';
    fillCirc(tx+1,170-th+Math.floor(th*.38),5+Math.floor(rng()*5));
  }

  // Farmhouse
  const hx=15+Math.floor(rng()*100);
  ctx.fillStyle=state.sun?'#1e1814':'#100c0a';ctx.fillRect(hx,160,24,18);
  ctx.fillStyle=state.sun?'#181010':'#0c0808';
  for(let ri=0;ri<9;ri++)ctx.fillRect(hx+ri,160-8+ri,24-ri*2,1);
  ctx.fillStyle=state.sun?(rng()>.1?'#b8c8d8':'#1a1810'):(rng()>.25?'#dd8830':'#1a1010');
  ctx.fillRect(hx+4,163,4,4);
  ctx.fillStyle=state.sun?(rng()>.1?'#b8c8d8':'#1a1810'):(rng()>.25?'#dd8830':'#1a1010');
  ctx.fillRect(hx+16,163,4,4);
  ctx.fillStyle='#1a1008';ctx.fillRect(hx+10,170,4,8);

  // Fence
  ctx.fillStyle=state.sun?'#2c2a1c':'#1c1a10';ctx.fillRect(0,177,180,1);
  for(let fx=3;fx<180;fx+=7)ctx.fillRect(fx,174,2,3);

  // Ground
  ctx.fillStyle=state.sun?'#1a2010':'#0e1408';ctx.fillRect(0,178,180,14);
  ctx.fillStyle=state.sun?'#141a0c':'#0a1006';ctx.fillRect(0,190,180,10);

  _hudPanel();
}

// ── WILD ─────────────────────────────────────────────────
function _bgWild(rng){
  const stars=Array.from({length:75},()=>[Math.floor(rng()*180),Math.floor(rng()*120),rng()]);
  const mx=10+Math.floor(rng()*30), my=10+Math.floor(rng()*18);
  const cx1=20+Math.floor(rng()*130), cy1=15+Math.floor(rng()*25);
  const cx2=30+Math.floor(rng()*110), cy2=20+Math.floor(rng()*20);
  const cx3=10+Math.floor(rng()*150), cy3=25+Math.floor(rng()*15);

  if(state.sun){
    // Day: mountain morning sky
    for(let y=0;y<120;y++){
      const t=y/120;
      ctx.fillStyle=`rgb(${(0x08+t*0x10)|0},${(0x18+t*0x18)|0},${(0x2e+t*0x16)|0})`;
      ctx.fillRect(0,y,180,1);
    }
    ctx.fillStyle='#141e2a';ctx.fillRect(0,120,180,80);
    _drawSun(mx+20,my);
    _drawCloud(cx1,cy1);_drawCloud(cx2,cy2);_drawCloud(cx3,cy3);
  } else {
    // Night: dense starfield
    ctx.fillStyle='#020408';ctx.fillRect(0,0,180,320);
    for(const [sx,sy,b] of stars){
      ctx.fillStyle=b>.9?'#ffffff':b>.6?'#dde0ff':'#5566aa';
      ctx.fillRect(sx,sy,1,1);
      if(b>.95){ctx.fillStyle='#8899bb';ctx.fillRect(sx+1,sy,1,1);ctx.fillRect(sx-1,sy,1,1);}
    }
    ctx.fillStyle='#f0ecd8';fillCirc(mx,my,10);
    ctx.fillStyle='#020408';fillCirc(mx-3,my-4,7);
    ctx.fillStyle='#d8d4c0';
    ctx.fillRect(mx+3,my+3,3,2);ctx.fillRect(mx-6,my+1,2,2);ctx.fillRect(mx+1,my-6,2,1);
  }

  // Mountains (lighter in day, near-black at night)
  ctx.fillStyle=state.sun?'#1a2430':'#0c1018';
  _drawMtns(rng,0,158,180,65,6);
  ctx.fillStyle=state.sun?'#0e1820':'#080c0e';
  _drawMtns(rng,0,178,180,50,4);

  // Mist
  for(let y=152;y<170;y++){
    ctx.fillStyle=`rgba(18,32,46,${((170-y)/18)*.14})`;
    ctx.fillRect(0,y,180,1);
  }

  // Pine forest
  const nt=10+Math.floor(rng()*7);
  for(let i=0;i<nt;i++){
    const tx=Math.floor(rng()*180);
    const th=20+Math.floor(rng()*22);
    ctx.fillStyle=state.sun?'#0c1810':'#050908';
    _drawPine(tx,188,th);
  }

  ctx.fillStyle=state.sun?'#0c1208':'#050806';ctx.fillRect(0,188,180,15);
  _hudPanel();
}

// ── Shared structure helpers ──────────────────────────────
function _drawMtns(rng,x,baseY,w,maxH,peaks){
  const xs=[x],hs=[0];
  for(let i=0;i<peaks;i++){
    xs.push(x+(i+.2+rng()*.6)*(w/peaks));
    hs.push(maxH*.3+rng()*maxH*.7);
  }
  xs.push(x+w);hs.push(0);
  for(let px=x;px<x+w;px++){
    let seg=0;
    for(let i=0;i<xs.length-1;i++)if(px>=xs[i]&&px<xs[i+1]){seg=i;break;}
    const t=(px-xs[seg])/(xs[seg+1]-xs[seg]);
    ctx.fillRect(px,Math.floor(baseY-(hs[seg]*(1-t)+hs[seg+1]*t)),1,Math.ceil(hs[seg]*(1-t)+hs[seg+1]*t)+6);
  }
}

function _drawPine(x,baseY,h){
  ctx.fillRect(x,baseY-Math.floor(h*.2),2,Math.floor(h*.2)+1);
  for(let i=0;i<3;i++){
    const ly=baseY-h+Math.floor(i*h*.6/3);
    const lw=2+i*4;
    for(let row=0;row<Math.floor(h*.4/3)+3;row++){
      const rw=Math.max(1,lw-Math.floor(row*lw/(h*.4/3+3)));
      ctx.fillRect(x-rw+1,ly+row,rw*2,1);
    }
  }
}

// Dark panel overlay for HUD area
function _hudPanel(){
  ctx.fillStyle='#050d06';ctx.fillRect(0,204,180,116);
  ctx.fillStyle='#080e08';
  for(let x=0;x<180;x+=8)ctx.fillRect(x,204,1,116);
  for(let y=208;y<320;y+=8)ctx.fillRect(0,y,180,1);
}
