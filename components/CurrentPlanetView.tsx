
import React, { useState } from 'react';
import type { Planet } from '../types';
import { Market } from './Market';
import { Shipyard } from './Shipyard';
import { useGame } from '../contexts/GameContext';
import { Icon } from './icons';

interface CurrentPlanetViewProps {
  planet: Planet;
}

export const CurrentPlanetView: React.FC<CurrentPlanetViewProps> = ({ planet }) => {
    const [activeTab, setActiveTab] = useState<'market' | 'shipyard'>('market');

    return (
        <div className="animate-slide-in p-4 md:p-8" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <div className="bg-space-panel border border-space-border rounded-lg p-6 mb-6">
                <h2 className="text-3xl font-orbitron text-accent-blue">{planet.name}</h2>
                <p className="text-space-text-secondary mt-2">{planet.description}</p>
                <p className="text-sm mt-2 text-accent-yellow">Arrival Tax: {(planet.taxRate * 100).toFixed(0)}%</p>
            </div>

            <div className="mb-6">
                <div className="border-b border-space-border">
                    <nav className="-mb-px flex space-x-6">
                        <button
                            onClick={() => setActiveTab('market')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'market' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-space-text-secondary hover:text-white hover:border-space-text-secondary'}`}
                        >
                            Market
                        </button>
                        <button
                            onClick={() => setActiveTab('shipyard')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === 'shipyard' ? 'border-accent-blue text-accent-blue' : 'border-transparent text-space-text-secondary hover:text-white hover:border-space-text-secondary'}`}
                        >
                            Shipyard
                        </button>
                    </nav>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    {activeTab === 'market' && <Market planet={planet} />}
                    {activeTab === 'shipyard' && <Shipyard planet={planet} />}
                </div>
                <div className="md:col-span-1 space-y-6">
                     <div className="bg-space-panel border border-space-border rounded-lg p-6">
                        <h3 className="text-xl font-orbitron mb-4 text-accent-yellow">My Cargo</h3>
                         <MyCargo />
                    </div>
                </div>
            </div>
        </div>
    );
};


const MyCargo: React.FC = () => {
    const { gameState } = useGame();
    if (!gameState) return null;

    const { player: { ship }, galaxy } = gameState;

    if (ship.cargo.items.length === 0) {
        return <p className="text-space-text-secondary italic">Cargo hold is empty.</p>;
    }

    return (
        <ul className="space-y-2">
            {ship.cargo.items.map(item => {
                const good = galaxy.goods.find(g => g.id === item.goodId);
                return (
                    <li key={item.goodId} className="flex justify-between items-center text-space-text">
                        <span>{good?.name || 'Unknown Good'}</span>
                        <span className="font-bold">{item.quantity}</span>
                    </li>
                );
            })}
        </ul>
    );
}
