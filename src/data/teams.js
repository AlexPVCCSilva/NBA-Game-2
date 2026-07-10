const baseTeams = [
  { id: 'LAL', name: 'Lakers', city: 'Los Angeles', conference: 'West', tier: 90 },
  { id: 'BOS', name: 'Celtics', city: 'Boston', conference: 'East', tier: 92 },
  { id: 'GSW', name: 'Warriors', city: 'Golden State', conference: 'West', tier: 88 },
  { id: 'MIA', name: 'Heat', city: 'Miami', conference: 'East', tier: 85 },
  { id: 'CHI', name: 'Bulls', city: 'Chicago', conference: 'East', tier: 80 },
  { id: 'NYK', name: 'Knicks', city: 'New York', conference: 'East', tier: 86 },
  { id: 'PHI', name: '76ers', city: 'Philadelphia', conference: 'East', tier: 87 },
  { id: 'DAL', name: 'Mavericks', city: 'Dallas', conference: 'West', tier: 89 },
  { id: 'DEN', name: 'Nuggets', city: 'Denver', conference: 'West', tier: 91 },
  { id: 'PHX', name: 'Suns', city: 'Phoenix', conference: 'West', tier: 86 },
  { id: 'LAC', name: 'Clippers', city: 'Los Angeles', conference: 'West', tier: 85 },
  { id: 'MIL', name: 'Bucks', city: 'Milwaukee', conference: 'East', tier: 88 },
  { id: 'BKN', name: 'Nets', city: 'Brooklyn', conference: 'East', tier: 78 },
  { id: 'SAS', name: 'Spurs', city: 'San Antonio', conference: 'West', tier: 82 },
  { id: 'OKC', name: 'Thunder', city: 'Oklahoma City', conference: 'West', tier: 90 },
  { id: 'MIN', name: 'Timberwolves', city: 'Minnesota', conference: 'West', tier: 88 },
  { id: 'SAC', name: 'Kings', city: 'Sacramento', conference: 'West', tier: 83 },
  { id: 'HOU', name: 'Rockets', city: 'Houston', conference: 'West', tier: 82 },
  { id: 'MEM', name: 'Grizzlies', city: 'Memphis', conference: 'West', tier: 84 },
  { id: 'NOP', name: 'Pelicans', city: 'New Orleans', conference: 'West', tier: 83 },
  { id: 'UTA', name: 'Jazz', city: 'Utah', conference: 'West', tier: 75 },
  { id: 'POR', name: 'Trail Blazers', city: 'Portland', conference: 'West', tier: 75 },
  { id: 'ATL', name: 'Hawks', city: 'Atlanta', conference: 'East', tier: 80 },
  { id: 'CLE', name: 'Cavaliers', city: 'Cleveland', conference: 'East', tier: 85 },
  { id: 'IND', name: 'Pacers', city: 'Indiana', conference: 'East', tier: 84 },
  { id: 'ORL', name: 'Magic', city: 'Orlando', conference: 'East', tier: 83 },
  { id: 'TOR', name: 'Raptors', city: 'Toronto', conference: 'East', tier: 77 },
  { id: 'WAS', name: 'Wizards', city: 'Washington', conference: 'East', tier: 74 },
  { id: 'CHA', name: 'Hornets', city: 'Charlotte', conference: 'East', tier: 76 },
  { id: 'DET', name: 'Pistons', city: 'Detroit', conference: 'East', tier: 73 },
];

export const teams = baseTeams.map(team => {
  let espnId = team.id.toLowerCase();
  // Correções de ID para a CDN da ESPN
  if (espnId === 'bkn') espnId = 'bkn'; 
  if (espnId === 'was') espnId = 'wsh';
  if (espnId === 'nop') espnId = 'no';
  if (espnId === 'uta') espnId = 'utah';

  return {
    ...team,
    logo: `https://a.espncdn.com/i/teamlogos/nba/500/${espnId}.png`
  };
});

export const getRandomTeam = () => {
  return teams[Math.floor(Math.random() * teams.length)];
};

export const getRandomOffer = (currentTeamId) => {
  const otherTeams = teams.filter(t => t.id !== currentTeamId);
  return otherTeams[Math.floor(Math.random() * otherTeams.length)];
};
