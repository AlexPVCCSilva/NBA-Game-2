import { getRandomTeam } from './teams';

// Peso dos atributos por posição para calcular o OVR máximo
const POSITION_WEIGHTS = {
  PG: { shooting: 1.2, playmaking: 1.5, finishing: 1.0, defense: 1.0, rebounding: 0.5, athleticism: 1.0 },
  SG: { shooting: 1.5, playmaking: 1.0, finishing: 1.2, defense: 1.0, rebounding: 0.6, athleticism: 1.1 },
  SF: { shooting: 1.1, playmaking: 1.0, finishing: 1.2, defense: 1.2, rebounding: 0.9, athleticism: 1.2 },
  PF: { shooting: 0.8, playmaking: 0.7, finishing: 1.3, defense: 1.3, rebounding: 1.4, athleticism: 1.0 },
  C:  { shooting: 0.5, playmaking: 0.6, finishing: 1.4, defense: 1.5, rebounding: 1.5, athleticism: 0.9 }
};

export function calculateMaxOvr(playerStats, pos) {
  const weights = POSITION_WEIGHTS[pos];
  
  let totalWeight = 0;
  let weightedSum = 0;

  for (const [stat, val] of Object.entries(playerStats)) {
    const w = weights[stat] || 1;
    weightedSum += val * w;
    totalWeight += w;
  }

  return Math.round(weightedSum / totalWeight);
}

export function calculateCurrentOvr(maxOvr, age, isInjured) {
  let ovr = maxOvr;

  // Curva de crescimento e declínio
  if (age < 26) {
    // Cresce gradualmente de 19 até 26
    const diff = 26 - age;
    ovr -= diff * 2.5; 
  } else if (age > 31) {
    // Declina após os 31
    const diff = age - 31;
    ovr -= diff * 1.5;
  }

  if (isInjured) ovr -= 15;

  return Math.max(40, Math.round(ovr));
}

export function generateSeasonStats(effectiveOvr, pos, isInjured) {
  // Base: 70 ovr = 10 pts, 3 ast, 3 reb
  // Base: 99 ovr = 30+ pts, 8+ ast, 10+ reb
  
  const factor = effectiveOvr / 100;
  
  let pts = (factor * 32) + (Math.random() * 5 - 2.5);
  let ast = (factor * 9) + (Math.random() * 3 - 1.5);
  let reb = (factor * 11) + (Math.random() * 4 - 2);

  // Ajustes de posição
  if (pos === 'PG') { ast *= 1.3; reb *= 0.5; }
  if (pos === 'SG') { pts *= 1.2; ast *= 0.8; reb *= 0.6; }
  if (pos === 'C') { reb *= 1.5; ast *= 0.4; pts *= 0.9; }
  if (pos === 'PF') { reb *= 1.3; ast *= 0.5; }

  // Garante que não tenha stat negativo
  pts = Math.max(0, pts);
  ast = Math.max(0, ast);
  reb = Math.max(0, reb);

  // Jogos
  let games = isInjured ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 15) + 65;
  if (games > 82) games = 82;

  return {
    pts: pts.toFixed(1),
    ast: ast.toFixed(1),
    reb: reb.toFixed(1),
    games,
    rating: (factor * 9.5).toFixed(1)
  };
}

export function generateNews(playerName, teamName, isInjured, age) {
  if (isInjured) {
    const inj = ['rompe o LCA', 'lesiona o ombro', 'quebra o pé', 'sofre lesão grave no joelho'];
    return `BOMBA: ${playerName} ${inj[Math.floor(Math.random() * inj.length)]} e está fora de grande parte da temporada.`;
  }

  if (age === 19) {
    return `Rookie Watch: ${playerName} estreia pelo ${teamName} com muita expectativa.`;
  }

  const newsPool = [
    `${playerName} faz um game-winner sensacional pelo ${teamName}!`,
    `Rumores: Clima pesa no vestiário do ${teamName}.`,
    `${teamName} demite o treinador após sequência de derrotas.`,
    `${playerName} é multado por criticar a arbitragem.`,
    `${playerName} anota career-high e leva a torcida à loucura.`,
    `${teamName} embala sequência de vitórias impressionante.`,
    `A imprensa questiona se ${playerName} pode liderar o ${teamName} ao título.`
  ];

  return newsPool[Math.floor(Math.random() * newsPool.length)];
}

export function checkForInjury() {
  const chance = Math.random();
  if (chance < 0.05) return 'SEVERE'; // 5% chance de lesão muito grave (pode aposentar)
  if (chance < 0.15) return 'MODERATE'; // 10% chance de lesão que estraga a season
  return 'NONE';
}

export function simulateLeagueStandings(allTeams, playerTeamId, playerOvr, isInjured, chemistry = 80) {
  // Simula o power final de todos os times
  const simulatedTeams = allTeams.map(team => {
    let power = team.tier;

    // Se for o time do jogador, aplica o buff
    if (team.id === playerTeamId) {
      // Nerfado: jogador não carrega sozinho o time tão facilmente
      let baseBuff = (playerOvr / 5);
      
      // Química afeta drasticamente o rendimento do time (0 = penalidade severa, 100 = time muito superior)
      const chemMultiplier = 0.5 + (chemistry / 100); // Ex: 80 chem = 1.3x buff. 0 chem = 0.5x buff.
      baseBuff *= chemMultiplier;

      power += baseBuff;
      
      if (isInjured) {
        power -= baseBuff; // Remove o bônus se machucado
      }
    }

    // Fator sorte (RNG) para a temporada regular (entre -10 e +15)
    const rng = (Math.random() * 25) - 10;
    const finalPower = power + rng;

    // Transforma finalPower em vitórias (temporada de 82 jogos)
    // 100 de power ~ 41 vitórias
    let wins = Math.floor(41 + ((finalPower - 100) * 1.5));
    wins = Math.max(10, Math.min(74, wins)); // Limitado entre 10 e 74 vitórias para ser realista

    return { ...team, finalPower, wins };
  });

  // Separa Leste e Oeste e ordena primariamente por vitórias, depois por finalPower como desempate
  const sortByWins = (a, b) => b.wins - a.wins || b.finalPower - a.finalPower;
  
  const east = simulatedTeams.filter(t => t.conference === 'East').sort(sortByWins);
  const west = simulatedTeams.filter(t => t.conference === 'West').sort(sortByWins);

  return { East: east, West: west };
}

export function simulatePlayoffSeries(myPower, opponentPower) {
  // Simula uma série melhor de 7
  let myWins = 0;
  let oppWins = 0;

  while (myWins < 4 && oppWins < 4) {
    // Para cada jogo, sorteia um vencedor baseado na diferença de power
    const diff = myPower - opponentPower;
    // Chance base de 50%, modificado por 1% por cada ponto de diferença
    const myWinChance = 0.5 + (diff * 0.01);
    
    if (Math.random() < myWinChance) {
      myWins++;
    } else {
      oppWins++;
    }
  }

  return {
    won: myWins === 4,
    score: `${myWins}-${oppWins}`
  };
}

export function generatePlayoffBracket(standings) {
  const getMatchups = (confStandings) => [
    { t1: confStandings[0], t2: confStandings[7] }, // 1 vs 8
    { t1: confStandings[3], t2: confStandings[4] }, // 4 vs 5
    { t1: confStandings[2], t2: confStandings[5] }, // 3 vs 6
    { t1: confStandings[1], t2: confStandings[6] }  // 2 vs 7
  ];

  return {
    round: 1,
    east: getMatchups(standings.East),
    west: getMatchups(standings.West)
  };
}

export function advanceBracket(bracket, playerTeamId, forceGame7Result = null) {
  let myResult = null;

  const resolveMatchup = (m) => {
    let series;
    
    // Se o jogador estiver nesse confronto e tivemos um minigame
    if (forceGame7Result && (m.t1.id === playerTeamId || m.t2.id === playerTeamId)) {
      const isT1 = m.t1.id === playerTeamId;
      if (forceGame7Result === 'WON') {
        series = { won: isT1, score: isT1 ? '4-3' : '3-4' };
      } else {
        series = { won: !isT1, score: isT1 ? '3-4' : '4-3' };
      }
    } else {
      series = simulatePlayoffSeries(m.t1.finalPower, m.t2.finalPower);
    }
    
    const winner = series.won ? m.t1 : m.t2;
    
    // Se o jogador estiver nesse matchup, salva o resultado
    if (m.t1.id === playerTeamId) {
      myResult = { opponent: m.t2, won: series.won, score: series.score };
    } else if (m.t2.id === playerTeamId) {
      // Inverte a string de score pra sempre ser "MeuScore-OppScore"
      const s = series.score.split('-');
      myResult = { opponent: m.t1, won: !series.won, score: `${s[1]}-${s[0]}` };
    }
    
    return winner;
  };

  if (bracket.round === 4) {
    const finalsMatchup = bracket.finals[0];
    const champion = resolveMatchup(finalsMatchup);
    return {
      nextBracket: { ...bracket, round: 5, champion },
      myResult
    };
  }

  const resolveRound = (matchups) => {
    const winners = [];
    for (let m of matchups) {
      winners.push(resolveMatchup(m));
    }
    
    const newMatchups = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (winners[i+1]) {
        newMatchups.push({ t1: winners[i], t2: winners[i+1] });
      } else {
        newMatchups.push(winners[i]);
      }
    }
    return newMatchups;
  };

  const nextEast = resolveRound(bracket.east);
  const nextWest = resolveRound(bracket.west);

  let nextBracket = {};
  if (bracket.round === 3) {
    nextBracket = {
      round: 4,
      finals: [{ t1: nextEast[0], t2: nextWest[0] }]
    };
  } else {
    nextBracket = {
      round: bracket.round + 1,
      east: nextEast,
      west: nextWest
    };
  }

  return { nextBracket, myResult };
}
