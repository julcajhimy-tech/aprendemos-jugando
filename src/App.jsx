import { useState, useEffect, useRef, useCallback } from "react";

// ══════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════════════
const MAX_ROUNDS   = 5;
const MAX_LIVES    = 3;
const POWER_STREAK = 3;
const TIMER_OPTS   = [10, 15, 20, 30];

const OPS = [
  { label:"Suma",  sym:"+", key:"sum" },
  { label:"Resta", sym:"−", key:"sub" },
  { label:"Mult.", sym:"×", key:"mul" },
  { label:"Div.",  sym:"÷", key:"div" },
];

// Team 1: top-row digits + Backspace + Enter
const T1_MAP = {
  "Digit1":"1","Digit2":"2","Digit3":"3","Digit4":"4","Digit5":"5",
  "Digit6":"6","Digit7":"7","Digit8":"8","Digit9":"9","Digit0":"0",
  "Backspace":"DEL","Enter":"OK",
};
// Team 2: numpad — NumpadEnter AND NumpadAdd as confirm (covers all keyboards)
const T2_MAP = {
  "Numpad1":"1","Numpad2":"2","Numpad3":"3",
  "Numpad4":"4","Numpad5":"5","Numpad6":"6",
  "Numpad7":"7","Numpad8":"8","Numpad9":"9",
  "Numpad0":"0",
  "NumpadDecimal":"DEL","NumpadSubtract":"DEL",
  "NumpadEnter":"OK","NumpadAdd":"OK",
};

function genQ(opKey){
  if(opKey==="sum"){const a=~~(Math.random()*20)+1,b=~~(Math.random()*20)+1;return{a,b,op:"+",ans:a+b};}
  if(opKey==="sub"){const a=~~(Math.random()*20)+5,b=~~(Math.random()*a)+1;return{a,b,op:"−",ans:a-b};}
  if(opKey==="mul"){const a=~~(Math.random()*10)+1,b=~~(Math.random()*10)+1;return{a,b,op:"×",ans:a*b};}
  const b=~~(Math.random()*9)+1,a=b*(~~(Math.random()*9)+1);return{a,b,op:"÷",ans:a/b};
}

const MOTIV=["¡Las matemáticas son su superpoder! 🦸","¡Cada error es una lección! 💡","¡Sigan practicando, campeones! 🏅","¡El esfuerzo siempre paga! 🌟","¡Juntos aprendemos más! 🤝","¡Hoy aprendieron algo nuevo! 🎉"];
const WIN_MSG =t=>[`🎊 ¡${t} GANÓ! 🎊`,"¡Increíble trabajo en equipo!",MOTIV[~~(Math.random()*MOTIV.length)]];
const DRAW_MSG=["🤝 ¡EMPATE ÉPICO! 🤝","¡Ambos equipos son campeones!","¡Las matemáticas los unieron! 💪"];

// ══════════════════════════════════════════════════════════════════════
//  PARTICLES
// ══════════════════════════════════════════════════════════════════════
function useParticles(){
  const pts=useRef([]),nid=useRef(0);
  const spawn=useCallback((x,y,type="correct",count=16)=>{
    const pal={correct:["#FFD93D","#6BCB77","#fff","#a8ff78"],wrong:["#FF6B6B","#ff4444","#ff9999"],powerup:["#FFD93D","#FF922B","#fff","#ffd700"],timeout:["#888","#aaa","#ccc"]}[type]||["#fff"];
    for(let i=0;i<count;i++){const a=(Math.PI*2*i)/count+Math.random()*.5,s=2+Math.random()*5;pts.current.push({id:nid.current++,x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:1,decay:.018+Math.random()*.02,size:5+Math.random()*9,color:pal[~~(Math.random()*pal.length)],shape:Math.random()>.5?"circle":"star",rot:Math.random()*Math.PI*2,rotS:(Math.random()-.5)*.2});}
  },[]);
  const update=useCallback(()=>{pts.current=pts.current.map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,vy:p.vy+.15,life:p.life-p.decay,rot:p.rot+p.rotS})).filter(p=>p.life>0);},[]);
  const draw=useCallback((ctx)=>{pts.current.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.rot);if(p.shape==="star"){ctx.beginPath();for(let i=0;i<5;i++){const a=(i*4*Math.PI)/5-Math.PI/2,r=i%2===0?p.size:p.size*.4;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();}else{ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();}ctx.restore();});},[]);
  return{spawn,update,draw};
}

// ══════════════════════════════════════════════════════════════════════
//  COUNTDOWN RING
// ══════════════════════════════════════════════════════════════════════
function CountdownRing({timeLeft,totalTime}){
  const r=34,circ=2*Math.PI*r,pct=Math.max(0,timeLeft)/Math.max(1,totalTime);
  const danger=timeLeft<=5;
  const stroke=danger?"#FF6B6B":timeLeft<=totalTime*.5?"#FFD93D":"#6BCB77";
  return(
    <div style={{position:"relative",width:80,height:80,flexShrink:0}}>
      <svg width={80} height={80} style={{transform:"rotate(-90deg)"}}>
        <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6}/>
        <circle cx={40} cy={40} r={r} fill="none" stroke={stroke} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 0.9s linear,stroke 0.3s",filter:`drop-shadow(0 0 ${danger?10:4}px ${stroke})`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontFamily:"'Fredoka One',cursive",fontSize:danger?25:21,color:stroke,textShadow:`0 0 ${danger?14:7}px ${stroke}`,lineHeight:1}}>{timeLeft}</div>
        <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",fontFamily:"'Fredoka One',cursive",marginTop:1}}>seg</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  ARENA CANVAS
// ══════════════════════════════════════════════════════════════════════
function TugVisual({ropePos,team1,team2,lastEvent}){
  const canvasRef=useRef(null),animRef=useRef(null),tick=useRef(0);
  const stRef=useRef({ropePos,team1,team2,lastEvent});
  const {spawn,update,draw:drawPts}=useParticles();
  useEffect(()=>{stRef.current={ropePos,team1,team2,lastEvent};},[ropePos,team1,team2,lastEvent]);
  useEffect(()=>{
    const c=canvasRef.current;if(!c||!lastEvent)return;
    const W=c.width,H=c.height,isT1=lastEvent.team==="team1";
    spawn(isT1?W*.25:W*.75,H*.44,lastEvent.type,lastEvent.type==="powerup"?28:16);
  },[lastEvent,spawn]);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const resize=()=>{const p=canvas.parentElement;canvas.width=p?Math.min(p.clientWidth,860):760;canvas.height=210;};
    resize();window.addEventListener("resize",resize);
    function lighten(hex,amt){const n=parseInt(hex.replace("#",""),16);return`rgb(${Math.min(255,(n>>16)+amt)},${Math.min(255,((n>>8)&0xff)+amt)},${Math.min(255,(n&0xff)+amt)})`;}
    function heart(x,y,sz,filled,pulse){ctx.save();ctx.translate(x,y);if(pulse){ctx.shadowColor="#FF6B6B";ctx.shadowBlur=12;}ctx.beginPath();ctx.moveTo(0,sz*.3);ctx.bezierCurveTo(0,0,-sz*.6,0,-sz*.6,-sz*.3);ctx.bezierCurveTo(-sz*.6,-sz*.7,0,-sz*.7,0,-sz*.3);ctx.bezierCurveTo(0,-sz*.7,sz*.6,-sz*.7,sz*.6,-sz*.3);ctx.bezierCurveTo(sz*.6,0,0,0,0,sz*.3);ctx.closePath();ctx.fillStyle=filled?"#FF6B6B":"rgba(255,107,107,0.14)";ctx.fill();if(filled){ctx.strokeStyle="rgba(255,255,255,0.35)";ctx.lineWidth=.7;ctx.stroke();}ctx.restore();}
    function powerBar(x,y,w,streak,color,side){const pct=(streak%POWER_STREAK)/POWER_STREAK,lvl=~~(streak/POWER_STREAK);ctx.save();ctx.fillStyle="rgba(0,0,0,0.35)";ctx.beginPath();ctx.roundRect(x,y,w,7,3);ctx.fill();if(pct>0){const g=ctx.createLinearGradient(x,y,x+w*pct,y);g.addColorStop(0,color);g.addColorStop(1,"#FFD93D");ctx.fillStyle=g;ctx.shadowColor=color;ctx.shadowBlur=pct>.5?8:0;ctx.beginPath();ctx.roundRect(x,y,w*pct,7,3);ctx.fill();}ctx.shadowBlur=0;ctx.font="bold 10px 'Fredoka One',cursive";ctx.fillStyle="#FFD93D";ctx.textAlign=side==="left"?"left":"right";ctx.fillText(lvl>0?`⚡×${lvl}`:"POWER",side==="left"?x:x+w,y-3);ctx.restore();}
    function figure(x,bY,color,faceR,state,streak,t){
      const pw=streak>=POWER_STREAK;ctx.save();ctx.translate(x,bY);
      if(pw){const ag=ctx.createRadialGradient(0,-20,4,0,-20,42);ag.addColorStop(0,`${color}55`);ag.addColorStop(1,"transparent");ctx.fillStyle=ag;ctx.beginPath();ctx.arc(0,-20,42+Math.sin(t*.08)*5,0,Math.PI*2);ctx.fill();}
      ctx.shadowColor=pw?"#FFD93D":color;ctx.shadowBlur=pw?12+Math.sin(t*.08)*4:5;
      let bounce=0,leg=0,arm=0,sx=1,sy=1;
      if(state==="celebrate"){bounce=Math.abs(Math.sin(t*.2))*-17;leg=Math.sin(t*.25)*30;sx=1+Math.sin(t*.2)*.07;sy=1-Math.sin(t*.2)*.04;}
      else if(state==="hit"||state==="timeout"){bounce=Math.sin(t*.4)*4;sx=1.14;sy=.87;arm=faceR?18:-18;}
      else if(state==="pull"){arm=faceR?-14:14;bounce=Math.sin(t*.12)*2.5;leg=Math.sin(t*.12)*7;}
      else{bounce=Math.sin(t*.05)*1.5;}
      ctx.scale(sx,sy);ctx.translate(0,bounce);
      ctx.strokeStyle=color;ctx.lineWidth=3.8;ctx.lineCap="round";ctx.lineJoin="round";
      const ls=(leg*Math.PI)/180;
      ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(-13+Math.sin(ls)*13,15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(13-Math.sin(ls)*13,15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,-36);ctx.stroke();
      const ad=faceR?1:-1,aa=(arm*Math.PI)/180;
      ctx.beginPath();ctx.moveTo(0,-29);ctx.lineTo(ad*21*Math.cos(aa),-29+21*Math.sin(aa)*ad);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-29);ctx.lineTo(-ad*15,-39);ctx.stroke();
      ctx.beginPath();ctx.arc(0,-49,13,0,Math.PI*2);
      const hg=ctx.createRadialGradient(-3,-53,2,0,-49,13);hg.addColorStop(0,pw?"#FFD93D":lighten(color,40));hg.addColorStop(1,color);
      ctx.fillStyle=hg;ctx.shadowBlur=0;ctx.fill();ctx.strokeStyle="rgba(255,255,255,0.3)";ctx.lineWidth=1.4;ctx.stroke();
      ctx.font="14px serif";ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillText(state==="celebrate"?"😄":state==="hit"?"😵":state==="timeout"?"😴":pw?"😤":"😐",0,-49);
      if(pw){ctx.strokeStyle="#FFD93D";ctx.lineWidth=2.2;ctx.shadowColor="#FFD93D";ctx.shadowBlur=10;const lx=faceR?-23:23;ctx.beginPath();ctx.moveTo(lx,-61);ctx.lineTo(lx+(faceR?5:-5),-52);ctx.lineTo(lx-(faceR?3:-3),-47);ctx.lineTo(lx+(faceR?4:-4),-39);ctx.stroke();}
      ctx.restore();
    }
    function arena(W,H,t){
      const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,"rgba(10,6,32,.97)");bg.addColorStop(.5,"rgba(20,10,50,.99)");bg.addColorStop(1,"rgba(10,6,32,.97)");
      ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(0,0,W,H,18);ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,0.022)";ctx.lineWidth=1;
      for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(let y=0;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      const g1=ctx.createRadialGradient(W*.17,H*.5,0,W*.17,H*.5,W*.37);g1.addColorStop(0,"rgba(255,145,43,.12)");g1.addColorStop(1,"transparent");ctx.fillStyle=g1;ctx.beginPath();ctx.roundRect(0,0,W,H,18);ctx.fill();
      const g2=ctx.createRadialGradient(W*.83,H*.5,0,W*.83,H*.5,W*.37);g2.addColorStop(0,"rgba(77,150,255,.12)");g2.addColorStop(1,"transparent");ctx.fillStyle=g2;ctx.beginPath();ctx.roundRect(0,0,W,H,18);ctx.fill();
      ctx.save();ctx.strokeStyle="rgba(255,215,0,.48)";ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.lineDashOffset=-(t*.5%28);ctx.shadowColor="#FFD93D";ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);ctx.restore();
      const lz=ctx.createLinearGradient(0,0,W*.17,0);lz.addColorStop(0,"rgba(255,145,43,.2)");lz.addColorStop(1,"transparent");ctx.fillStyle=lz;ctx.beginPath();ctx.roundRect(0,0,W*.17,H,[18,0,0,18]);ctx.fill();
      const rz=ctx.createLinearGradient(W*.83,0,W,0);rz.addColorStop(0,"transparent");rz.addColorStop(1,"rgba(77,150,255,.2)");ctx.fillStyle=rz;ctx.beginPath();ctx.roundRect(W*.83,0,W*.17,H,[0,18,18,0]);ctx.fill();
      ctx.font="bold 12px 'Fredoka One',cursive";ctx.fillStyle="#FF922B";ctx.shadowColor="#FF922B";ctx.shadowBlur=8;ctx.textAlign="left";ctx.fillText("← GANA T1",10,17);ctx.fillStyle="#4D96FF";ctx.shadowColor="#4D96FF";ctx.textAlign="right";ctx.fillText("GANA T2 →",W-10,17);ctx.shadowBlur=0;
      const bd=ctx.createLinearGradient(0,0,W,H);bd.addColorStop(0,"rgba(255,255,255,.19)");bd.addColorStop(.5,"rgba(255,255,255,.04)");bd.addColorStop(1,"rgba(255,255,255,.12)");ctx.strokeStyle=bd;ctx.lineWidth=1.5;ctx.shadowBlur=3;ctx.beginPath();ctx.roundRect(1,1,W-2,H-2,17);ctx.stroke();ctx.shadowBlur=0;
    }
    function ropeCanvas(W,H,rp,t){
      const ry=H*.45,rx=W/2+rp*(W*.28);
      ctx.save();ctx.strokeStyle="rgba(0,0,0,.25)";ctx.lineWidth=13;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(26,ry+4);ctx.lineTo(W-26,ry+4);ctx.stroke();
      const rg=ctx.createLinearGradient(26,ry-4,W-26,ry+4);rg.addColorStop(0,"#8B4513");rg.addColorStop(.3,"#CD853F");rg.addColorStop(.5,"#DEB887");rg.addColorStop(.7,"#CD853F");rg.addColorStop(1,"#8B4513");ctx.strokeStyle=rg;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(26,ry);ctx.lineTo(W-26,ry);ctx.stroke();
      ctx.strokeStyle="rgba(255,255,255,.1)";ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();for(let px=26;px<W-26;px+=2){const py=ry+Math.sin(px*.07+t*.05+i*2)*1.6;if(px===26)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.stroke();}
      const gp=15+Math.sin(t*.08)*3;const mg=ctx.createRadialGradient(rx,ry,0,rx,ry,gp*2);mg.addColorStop(0,"rgba(255,107,107,.55)");mg.addColorStop(1,"transparent");ctx.fillStyle=mg;ctx.beginPath();ctx.arc(rx,ry,gp*2,0,Math.PI*2);ctx.fill();
      const mrg=ctx.createRadialGradient(rx-4,ry-4,2,rx,ry,gp);mrg.addColorStop(0,"#FF9999");mrg.addColorStop(.5,"#FF6B6B");mrg.addColorStop(1,"#CC0000");ctx.beginPath();ctx.arc(rx,ry,gp,0,Math.PI*2);ctx.fillStyle=mrg;ctx.shadowColor="#FF6B6B";ctx.shadowBlur=15;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle="rgba(255,255,255,.6)";ctx.lineWidth=2;ctx.stroke();
      ctx.restore();
    }
    function hud(W,H,t1,t2){
      const hs=10,gap=23;
      for(let i=0;i<MAX_LIVES;i++)heart(13+i*gap,H-22,hs,i<t1.lives,t1.lives===1&&i===0);
      for(let i=0;i<MAX_LIVES;i++)heart(W-13-i*gap,H-22,hs,i<t2.lives,t2.lives===1&&i===0);
      powerBar(13,H-38,80,t1.streak,"#FF922B","left");
      powerBar(W-93,H-38,80,t2.streak,"#4D96FF","right");
    }
    function banner(W,H,ev,t){
      if(!ev)return;const age=t-(ev.time||0);if(age>120)return;
      const op=Math.max(0,1-age/120),sc=age<10?.5+(age/10)*.6:1;
      ctx.save();ctx.translate(W/2,H*.14);ctx.scale(sc,sc);ctx.globalAlpha=op;
      const msg=ev.type==="powerup"?"⚡ ¡POWER UP! ⚡":ev.type==="correct"?(ev.team==="team1"?"🔴 ¡Correcto! +1":"🔵 ¡Correcto! +1"):ev.type==="timeout"?"⏰ ¡TIEMPO! Ambos −❤️":"💥 ¡Fallo! −❤️";
      const bgc=ev.type==="powerup"?"rgba(255,165,0,.9)":ev.type==="correct"?"rgba(107,203,119,.9)":ev.type==="timeout"?"rgba(90,90,90,.9)":"rgba(255,80,80,.9)";
      ctx.font="bold 13px 'Fredoka One',cursive";const tw=ctx.measureText(msg).width+28;
      ctx.beginPath();ctx.roundRect(-tw/2,-14,tw,28,13);ctx.fillStyle=bgc;ctx.shadowColor=bgc;ctx.shadowBlur=18;ctx.fill();
      ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.shadowBlur=0;ctx.fillText(msg,0,0);ctx.restore();
    }
    const loop=()=>{
      const{ropePos,team1,team2,lastEvent}=stRef.current;const W=canvas.width,H=canvas.height;
      tick.current++;const t=tick.current;ctx.clearRect(0,0,W,H);
      arena(W,H,t);ropeCanvas(W,H,ropePos,t);
      const rx=W/2+ropePos*(W*.28);
      figure(Math.max(52,rx-92),H*.64,"#FF922B",true, team1.state,team1.streak,t);
      figure(Math.min(W-52,rx+92),H*.64,"#4D96FF",false,team2.state,team2.streak,t);
      update();drawPts(ctx);banner(W,H,lastEvent,t);hud(W,H,team1,team2);
      animRef.current=requestAnimationFrame(loop);
    };
    loop();
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener("resize",resize);};
  },[update,drawPts]);
  return <canvas ref={canvasRef} style={{width:"100%",borderRadius:18,display:"block",boxShadow:"0 6px 38px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06)"}}/>;
}

// ══════════════════════════════════════════════════════════════════════
//  ANIMATED BACKGROUND
// ══════════════════════════════════════════════════════════════════════
function AnimatedBg(){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current,ctx=c.getContext("2d");let id;
    const C=["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF922B","#CC5DE8"];
    const S=["+","-","×","÷","=","?","1","2","3","4","5","6","7","8","9","0"];
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};resize();window.addEventListener("resize",resize);
    const sh=Array.from({length:55},()=>({x:Math.random()*c.width,y:Math.random()*c.height,size:12+Math.random()*36,angle:Math.random()*Math.PI*2,rot:(Math.random()-.5)*.02,color:C[~~(Math.random()*C.length)],opacity:.04+Math.random()*.1,type:Math.random()>.5?"shape":"sym",shape:["circle","triangle","square","diamond"][~~(Math.random()*4)],sym:S[~~(Math.random()*S.length)],dx:(Math.random()-.5)*.46,dy:-(0.26+Math.random()*.36)}));
    const draw=()=>{ctx.clearRect(0,0,c.width,c.height);sh.forEach(s=>{s.x+=s.dx;s.y+=s.dy;s.angle+=s.rot;if(s.y<-60){s.y=c.height+30;s.x=Math.random()*c.width;}if(s.x<-60)s.x=c.width+30;if(s.x>c.width+60)s.x=-30;ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);ctx.globalAlpha=s.opacity;ctx.fillStyle=s.color;ctx.strokeStyle=s.color;ctx.lineWidth=2;if(s.type==="sym"){ctx.font=`bold ${s.size}px 'Fredoka One',cursive`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(s.sym,0,0);}else{ctx.beginPath();if(s.shape==="circle")ctx.arc(0,0,s.size/2,0,Math.PI*2);else if(s.shape==="square")ctx.rect(-s.size/2,-s.size/2,s.size,s.size);else if(s.shape==="triangle"){ctx.moveTo(0,-s.size/2);ctx.lineTo(s.size/2,s.size/2);ctx.lineTo(-s.size/2,s.size/2);ctx.closePath();}else{ctx.moveTo(0,-s.size/2);ctx.lineTo(s.size/2,0);ctx.lineTo(0,s.size/2);ctx.lineTo(-s.size/2,0);ctx.closePath();}ctx.stroke();}ctx.restore();});id=requestAnimationFrame(draw);};
    draw();return()=>{cancelAnimationFrame(id);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,zIndex:0,pointerEvents:"none"}}/>;
}

// ══════════════════════════════════════════════════════════════════════
//  CONFETTI
// ══════════════════════════════════════════════════════════════════════
function Confetti(){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current,ctx=c.getContext("2d");c.width=window.innerWidth;c.height=window.innerHeight;
    const p=Array.from({length:140},()=>({x:Math.random()*c.width,y:Math.random()*c.height-c.height,w:8+Math.random()*10,h:4+Math.random()*6,color:["#FF6B6B","#FFD93D","#6BCB77","#4D96FF","#FF922B","#CC5DE8"][~~(Math.random()*6)],rot:Math.random()*Math.PI*2,rotS:(Math.random()-.5)*.15,vy:2+Math.random()*4,vx:(Math.random()-.5)*2}));
    let id;const draw=()=>{ctx.clearRect(0,0,c.width,c.height);p.forEach(q=>{q.y+=q.vy;q.x+=q.vx;q.rot+=q.rotS;if(q.y>c.height+20){q.y=-20;q.x=Math.random()*c.width;}ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.rot);ctx.fillStyle=q.color;ctx.fillRect(-q.w/2,-q.h/2,q.w,q.h);ctx.restore();});id=requestAnimationFrame(draw);};
    draw();return()=>cancelAnimationFrame(id);
  },[]);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,zIndex:999,pointerEvents:"none"}}/>;
}

// ══════════════════════════════════════════════════════════════════════
//  CALC CARD — self-contained, FULLY INDEPENDENT per team
//  Each team has its OWN rounds, OWN question queue, OWN state.
//  No waiting for the other team. Ever.
// ══════════════════════════════════════════════════════════════════════
const CalcCard = ({ team, color, question, lives, streak, flash, onAnswer, disabled, imperativeRef, roundsDone }) => {
  const [input, setInput] = useState("");
  const stateRef = useRef({ input, disabled, question });

  useEffect(() => { stateRef.current = { input, disabled, question }; });

  // Reset input whenever a NEW question arrives
  useEffect(() => { setInput(""); }, [question]);

  const pushDigit = useCallback((d) => {
    if (stateRef.current.disabled) return;
    setInput(p => p.length >= 4 ? p : p + d);
  }, []);

  const delDigit = useCallback(() => {
    if (stateRef.current.disabled) return;
    setInput(p => p.slice(0, -1));
  }, []);

  const submit = useCallback(() => {
    const s = stateRef.current;
    if (s.disabled || !s.input || !s.question) return;
    const correct = parseInt(s.input) === s.question.ans;
    onAnswer(correct);
    setInput("");
  }, [onAnswer]);

  // Wire up to parent keyboard handler
  useEffect(() => {
    if (imperativeRef) imperativeRef.current = { pushDigit, delDigit, submit };
  }, [imperativeRef, pushDigit, delDigit, submit]);

  const cm = color === "orange"
    ? { border:"#FF922B", accent:"#FF922B", bg:"#FF922B", name:"🔴 Equipo 1", kbdLabel:"Teclado normal", kbdKeys:["1–9","0","⌫","↵"] }
    : { border:"#4D96FF", accent:"#4D96FF", bg:"#4D96FF", name:"🔵 Equipo 2", kbdLabel:"Teclado numérico", kbdKeys:["Num1–9","Num0","Num,","Num+ ó Num↵"] };

  const powered = streak >= POWER_STREAK;
  const PAD = [["7","8","9"],["4","5","6"],["1","2","3"]];

  const btnS = {
    border:"none", borderRadius:14, cursor:"pointer",
    fontFamily:"'Fredoka One',cursive", fontWeight:700,
    userSelect:"none", WebkitUserSelect:"none",
    touchAction:"manipulation",
    transition:"transform .08s, filter .1s",
    display:"flex", alignItems:"center", justifyContent:"center",
  };

  return (
    <div style={{
      border:`2px solid ${powered?"#FFD93D":disabled?"rgba(255,255,255,.1)":cm.border+"77"}`,
      borderRadius:22, padding:"13px 11px",
      background: flash==="correct"?"rgba(107,203,119,.13)":flash==="wrong"?"rgba(255,80,80,.13)":flash==="timeout"?"rgba(80,80,80,.13)":"rgba(255,255,255,.055)",
      backdropFilter:"blur(22px)",
      flex:1, maxWidth:268, minWidth:195,
      boxShadow: powered
        ?`0 0 24px #FFD93D33,0 8px 30px rgba(0,0,0,.45)`
        :`0 8px 30px rgba(0,0,0,.4),0 0 0 1px ${cm.border}14`,
      transition:"background .25s,box-shadow .3s,border-color .3s",
      position:"relative", overflow:"hidden",
      opacity: disabled ? .5 : 1,
    }}>
      {powered && <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#FFD93D,transparent)",animation:"shimmer 1.4s infinite"}}/>}
      <style>{`
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        .cbtn:active{transform:scale(0.85)!important;}
        .cbtn:hover{filter:brightness(1.2);}
      `}</style>

      {/* Header */}
      <div style={{textAlign:"center",fontFamily:"'Fredoka One',cursive",color:powered?"#FFD93D":cm.accent,fontSize:19,marginBottom:3}}>{cm.name}</div>

      {/* Lives */}
      <div style={{textAlign:"center",fontSize:19,marginBottom:2,letterSpacing:3}}>
        {"❤️".repeat(lives)}{"🖤".repeat(MAX_LIVES-lives)}
      </div>

      {/* Streak */}
      <div style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:6,letterSpacing:.4}}>
        {powered?"⚡ POWER UP ACTIVO":"RACHA "+"▰".repeat(streak%POWER_STREAK)+"▱".repeat(POWER_STREAK-streak%POWER_STREAK)+" /"+POWER_STREAK}
      </div>

      {/* Round progress dots */}
      <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:8}}>
        {Array.from({length:MAX_ROUNDS},(_,i)=>(
          <div key={i} style={{width:10,height:10,borderRadius:"50%",
            background:i<roundsDone?cm.bg:"rgba(255,255,255,.12)",
            boxShadow:i<roundsDone?`0 0 6px ${cm.border}`:"none",
            transition:"background .3s"}}/>
        ))}
      </div>

      {/* Question */}
      <div style={{background:powered?"linear-gradient(135deg,#FF922B,#FFD93D)":cm.bg,borderRadius:13,padding:"10px 8px",textAlign:"center",color:"#fff",fontFamily:"'Fredoka One',cursive",fontSize:30,fontWeight:700,marginBottom:9,boxShadow:`0 3px 12px ${cm.border}44`,letterSpacing:1,
        opacity:disabled?.5:1}}>
        {question ? `${question.a} ${question.op} ${question.b} = ?` : "✅ ¡Completado!"}
      </div>

      {/* 3×3 numpad — always visible, locked when disabled */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:5,opacity:disabled?.35:1,pointerEvents:disabled?"none":"auto"}}>
        {PAD.map(row=>row.map(d=>(
          <button key={d} className="cbtn"
            tabIndex={-1} onPointerDown={e=>{e.preventDefault();pushDigit(d);}}
            style={{...btnS,height:50,fontSize:24,
              background:d==="3"||d==="9"?"#6BCB77":d==="6"?"#FF6B6B":cm.bg,
              color:"#fff",boxShadow:"0 3px 9px rgba(0,0,0,.28)"}}>
            {d}
          </button>
        )))}
      </div>

      {/* Bottom row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:7,opacity:disabled?.35:1,pointerEvents:disabled?"none":"auto"}}>
        <button className="cbtn" tabIndex={-1} onPointerDown={e=>{e.preventDefault();pushDigit("0");}}
          style={{...btnS,height:46,fontSize:24,background:cm.bg,color:"#fff",boxShadow:"0 3px 9px rgba(0,0,0,.28)"}}>0</button>
        <button className="cbtn" tabIndex={-1} onPointerDown={e=>{e.preventDefault();delDigit();}}
          style={{...btnS,height:46,fontSize:20,background:"rgba(255,255,255,.11)",color:"#fff",boxShadow:"0 3px 9px rgba(0,0,0,.2)"}}>⌫</button>
        <button className="cbtn" tabIndex={-1} onPointerDown={e=>{e.preventDefault();submit();}}
          disabled={!input||disabled}
          style={{...btnS,height:46,fontSize:13,
            background:!input||disabled?"rgba(255,255,255,.07)":"linear-gradient(135deg,#6BCB77,#3aaa58)",
            color:!input||disabled?"rgba(255,255,255,.2)":"#fff",
            boxShadow:!input||disabled?"none":"0 3px 10px rgba(107,203,119,.35)"}}>✓ OK</button>
      </div>

      {/* Answer display */}
      <div style={{border:`2px solid ${powered?"#FFD93D":cm.border+"55"}`,borderRadius:10,padding:"6px 10px",fontFamily:"'Fredoka One',cursive",fontSize:28,color:powered?"#FFD93D":cm.accent,background:"rgba(0,0,0,.3)",textAlign:"center",letterSpacing:3,minHeight:44,opacity:disabled?.35:1}}>
        {input||<span style={{color:"rgba(255,255,255,.1)"}}>_ _</span>}
      </div>

      {/* Feedback flash */}
      <div style={{textAlign:"center",fontFamily:"'Fredoka One',cursive",fontSize:13,height:20,marginTop:4,
        color:flash==="correct"?"#6BCB77":flash==="wrong"?"#FF6B6B":flash==="timeout"?"#aaa":"transparent",
        fontWeight:700,transition:"color .2s"}}>
        {flash==="correct"?"✅ ¡Correcto! +1":flash==="wrong"?"❌ Incorrecto":flash==="timeout"?"⏰ Tiempo −❤️":disabled?"🏁 ¡Rondas completas!":"."}
      </div>

      {/* Keyboard hint */}
      <div style={{marginTop:5,background:"rgba(0,0,0,.22)",borderRadius:8,padding:"4px 7px",textAlign:"center"}}>
        <div style={{color:"rgba(255,255,255,.2)",fontSize:8,fontFamily:"'Fredoka One',cursive",letterSpacing:.4,marginBottom:2}}>{cm.kbdLabel}</div>
        <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap"}}>
          {cm.kbdKeys.map(k=>(
            <kbd key={k} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.14)",borderRadius:4,padding:"1px 5px",fontSize:9,color:"rgba(255,255,255,.45)",fontFamily:"monospace"}}>{k}</kbd>
          ))}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
//  MAIN APP
//  KEY DESIGN: each team is FULLY INDEPENDENT.
//  - Own round counter, own question, own lives, own streak
//  - Answering immediately gets next question — NO waiting for other
//  - Timer is shared (same countdown) but penalises both on expire
//  - Game ends when BOTH teams finish MAX_ROUNDS or either hits 0 lives
// ══════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen,  setScreen]  = useState("home");
  const [selOps,  setOps]     = useState(["sum"]);
  const [timerS,  setTimerS]  = useState(10);

  // Per-team independent state
  const [score,   setScore]   = useState({team1:0,  team2:0});
  const [rounds,  setRounds]  = useState({team1:0,  team2:0});   // rounds completed
  const [lives,   setLives]   = useState({team1:MAX_LIVES, team2:MAX_LIVES});
  const [streaks, setStr]     = useState({team1:0,  team2:0});
  const [questions,setQ]      = useState({team1:null,team2:null});
  const [flashes, setFlashes] = useState({team1:null,team2:null});
  const [tStates, setTS]      = useState({team1:"pull",team2:"pull"});

  // Shared arena state
  const [rope,    setRope]    = useState(0);
  const [lastEvt, setLE]      = useState(null);

  // Timer
  const [timeLeft,setTimeLeft]= useState(10);
  const [timerOn, setTimerOn] = useState(false);
  // Shared round index (drives the timer reset)
  const [roundIdx,setRoundIdx]= useState(0);

  // Imperative refs for keyboard → card bridge
  const t1Ref = useRef(null);
  const t2Ref = useRef(null);

  const tickRef  = useRef(0);
  const timerRef = useRef(null);
  const snap     = useRef({});

  useEffect(() => {
    snap.current = { screen, questions, rounds, lives, streaks, rope, timerOn, timerS, selOps, score, roundIdx };
  });

  const pickOp = (ops) => ops[~~(Math.random() * ops.length)];

  // ── check if game should end ─────────────────────────────────────
  const checkGameOver = useCallback((newLives, newRounds) => {
    if (newLives.team1 === 0 || newLives.team2 === 0) {
      setTimeout(() => setScreen("result"), 800);
      return true;
    }
    if (newRounds.team1 >= MAX_ROUNDS && newRounds.team2 >= MAX_ROUNDS) {
      setTimeout(() => setScreen("result"), 600);
      return true;
    }
    return false;
  }, []);

  // ── handle answer for one team — IMMEDIATELY gives next question ──
  const handleAnswer = useCallback((team, correct) => {
    const s = snap.current;
    const ops = s.selOps;
    const now = (++tickRef.current) * 10;

    if (correct) {
      setStr(prev => {
        const ns = { ...prev, [team]: prev[team] + 1 };
        const isPow = ns[team] > 0 && ns[team] % POWER_STREAK === 0;
        setRope(p => Math.max(-1, Math.min(1, p + (team==="team1"?-1:1) * (isPow?.38:.17))));
        setLE({ team, type: isPow?"powerup":"correct", time: now });
        setScore(sc => ({ ...sc, [team]: sc[team] + 1 }));
        return ns;
      });
      setFlashes(f => ({ ...f, [team]:"correct" }));
      setTS(ts => ({ ...ts, [team]:"celebrate" }));
      setTimeout(() => { setTS(ts => ({ ...ts, [team]:"pull" })); }, 700);
      setTimeout(() => { setFlashes(f => ({ ...f, [team]:null })); }, 700);
    } else {
      setLives(lv => {
        const nl = { ...lv, [team]: Math.max(0, lv[team] - 1) };
        checkGameOver(nl, s.rounds);
        return nl;
      });
      setStr(ps => ({ ...ps, [team]: 0 }));
      setLE({ team, type:"wrong", time: now });
      setFlashes(f => ({ ...f, [team]:"wrong" }));
      setTS(ts => ({ ...ts, [team]:"hit" }));
      setTimeout(() => { setTS(ts => ({ ...ts, [team]:"pull" })); }, 700);
      setTimeout(() => { setFlashes(f => ({ ...f, [team]:null })); }, 700);
    }

    // Advance THIS team's round counter and give next question IMMEDIATELY
    setRounds(r => {
      const nr = { ...r, [team]: r[team] + 1 };
      if (nr[team] < MAX_ROUNDS) {
        // Give next question right away — no waiting for other team
        setQ(q => ({ ...q, [team]: genQ(ops[~~(Math.random()*ops.length)]) }));
      } else {
        // This team finished all rounds — check if game over
        setLives(lv => { checkGameOver(lv, nr); return lv; });
      }
      return nr;
    });

  }, [checkGameOver]);

  // ── timer countdown (shared, resets each roundIdx) ───────────────
  useEffect(() => {
    if (screen !== "game" || !timerOn) { clearInterval(timerRef.current); return; }
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerOn(false);
          const s = snap.current;
          const now = (++tickRef.current) * 10;
          // Both teams lose a life
          setLE({ team:"both", type:"timeout", time:now });
          const nl = { team1:Math.max(0,s.lives.team1-1), team2:Math.max(0,s.lives.team2-1) };
          setLives(nl);
          setStr({ team1:0, team2:0 });
          setTS({ team1:"timeout", team2:"timeout" });
          setFlashes({ team1:"timeout", team2:"timeout" });

          if (nl.team1===0||nl.team2===0) { setTimeout(()=>setScreen("result"),800); return 0; }

          // Advance rounds for teams that hadn't answered
          setRounds(r => {
            const nr = {
              team1: r.team1 < MAX_ROUNDS ? r.team1+1 : r.team1,
              team2: r.team2 < MAX_ROUNDS ? r.team2+1 : r.team2,
            };
            if(checkGameOver(nl,nr)) return nr;
            // Give new questions after delay
            const ops = s.selOps;
            setTimeout(() => {
              setTS({ team1:"pull", team2:"pull" });
              setFlashes({ team1:null, team2:null });
              if (nr.team1 < MAX_ROUNDS) setQ(q=>({...q,team1:genQ(pickOp(ops))}));
              if (nr.team2 < MAX_ROUNDS) setQ(q=>({...q,team2:genQ(pickOp(ops))}));
              setTimeLeft(s.timerS);
              setTimerOn(true);
              setRoundIdx(i=>i+1);
            }, 1200);
            return nr;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, timerOn, roundIdx, checkGameOver]);

  // ── start game ────────────────────────────────────────────────────
  const startGame = () => {
    clearInterval(timerRef.current);
    const pick = () => selOps[~~(Math.random()*selOps.length)];
    setScore({team1:0,team2:0}); setRounds({team1:0,team2:0});
    setLives({team1:MAX_LIVES,team2:MAX_LIVES}); setStr({team1:0,team2:0});
    setRope(0); setLE(null); setTS({team1:"pull",team2:"pull"});
    setFlashes({team1:null,team2:null});
    setQ({team1:genQ(pick()),team2:genQ(pick())});
    setTimeLeft(timerS); setTimerOn(false); setRoundIdx(0);
    setScreen("game");
    setTimeout(()=>setTimerOn(true), 450);
  };

  // ── PHYSICAL KEYBOARD — one-time listener, reads refs live ────────
  useEffect(() => {
    const onKey = e => {
      if (snap.current.screen !== "game") return;
      // Blur any focused button so Enter doesn't trigger its click AND the game handler
      const ae = document.activeElement;
      if (ae && ae.tagName === "BUTTON") ae.blur();
      if (e.code in T1_MAP) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const v=T1_MAP[e.code], api=t1Ref.current; if(!api)return;
        if(v==="DEL") api.delDigit(); else if(v==="OK") api.submit(); else api.pushDigit(v);
        return;
      }
      if (e.code in T2_MAP) {
        e.preventDefault();
        e.stopImmediatePropagation();
        const v=T2_MAP[e.code], api=t2Ref.current; if(!api)return;
        if(v==="DEL") api.delDigit(); else if(v==="OK") api.submit(); else api.pushDigit(v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // ← empty deps intentional: refs always point to latest fns

  const toggleOp = k => setOps(p=>p.includes(k)?(p.length>1?p.filter(x=>x!==k):p):[...p,k]);

  // ── HOME ──────────────────────────────────────────────────────────
  if(screen==="home") return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive",position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#0f0a2a 0%,#1e1060 50%,#0f0a2a 100%)"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');*{box-sizing:border-box;margin:0;padding:0;}button:active{transform:scale(0.93)!important;}`}</style>
      <AnimatedBg/>
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:24,maxWidth:520}}>
        <div style={{fontSize:64,marginBottom:6,filter:"drop-shadow(0 0 20px #FFD93D88)"}}>🧮</div>
        <div style={{background:"linear-gradient(135deg,#FF922B,#FFD93D)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:"clamp(28px,5.5vw,52px)",lineHeight:1.1,marginBottom:2}}>Aprendemos</div>
        <div style={{background:"linear-gradient(135deg,#6BCB77,#4D96FF)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontSize:"clamp(28px,5.5vw,52px)",marginBottom:18}}>Jugando 🎉</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:12}}>
          <div style={{background:"rgba(255,255,255,.055)",backdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,.09)",borderRadius:18,padding:"14px 15px",flex:1,minWidth:185}}>
            <div style={{color:"#FFD93D",fontSize:13,marginBottom:8}}>⚙️ Operaciones</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>
              {OPS.map(op=><button key={op.key} onClick={()=>toggleOp(op.key)} style={{background:selOps.includes(op.key)?"#FFD93D":"rgba(255,255,255,.07)",color:selOps.includes(op.key)?"#333":"#fff",border:`2px solid ${selOps.includes(op.key)?"#FFD93D":"rgba(255,255,255,.16)"}`,borderRadius:10,padding:"6px 11px",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka One',cursive",transition:"all .2s"}}>{op.sym} {op.label}</button>)}
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,.055)",backdropFilter:"blur(14px)",border:"1px solid rgba(255,255,255,.09)",borderRadius:18,padding:"14px 15px",minWidth:170}}>
            <div style={{color:"#FFD93D",fontSize:13,marginBottom:8}}>⏱️ Tiempo / pregunta</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>
              {TIMER_OPTS.map(t=><button key={t} onClick={()=>setTimerS(t)} style={{background:timerS===t?"#FF922B":"rgba(255,255,255,.07)",color:timerS===t?"#fff":"rgba(255,255,255,.6)",border:`2px solid ${timerS===t?"#FF922B":"rgba(255,255,255,.16)"}`,borderRadius:10,padding:"6px 10px",fontSize:13,cursor:"pointer",fontFamily:"'Fredoka One',cursive",transition:"all .2s"}}>{t}s</button>)}
            </div>
            <div style={{color:"rgba(255,255,255,.26)",fontSize:10,marginTop:6,textAlign:"center"}}>Al vencer: ambos −❤️</div>
          </div>
        </div>
        <div style={{color:"rgba(255,255,255,.28)",fontSize:11,marginBottom:14}}>
          {MAX_ROUNDS} rondas · {MAX_LIVES} vidas · Racha ×{POWER_STREAK}=⚡ · Cada equipo juega de forma independiente
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginBottom:18}}>
          {[{label:"🔴 Equipo 1",keys:["1-9","0","⌫","↵"],color:"#FF922B",desc:"Teclado normal"},{label:"🔵 Equipo 2",keys:["Num1-9","Num0","Num,","Num+ ó Num↵"],color:"#4D96FF",desc:"Teclado numérico"}].map(({label,keys,color,desc})=>(
            <div key={label} style={{background:"rgba(255,255,255,.04)",border:`1px solid ${color}33`,borderRadius:12,padding:"6px 12px",textAlign:"center"}}>
              <div style={{color,fontFamily:"'Fredoka One',cursive",fontSize:12,marginBottom:3}}>{label} — {desc}</div>
              <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap"}}>{keys.map(k=><kbd key={k} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.18)",borderRadius:5,padding:"2px 6px",fontSize:10,color:"rgba(255,255,255,.6)",fontFamily:"monospace"}}>{k}</kbd>)}</div>
            </div>
          ))}
        </div>
        <button onClick={startGame} style={{background:"linear-gradient(135deg,#FF6B6B,#FF922B)",color:"#fff",border:"none",borderRadius:18,padding:"15px 50px",fontSize:22,fontFamily:"'Fredoka One',cursive",cursor:"pointer",boxShadow:"0 8px 26px rgba(255,107,107,.45)"}}>🎮 ¡JUGAR!</button>
      </div>
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────
  if(screen==="result"){
    const winner=score.team1>score.team2?"Equipo 1 🔴":score.team2>score.team1?"Equipo 2 🔵":null;
    const msgs=winner?WIN_MSG(winner):DRAW_MSG;
    return(
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Fredoka One',cursive",position:"relative",background:"linear-gradient(135deg,#0f0a2a,#1e1060,#0f0a2a)",overflow:"hidden"}}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');*{box-sizing:border-box;}`}</style>
        <AnimatedBg/><Confetti/>
        <div style={{position:"relative",zIndex:10,textAlign:"center",padding:24,maxWidth:480}}>
          <div style={{fontSize:76,marginBottom:8,filter:"drop-shadow(0 0 26px #FFD93D)"}}>🏆</div>
          {msgs.map((m,i)=><div key={i} style={{color:i===0?"#FFD93D":"#fff",fontSize:i===0?32:i===1?20:16,marginBottom:10,textShadow:i===0?"0 0 20px #FFD93D77":"none"}}>{m}</div>)}
          <div style={{display:"flex",gap:16,justifyContent:"center",margin:"20px 0",flexWrap:"wrap"}}>
            {[{label:"Equipo 1 🔴",s:score.team1,c:"#FF922B"},{label:"Equipo 2 🔵",s:score.team2,c:"#4D96FF"}].map(t=>(
              <div key={t.label} style={{background:`${t.c}16`,border:`2px solid ${t.c}44`,borderRadius:16,padding:"13px 24px",color:"#fff",minWidth:128,backdropFilter:"blur(10px)"}}>
                <div style={{fontSize:13,color:t.c}}>{t.label}</div>
                <div style={{fontSize:46,fontWeight:700}}>{t.s}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,.35)"}}>respuestas correctas</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={startGame} style={{background:"linear-gradient(135deg,#6BCB77,#4D96FF)",color:"#fff",border:"none",borderRadius:14,padding:"12px 26px",fontSize:18,cursor:"pointer",fontFamily:"'Fredoka One',cursive",boxShadow:"0 5px 18px rgba(77,150,255,.38)"}}>🔄 Jugar de nuevo</button>
            <button onClick={()=>setScreen("home")} style={{background:"rgba(255,255,255,.07)",color:"#fff",border:"1px solid rgba(255,255,255,.17)",borderRadius:14,padding:"12px 22px",fontSize:18,cursor:"pointer",fontFamily:"'Fredoka One',cursive"}}>🏠 Inicio</button>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME ──────────────────────────────────────────────────────────
  const danger=timeLeft<=5;

  return(
    <div style={{minHeight:"100vh",fontFamily:"'Fredoka One',cursive",background:"linear-gradient(135deg,#0f0a2a 0%,#1e1060 50%,#0f0a2a 100%)",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        *{box-sizing:border-box;}body{margin:0;}
        @media(max-width:680px){.grow{flex-direction:column!important;align-items:center!important;}.tugw{order:-1;width:100%!important;}}
        ${danger?`@keyframes ef{0%,100%{box-shadow:inset 0 0 0 0 transparent}50%{box-shadow:inset 0 0 45px 8px rgba(255,107,107,.22)}}`:""}
      `}</style>
      <AnimatedBg/>
      {danger&&<div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",animation:"ef 0.55s infinite"}}/>}

      <div style={{position:"relative",zIndex:1,padding:"8px 12px",maxWidth:1060,margin:"0 auto"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5,flexWrap:"wrap",gap:6}}>
          <div style={{color:"#FFD93D",fontSize:17,textShadow:"0 0 10px #FFD93D33"}}>🧮 Aprendemos Jugando</div>
          <div style={{display:"flex",gap:7,alignItems:"center"}}>
            <CountdownRing timeLeft={timeLeft} totalTime={timerS}/>
            <button onClick={()=>{clearInterval(timerRef.current);setScreen("home");}} style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.09)",borderRadius:8,padding:"5px 11px",color:"#fff",cursor:"pointer",fontFamily:"'Fredoka One',cursive",fontSize:12}}>🏠 Inicio</button>
          </div>
        </div>

        {/* Score bars */}
        <div style={{display:"flex",gap:7,marginBottom:7}}>
          {[{k:"team1",c:"#FF922B",s:score.team1},{k:"team2",c:"#4D96FF",s:score.team2}].map(({k,c,s})=>(
            <div key={k} style={{flex:1,background:"rgba(255,255,255,.05)",borderRadius:6,height:7,overflow:"hidden"}}>
              <div style={{height:"100%",background:c,width:`${(s/MAX_ROUNDS)*100}%`,transition:"width .5s",borderRadius:6,boxShadow:`0 0 7px ${c}88`}}/>
            </div>
          ))}
        </div>

        {/* Game row */}
        <div className="grow" style={{display:"flex",gap:11,alignItems:"flex-start",justifyContent:"center"}}>

          {questions.team1!=null && (
            <CalcCard
              team="team1" color="orange"
              question={questions.team1}
              lives={lives.team1} streak={streaks.team1}
              flash={flashes.team1}
              roundsDone={rounds.team1}
              onAnswer={c=>handleAnswer("team1",c)}
              disabled={rounds.team1>=MAX_ROUNDS}
              imperativeRef={t1Ref}
            />
          )}

          <div className="tugw" style={{flex:2,display:"flex",flexDirection:"column",alignItems:"center",gap:7,minWidth:230}}>
            <TugVisual ropePos={rope}
              team1={{lives:lives.team1,streak:streaks.team1,state:tStates.team1}}
              team2={{lives:lives.team2,streak:streaks.team2,state:tStates.team2}}
              lastEvent={lastEvt}/>
            {/* Score chips */}
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              {[{label:"🔴 T1",s:score.team1,c:"#FF922B"},{label:"🔵 T2",s:score.team2,c:"#4D96FF"}].map(t=>(
                <div key={t.label} style={{background:`${t.c}1e`,border:`1px solid ${t.c}44`,borderRadius:9,padding:"3px 13px",color:"#fff",fontFamily:"'Fredoka One',cursive",fontSize:13}}>
                  {t.label} <span style={{color:t.c,fontSize:19,fontWeight:700}}>{t.s}</span>
                </div>
              ))}
            </div>
          </div>

          {questions.team2!=null && (
            <CalcCard
              team="team2" color="blue"
              question={questions.team2}
              lives={lives.team2} streak={streaks.team2}
              flash={flashes.team2}
              roundsDone={rounds.team2}
              onAnswer={c=>handleAnswer("team2",c)}
              disabled={rounds.team2>=MAX_ROUNDS}
              imperativeRef={t2Ref}
            />
          )}
        </div>
      </div>
    </div>
  );
}
