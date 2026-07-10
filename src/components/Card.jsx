import React from 'react';

export default function Card({ player }) {
  if (!player) return null;

  return (
    <div className="relative w-64 h-96 rounded-2xl bg-gradient-to-b from-brand-orange to-yellow-600 p-1 shadow-2xl overflow-hidden border-2 border-yellow-300">
      <div className="absolute inset-0 bg-black/40 mix-blend-overlay"></div>
      
      <div className="relative h-full flex flex-col justify-between bg-brand-panel rounded-xl p-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-center">
            <span className="text-5xl font-display font-bold text-white drop-shadow-md">{player.ovr}</span>
            <span className="text-xl font-display text-brand-orange">{player.pos}</span>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-widest text-white/50">O FENÔMENO</span>
          </div>
        </div>

        <div className="text-center my-4">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wide">{player.name || 'Seu Jogador'}</h2>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between items-center bg-black/30 px-2 py-1 rounded">
            <span className="text-white/70">SHO</span>
            <span className="font-bold text-white">{player.shooting}</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 px-2 py-1 rounded">
            <span className="text-white/70">PLY</span>
            <span className="font-bold text-white">{player.playmaking}</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 px-2 py-1 rounded">
            <span className="text-white/70">FIN</span>
            <span className="font-bold text-white">{player.finishing}</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 px-2 py-1 rounded">
            <span className="text-white/70">DEF</span>
            <span className="font-bold text-white">{player.defense}</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 px-2 py-1 rounded">
            <span className="text-white/70">REB</span>
            <span className="font-bold text-white">{player.rebounding}</span>
          </div>
          <div className="flex justify-between items-center bg-black/30 px-2 py-1 rounded">
            <span className="text-white/70">ATH</span>
            <span className="font-bold text-white">{player.athleticism}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
