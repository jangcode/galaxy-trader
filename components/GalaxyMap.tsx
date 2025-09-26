
import React from 'react';
import type { Galaxy, PlayerState } from '../types';
import { useGame } from '../contexts/GameContext';

interface GalaxyMapProps {
  galaxy: Galaxy;
  player: PlayerState;
  onPlanetSelect: () => void;
}

export const GalaxyMap: React.FC<GalaxyMapProps> = ({ galaxy, player, onPlanetSelect }) => {
  const { actions } = useGame();

  const handleTravel = (planetId: string) => {
    if (planetId !== player.currentPlanetId) {
        actions.travelTo(planetId);
        onPlanetSelect();
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-orbitron text-center mb-8 text-accent-blue">Galaxy Map: {galaxy.name}</h2>
      <div className="relative w-full max-w-4xl h-[500px] mx-auto bg-space-panel border border-space-border rounded-lg p-4 bg-dots">
        <svg className="absolute inset-0 w-full h-full" style={{ background: 'radial-gradient(ellipse at center, rgba(13,17,23,0) 0%, #0D1117 100%)' }}>
          {galaxy.planets.map(planet => {
            const currentPlanet = galaxy.planets.find(p => p.id === player.currentPlanetId);
            if (currentPlanet && currentPlanet.id !== planet.id) {
              return (
                <line
                  key={`line-${planet.id}`}
                  x1={currentPlanet.position.x / 8 + 50}
                  y1={currentPlanet.position.y / 5 + 50}
                  x2={planet.position.x / 8 + 50}
                  y2={planet.position.y / 5 + 50}
                  stroke="rgba(48, 54, 61, 0.5)"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              );
            }
            return null;
          })}
        </svg>

        {galaxy.planets.map(planet => (
          <div
            key={planet.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 group transition-transform duration-300 hover:scale-110 cursor-pointer`}
            style={{ left: `${planet.position.x / 8 + 50}px`, top: `${planet.position.y / 5 + 50}px` }}
            onClick={() => handleTravel(planet.id)}
          >
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center
              ${player.currentPlanetId === planet.id ? 'bg-accent-blue border-white animate-pulse-slow' : 'bg-space-dark border-space-border group-hover:border-accent-blue'}
            `}>
                <div className={`w-4 h-4 rounded-full ${player.currentPlanetId === planet.id ? 'bg-white' : 'bg-space-text-secondary group-hover:bg-accent-blue'}`}></div>
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap px-3 py-1 bg-space-dark text-space-text text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {planet.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
