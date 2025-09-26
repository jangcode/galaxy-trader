
import React from 'react';
import type { PlayerState } from '../types';
import { Icon } from './icons';
import { useGame } from '../contexts/GameContext';

interface HeaderProps {
  player: PlayerState;
  currentPlanetName: string;
  onSetView: (view: 'map' | 'planet' | 'prices') => void;
}

const StatDisplay: React.FC<{ icon: string; value: string | number; label: string; colorClass?: string }> = ({ icon, value, label, colorClass = 'text-accent-blue' }) => (
  <div className="flex items-center space-x-2 bg-space-dark p-2 rounded-md">
    <Icon name={icon} className={`w-6 h-6 ${colorClass}`} />
    <div>
      <p className={`font-orbitron text-lg ${colorClass}`}>{value}</p>
      <p className="text-xs text-space-text-secondary">{label}</p>
    </div>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ player, currentPlanetName, onSetView }) => {
  const { actions } = useGame();
  const cargoLoad = player.ship.cargo.items.reduce((acc, item) => acc + item.quantity, 0);
  const durabilityColor = player.ship.durability > 50 ? 'text-accent-green' : player.ship.durability > 20 ? 'text-accent-yellow' : 'text-accent-red';

  return (
    <header className="bg-space-panel border-b border-space-border p-4">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-orbitron text-white">
          Galaxy Trader
        </h1>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <StatDisplay icon="credits" value={player.credits.toLocaleString()} label="Credits" colorClass="text-accent-yellow"/>
          <StatDisplay icon="cargo" value={`${cargoLoad} / ${player.ship.cargo.capacity}`} label="Cargo" />
          <StatDisplay icon="durability" value={`${player.ship.durability}%`} label="Durability" colorClass={durabilityColor} />
          <StatDisplay icon="planet" value={currentPlanetName} label="Location" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => onSetView('map')} className="bg-accent-blue/20 text-accent-blue px-4 py-2 rounded-md hover:bg-accent-blue/40 transition-colors flex items-center gap-2">
                  <Icon name="galaxy" className="w-5 h-5" />
                  <span>Map</span>
              </button>
              <button onClick={() => onSetView('planet')} className="bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-md hover:bg-indigo-500/40 transition-colors flex items-center gap-2">
                  <Icon name="market" className="w-5 h-5" />
                  <span>Market</span>
              </button>
              <button onClick={() => onSetView('prices')} className="bg-accent-green/20 text-accent-green px-4 py-2 rounded-md hover:bg-accent-green/40 transition-colors flex items-center gap-2">
                  <Icon name="chart" className="w-5 h-5" />
                  <span>Prices</span>
              </button>
            </div>
             <div className="flex items-center gap-2 border-l border-space-border pl-2 ml-2">
                 <button onClick={() => actions.saveGame()} className="bg-teal-500/20 text-teal-400 px-3 py-2 rounded-md hover:bg-teal-500/40 transition-colors flex items-center gap-2" title="Save Game">
                    <Icon name="save" className="w-5 h-5" />
                </button>
                <button onClick={() => actions.loadGame()} className="bg-sky-500/20 text-sky-400 px-3 py-2 rounded-md hover:bg-sky-500/40 transition-colors flex items-center gap-2" title="Load Game">
                    <Icon name="load" className="w-5 h-5" />
                </button>
                <button onClick={() => actions.newGame()} className="bg-red-500/20 text-red-400 px-3 py-2 rounded-md hover:bg-red-500/40 transition-colors flex items-center gap-2" title="New Game">
                    <Icon name="new" className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};
