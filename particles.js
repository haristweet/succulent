// ── PARTICLES ────────────────────────────────────────────
const particles=[];
function addDrops(x,y){
  for(let i=0;i<6;i++)particles.push({
    x,y,vx:(Math.random()-0.5)*1.2,vy:-Math.random()*1.5-0.5,
    life:1,maxLife:0.8+Math.random()*0.4,c:'#4488ff',type:'drop'
  });
}
function addSparks(x,y,c){
  for(let i=0;i<10;i++){
    const a=Math.random()*Math.PI*2,s=1+Math.random()*2;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:1,maxLife:0.6+Math.random()*0.5,c,type:'spark'});
  }
}
function bigBurst(x,y,c1,c2){
  for(let i=0;i<60;i++){
    const a=Math.random()*Math.PI*2,s=1+Math.random()*4;
    const c=Math.random()<0.5?c1:c2;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,
      life:1,maxLife:0.8+Math.random()*0.8,c,type:'spark'});
  }
  // 上方向に舞い上がる花びら
  for(let i=0;i<20;i++){
    const a=-Math.PI/2+((Math.random()-0.5)*Math.PI);
    const s=1.5+Math.random()*3;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:1,maxLife:1.2+Math.random()*0.6,c:c1,type:'spark'});
  }
}
function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;
    p.life-=dt/p.maxLife;
    if(p.life<=0)particles.splice(i,1);
  }
}
function drawParticles(){
  for(const p of particles){
    ctx.globalAlpha=Math.max(0,p.life);
    ctx.fillStyle=p.c;
    ctx.fillRect(p.x|0,p.y|0,1,1);
  }
  ctx.globalAlpha=1;
}
