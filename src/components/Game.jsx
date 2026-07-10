import React, { useState, useEffect } from 'react';
import { legends } from '../data/legends';
import CareerSim from './CareerSim';

const STATS = ['shooting', 'playmaking', 'finishing', 'defense', 'rebounding', 'athleticism'];

export default function Game() {
  const [name, setName] = useState('');
  const [pos, setPos] = useState('PG');
  const [step, setStep] = useState('SETUP'); // SETUP, DRAFT, RESULT

  const [availableStats, setAvailableStats] = useState([...STATS]);
  const [draftedStats, setDraftedStats] = useState({});
  const [currentLegend, setCurrentLegend] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [finalPlayer, setFinalPlayer] = useState(null);

  const startDraft = () => {
    if (!name.trim()) return;
    setStep('DRAFT');
    spinReel();
  };

  const spinReel = () => {
    setSpinning(true);
    let spins = 0;
    const maxSpins = 15;
    const interval = setInterval(() => {
      const randomLegend = legends[Math.floor(Math.random() * legends.length)];
      setCurrentLegend(randomLegend);
      spins++;
      if (spins >= maxSpins) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 70);
  };

  const pickStat = (stat) => {
    if (spinning || !currentLegend) return;

    const newDrafted = {
      ...draftedStats,
      [stat]: {
        value: currentLegend[stat],
        from: currentLegend.name
      }
    };

    setDraftedStats(newDrafted);
    const newAvailable = availableStats.filter(s => s !== stat);
    setAvailableStats(newAvailable);

    if (newAvailable.length === 0) {
      finishDraft(newDrafted);
    } else {
      spinReel();
    }
  };

  const finishDraft = (finalDrafted) => {
    const shooting = finalDrafted.shooting.value;
    const playmaking = finalDrafted.playmaking.value;
    const finishing = finalDrafted.finishing.value;
    const defense = finalDrafted.defense.value;
    const rebounding = finalDrafted.rebounding.value;
    const athleticism = finalDrafted.athleticism.value;

    const playerObj = {
      name,
      pos,
      shooting,
      playmaking,
      finishing,
      defense,
      rebounding,
      athleticism
    };

    setFinalPlayer(playerObj);
    setStep('RESULT');
  };

  const restart = () => {
    setStep('SETUP');
    setAvailableStats([...STATS]);
    setDraftedStats({});
    setCurrentLegend(null);
    setFinalPlayer(null);
    setName('');
  };

  if (step === 'SETUP') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050505]">
        {/* Fundo com efeito de luzes de estádio e radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-orange/20 via-[#050505] to-[#050505]"></div>
        
        <div className="max-w-xl w-full flex flex-col gap-8 p-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
          <div className="text-center">
            <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-yellow-500 uppercase tracking-tight">Draft Your Legend</h1>
            <p className="text-white/60 mt-2 font-light">Molde o futuro roubando a essência do passado.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-brand-orange font-bold ml-2">Nome do Jogador</label>
            <input 
              className="bg-white/5 border border-white/10 rounded-xl p-4 text-2xl font-display outline-none focus:border-brand-orange focus:bg-brand-orange/5 text-white transition-all shadow-inner"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Air Alex"
              maxLength={20}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-[0.2em] text-brand-orange font-bold ml-2">Posição</label>
            <div className="flex gap-3">
              {['PG', 'SG', 'SF', 'PF', 'C'].map(p => (
                <button 
                  key={p}
                  onClick={() => setPos(p)}
                  className={`flex-1 py-4 rounded-xl border-2 font-display text-2xl transition-all duration-300 transform ${pos === p ? 'bg-gradient-to-b from-brand-orange to-orange-700 text-black border-brand-orange scale-110 shadow-[0_10px_20px_rgba(245,130,22,0.4)] z-10' : 'bg-black/50 border-white/10 text-white/70 hover:border-brand-orange/50 hover:text-white'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={startDraft}
              disabled={!name.trim()}
              className="w-full py-5 rounded-xl bg-gradient-to-r from-brand-orange to-yellow-500 text-black font-display text-2xl uppercase tracking-widest hover:brightness-110 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_30px_rgba(245,130,22,0.3)] hover:shadow-[0_0_40px_rgba(245,130,22,0.6)]"
            >
              INICIAR DRAFT
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'DRAFT') {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center py-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-orange/10 via-[#050505] to-[#050505]"></div>
        
        <div className="max-w-4xl w-full flex flex-col gap-8 relative z-10 px-4">
          <div className="flex justify-between items-center text-sm uppercase tracking-[0.2em] text-white/50 bg-white/5 px-6 py-3 rounded-full border border-white/10">
            <span><strong className="text-brand-orange">{pos}</strong> • {name}</span>
            <span>Slots: <strong className="text-white">{6 - availableStats.length}</strong> / 6</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">
            {/* O "Trading Card" da Lenda */}
            <div className="w-[300px] h-[420px] shrink-0 bg-gradient-to-b from-gray-800 to-black rounded-xl border-[3px] border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center transition-all duration-300 transform perspective-1000">
              {spinning && (
                <div className="absolute inset-0 bg-gradient-to-r from-brand-orange/0 via-brand-orange/30 to-brand-orange/0 animate-[shimmer_0.5s_infinite] -skew-x-12 translate-x-[-100%]"></div>
              )}
              
              <div className="absolute top-4 left-4 text-3xl font-display font-black italic text-white/10">{currentLegend?.pos}</div>
              
              <div className="flex-1 flex items-center justify-center w-full">
                {spinning ? (
                  <div className="text-6xl text-white/30 font-display animate-pulse blur-[2px]">?</div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-orange to-yellow-600 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(245,130,22,0.4)] border-4 border-black">
                       <span className="text-5xl font-display text-black">{currentLegend?.name.charAt(0)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={`w-full bg-black/80 backdrop-blur-sm p-6 border-t border-white/10 text-center transition-opacity ${spinning ? 'opacity-50' : 'opacity-100'}`}>
                <div className="text-xs uppercase tracking-widest text-brand-orange mb-1">ON THE CLOCK</div>
                <div className="text-3xl font-display text-white mb-1 truncate">{currentLegend?.name || '...'}</div>
                <div className="text-xs text-white/50">{currentLegend ? `Era: ${currentLegend.era}` : ''}</div>
              </div>
            </div>

            {/* Painel de Atributos Moderno */}
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
              {STATS.map(stat => {
                const isAvailable = availableStats.includes(stat);
                const drafted = draftedStats[stat];
                const valueToShow = !isAvailable ? drafted.value : (!spinning && currentLegend ? currentLegend[stat] : 0);
                
                return (
                  <button 
                    key={stat}
                    disabled={!isAvailable || spinning || !currentLegend}
                    onClick={() => pickStat(stat)}
                    className={`relative p-5 rounded-xl border flex flex-col gap-3 text-left overflow-hidden transition-all duration-300 ${
                      !isAvailable 
                        ? 'bg-brand-orange/10 border-brand-orange/30 cursor-not-allowed' 
                        : spinning 
                          ? 'bg-white/5 border-white/5 cursor-not-allowed opacity-60' 
                          : 'bg-white/5 border-white/10 hover:border-brand-orange hover:bg-white/10 cursor-pointer shadow-lg hover:-translate-y-1 group'
                    }`}
                  >
                    {!isAvailable && (
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-orange/10 rounded-full blur-xl"></div>
                    )}
                    
                    <div className="flex justify-between items-end relative z-10">
                      <span className="text-xs uppercase tracking-widest text-white/60 font-bold">{stat}</span>
                      <span className={`text-3xl font-display ${!isAvailable ? 'text-brand-orange' : 'text-white group-hover:text-brand-orange transition-colors'}`}>
                        {spinning && isAvailable ? '??' : valueToShow}
                      </span>
                    </div>
                    
                    {/* Barra de Progresso do Atributo */}
                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden relative z-10">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${!isAvailable ? 'bg-brand-orange' : 'bg-white/50 group-hover:bg-brand-orange'}`}
                        style={{ width: `${spinning && isAvailable ? 0 : valueToShow}%` }}
                      ></div>
                    </div>

                    {!isAvailable && (
                      <div className="absolute bottom-2 right-4 text-[10px] text-brand-orange/60 font-bold uppercase tracking-widest italic z-10">
                        {drafted.from}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <CareerSim player={finalPlayer} onRestart={restart} />;
}
