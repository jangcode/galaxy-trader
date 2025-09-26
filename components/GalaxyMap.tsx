
import React, { useState } from 'react';
import type { Galaxy, PlayerState } from '../types';
import { useGame } from '../contexts/GameContext';
import { calculateDistance } from '../services/gameLogic';
import { Icon } from './icons';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

export const GalaxyMap: React.FC<{ galaxy: Galaxy; player: PlayerState, onPlanetSelect: () => void; }> = ({ galaxy, player, onPlanetSelect }) => {
  const { actions } = useGame();
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);

  const handleTravel = (planetId: string) => {
    if (planetId !== player.currentPlanetId) {
      actions.travelTo(planetId);
      onPlanetSelect();
      setSelectedPlanetId(null);
    }
  };

  const currentPlanet = galaxy.planets.find(p => p.id === player.currentPlanetId);
  const selectedPlanet = selectedPlanetId ? galaxy.planets.find(p => p.id === selectedPlanetId) : null;

  return (
    <div className="animate-fade-in relative h-full w-full bg-space-dark overflow-hidden">
      <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full h-full">
        {/* Starfield background */}
        <defs>
          <radialGradient id="grad-bg">
              <stop offset="0%" stopColor="#161B22" />
              <stop offset="100%" stopColor="#0D1117" />
          </radialGradient>
        </defs>
        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#grad-bg)" />
        
        {/* Travel Lines */}
        {currentPlanet && galaxy.planets.map(planet => {
          if (planet.id === currentPlanet.id) return null;
          return (
            <line
              key={`line-${planet.id}`}
              x1={currentPlanet.position.x}
              y1={currentPlanet.position.y}
              x2={planet.position.x}
              y2={planet.position.y}
              stroke="#58A6FF"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="opacity-50"
            />
          );
        })}

        {/* Planets */}
        {galaxy.planets.map(planet => {
          const isCurrent = player.currentPlanetId === planet.id;
          const isHovered = hoveredPlanetId === planet.id;
          const radius = isCurrent ? 12 : 8;
          
          return (
            <g
              key={planet.id}
              transform={`translate(${planet.position.x}, ${planet.position.y})`}
              onClick={() => setSelectedPlanetId(planet.id)}
              onMouseEnter={() => setHoveredPlanetId(planet.id)}
              onMouseLeave={() => setHoveredPlanetId(null)}
              className="cursor-pointer"
            >
              <circle
                r={radius}
                fill={planet.color}
                stroke={isCurrent ? '#58A6FF' : '#C9D1D9'}
                strokeWidth={isCurrent ? 2 : 1}
                className={`transition-transform duration-300 ${isCurrent ? 'animate-pulse-slow' : ''} ${isHovered && !isCurrent ? 'transform scale-125' : ''}`}
              />
               {isHovered && !isCurrent && <circle r={radius + 4} fill="white" fillOpacity="0.2" className="pointer-events-none" />}
              <text
                y={-radius - 10}
                textAnchor="middle"
                fill={isCurrent ? '#58A6FF' : (isHovered ? '#FFFFFF' : '#C9D1D9')}
                fontSize="12"
                fontWeight={isCurrent ? 'bold' : 'normal'}
                className="font-sans pointer-events-none transition-all duration-300"
                style={{ textShadow: '0 0 5px black' }}
              >
                {planet.name}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute top-4 left-4 p-2 bg-space-panel/80 rounded border border-space-border">
          <h3 className="font-orbitron text-lg">Galaxy Map</h3>
          <p className="text-sm text-space-text-secondary">{galaxy.name} Galaxy</p>
      </div>

      {/* Planet Info Panel */}
      {selectedPlanet && currentPlanet && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-space-panel/90 backdrop-blur-sm border border-space-border rounded-lg shadow-2xl w-full max-w-sm animate-fade-in text-space-text"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 flex justify-between items-center border-b border-space-border">
            <h3 className="font-orbitron text-xl" style={{ color: selectedPlanet.color }}>{selectedPlanet.name}</h3>
            <button onClick={() => setSelectedPlanetId(null)} className="text-space-text-secondary hover:text-white">
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4 space-y-2 text-sm">
            <p className="text-space-text-secondary h-16 overflow-y-auto pr-2">{selectedPlanet.description}</p>
            <div className="border-t border-space-border my-2"></div>
            <div className="flex justify-between"><span>Distance:</span> <span className="font-mono">{Math.round(calculateDistance(currentPlanet.position, selectedPlanet.position))} units</span></div>
            <div className="flex justify-between"><span>Est. Fuel Cost:</span> <span className="font-mono">{Math.round(calculateDistance(currentPlanet.position, selectedPlanet.position) / 10)}cr</span></div>
            <div className="flex justify-between"><span>Arrival Tax:</span> <span className="font-mono">{(selectedPlanet.taxRate * 100).toFixed(0)}% ({Math.round(player.credits * selectedPlanet.taxRate)}cr)</span></div>
          </div>
          <div className="p-4 bg-space-dark/50 rounded-b-lg">
            {selectedPlanet.id === player.currentPlanetId ? (
              <p className="text-center text-accent-green font-semibold">You are currently orbiting this planet.</p>
            ) : (
              <button 
                onClick={() => handleTravel(selectedPlanet.id)}
                className="w-full bg-accent-blue/20 text-accent-blue px-4 py-2 rounded-md hover:bg-accent-blue/40 transition-colors flex items-center justify-center gap-2"
              >
                Travel to {selectedPlanet.name}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
