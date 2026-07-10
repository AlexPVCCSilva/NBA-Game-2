import React, { useState, useEffect, useRef } from 'react';

// ----------------------------------------------------
// GAME 1: THE SHOT (Arremesso)
// ----------------------------------------------------
function TrajectoryGame({ onComplete, resolved, won, playerOvr }) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentDrag, setCurrentDrag] = useState({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(5);
  
  const [ballPos, setBallPos] = useState({ x: 150, y: 300 });
  
  // Dificuldade por OVR (tamanho do aro)
  const hoopWidth = Math.max(30, Math.floor(playerOvr * 0.8)); // 99 OVR -> ~80px
  const hoopPos = { x: 150, y: 60 };
  
  useEffect(() => {
    if (resolved) return;
    const clock = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(clock);
          onComplete(false); // Shot clock violation
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, [resolved, onComplete]);

  const handlePointerDown = (e) => {
    if (resolved) return;
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCurrentDrag({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!isDragging || resolved) return;
    setCurrentDrag({ x: e.clientX, y: e.clientY });
  };

  const animateBall = (vx, vy) => {
    let x = 150;
    let y = 300;
    let velX = vx * 0.15;
    let velY = vy * 0.15;
    const gravity = 0.5;
    let hasWon = false;

    const interval = setInterval(() => {
      x += velX;
      y += velY;
      velY += gravity;
      
      setBallPos({ x, y });

      const dist = Math.hypot(x - hoopPos.x, y - hoopPos.y);
      if (dist < (hoopWidth / 2) && !hasWon) {
        hasWon = true;
      }

      if (y > 400 || x > 400 || x < -100) {
        clearInterval(interval);
      }
    }, 16); 
    
    setTimeout(() => {
       clearInterval(interval);
       onComplete(hasWon);
    }, 1500); 
  };

  const handlePointerUp = (e) => {
    if (!isDragging || resolved) return;
    e.target.releasePointerCapture && e.target.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    
    const dx = dragStart.x - currentDrag.x;
    const dy = dragStart.y - currentDrag.y;
    
    animateBall(dx, dy);
  };

  const previewPoints = [];
  if (isDragging) {
    const vx = (dragStart.x - currentDrag.x) * 0.15;
    const vy = (dragStart.y - currentDrag.y) * 0.15;
    let px = 150;
    let py = 300;
    let pvY = vy;
    for (let i = 0; i < 15; i++) {
      px += vx * 3;
      py += pvY * 3;
      pvY += 0.5 * 3;
      previewPoints.push({ x: px, y: py });
    }
  }

  const displayBallPos = isDragging ? {
    x: ballPos.x + (currentDrag.x - dragStart.x),
    y: ballPos.y + (currentDrag.y - dragStart.y)
  } : ballPos;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-50 bg-[#2a4521] flex flex-col p-6 border border-brand-orange/30 rounded-xl overflow-hidden select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #fff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fff 20px)' }}></div>
      
      <div className="text-white uppercase tracking-widest text-[10px] font-bold mb-2 flex justify-between w-full relative z-10">
        <span>The Shot</span>
        <span className="text-red-400 bg-black/50 px-2 py-0.5 rounded">{timeLeft}s</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-1 relative z-10">Clutch Moment</h2>
      <p className="text-white/80 text-xs mb-4 relative z-10">Pull back to aim and shoot.</p>

      <div className="flex-1 relative bg-orange-900/40 rounded-lg overflow-hidden touch-none border border-orange-500/30">
        
        {/* Hoop */}
        <div 
          className="absolute h-3 border-b-4 border-r-4 border-red-500 rounded-b-full transition-all"
          style={{ width: hoopWidth, left: hoopPos.x - (hoopWidth / 2), top: hoopPos.y }}
        ></div>
        <div className="absolute w-24 h-1 bg-white/40" style={{ left: hoopPos.x - 48, top: hoopPos.y - 12 }}></div>
        <div className="absolute w-32 h-32 border border-white/20 rounded-full" style={{ left: hoopPos.x - 64, top: hoopPos.y - 100 }}></div>
        
        {/* Trajectory */}
        {isDragging && previewPoints.map((pt, i) => (
          <div 
            key={i} 
            className="absolute w-1.5 h-1.5 bg-white/50 rounded-full"
            style={{ left: pt.x, top: pt.y }}
          ></div>
        ))}
        
        {/* Ball */}
        <div 
          className={`absolute w-6 h-6 bg-brand-orange rounded-full border border-black shadow-[0_0_15px_rgba(245,130,22,0.8)] cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ left: displayBallPos.x - 12, top: displayBallPos.y - 12, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
        >
          {/* Linhas da bola */}
          <div className="absolute inset-0 border border-black/30 rounded-full"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-black/40"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/40"></div>
        </div>
      </div>

      {resolved && (
        <div className={`absolute inset-0 flex items-center justify-center font-display text-5xl bg-black/80 z-50 ${won ? 'text-green-500' : 'text-red-600'}`}>
          {won ? 'SWISH!' : 'BRICK!'}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// GAME 2: THE VISION (Passe)
// ----------------------------------------------------
function PassGame({ onComplete, resolved, won, playerOvr }) {
  const containerRef = useRef(null);
  const [isPassing, setIsPassing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  
  // Game state
  const [ballPos, setBallPos] = useState({ x: 150, y: 320 });
  const [teammate, setTeammate] = useState({ x: 150, y: 50, dir: 1 });
  const [defenders, setDefenders] = useState([
    { x: 100, y: 150, dir: 1, speed: 2 },
    { x: 200, y: 220, dir: -1, speed: 2.5 }
  ]);

  const teammateWidth = 40;
  const defenderWidth = 35;
  
  // Dificuldade (Velocidade dos defensores e do companheiro)
  // OVR 99 -> defensores lentos, alvo rápido
  const defSpeedMod = Math.max(0.5, 3 - (playerOvr / 35)); 

  useEffect(() => {
    if (resolved || isPassing) return;
    const clock = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(clock);
          onComplete(false); // Shot clock violation
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, [resolved, isPassing, onComplete]);

  // Game Loop para movimentação
  useEffect(() => {
    if (resolved || isPassing) return;
    const loop = setInterval(() => {
      // Move teammate
      setTeammate(t => {
        let nx = t.x + (4 * t.dir);
        let ndir = t.dir;
        if (nx > 260) { nx = 260; ndir = -1; }
        if (nx < 40) { nx = 40; ndir = 1; }
        return { ...t, x: nx, dir: ndir };
      });

      // Move defenders
      setDefenders(defs => defs.map(d => {
        let nx = d.x + (d.speed * defSpeedMod * d.dir);
        let ndir = d.dir;
        if (nx > 280) { nx = 280; ndir = -1; }
        if (nx < 20) { nx = 20; ndir = 1; }
        return { ...d, x: nx, dir: ndir };
      }));
    }, 30);
    return () => clearInterval(loop);
  }, [resolved, isPassing, defSpeedMod]);

  const handleContainerClick = (e) => {
    if (resolved || isPassing) return;
    
    // Calcula o destino do passe (onde clicou)
    const rect = containerRef.current.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;

    setIsPassing(true);

    const startX = ballPos.x;
    const startY = ballPos.y;
    const angle = Math.atan2(targetY - startY, targetX - startX);
    const speed = 12;

    let currX = startX;
    let currY = startY;
    let hasResolved = false;

    const passLoop = setInterval(() => {
      currX += Math.cos(angle) * speed;
      currY += Math.sin(angle) * speed;
      
      setBallPos({ x: currX, y: currY });

      // Collision checks current positions (since defenders freeze while passing for simplicity, 
      // but if we want them to keep moving, we should use state refs. For NSS style, freezing or predicting is fine.
      // We will check collision with current react state closures, which means hitboxes are fixed at the moment of pass.
      
      // Checa colisão com defensores
      for (const d of defenders) {
        const dist = Math.hypot(currX - d.x, currY - d.y);
        if (dist < (defenderWidth/2 + 10)) {
          clearInterval(passLoop);
          if (!hasResolved) {
            hasResolved = true;
            onComplete(false); // Intercepted
          }
          return;
        }
      }

      // Checa colisão com companheiro
      const distToTeammate = Math.hypot(currX - teammate.x, currY - teammate.y);
      if (distToTeammate < (teammateWidth/2 + 15)) {
        clearInterval(passLoop);
        if (!hasResolved) {
          hasResolved = true;
          onComplete(true); // Assist
        }
        return;
      }

      // Out of bounds
      if (currY < 0 || currY > 400 || currX < 0 || currX > 300) {
        clearInterval(passLoop);
        if (!hasResolved) {
          hasResolved = true;
          onComplete(false); // Bad pass
        }
      }

    }, 16);
  };

  return (
    <div 
      className="absolute inset-0 z-50 bg-[#2a4521] flex flex-col p-6 border border-brand-orange/30 rounded-xl overflow-hidden select-none"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #fff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fff 20px)' }}></div>
      
      <div className="text-yellow-400 uppercase tracking-widest text-[10px] font-bold mb-2 flex justify-between w-full relative z-10">
        <span>The Vision</span>
        <span className="text-red-400 bg-black/50 px-2 py-0.5 rounded">{timeLeft}s</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-1 relative z-10">Find the Open Man</h2>
      <p className="text-white/80 text-xs mb-4 relative z-10">Tap anywhere to pass. Don't get intercepted!</p>

      <div 
        ref={containerRef}
        className="flex-1 relative bg-orange-900/20 rounded-lg overflow-hidden border border-orange-500/30 cursor-crosshair"
        onClick={handleContainerClick}
      >
        {/* Teammate */}
        <div 
          className="absolute bg-blue-500 rounded-full border-2 border-white flex items-center justify-center font-bold text-white text-xs shadow-[0_0_15px_rgba(59,130,246,0.6)]"
          style={{ width: teammateWidth, height: teammateWidth, left: teammate.x - teammateWidth/2, top: teammate.y - teammateWidth/2 }}
        >
          99
        </div>

        {/* Defenders */}
        {defenders.map((d, i) => (
          <div 
            key={i}
            className="absolute bg-red-600 rounded-full border-2 border-black flex items-center justify-center font-bold text-white text-xs"
            style={{ width: defenderWidth, height: defenderWidth, left: d.x - defenderWidth/2, top: d.y - defenderWidth/2 }}
          >
            D
          </div>
        ))}

        {/* You (Player) */}
        {!isPassing && (
          <div 
            className="absolute w-8 h-8 bg-brand-orange rounded-full border-2 border-white flex items-center justify-center"
            style={{ left: ballPos.x - 16, top: ballPos.y - 16 }}
          >
            U
          </div>
        )}

        {/* Ball */}
        <div 
          className="absolute w-5 h-5 bg-brand-orange rounded-full border border-black shadow-[0_0_10px_rgba(245,130,22,0.8)]"
          style={{ left: ballPos.x - 10, top: ballPos.y - 10 }}
        ></div>
      </div>

      {resolved && (
        <div className={`absolute inset-0 flex items-center justify-center font-display text-5xl bg-black/80 z-50 ${won ? 'text-green-500' : 'text-red-600'}`}>
          {won ? 'DIME!' : 'TURNOVER!'}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// GAME 3: THE DRIVE (Infiltração)
// ----------------------------------------------------
function DriveGame({ onComplete, resolved, won, playerOvr }) {
  const containerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [playerX, setPlayerX] = useState(150);
  const [defenders, setDefenders] = useState([]);

  // Dificuldade
  // OVR 99 -> Defensores caem devagar
  const defFallSpeed = Math.max(3, 8 - (playerOvr / 15)); 
  const spawnRate = Math.max(300, 800 - (playerOvr * 3));

  useEffect(() => {
    if (resolved) return;
    const clock = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(clock);
          onComplete(true); // Se sobreviveu 5 segundos, chegou na cesta!
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, [resolved, onComplete]);

  // Game Loop
  useEffect(() => {
    if (resolved) return;
    
    // Spawner
    const spawner = setInterval(() => {
      setDefenders(prev => [...prev, {
        id: Math.random(),
        x: Math.random() * 240 + 30, // Random X
        y: -30
      }]);
    }, spawnRate);

    // Mover defensores
    const mover = setInterval(() => {
      setDefenders(prev => {
        let hit = false;
        const next = prev.map(d => {
          const ny = d.y + defFallSpeed;
          // Collision check
          const dist = Math.hypot(playerX - d.x, 320 - ny);
          if (dist < 30) {
             hit = true;
          }
          return { ...d, y: ny };
        }).filter(d => d.y < 400);

        if (hit) {
          onComplete(false); // Trombou no defensor
        }
        return next;
      });
    }, 30);

    return () => {
      clearInterval(spawner);
      clearInterval(mover);
    };
  }, [resolved, playerX, defFallSpeed, spawnRate, onComplete]);

  const handleTap = (e) => {
    if (resolved) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // Move towards click but clamp
    setPlayerX(clickX);
  };

  return (
    <div 
      className="absolute inset-0 z-50 bg-[#2a4521] flex flex-col p-6 border border-brand-orange/30 rounded-xl overflow-hidden select-none"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #fff 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #fff 20px)' }}></div>
      
      <div className="text-blue-400 uppercase tracking-widest text-[10px] font-bold mb-2 flex justify-between w-full relative z-10">
        <span>The Drive</span>
        <span className="text-yellow-400 bg-black/50 px-2 py-0.5 rounded">{timeLeft}s to Rim</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-1 relative z-10">Attack the Paint</h2>
      <p className="text-white/80 text-xs mb-4 relative z-10">Tap left/right to dodge defenders!</p>

      <div 
        ref={containerRef}
        className="flex-1 relative bg-orange-900/20 rounded-lg overflow-hidden border border-orange-500/30 cursor-pointer"
        onClick={handleTap}
      >
        {/* Parquet floor lines */}
        <div className="absolute inset-x-0 top-0 bottom-0 flex justify-evenly opacity-10">
          <div className="w-px bg-white"></div>
          <div className="w-px bg-white"></div>
          <div className="w-px bg-white"></div>
        </div>

        {/* Player */}
        <div 
          className="absolute w-10 h-10 bg-brand-orange rounded-full border-2 border-white shadow-[0_0_20px_rgba(245,130,22,0.8)] flex items-center justify-center transition-all duration-100 ease-out z-20"
          style={{ left: playerX - 20, top: 320 - 20 }}
        >
          <div className="w-4 h-4 bg-black rounded-full opacity-50"></div>
        </div>

        {/* Defenders */}
        {defenders.map(d => (
          <div 
            key={d.id}
            className="absolute w-10 h-10 bg-red-600 rounded-full border-2 border-black flex items-center justify-center font-bold text-white text-xs z-10"
            style={{ left: d.x - 20, top: d.y - 20 }}
          >
            D
          </div>
        ))}
      </div>

      {resolved && (
        <div className={`absolute inset-0 flex items-center justify-center font-display text-5xl bg-black/80 z-50 ${won ? 'text-green-500' : 'text-red-600'}`}>
          {won ? 'POSTERIZED!' : 'BLOCKED!'}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// GAME 4: PRESS CONFERENCE
// ----------------------------------------------------
function PressGame({ onComplete, resolved, won }) {
  const [timeLeft, setTimeLeft] = useState(3); 
  const options = [
    { text: "We played as a team. Proud of my guys.", win: true },
    { text: "I did my best, the rest of the team needs to step up.", win: false },
    { text: "I take full responsibility for this loss.", win: true }
  ];

  useEffect(() => {
    if (resolved) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          onComplete(false); 
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resolved, onComplete]);

  return (
    <div className="absolute inset-0 z-50 bg-[#111] flex flex-col p-6 border border-purple-500/30 rounded-xl">
      <div className="text-purple-500 uppercase tracking-widest text-[10px] font-bold mb-2">Press Conference</div>
      <div className="text-white/40 text-xs mb-4">You have <span className="text-white font-bold">{timeLeft}s</span> to answer.</div>
      
      <div className="bg-[#222] p-4 rounded-lg mb-4 text-white text-sm italic border-l-4 border-purple-500">
        "Tough game tonight. What are your thoughts on the team's performance?"
      </div>

      <div className="flex flex-col gap-2 flex-1 justify-end">
        {!resolved ? options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onComplete(opt.win)}
            className="text-left bg-[#0a0a0a] border border-[#333] hover:border-purple-500 text-white/80 p-3 rounded text-xs transition hover:translate-x-2"
          >
            "{opt.text}"
          </button>
        )) : null}
      </div>

      {resolved && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center font-display text-4xl bg-black/80 z-50 ${won ? 'text-green-500' : 'text-red-600'}`}>
          {won ? 'GOOD PR!' : 'CONTROVERSY!'}
          <div className="text-xs text-white/50 font-sans mt-2 tracking-widest uppercase">
            {won ? 'Chemistry +15' : 'Chemistry -5'}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Minigames({ gameType, onComplete, playerOvr = 75 }) {
  const [resolved, setResolved] = useState(false);
  const [won, setWon] = useState(false);

  const handleComplete = (isWin) => {
    if (resolved) return;
    setResolved(true);
    setWon(isWin);
    
    setTimeout(() => {
      onComplete(isWin);
    }, 1500);
  };

  if (gameType === 'trajectory') {
    return <TrajectoryGame onComplete={handleComplete} resolved={resolved} won={won} playerOvr={playerOvr} />;
  }

  if (gameType === 'pass') {
    return <PassGame onComplete={handleComplete} resolved={resolved} won={won} playerOvr={playerOvr} />;
  }

  if (gameType === 'drive') {
    return <DriveGame onComplete={handleComplete} resolved={resolved} won={won} playerOvr={playerOvr} />;
  }

  if (gameType === 'press') {
    return <PressGame onComplete={handleComplete} resolved={resolved} won={won} />;
  }

  return (
     <div className="absolute inset-0 z-50 bg-[#111] flex flex-col items-center justify-center p-6 border border-red-500/30 rounded-xl text-white">
        ERRO: Minigame não encontrado.
     </div>
  );
}
