import React, { useState, useEffect, useRef } from 'react';

// ----------------------------------------------------
// GAME 0: CLUTCH TIME (BARRA VERDE)
// ----------------------------------------------------
function ClutchGame({ onComplete, resolved, won, playerOvr }) {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const dirRef = useRef(1);

  // Calcula a dificuldade baseado no OVR
  // Velocidade: maior OVR = intervalo maior = barra mais lenta
  const speedMs = Math.max(10, Math.floor(playerOvr / 4)); // OVR 99 ~ 24ms, OVR 60 ~ 15ms
  
  // Tamanho do alvo: maior OVR = alvo maior
  const targetWidth = Math.floor(playerOvr / 8); // OVR 99 ~ 12%, OVR 60 ~ 7%
  const targetStart = 75;
  const targetEnd = targetStart + targetWidth;

  useEffect(() => {
    if (resolved) return;
    
    // Shot clock timer
    const clock = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(clock);
          onComplete(false); // Estouro de cronômetro
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const interval = setInterval(() => {
      setProgress(p => {
        let next = p + dirRef.current * 3;
        if (next >= 100) { next = 100; dirRef.current = -1; }
        if (next <= 0) { next = 0; dirRef.current = 1; }
        return next;
      });
    }, speedMs);
    
    return () => { clearInterval(interval); clearInterval(clock); };
  }, [resolved, onComplete, speedMs]);

  const handleShoot = () => {
    if (resolved) return;
    const isWin = progress >= targetStart && progress <= targetEnd;
    onComplete(isWin);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#111] flex flex-col items-center justify-center p-6 border border-red-500/30 rounded-xl">
      <div className="text-red-500 font-display text-3xl mb-1">CLUTCH TIME!</div>
      <div className="text-white/60 mb-8 text-center text-xs flex gap-2 items-center">
        Game 7. Shot in the green. 
        <span className="bg-red-500/20 text-red-500 border border-red-500 px-2 py-0.5 font-bold rounded">
          {timeLeft}s
        </span>
      </div>
      
      <div className="w-full max-w-sm bg-[#050505] h-6 rounded-full mb-8 relative border border-[#222]">
        <div 
          className="absolute top-0 bottom-0 bg-green-500 transition-all"
          style={{ left: `${targetStart}%`, right: `${100 - targetEnd}%` }}
        ></div>
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white]"
          style={{ left: `${progress}%` }}
        ></div>
      </div>

      {!resolved ? (
        <button 
          onClick={handleShoot}
          className="px-10 py-3 bg-red-600 text-white font-bold text-xs uppercase tracking-widest rounded hover:bg-red-500 transition"
        >
          Shoot
        </button>
      ) : (
        <div className={`font-display text-2xl ${won ? 'text-green-500' : 'text-red-600'}`}>
          {won ? 'GREEN RELEASE!' : 'BRICK...'}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// GAME 1: BUZZER BEATER (TRAJETÓRIA)
// ----------------------------------------------------
function TrajectoryGame({ onComplete, resolved, won, playerOvr }) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentDrag, setCurrentDrag] = useState({ x: 0, y: 0 });
  const [timeLeft, setTimeLeft] = useState(5);
  
  const [ballPos, setBallPos] = useState({ x: 50, y: 200 });
  
  // Dificuldade por OVR (tamanho do aro)
  // OVR 99 -> aro de 50px, OVR 60 -> aro de 30px
  const hoopWidth = Math.max(25, Math.floor(playerOvr / 2));
  const hoopPos = { x: 280, y: 50 };
  
  useEffect(() => {
    if (resolved) return;
    const clock = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(clock);
          onComplete(false); // Estouro
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
    let x = 50;
    let y = 200;
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
      // Margem de acerto dinâmica baseada no aro
      if (dist < (hoopWidth / 2) && !hasWon) {
        hasWon = true;
      }

      if (y > 300 || x > 400 || x < 0) {
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
    let px = 50;
    let py = 200;
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
      className="absolute inset-0 z-50 bg-[#111] flex flex-col p-6 border border-brand-orange/30 rounded-xl overflow-hidden select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="text-brand-orange uppercase tracking-widest text-[10px] font-bold mb-2 flex justify-between w-full">
        <span>Buzzer Beater</span>
        <span className="text-red-500">{timeLeft}s</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-1">Game 7. Last Possession.</h2>
      <p className="text-white/60 text-xs mb-4">Pull the ball backwards and release to shoot.</p>

      <div className="flex-1 relative border border-[#222] bg-[#0a0a0a] rounded-lg overflow-hidden touch-none">
        
        {/* Dynamic Hoop */}
        <div 
          className="absolute h-2 border-b-2 border-r-2 border-red-500 rounded-b-full transition-all"
          style={{ width: hoopWidth, left: hoopPos.x - (hoopWidth / 2), top: hoopPos.y }}
        ></div>
        <div className="absolute w-2 h-16 bg-white/20" style={{ left: hoopPos.x + (hoopWidth / 2), top: hoopPos.y - 10 }}></div>
        
        {/* Trajectory Preview */}
        {isDragging && previewPoints.map((pt, i) => (
          <div 
            key={i} 
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{ left: pt.x, top: pt.y }}
          ></div>
        ))}
        
        {/* Ball */}
        <div 
          className={`absolute w-6 h-6 bg-brand-orange rounded-full border border-black shadow-[0_0_10px_rgba(245,130,22,0.5)] cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ left: displayBallPos.x - 12, top: displayBallPos.y - 12, touchAction: 'none' }}
          onPointerDown={handlePointerDown}
        ></div>
      </div>

      {resolved && (
        <div className={`absolute inset-0 flex items-center justify-center font-display text-5xl bg-black/80 z-50 ${won ? 'text-green-500' : 'text-red-600'}`}>
          {won ? 'SWISH!' : 'BRICK...'}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// GAME 3: MEMORY PLAYBOOK
// ----------------------------------------------------
function MemoryGame({ onComplete, resolved, won, playerOvr }) {
  const [sequence, setSequence] = useState([]);
  const [playerSeq, setPlayerSeq] = useState([]);
  const [flashIndex, setFlashIndex] = useState(-1);
  const [isShowing, setIsShowing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5);

  // Dificuldade por OVR
  // OVR 99 -> tempo entre flashes 800ms
  // OVR 60 -> tempo entre flashes 400ms (rápido!)
  const flashSpeed = Math.max(300, Math.floor(playerOvr * 8));

  useEffect(() => {
    if (resolved) return;
    const seq = Array.from({length: 4}, () => Math.floor(Math.random() * 4));
    setSequence(seq);
    
    let step = 0;
    const interval = setInterval(() => {
      if (step < seq.length) {
        setFlashIndex(seq[step]);
        setTimeout(() => setFlashIndex(-1), flashSpeed / 2);
        step++;
      } else {
        setIsShowing(false);
        clearInterval(interval);
      }
    }, flashSpeed);

    return () => clearInterval(interval);
  }, [resolved, flashSpeed]);

  useEffect(() => {
    if (resolved || isShowing) return;
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
  }, [resolved, isShowing, onComplete]);

  const handlePadClick = (idx) => {
    if (isShowing || resolved) return;
    const newPlayerSeq = [...playerSeq, idx];
    setPlayerSeq(newPlayerSeq);
    
    const currentStep = newPlayerSeq.length - 1;
    if (newPlayerSeq[currentStep] !== sequence[currentStep]) {
      onComplete(false);
      return;
    }
    
    if (newPlayerSeq.length === sequence.length) {
      onComplete(true);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#111] flex flex-col items-center justify-center p-6 border border-yellow-500/30 rounded-xl">
      <div className="text-yellow-500 uppercase tracking-widest text-[10px] font-bold mb-2 flex justify-between w-full max-w-[250px]">
        <span>Coach's Playbook</span>
        {!isShowing && <span className="text-red-500">{timeLeft}s</span>}
      </div>
      <h2 className="text-xl font-bold text-white mb-6">Memorize the Sequence</h2>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-[250px] aspect-square p-4 bg-[#0a0a0a] rounded-lg border border-[#222]">
        {[0,1,2,3].map(i => (
          <button
            key={i}
            disabled={isShowing || resolved}
            onClick={() => handlePadClick(i)}
            className={`rounded-lg transition duration-200 border border-[#333] ${flashIndex === i ? 'bg-yellow-400 scale-95 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'bg-[#111] hover:bg-[#222]'}`}
          ></button>
        ))}
      </div>

      {resolved && (
        <div className={`absolute inset-0 flex items-center justify-center font-display text-4xl bg-black/80 z-50 ${won ? 'text-green-500' : 'text-red-600'}`}>
          {won ? 'PERFECT PLAY!' : 'TURNOVER...'}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// GAME 4: DRAFT COMBINE
// ----------------------------------------------------
function CombineGame({ onComplete, resolved, won, playerOvr }) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  
  // Dificuldade por OVR
  // OVR 99 -> Spawn lento (600ms), Alvo mínimo (6)
  // OVR 60 -> Spawn rápido (400ms), Alvo alto (9)
  const spawnSpeed = Math.max(300, 200 + Math.floor(playerOvr * 4));
  const winScore = Math.max(4, 12 - Math.floor(playerOvr / 15));
  
  useEffect(() => {
    if (resolved) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          onComplete(score >= winScore); 
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resolved, score, onComplete, winScore]);

  useEffect(() => {
    if (resolved) return;
    const spawner = setInterval(() => {
      setActiveIdx(Math.floor(Math.random() * 9));
    }, spawnSpeed);
    return () => clearInterval(spawner);
  }, [resolved, spawnSpeed]);

  const handleHit = (idx) => {
    if (resolved || idx !== activeIdx) return;
    setScore(s => s + 1);
    setActiveIdx(-1);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#111] flex flex-col items-center p-6 border border-blue-500/30 rounded-xl">
      <div className="w-full flex justify-between items-center mb-4 text-white">
        <div>TIME: <span className="text-blue-400 font-bold">{timeLeft}s</span></div>
        <div>SCORE: <span className="text-yellow-400 font-bold">{score}/{winScore}</span></div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 w-full aspect-square max-w-[250px] bg-[#0a0a0a] p-2 rounded-lg border border-[#222]">
        {[0,1,2,3,4,5,6,7,8].map(i => (
          <button
            key={i}
            onClick={() => handleHit(i)}
            disabled={resolved}
            className={`rounded-md transition-all ${activeIdx === i ? 'bg-blue-500 scale-95 shadow-[0_0_10px_rgba(59,130,246,0.6)]' : 'bg-[#111]'}`}
          ></button>
        ))}
      </div>

      {resolved && (
        <div className={`absolute inset-0 flex items-center justify-center font-display text-4xl bg-black/80 z-50 ${won ? 'text-green-500' : 'text-red-600'}`}>
          {won ? 'BEAST MODE!' : 'TOO SLOW...'}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// GAME 5: PRESS CONFERENCE
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
      
      <div className="bg-[#222] p-4 rounded-lg mb-4 text-white text-sm italic">
        "Tough game tonight. What are your thoughts on the team's performance?"
      </div>

      <div className="flex flex-col gap-2 flex-1 justify-end">
        {!resolved ? options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onComplete(opt.win)}
            className="text-left bg-[#0a0a0a] border border-[#333] hover:border-purple-500 text-white/80 p-3 rounded text-xs transition"
          >
            "{opt.text}"
          </button>
        )) : null}
      </div>

      {resolved && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center font-display text-4xl bg-black/80 z-50 ${won ? 'text-green-500' : 'text-red-600'}`}>
          {won ? 'GOOD PR!' : 'CONTROVERSY...'}
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
    
    // Sons foram removidos a pedido do usuário
    setTimeout(() => {
      onComplete(isWin);
    }, 1500);
  };

  if (gameType === 'trajectory') {
    return <TrajectoryGame onComplete={handleComplete} resolved={resolved} won={won} playerOvr={playerOvr} />;
  }

  if (gameType === 'clutch') {
    return <ClutchGame onComplete={handleComplete} resolved={resolved} won={won} playerOvr={playerOvr} />;
  }

  if (gameType === 'memory') {
    return <MemoryGame onComplete={handleComplete} resolved={resolved} won={won} playerOvr={playerOvr} />;
  }

  if (gameType === 'combine') {
    return <CombineGame onComplete={handleComplete} resolved={resolved} won={won} playerOvr={playerOvr} />;
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
