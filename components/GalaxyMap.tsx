import React, { useState, useEffect, useMemo } from 'react';
import type { Galaxy, PlayerState } from '../types';
import { useGame } from '../contexts/GameContext';
import { calculateDistance } from '../services/gameLogic';
import { Icon } from './icons';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

const Ship: React.FC<{ player: PlayerState; galaxy: Galaxy }> = ({ player, galaxy }) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    if (player.isTraveling && player.travelInfo) {
      const origin = galaxy.planets.find(p => p.id === player.travelInfo!.originPlanetId);
      const destination = galaxy.planets.find(p => p.id === player.travelInfo!.destinationPlanetId);

      if (!origin || !destination) return;

      const startTime = new Date(player.travelInfo.startTime).getTime();
      const endTime = new Date(player.travelInfo.endTime).getTime();
      const duration = endTime - startTime;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const x = origin.position.x + (destination.position.x - origin.position.x) * progress;
        const y = origin.position.y + (destination.position.y - origin.position.y) * progress;
        setPosition({ x, y });
        
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(animate);
        }
      };
      
      animationFrameId = requestAnimationFrame(animate);

    } else if (player.currentPlanetId) {
      const currentPlanet = galaxy.planets.find(p => p.id === player.currentPlanetId);
      if (currentPlanet) {
        setPosition(currentPlanet.position);
      }
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [player.isTraveling, player.currentPlanetId, player.travelInfo, galaxy]);

  if (!position) return null;

  let rotation = 0;
  if (player.isTraveling && player.travelInfo) {
      const origin = galaxy.planets.find(p => p.id === player.travelInfo!.originPlanetId);
      const destination = galaxy.planets.find(p => p.id === player.travelInfo!.destinationPlanetId);
      if(origin && destination) {
          const dx = destination.position.x - origin.position.x;
          const dy = destination.position.y - origin.position.y;
          rotation = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
      }
  }

  return (
    <g transform={`translate(${position.x}, ${position.y}) rotate(${rotation})`}>
      <path d="M0 -10 L6 8 L0 5 L-6 8 Z" fill="#58A6FF" stroke="white" strokeWidth="1" />
    </g>
  );
};


export const GalaxyMap: React.FC<{ galaxy: Galaxy; player: PlayerState, onPlanetSelect: () => void; }> = ({ galaxy, player, onPlanetSelect }) => {
  const { actions } = useGame();
  const [hoveredPlanetId, setHoveredPlanetId] = useState<string | null>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);

  const marketOpportunities = useMemo(() => {
    const bestSellPlanets = new Set<string>();
    const bestBuyPlanets = new Set<string>();

    if (!galaxy.goods || !galaxy.planets) {
        return { bestSellPlanets, bestBuyPlanets };
    }

    // Find best places to sell current cargo
    const cargoGoodIds = player.ship.cargo.items.map(item => item.goodId);
    for (const goodId of cargoGoodIds) {
        const good = galaxy.goods.find(g => g.id === goodId);
        if (!good) continue;

        let maxSellPrice = 0;
        let bestPlanetId = '';

        galaxy.planets.forEach(planet => {
            if (planet.id === player.currentPlanetId) return;
            const marketGood = planet.market.find(mg => mg.goodId === goodId);
            if (marketGood && marketGood.sellPrice > maxSellPrice) {
                maxSellPrice = marketGood.sellPrice;
                bestPlanetId = planet.id;
            }
        });
        
        // A good deal is >25% above base price
        if (bestPlanetId && maxSellPrice > good.basePrice * 1.25) {
            bestSellPlanets.add(bestPlanetId);
        }
    }
    
    // Find best places to buy any good
    galaxy.goods.forEach(good => {
        let minBuyPrice = Infinity;
        let bestPlanetId = '';

        galaxy.planets.forEach(planet => {
            if (planet.id === player.currentPlanetId) return;
            const marketGood = planet.market.find(mg => mg.goodId === good.id);
            if (marketGood && marketGood.buyPrice < minBuyPrice) {
                minBuyPrice = marketGood.buyPrice;
                bestPlanetId = planet.id;
            }
        });
        
        // A good deal is <75% of base price
        if (bestPlanetId && minBuyPrice < good.basePrice * 0.75) {
            bestBuyPlanets.add(bestPlanetId);
        }
    });

    return { bestSellPlanets, bestBuyPlanets };
  }, [galaxy.planets, galaxy.goods, player.ship.cargo.items, player.currentPlanetId]);


  const handleTravel = (planetId: string) => {
    if (planetId !== player.currentPlanetId) {
      actions.travelTo(planetId);
      setSelectedPlanetId(null);
    }
  };

  const currentPlanetForLines = galaxy.planets.find(p => p.id === (player.isTraveling ? player.travelInfo?.originPlanetId : player.currentPlanetId));
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
        
        {/* Hyperspace Lanes */}
        {currentPlanetForLines && galaxy.planets.map(planet => {
          if (planet.id === currentPlanetForLines.id) return null;
          return (
            <g key={`lane-${planet.id}`}>
                <line
                  x1={currentPlanetForLines.position.x}
                  y1={currentPlanetForLines.position.y}
                  x2={planet.position.x}
                  y2={planet.position.y}
                  stroke="#58A6FF"
                  strokeWidth="5"
                  className="opacity-[0.08]"
                />
                <line
                  x1={currentPlanetForLines.position.x}
                  y1={currentPlanetForLines.position.y}
                  x2={planet.position.x}
                  y2={planet.position.y}
                  stroke="#C9D1D9"
                  strokeWidth="1"
                  className="opacity-25"
                />
            </g>
          );
        })}

        {/* Player ship trajectory */}
        {player.isTraveling && player.travelInfo && (() => {
            const origin = galaxy.planets.find(p => p.id === player.travelInfo!.originPlanetId);
            const destination = galaxy.planets.find(p => p.id === player.travelInfo!.destinationPlanetId);
            if (!origin || !destination) return null;
            return (
                <line
                    x1={origin.position.x}
                    y1={origin.position.y}
                    x2={destination.position.x}
                    y2={destination.position.y}
                    stroke="#F85149"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                    className="opacity-90"
                />
            )
        })()}

        {/* Planets */}
        {galaxy.planets.map(planet => {
          const isCurrent = player.currentPlanetId === planet.id;
          const isHovered = hoveredPlanetId === planet.id;
          const radius = isCurrent ? 12 : 8;
          const isBestSell = marketOpportunities.bestSellPlanets.has(planet.id);
          const isBestBuy = marketOpportunities.bestBuyPlanets.has(planet.id);
          
          return (
            <g
              key={planet.id}
              transform={`translate(${planet.position.x}, ${planet.position.y})`}
              onClick={() => setSelectedPlanetId(planet.id)}
              onMouseEnter={() => setHoveredPlanetId(planet.id)}
              onMouseLeave={() => setHoveredPlanetId(null)}
              className="cursor-pointer"
            >
              {isBestSell && (
                <circle r={radius + 6} fill="none" stroke="#3FB950" strokeWidth="2" className="animate-glow-ring pointer-events-none" />
              )}
              {isBestBuy && !isBestSell && (
                <circle r={radius + 6} fill="none" stroke="#E3B341" strokeWidth="2" className="animate-glow-ring pointer-events-none" />
              )}
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
        <Ship player={player} galaxy={galaxy} />
      </svg>
      <div className="absolute top-4 left-4 p-2 bg-space-panel/80 rounded border border-space-border">
          <h3 className="font-orbitron text-lg">Galaxy Map</h3>
          <p className="text-sm text-space-text-secondary">{galaxy.name} Galaxy</p>
      </div>

      {/* Planet Info Panel */}
      {selectedPlanet && (
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
            <div className="flex justify-between"><span>Distance:</span> <span className="font-mono">{Math.round(calculateDistance(currentPlanetForLines?.position || selectedPlanet.position, selectedPlanet.position))} units</span></div>
            <div className="flex justify-between"><span>Est. Fuel Cost:</span> <span className="font-mono">{Math.round(calculateDistance(currentPlanetForLines?.position || selectedPlanet.position, selectedPlanet.position) / 10)}cr</span></div>
            <div className="flex justify-between"><span>Arrival Tax:</span> <span className="font-mono">{(selectedPlanet.taxRate * 100).toFixed(0)}% ({Math.round(player.credits * selectedPlanet.taxRate)}cr)</span></div>
          </div>
          <div className="p-4 bg-space-dark/50 rounded-b-lg">
            {selectedPlanet.id === player.currentPlanetId ? (
              <p className="text-center text-accent-green font-semibold">You are currently orbiting this planet.</p>
            ) : (
              <button 
                onClick={() => handleTravel(selectedPlanet.id)}
                disabled={player.isTraveling}
                className="w-full bg-accent-blue/20 text-accent-blue px-4 py-2 rounded-md hover:bg-accent-blue/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {player.isTraveling ? 'In Transit...' : `Travel to ${selectedPlanet.name}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};