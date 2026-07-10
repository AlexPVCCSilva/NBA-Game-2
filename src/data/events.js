export const seasonEvents = [
  {
    id: 'media_criticism',
    title: 'Crítica na Mídia',
    description: 'Um analista famoso da ESPN disse que você não é um jogador que joga para a equipe. Como você responde?',
    options: [
      {
        label: 'Ignorar e focar nos treinos',
        effectType: 'OVR',
        effectValue: 2,
        news: 'Focou no basquete e calou os críticos na quadra.',
        chemValue: 0
      },
      {
        label: 'Atacar o analista no Twitter',
        effectType: 'CHEMISTRY',
        effectValue: -15,
        news: 'Causou um drama desnecessário nas redes sociais. O clima pesou.',
        chemValue: 0
      },
      {
        label: 'Prometer título para os fãs',
        effectType: 'CHEMISTRY',
        effectValue: 15,
        news: 'Assumiu a responsabilidade e incendiou a torcida!',
        chemValue: 0
      }
    ]
  },
  {
    id: 'coach_conflict',
    title: 'Atrito com o Treinador',
    description: 'O treinador quer que você diminua seus arremessos e passe mais a bola para envolver o time.',
    options: [
      {
        label: 'Aceitar o novo papel',
        effectType: 'CHEMISTRY',
        effectValue: 20,
        news: 'Abraçou o sistema do técnico. O time está mais unido do que nunca.'
      },
      {
        label: 'Ignorar e arremessar mais',
        effectType: 'OVR',
        effectValue: 3,
        chemValue: -20,
        news: 'Ignorou o técnico para inflar os próprios números. O vestiário está rachado.'
      }
    ]
  },
  {
    id: 'party_night',
    title: 'Festa antes do Jogo',
    description: 'Um rapper famoso te convidou para uma festa épica na noite anterior a um jogo importante.',
    options: [
      {
        label: 'Ir na festa até de manhã',
        effectType: 'OVR',
        effectValue: -4,
        chemValue: -10,
        news: 'Foi visto de ressaca na quadra e prejudicou o time.'
      },
      {
        label: 'Ficar em casa e descansar',
        effectType: 'OVR',
        effectValue: 1,
        chemValue: 10,
        news: 'Mostrou profissionalismo e liderou pelo exemplo.'
      }
    ]
  }
];
