import React, { useState, useEffect, useRef } from 'react';

// ----------------------------------------------------
// SHARED UI COMPONENTS
// ----------------------------------------------------
const CourtBackground = () => (
  <>
    <div className="absolute inset-0 bg-[#1a0f08]"></div>
    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, #d97706 2px, transparent 2px), linear-gradient(#d97706 2px, transparent 2px)', backgroundSize: '60px 60px' }}></div>
    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none"></div>
  </>
);

const GameHeader = ({ title, subtitle, timeLeft, colorClass = "text-brand-orange" }) => (
  <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl mb-4 relative z-10 shadow-2xl">
    <div className={`${colorClass} uppercase tracking-widest text-[10px] font-bold mb-1 flex justify-between w-full`}>
      <span>{title}</span>
      <span className="text-red-400 font-mono animate-pulse flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500"></div> {timeLeft}s
      </span>
    </div>
    <h2 className="text-2xl font-display text-white drop-shadow-md">{subtitle}</h2>
  </div>
);

const ResultOverlay = ({ resolved, won, winText, loseText }) => {
  if (!resolved) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 animate-in fade-in duration-300">
      <div className={`transform scale-110 font-display text-6xl drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] ${won ? 'text-green-400 animate-bounce' : 'text-red-500 animate-pulse'}`}>
        {won ? winText : loseText}
      </div>
    </div>
  );
};

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
  
  const hoopWidth = Math.max(30, Math.floor(playerOvr * 0.8)); 
  const hoopPos = { x: 150, y: 60 };
  
  useEffect(() => {
    if (resolved) return;
    const clock = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(clock);
          onComplete(false); 
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
      className="absolute inset-0 z-50 flex flex-col p-6 border-2 border-brand-orange/50 rounded-2xl overflow-hidden select-none shadow-[0_0_60px_rgba(245,130,22,0.2)] bg-black"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <CourtBackground />
      <GameHeader title="The Shot" subtitle="Clutch Moment" timeLeft={timeLeft} />

      <div className="flex-1 relative rounded-xl overflow-hidden touch-none border border-white/5 shadow-inner bg-black/20">
        
        {/* Glow do Garrafão */}
        <div className="absolute w-40 h-40 bg-brand-orange/20 rounded-full blur-3xl" style={{ left: hoopPos.x - 80, top: hoopPos.y - 80 }}></div>

        {/* Hoop */}
        <div 
          className="absolute h-3 border-b-4 border-r-4 border-red-500 rounded-b-full transition-all shadow-[0_0_15px_rgba(239,68,68,0.8)]"
          style={{ width: hoopWidth, left: hoopPos.x - (hoopWidth / 2), top: hoopPos.y }}
        ></div>
        <div className="absolute w-24 h-1.5 bg-white/80 rounded" style={{ left: hoopPos.x - 48, top: hoopPos.y - 12 }}></div>
        <div className="absolute w-32 h-32 border-2 border-white/20 rounded-full" style={{ left: hoopPos.x - 64, top: hoopPos.y - 100 }}></div>
        
        {/* Trajectory */}
        {isDragging && previewPoints.map((pt, i) => (
          <div 
            key={i} 
            className="absolute w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)] transition-all"
            style={{ left: pt.x, top: pt.y, opacity: 1 - (i * 0.05) }}
          ></div>
        ))}
        
        {/* Ball */}
        <div 
          className={`absolute w-8 h-8 bg-gradient-to-br from-brand-orange to-orange-700 rounded-full border border-black/50 shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_-2px_6px_rgba(0,0,0,0.5)] cursor-grab ${isDragging ? 'cursor-grabbing scale-110 shadow-[0_0_30px_rgba(245,130,22,0.8)]' : ''} transition-transform`}
          style={{ left: displayBallPos.x - 16, top: displayBallPos.y - 16, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
        >
          {/* Linhas da bola */}
          <div className="absolute inset-0 border border-black/40 rounded-full"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black/60"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-black/60"></div>
        </div>
      </div>

      <ResultOverlay resolved={resolved} won={won} winText="SWISH!" loseText="BRICK!" />
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
  
  const [ballPos, setBallPos] = useState({ x: 150, y: 320 });
  const [teammate, setTeammate] = useState({ x: 150, y: 50, dir: 1 });
  const [defenders, setDefenders] = useState([
    { x: 100, y: 150, dir: 1, speed: 2 },
    { x: 200, y: 220, dir: -1, speed: 2.5 }
  ]);

  const teammateWidth = 40;
  const defenderWidth = 35;
  const defSpeedMod = Math.max(0.5, 3 - (playerOvr / 35)); 

  useEffect(() => {
    if (resolved || isPassing) return;
    const clock = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(clock);
          onComplete(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, [resolved, isPassing, onComplete]);

  useEffect(() => {
    if (resolved || isPassing) return;
    const loop = setInterval(() => {
      setTeammate(t => {
        let nx = t.x + (4 * t.dir);
        let ndir = t.dir;
        if (nx > 260) { nx = 260; ndir = -1; }
        if (nx < 40) { nx = 40; ndir = 1; }
        return { ...t, x: nx, dir: ndir };
      });

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
    
    const rect = containerRef.current.getBoundingClientRect();
    const targetX = e.clientX - rect.left;
    const targetY = e.clientY - rect.top;

    setIsPassing(true);

    const startX = ballPos.x;
    const startY = ballPos.y;
    const angle = Math.atan2(targetY - startY, targetX - startX);
    const speed = 15; // Faster pass

    let currX = startX;
    let currY = startY;
    let hasResolved = false;

    const passLoop = setInterval(() => {
      currX += Math.cos(angle) * speed;
      currY += Math.sin(angle) * speed;
      
      setBallPos({ x: currX, y: currY });
      
      for (const d of defenders) {
        const dist = Math.hypot(currX - d.x, currY - d.y);
        if (dist < (defenderWidth/2 + 10)) {
          clearInterval(passLoop);
          if (!hasResolved) {
            hasResolved = true;
            onComplete(false); 
          }
          return;
        }
      }

      const distToTeammate = Math.hypot(currX - teammate.x, currY - teammate.y);
      if (distToTeammate < (teammateWidth/2 + 15)) {
        clearInterval(passLoop);
        if (!hasResolved) {
          hasResolved = true;
          onComplete(true); 
        }
        return;
      }

      if (currY < 0 || currY > 400 || currX < 0 || currX > 300) {
        clearInterval(passLoop);
        if (!hasResolved) {
          hasResolved = true;
          onComplete(false); 
        }
      }
    }, 16);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col p-6 border-2 border-yellow-500/50 rounded-2xl overflow-hidden select-none shadow-[0_0_60px_rgba(234,179,8,0.2)] bg-black">
      <CourtBackground />
      <GameHeader title="The Vision" subtitle="Find the Open Man" timeLeft={timeLeft} colorClass="text-yellow-400" />

      <div 
        ref={containerRef}
        className="flex-1 relative rounded-xl overflow-hidden border border-white/10 cursor-crosshair bg-black/20"
        onClick={handleContainerClick}
      >
        
        {/* Glow da visão */}
        <div className="absolute w-full h-40 bg-yellow-500/10 rounded-full blur-3xl" style={{ top: 0 }}></div>

        {/* Teammate */}
        <div 
          className="absolute bg-blue-600 rounded-full border-2 border-blue-300 flex items-center justify-center font-bold text-white text-xs shadow-[0_0_20px_rgba(59,130,246,0.8)] transition-all"
          style={{ width: teammateWidth, height: teammateWidth, left: teammate.x - teammateWidth/2, top: teammate.y - teammateWidth/2 }}
        >
          99
        </div>

        {/* Defenders */}
        {defenders.map((d, i) => (
          <div 
            key={i}
            className="absolute bg-red-600 rounded-full border-2 border-red-300 flex items-center justify-center font-bold text-white text-xs shadow-[0_0_15px_rgba(220,38,38,0.6)]"
            style={{ width: defenderWidth, height: defenderWidth, left: d.x - defenderWidth/2, top: d.y - defenderWidth/2 }}
          >
            D
          </div>
        ))}

        {/* Player Aura */}
        {!isPassing && (
          <div 
            className="absolute w-12 h-12 border-2 border-yellow-400 rounded-full animate-ping opacity-50"
            style={{ left: ballPos.x - 24, top: ballPos.y - 24 }}
          ></div>
        )}

        {/* Ball */}
        <div 
          className="absolute w-6 h-6 bg-gradient-to-br from-brand-orange to-orange-700 rounded-full border border-black shadow-[0_5px_15px_rgba(0,0,0,0.5),0_0_20px_rgba(245,130,22,0.8)] z-20 transition-transform"
          style={{ left: ballPos.x - 12, top: ballPos.y - 12 }}
        >
           <div className="absolute top-1/2 left-0 right-0 h-px bg-black/60"></div>
           <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black/60"></div>
        </div>
      </div>

      <ResultOverlay resolved={resolved} won={won} winText="DIME!" loseText="TURNOVER!" />
    </div>
  );
}

// ----------------------------------------------------
// GAME 3: THE DRIVE (Infiltração)
// ----------------------------------------------------
function DriveGame({ onComplete, resolved, won, playerOvr }) {
  const containerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(6);
  const [playerPos, setPlayerPos] = useState({ x: 150, y: 350 });
  const [defenders, setDefenders] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Difficulty: Faster and more frequent defenders
  const defFallSpeed = Math.max(4, 10 - (playerOvr / 15)); 
  const spawnRate = Math.max(150, 500 - (playerOvr * 3));

  const hoopPos = { x: 150, y: 30 };

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

  // Game Loop
  useEffect(() => {
    if (resolved) return;
    
    const spawner = setInterval(() => {
      setDefenders(prev => [...prev, {
        id: Math.random(),
        x: Math.random() * 260 + 20, // Spawn across width
        y: -30
      }]);
    }, spawnRate);

    const mover = setInterval(() => {
      setDefenders(prev => {
        let hit = false;
        const next = prev.map(d => {
          const ny = d.y + defFallSpeed;
          const dist = Math.hypot(playerPos.x - d.x, playerPos.y - ny);
          if (dist < 35) { // Collision radius
             hit = true;
          }
          return { ...d, y: ny };
        }).filter(d => d.y < 420);

        if (hit) {
          onComplete(false); // Crashed into defender
        }
        return next;
      });

      // Check win condition (Dunk)
      const distToHoop = Math.hypot(playerPos.x - hoopPos.x, playerPos.y - hoopPos.y);
      if (distToHoop < 40) {
        onComplete(true);
      }

    }, 30);

    return () => {
      clearInterval(spawner);
      clearInterval(mover);
    };
  }, [resolved, playerPos, defFallSpeed, spawnRate, hoopPos.x, hoopPos.y, onComplete]);

  const handlePointerDown = (e) => {
    if (resolved) return;
    e.target.setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || resolved) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newX = e.clientX - rect.left;
    let newY = e.clientY - rect.top;
    
    // Clamp to container
    if (newX < 20) newX = 20;
    if (newX > rect.width - 20) newX = rect.width - 20;
    if (newY < 20) newY = 20;
    if (newY > rect.height - 20) newY = rect.height - 20;

    setPlayerPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e) => {
    if (!isDragging || resolved) return;
    e.target.releasePointerCapture && e.target.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col p-6 border-2 border-blue-500/50 rounded-2xl overflow-hidden select-none shadow-[0_0_60px_rgba(59,130,246,0.2)] bg-black">
      <CourtBackground />
      <GameHeader title="The Drive" subtitle="Attack the Paint" timeLeft={timeLeft} colorClass="text-blue-400" />

      <div 
        ref={containerRef}
        className="flex-1 relative rounded-xl overflow-hidden border border-white/10 touch-none bg-black/20"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Speed lines */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyIiBoZWlnaHQ9IjIwIj48cmVjdCB3aWR0aD0iMiIgaGVpZ2h0PSIyMCIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KSIvPjwvc3ZnPg==')] animate-[slideDown_0.2s_linear_infinite]"></div>

        {/* The Hoop */}
        <div className="absolute w-full h-32 bg-blue-500/10 rounded-full blur-2xl" style={{ top: -20 }}></div>
        <div className="absolute border-4 border-orange-500 rounded-full shadow-[0_0_20px_rgba(245,130,22,0.8)]" style={{ width: 60, height: 60, left: hoopPos.x - 30, top: hoopPos.y - 30 }}></div>
        <div className="absolute w-20 h-2 bg-white/50 rounded" style={{ left: hoopPos.x - 40, top: hoopPos.y - 40 }}></div>

        {/* Player */}
        <div 
          className={`absolute w-12 h-12 bg-gradient-to-br from-brand-orange to-orange-700 rounded-full border-2 border-white shadow-[0_0_30px_rgba(245,130,22,1)] flex items-center justify-center z-20 ${isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab'}`}
          style={{ left: playerPos.x - 24, top: playerPos.y - 24, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
        >
          <div className="w-5 h-5 bg-black/50 rounded-full backdrop-blur-sm"></div>
        </div>

        {/* Defenders */}
        {defenders.map(d => (
          <div 
            key={d.id}
            className="absolute w-12 h-12 bg-gradient-to-b from-red-600 to-red-900 rounded-full border-2 border-red-300 flex items-center justify-center font-bold text-white text-xs z-10 shadow-[0_0_20px_rgba(220,38,38,0.8)]"
            style={{ left: d.x - 24, top: d.y - 24 }}
          >
            D
          </div>
        ))}
      </div>

      <ResultOverlay resolved={resolved} won={won} winText="POSTERIZED!" loseText="BLOCKED!" />
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
    <div className="absolute inset-0 z-50 flex flex-col p-6 border-2 border-purple-500/50 rounded-2xl bg-[#0a0510] shadow-[0_0_60px_rgba(168,85,247,0.2)]">
      
      <GameHeader title="Press Conference" subtitle="Media Scrutiny" timeLeft={timeLeft} colorClass="text-purple-400" />
      
      <div className="bg-white/5 backdrop-blur-md p-5 rounded-xl mb-4 text-white font-serif italic border-l-4 border-purple-500 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        "Tough game tonight. What are your thoughts on the team's performance?"
      </div>

      <div className="flex flex-col gap-3 flex-1 justify-end relative z-10">
        {!resolved ? options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onComplete(opt.win)}
            className="text-left bg-black/40 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-500/20 text-white/90 p-4 rounded-xl text-sm transition-all hover:-translate-y-1 shadow-md"
          >
            "{opt.text}"
          </button>
        )) : null}
      </div>

      {resolved && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-300`}>
          <div className={`transform scale-110 font-display text-5xl drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] ${won ? 'text-green-400 animate-bounce' : 'text-red-500 animate-pulse'}`}>
            {won ? 'GOOD PR!' : 'CONTROVERSY!'}
          </div>
          <div className="text-xs text-white/70 font-sans mt-4 tracking-widest uppercase bg-black/50 px-4 py-2 rounded-full border border-white/10">
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

  return null;
}
