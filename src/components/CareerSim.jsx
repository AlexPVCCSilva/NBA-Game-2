import React, { useState, useEffect, useRef } from 'react';
import { getRandomTeam, getRandomOffer, teams } from '../data/teams';
import { calculateMaxOvr, generateSeasonStats, generateNews, checkForInjury, calculateCurrentOvr, simulateLeagueStandings, generatePlayoffBracket, advanceBracket } from '../data/career';
import { seasonEvents } from '../data/events';
import Minigames from './Minigames';

export default function CareerSim({ player, onRestart }) {
  const [age, setAge] = useState(19);
  const [currentTeam, setCurrentTeam] = useState(null);
  const [history, setHistory] = useState([]);
  const [news, setNews] = useState([]);
  const [transferOffer, setTransferOffer] = useState(null);
  const [isRetired, setIsRetired] = useState(false);
  const [retirementReason, setRetirementReason] = useState('');
  const [maxOvr, setMaxOvr] = useState(0);
  const [rings, setRings] = useState(0);
  const [standings, setStandings] = useState({ East: [], West: [] });
  const [chemistry, setChemistry] = useState(80);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [activeMinigame, setActiveMinigame] = useState(false);
  const isAdvancingRef = useRef(false);
  const [activeConf, setActiveConf] = useState('West');
  
  // Novos Sistemas
  const [awards, setAwards] = useState({ mvp: 0, dpoy: 0, roty: 0 });
  const [goatPoints, setGoatPoints] = useState(0);
  const [contractYears, setContractYears] = useState(4);
  const [skillPoints, setSkillPoints] = useState(0);
  const [rivalTeam, setRivalTeam] = useState(null);
  const [freeAgencyOffers, setFreeAgencyOffers] = useState(null);
  const [showTraining, setShowTraining] = useState(false);
  const [ovrBuff, setOvrBuff] = useState(0);

  const [playerAttributes, setPlayerAttributes] = useState({
    shooting: player.shooting,
    playmaking: player.playmaking,
    finishing: player.finishing,
    defense: player.defense,
    rebounding: player.rebounding,
    athleticism: player.athleticism
  });

  // Estado dos Playoffs: se != null, o modal está aberto
  const [playoffs, setPlayoffs] = useState(null);

  const newsRef = useRef(null);

  useEffect(() => {
    // Inicialização
    const initialTeam = getRandomTeam();
    setCurrentTeam(initialTeam);
    setNews([`Draft NBA: ${player.name} é selecionado pelo ${initialTeam.name}!`]);
    // standings iniciais
    const initialMax = calculateMaxOvr(playerAttributes, player.pos);
    setStandings(simulateLeagueStandings(teams, initialTeam.id, calculateCurrentOvr(initialMax, 19, false), false));
  }, []); // Run once on mount

  useEffect(() => {
    setMaxOvr(calculateMaxOvr(playerAttributes, player.pos) + ovrBuff);
  }, [playerAttributes, player.pos, ovrBuff]);

  useEffect(() => {
    if (newsRef.current) {
      newsRef.current.scrollTop = newsRef.current.scrollHeight;
    }
  }, [news]);

  const simulateSeason = () => {
    if (isRetired || transferOffer || playoffs || pendingEvent || activeMinigame) return;

    // 40% chance of random event during season
    if (Math.random() < 0.4) {
      const event = seasonEvents[Math.floor(Math.random() * seasonEvents.length)];
      setPendingEvent(event);
      return; 
    }

    processSeason();
  };

  const handleEventDecision = (option) => {
    if (option.effectType === 'CHEMISTRY') {
      setChemistry(c => Math.max(0, Math.min(100, c + option.effectValue)));
    } else if (option.effectType === 'OVR') {
      setOvrBuff(b => b + option.effectValue);
    }
    
    if (option.chemValue) {
      setChemistry(c => Math.max(0, Math.min(100, c + option.chemValue)));
    }
    
    setNews(prev => [...prev, `NOTÍCIA: ${option.news}`]);
    setPendingEvent(null);
    processSeason();
  };

  const forceTrade = () => {
    if (isRetired || transferOffer || playoffs || pendingEvent || activeMinigame) return;
    const newTeam = getRandomOffer(currentTeam.id);
    setCurrentTeam(newTeam);
    setChemistry(20); 
    setNews(prev => [...prev, `BOMBA: ${player.name} força saída e é trocado para o ${newTeam.name}!`]);
    processSeason();
  };

  const processSeason = () => {
    // Recuperação natural de química com o passar dos anos (time se ajusta ao jogador)
    if (chemistry < 80) {
      setChemistry(c => Math.min(80, c + 15));
    }

    const injuryStatus = checkForInjury();
    const isInjured = injuryStatus !== 'NONE';
    
    const effectiveOvr = calculateCurrentOvr(maxOvr, age, isInjured);
    const stats = generateSeasonStats(effectiveOvr, player.pos, isInjured);
    
    // Passa a chemistry para afetar o power do time
    const newStandings = simulateLeagueStandings(teams, currentTeam.id, effectiveOvr, isInjured, chemistry);
    setStandings(newStandings);

    let seed = 15;
    let finalPower = 0;
    let madePlayoffs = false;

    const confArr = currentTeam.conference === 'East' ? newStandings.East : newStandings.West;
    const teamIndex = confArr.findIndex(t => t.id === currentTeam.id);
    if (teamIndex !== -1) {
      seed = teamIndex + 1;
      finalPower = confArr[teamIndex].finalPower;
      madePlayoffs = seed <= 8;
    }
    
    // Premiações
    let isMvp = false;
    let isDpoy = false;
    let isRoty = false;
    
    if (age === 19 && stats.pts > 15) isRoty = true;
    if (stats.pts >= 28 && seed <= 3 && Math.random() < 0.8) isMvp = true;
    if (playerAttributes.defense >= 85 && Math.random() < 0.4) isDpoy = true;

    // Atualiza estados
    if (isMvp) setAwards(a => ({ ...a, mvp: a.mvp + 1 }));
    if (isDpoy) setAwards(a => ({ ...a, dpoy: a.dpoy + 1 }));
    if (isRoty) setAwards(a => ({ ...a, roty: a.roty + 1 }));

    let earnedGoatPts = Math.floor(stats.pts * 5); // 5 pts no medidor por cada ponto de média
    let earnedSp = 5; // Base SP por jogar a temporada
    
    if (isMvp) { earnedGoatPts += 300; earnedSp += 15; setNews(prev => [...prev, `🏆 ${player.name} é eleito o MVP da temporada!`]); }
    if (isDpoy) { earnedGoatPts += 100; earnedSp += 10; setNews(prev => [...prev, `🛡️ ${player.name} ganha o prêmio de Melhor Defensor (DPOY)!`]); }
    if (isRoty) { earnedGoatPts += 50; earnedSp += 5; setNews(prev => [...prev, `⭐ ${player.name} é o Novato do Ano (ROTY)!`]); }
    
    setGoatPoints(g => g + earnedGoatPts);
    setSkillPoints(s => s + earnedSp);
    
    // Define um rival no 2º ano da carreira
    if (age === 20 && !rivalTeam) {
      const potentialRivals = confArr.filter(t => t.id !== currentTeam.id);
      const chosenRival = potentialRivals[Math.floor(Math.random() * potentialRivals.length)];
      setRivalTeam(chosenRival);
      setNews(prev => [...prev, `🔥 RIVALIDADE: Jogadores do ${chosenRival.name} falaram mal de você na mídia! Uma rivalidade épica acaba de nascer.`]);
    }

    const seasonRecord = {
      age,
      team: currentTeam,
      stats,
      isInjured,
      seed,
      wonRing: false,
      awards: { mvp: isMvp, dpoy: isDpoy, roty: isRoty }
    };

    setHistory(prev => [...prev, seasonRecord]);
    
    const seasonNews = generateNews(player.name, currentTeam.name, isInjured, age);
    setNews(prev => [...prev, `${age} anos: ${seasonNews}`]);
    setNews(prev => [...prev, `${currentTeam.name} termina em ${seed}º na conferência.`]);

    if (madePlayoffs) {
      setPlayoffs({
        bracket: generatePlayoffBracket(newStandings),
        results: [],
        eliminated: false,
        injuryStatus // Passado para saber se deve aposentar depois
      });
    } else {
      setNews(prev => [...prev, `Férias antecipadas: ${currentTeam.name} está fora dos Playoffs.`]);
      finishSeason(injuryStatus);
    }
  };

  const advancePlayoffs = () => {
    if (!playoffs || playoffs.eliminated || isAdvancingRef.current || activeMinigame) return;

    isAdvancingRef.current = true;

    // Chance de minigame de jogo 7
    if (Math.random() < 0.35 && playoffs.bracket.round <= 4) {
      const types = ['trajectory', 'pass', 'drive', 'press'];
      const chosen = types[Math.floor(Math.random() * types.length)];
      setActiveMinigame(chosen);
      // DO NOT unlock isAdvancingRef here! Wait for Minigame to finish!
      return;
    }

    processPlayoffRound(0);
  };

  const handleMinigameComplete = (isWin) => {
    if (isWin) {
      setChemistry(c => Math.min(100, c + 15)); // Game winner dá moral pro time!
    } else {
      setChemistry(c => Math.max(0, c - 5)); 
    }
    setActiveMinigame(false);
    // keep locked
    processPlayoffRound(isWin ? 'WON' : 'LOST');
  };

  const processPlayoffRound = (forceGame7Result = null) => {
    const { nextBracket, myResult } = advanceBracket(playoffs.bracket, currentTeam.id, forceGame7Result);
    const roundNames = { 1: 'First Round', 2: 'Conf. Semifinals', 3: 'Conf. Finals', 4: 'NBA Finals' };
    const roundName = roundNames[playoffs.bracket.round];
    
    if (!myResult) {
      isAdvancingRef.current = false;
      return; // Segurança
    }

    const newResults = [...playoffs.results, { 
      roundName, 
      result: myResult.score, 
      won: myResult.won,
      opponent: myResult.opponent
    }];

    if (myResult.won) {
      // Checa vitória contra Rival
      if (rivalTeam && myResult.opponent.id === rivalTeam.id) {
        setGoatPoints(g => g + 150);
        setSkillPoints(s => s + 10);
        setNews(prev => [...prev, `🔥 O ${player.name} destruiu o rival ${rivalTeam.name} nos Playoffs! O mundo do basquete foi a loucura.`]);
      }

      if (playoffs.bracket.round === 4) {
        // CAMPEÃO
        setNews(prev => [...prev, `🏆 É CAMPEÃO! ${player.name} lidera o ${currentTeam.name} ao título contra o ${myResult.opponent.name}!`]);
        setRings(r => r + 1);
        setGoatPoints(g => g + 500);
        setSkillPoints(s => s + 20);
        
        setHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].wonRing = true;
          return newHistory;
        });

        setTimeout(() => {
          setPlayoffs(null);
          finishSeason(playoffs.injuryStatus);
        }, 4000);
        
        setPlayoffs(prev => ({ ...prev, bracket: nextBracket, results: newResults }));
      } else {
        setPlayoffs({ ...playoffs, bracket: nextBracket, results: newResults });
      }
    } else {
      // ELIMINADO
      setNews(prev => [...prev, `Eliminado nos Playoffs (${roundName}) pelo ${myResult.opponent.name}. O sonho acabou.`]);
      setTimeout(() => {
        setPlayoffs(null);
        finishSeason(playoffs.injuryStatus);
      }, 4000);
      
      setPlayoffs({ ...playoffs, bracket: nextBracket, results: newResults, eliminated: true });
    }
    
    setTimeout(() => {
      isAdvancingRef.current = false;
    }, 100);
  };

  const getCurrentOpponent = () => {
    if (!playoffs || playoffs.eliminated || playoffs.bracket.round === 5) return null;
    const { bracket } = playoffs;
    let matchups = [];
    if (bracket.round === 4) matchups = bracket.finals;
    else matchups = currentTeam.conference === 'East' ? bracket.east : bracket.west;
    
    const m = matchups.find(match => match.t1.id === currentTeam.id || match.t2.id === currentTeam.id);
    if (!m) return null;
    return m.t1.id === currentTeam.id ? m.t2 : m.t1;
  };

  const currentOpponent = getCurrentOpponent();

  const finishSeason = (injuryStatus) => {
    // Check Retirement
    if (injuryStatus === 'SEVERE' && Math.random() < 0.6) {
      setIsRetired(true);
      setRetirementReason('Lesão devastadora forçou aposentadoria precoce.');
      setNews(prev => [...prev, `BOMBA: ${player.name} anuncia aposentadoria após lesão gravíssima aos ${age} anos.`]);
      return;
    }

    if (age >= 38 && Math.random() < 0.5) {
      setIsRetired(true);
      setRetirementReason('Idade chegou. O corpo já não acompanha mais a liga.');
      setNews(prev => [...prev, `${player.name} pendura os tênis e se aposenta aos ${age} anos.`]);
      return;
    }

    if (age >= 41) {
      setIsRetired(true);
      setRetirementReason('Aposentadoria mandatória pela idade.');
      setNews(prev => [...prev, `${player.name} finalmente se aposenta aos 41 anos.`]);
      return;
    }

    // Free Agency Check
    if (contractYears <= 1) {
      // Contrato acabou. Gerar 3 ofertas. A primeira é renovação com o time atual.
      const renewalOffer = { team: currentTeam, salary: Math.floor(Math.random() * 20) + 30, years: 4 }; // $30-$50M
      const offer2 = { team: getRandomOffer(currentTeam.id), salary: Math.floor(Math.random() * 25) + 20, years: Math.floor(Math.random() * 3) + 2 };
      const offer3 = { team: getRandomOffer(currentTeam.id), salary: Math.floor(Math.random() * 25) + 20, years: Math.floor(Math.random() * 3) + 2 };
      
      setFreeAgencyOffers([renewalOffer, offer2, offer3]);
      setNews(prev => [...prev, `${player.name} é um Free Agent! O mundo da NBA aguarda sua decisão.`]);
      return; // Pausa a progressão de idade até ele escolher
    } else {
      setContractYears(y => y - 1);
      setAge(a => a + 1);
    }
  };

  const handleFreeAgencyDecision = (offer) => {
    if (offer.team.id === currentTeam.id) {
      setNews(prev => [...prev, `LEALDADE: ${player.name} renova com o ${offer.team.name} por ${offer.years} anos e $${offer.salary}M/ano.`]);
      setChemistry(c => Math.min(100, c + 15));
    } else {
      setNews(prev => [...prev, `BOMBA NA FREE AGENCY: ${player.name} assina com o ${offer.team.name} por ${offer.years} anos! ($${offer.salary}M/ano)`]);
      setCurrentTeam(offer.team);
      setChemistry(70); // Química nova num novo time
    }
    setContractYears(offer.years);
    setFreeAgencyOffers(null);
    setAge(a => a + 1);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans flex justify-center p-4 sm:p-6 lg:p-8">
      {/* Container principal */}
      <div className="max-w-[1600px] w-full grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-6">

        {/* =========================================
            LEFT COLUMN: PLAYER INFO & STATS
            ========================================= */}
        <div className="flex flex-col gap-4">
          
          {/* Player Identity Card */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col relative shadow-sm">
            <div className="flex gap-4 items-center mb-6">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center p-1 border border-white/10">
                {currentTeam ? (
                  <img src={currentTeam.logo} alt={currentTeam.name} className="w-full h-full object-contain opacity-90" />
                ) : (
                  <div className="w-full h-full bg-brand-orange rounded-full"></div>
                )}
              </div>
              <div>
                <div className="uppercase font-bold tracking-wider text-sm">{player.name}</div>
                <div className="text-white/40 text-[10px]">{currentTeam ? currentTeam.name : 'Free Agent'}</div>
              </div>
            </div>

            <div className="flex justify-between items-end mb-4">
              <div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">OVR</div>
                <div className="text-6xl font-display text-yellow-400 leading-none">{calculateCurrentOvr(maxOvr, age, false)}</div>
              </div>
              <div className="text-4xl font-display text-white/10">#{player.number || '0'}</div>
            </div>

            <hr className="border-[#222] my-4" />

            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Role</span>
                <span className="font-bold">{player.pos}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Age</span>
                <span className="font-bold">{age}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Contract</span>
                <span className="font-bold">{contractYears} yrs</span>
              </div>
            </div>
          </div>

          {/* Player Attributes */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-sm">
            <div className="text-yellow-400 text-[10px] uppercase font-bold tracking-widest mb-4 flex justify-between">
              <span>Attributes</span>
              <span className="text-white/30">CUR / MAX</span>
            </div>
            <div className="space-y-3">
              {Object.entries(playerAttributes).map(([key, val]) => {
                let penalty = 0;
                if (age < 26) penalty = (26 - age) * 2.5;
                else if (age > 31) penalty = (age - 31) * 1.5;
                const currentVal = Math.max(25, Math.round(val - penalty));
                
                return (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] uppercase text-white/50 mb-1">
                      <span>{key}</span>
                      <span className="text-white font-bold">{currentVal} <span className="text-white/30 font-normal">/ {val}</span></span>
                    </div>
                    <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden border border-[#222]">
                      <div className="bg-white h-full transition-all duration-1000" style={{ width: `${Math.min(100, currentVal)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Season Stats */}
          {history.length > 0 && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-sm">
              <div className="text-yellow-400 text-[10px] uppercase font-bold tracking-widest mb-4">Season {history[history.length-1].age}</div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Games</span>
                  <span className="font-bold">{history[history.length-1].stats.games}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Points</span>
                  <span className="font-bold">{history[history.length-1].stats.pts}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Assists</span>
                  <span className="font-bold">{history[history.length-1].stats.ast}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Rebounds</span>
                  <span className="font-bold">{history[history.length-1].stats.reb}</span>
                </div>
              </div>
            </div>
          )}

          {/* Trophies & GOAT */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-sm">
            <div className="text-yellow-400 text-[10px] uppercase font-bold tracking-widest mb-4">Trophies & Legacy</div>
            <div className="flex justify-between text-center mb-6">
              <div>
                <div className="font-display text-2xl text-white">{rings}</div>
                <div className="text-[9px] text-white/40 uppercase">Rings</div>
              </div>
              <div>
                <div className="font-display text-2xl text-white">{awards.mvp}</div>
                <div className="text-[9px] text-white/40 uppercase">MVP</div>
              </div>
              <div>
                <div className="font-display text-2xl text-white">{awards.dpoy}</div>
                <div className="text-[9px] text-white/40 uppercase">DPOY</div>
              </div>
              <div>
                <div className="font-display text-2xl text-white">{awards.roty}</div>
                <div className="text-[9px] text-white/40 uppercase">ROTY</div>
              </div>
            </div>
            
            <div className="text-[10px] text-white/50 uppercase tracking-widest mb-2 flex justify-between">
              <span>GOAT Meter</span>
              <span className="text-white">{goatPoints} <span className="text-white/30">/ 10k</span></span>
            </div>
            <div className="w-full bg-[#050505] h-1.5 rounded-full overflow-hidden border border-[#222]">
              <div className="bg-yellow-400 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (goatPoints / 10000) * 100)}%` }}></div>
            </div>
          </div>

        </div>

        {/* =========================================
            CENTER COLUMN: HISTORY, ACTION, PRESS
            ========================================= */}
        <div className="flex flex-col gap-4 min-w-0">
          
          {/* Top Bar */}
          <div className="flex justify-between items-center px-2 py-1">
            <div className="text-[10px] text-white/40 uppercase tracking-widest">{player.pos}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">
              AGE <span className="text-yellow-400 font-bold ml-1">{age}</span>
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest flex items-center gap-2">
              CHEMISTRY 
              <div className="w-16 bg-[#222] h-1.5 rounded-full overflow-hidden inline-block align-middle ml-1">
                 <div className={`h-full ${chemistry >= 70 ? 'bg-green-500' : chemistry >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${chemistry}%` }}></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 h-[500px]">
            {/* Center Left: History Timeline */}
            <div className="w-full lg:w-[120px] shrink-0 flex flex-col gap-2 overflow-y-auto no-scrollbar">
              {history.slice().reverse().map((h, i) => (
                <div key={i} className="flex gap-2 items-center bg-[#111] border border-[#222] px-3 py-2 rounded-lg cursor-default hover:bg-[#1a1a1a] transition">
                  <div className={`text-xs font-bold ${i === 0 ? 'text-yellow-400' : 'text-white/60'}`}>{h.age}</div>
                  <img src={h.team.logo} alt={h.team.name} className={`w-5 h-5 object-contain ${i !== 0 && 'grayscale opacity-50'}`} />
                  {h.wonRing && <span className="text-yellow-400 text-xs ml-auto">🏆</span>}
                </div>
              ))}
            </div>

            {/* Center Right: MAIN ACTION PANEL */}
            <div className="flex-1 bg-[#111] border border-[#222] rounded-xl p-6 relative flex flex-col justify-center items-center shadow-sm">
              
              {/* Overlays / Modals rendered inside the main panel */}
              {isRetired ? (
                <div className="text-center">
                  <h2 className="text-2xl font-display text-white mb-2">CAREER RETIRED</h2>
                  <p className="text-white/50 text-sm">{retirementReason}</p>
                  <button onClick={onRestart} className="mt-6 px-6 py-2 border border-[#333] hover:bg-white text-white hover:text-black text-xs uppercase tracking-widest rounded transition">New Career</button>
                </div>
              ) : freeAgencyOffers ? (
                <div className="w-full h-full flex flex-col">
                  <div className="text-[10px] text-green-400 uppercase tracking-widest mb-1 border border-green-500/30 bg-green-500/10 px-2 py-1 rounded inline-block self-start">
                    {freeAgencyOffers.length} CLUBS INTERESTED
                  </div>
                  <h2 className="text-2xl font-display text-white mb-1 uppercase mt-4">Transfer Window</h2>
                  <p className="text-white/40 text-xs mb-6">Clubs are circling. Make your move.</p>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {freeAgencyOffers.map((offer, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleFreeAgencyDecision(offer)}
                        className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 cursor-pointer hover:border-white/30 transition flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center p-1">
                            <img src={offer.team.logo} alt={offer.team.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white uppercase">{offer.team.name}</div>
                            <div className="text-[10px] text-white/40 uppercase">{offer.team.id === currentTeam.id ? 'Stay (Renew)' : 'Move'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-yellow-400 font-display text-xl group-hover:text-yellow-300 transition">${offer.salary}M</div>
                          <div className="text-[10px] text-white/50 uppercase">{offer.years} Yrs</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : playoffs ? (
                <div className="w-full h-full flex flex-col">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-display text-white uppercase">NBA Playoffs</h2>
                  </div>
                  
                  <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                    {playoffs.results.map((res, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[#0a0a0a] border border-[#222] p-3 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-bold uppercase text-[10px] text-white/70">{res.roundName}</span>
                          <span className="text-xs text-white">vs {res.opponent.name}</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <span className="text-xl font-display">{res.result}</span>
                          <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded ${res.won ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {res.won ? 'ADV' : 'ELIM'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!playoffs.eliminated && playoffs.bracket.round < 5 && currentOpponent && (
                     <div className="mt-4 pt-4 border-t border-[#222]">
                        <button 
                          onClick={advancePlayoffs}
                          disabled={!!activeMinigame || playoffs.eliminated}
                          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black py-3 rounded uppercase font-bold tracking-widest text-sm transition"
                        >
                          Play vs {currentOpponent.name}
                        </button>
                     </div>
                  )}

                  {playoffs.bracket.round === 5 && (
                    <div className="mt-4 pt-4 border-t border-[#222] text-center text-yellow-400 font-display text-2xl animate-pulse">
                      CHAMPIONS
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full flex flex-col justify-center items-center h-full gap-4">
                  
                  {/* Skill Points Display */}
                  <div className="flex items-center gap-4 mb-4 bg-[#0a0a0a] border border-[#222] px-6 py-3 rounded-full">
                     <span className="text-xs text-white/50 uppercase tracking-widest">Skill Points</span>
                     <span className="text-xl font-display text-yellow-400">{skillPoints}</span>
                     <button onClick={() => setShowTraining(true)} className="ml-4 text-[10px] uppercase bg-[#222] hover:bg-[#333] px-3 py-1.5 rounded transition">Train</button>
                  </div>

                  <button 
                    onClick={simulateSeason}
                    className="w-full max-w-sm py-4 bg-white text-black font-bold text-sm tracking-widest uppercase rounded hover:bg-gray-200 transition"
                  >
                    Simulate Season
                  </button>

                  <button 
                    onClick={forceTrade}
                    disabled={isRetired || playoffs || pendingEvent || activeMinigame || freeAgencyOffers}
                    className="text-[10px] text-white/30 uppercase tracking-widest hover:text-white transition disabled:opacity-30"
                  >
                    Force Trade
                  </button>
                </div>
              )}

              {/* Overlays Absolutos (Minigame / Evento) */}
              {activeMinigame && (
                <Minigames 
                  gameType={activeMinigame} 
                  onComplete={handleMinigameComplete} 
                  playerOvr={calculateCurrentOvr(maxOvr, age, false)}
                />
              )}

              {pendingEvent && (
                <div className="absolute inset-0 z-50 bg-[#111] flex flex-col p-6 rounded-xl border border-yellow-400/30">
                  <div className="text-yellow-400 uppercase tracking-widest text-[10px] font-bold mb-2">Season Event</div>
                  <h2 className="text-lg font-bold text-white mb-2">{pendingEvent.title}</h2>
                  <p className="text-white/60 text-xs mb-6 flex-1">{pendingEvent.description}</p>
                  <div className="flex flex-col gap-2 mt-auto">
                    {pendingEvent.options.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleEventDecision(opt)}
                        className="w-full py-2.5 px-4 border border-[#333] bg-[#0a0a0a] text-xs text-left rounded hover:border-yellow-400 hover:text-yellow-400 transition flex justify-between"
                      >
                        <span>{opt.label}</span>
                        <span className="opacity-50">
                          {opt.effectType === 'CHEMISTRY' ? 'CHEM' : 'OVR'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Treinamento Overlay dentro do painel */}
              {showTraining && (
                <div className="absolute inset-0 z-50 bg-[#111] flex flex-col p-6 rounded-xl border border-[#333]">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">Training Center</h2>
                      <div className="text-yellow-400 uppercase tracking-widest text-[10px] font-bold">SP: {skillPoints}</div>
                    </div>
                    <button onClick={() => setShowTraining(false)} className="text-[10px] text-white/50 uppercase hover:text-white">Close</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto no-scrollbar">
                    {Object.entries(playerAttributes).map(([key, val]) => {
                      let penalty = 0;
                      if (age < 26) penalty = (26 - age) * 2.5;
                      else if (age > 31) penalty = (age - 31) * 1.5;
                      const currentVal = Math.max(25, Math.round(val - penalty));

                      return (
                        <div key={key} className="bg-[#0a0a0a] border border-[#222] p-3 rounded flex justify-between items-center">
                          <div>
                            <div className="text-[9px] text-white/40 uppercase tracking-widest">{key}</div>
                            <div className="font-bold text-sm text-white">{currentVal} <span className="text-white/30 font-normal">/ {val}</span></div>
                          </div>
                          <button 
                            disabled={skillPoints < 10 || val >= 99}
                            onClick={() => {
                              setSkillPoints(s => s - 10);
                              setPlayerAttributes(prev => ({ ...prev, [key]: prev[key] + 1 }));
                              setNews(prev => [...prev, `TRAINING: +1 POTENTIAL EM ${key.toUpperCase()}`]);
                            }}
                            className="px-2 py-1 bg-white text-black text-[9px] font-bold uppercase rounded disabled:opacity-20 disabled:bg-gray-500 transition"
                          >
                            +1
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bottom: The Press (News) */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col flex-1 min-h-[200px]">
            <div className="text-yellow-400 text-[10px] uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-yellow-400"></span> THE PRESS
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col pr-2 text-xs">
              {news.slice().reverse().map((n, i) => (
                <div key={i} className="py-2 border-b border-[#222] text-white/70 flex gap-4">
                  <span className="text-white/30 text-[10px] w-12">{history.length > 0 ? history[history.length-1].age : age}</span>
                  <span>{n}</span>
                </div>
              ))}
              <div ref={newsRef} />
            </div>
          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN: STANDINGS
            ========================================= */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col flex-1 h-[calc(100vh-2rem)] overflow-hidden">
            
            <div className="flex mb-4 border-b border-[#222] shrink-0">
              <button 
                onClick={() => setActiveConf('West')}
                className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-widest transition border-b-2 ${activeConf === 'West' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-white/40 hover:text-white'}`}
              >
                West
              </button>
              <button 
                onClick={() => setActiveConf('East')}
                className={`flex-1 pb-2 text-[10px] font-bold uppercase tracking-widest transition border-b-2 ${activeConf === 'East' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-white/40 hover:text-white'}`}
              >
                East
              </button>
            </div>

            <div className="space-y-0.5 text-xs flex-1 overflow-y-auto no-scrollbar pr-1">
              {standings[activeConf].map((t, idx) => (
                <div key={t.id} className={`flex justify-between items-center px-2 py-1.5 rounded ${currentTeam?.id === t.id ? 'bg-yellow-400/10 text-yellow-400 font-bold' : 'text-white/60 hover:bg-[#222]'}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-[9px] opacity-50">{idx + 1}</span>
                    <img src={t.logo} alt={t.name} className="w-4 h-4 object-contain" />
                    <span className="truncate max-w-[120px]">{t.name}</span>
                  </div>
                  <span className="font-mono text-[10px] tracking-wider">{t.wins}-{82 - t.wins}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-[#222] text-right text-[9px] text-white/30 uppercase tracking-widest shrink-0">
              League • Wins
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
