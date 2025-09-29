
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
  <div className="flex items-center space-x-1 sm:space-x-2 bg-space-dark px-2 py-1 rounded-md">
    <Icon name={icon} className={`w-5 h-5 ${colorClass}`} />
    <div>
      <p className={`font-orbitron text-base ${colorClass}`}>{value}</p>
      <p className="text-xs text-space-text-secondary hidden sm:block">{label}</p>
    </div>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ player, currentPlanetName, onSetView }) => {
  const { actions } = useGame();
  const cargoLoad = player.ship.cargo.items.reduce((acc, item) => acc + item.quantity, 0);
  const durabilityColor = player.ship.durability > 50 ? 'text-accent-green' : player.ship.durability > 20 ? 'text-accent-yellow' : 'text-accent-red';

  return (
    <header className="bg-space-panel border-b border-space-border p-2 sm:p-4">
      <div className="max-w-7xl mx-auto flex flex-nowrap justify-between items-center gap-2 sm:gap-4">
        <h1 className="text-xl md:text-3xl font-orbitron text-white whitespace-nowrap">
          Galaxy Trader
        </h1>
        <div className="flex flex-nowrap items-center gap-1 sm:gap-2">
          <StatDisplay icon="credits" value={player.credits.toLocaleString()} label="Credits" colorClass="text-accent-yellow"/>
          <StatDisplay icon="cargo" value={`${cargoLoad}/${player.ship.cargo.capacity}`} label="Cargo" />
          <StatDisplay icon="durability" value={`${player.ship.durability}%`} label="Durability" colorClass={durabilityColor} />
          <StatDisplay icon="planet" value={currentPlanetName} label="Location" />
        </div>
        <div className="flex flex-nowrap items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={() => onSetView('map')} className="bg-accent-blue/20 text-accent-blue px-2 py-1 sm:px-3 sm:py-2 text-sm rounded-md hover:bg-accent-blue/40 transition-colors flex items-center gap-1 sm:gap-2">
                  <Icon name="galaxy" className="w-5 h-5" />
                  <span className="hidden sm:inline">Map</span>
              </button>
              <button 
                onClick={() => onSetView('planet')}
                disabled={player.isTraveling} 
                className="bg-indigo-500/20 text-indigo-400 px-2 py-1 sm:px-3 sm:py-2 text-sm rounded-md hover:bg-indigo-500/40 transition-colors flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Icon name="market" className="w-5 h-5" />
                  <span className="hidden sm:inline">Market</span>
              </button>
              <button 
                onClick={() => onSetView('prices')} 
                disabled={player.isTraveling}
                className="bg-accent-green/20 text-accent-green px-2 py-1 sm:px-3 sm:py-2 text-sm rounded-md hover:bg-accent-green/40 transition-colors flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Icon name="chart" className="w-5 h-5" />
                  <span className="hidden sm:inline">Prices</span>
              </button>
            </div>
             <div className="flex items-center gap-1 sm:gap-2 border-l border-space-border pl-1 sm:pl-2 ml-1 sm:ml-2">
                 <button onClick={() => actions.saveGame()} className="bg-teal-500/20 text-teal-400 p-2 rounded-md hover:bg-teal-500/40 transition-colors flex items-center" title="Save Game">
                    <Icon name="save" className="w-5 h-5" />
                </button>
                <button onClick={() => actions.loadGame()} className="bg-sky-500/20 text-sky-400 p-2 rounded-md hover:bg-sky-500/40 transition-colors flex items-center" title="Load Game">
                    <Icon name="load" className="w-5 h-5" />
                </button>
                <button onClick={() => actions.newGame()} className="bg-red-500/20 text-red-400 p-2 rounded-md hover:bg-red-500/40 transition-colors flex items-center" title="New Game">
                    <Icon name="new" className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};