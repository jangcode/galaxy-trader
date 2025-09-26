
import React, { useState } from 'react';
import type { Planet } from '../types';
import { Market } from './Market';
import { useGame } from '../contexts/GameContext';
import { Icon } from './icons';

interface CurrentPlanetViewProps {
  planet: Planet;
}

export const CurrentPlanetView: React.FC<CurrentPlanetViewProps> = ({ planet }) => {
    const { actions } = useGame();
    const [repairAmount, setRepairAmount] = useState(10);

    const handleRepair = () => {
        actions.repairShip(repairAmount);
    }

    return (
        <div className="animate-slide-in p-4 md:p-8" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <div className="bg-space-panel border border-space-border rounded-lg p-6 mb-8">
                <h2 className="text-3xl font-orbitron text-accent-blue">{planet.name}</h2>
                <p className="text-space-text-secondary mt-2">{planet.description}</p>
                <p className="text-sm mt-2 text-accent-yellow">Arrival Tax: {(planet.taxRate * 100).toFixed(0)}%</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Market planet={planet} />
                </div>
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-space-panel border border-space-border rounded-lg p-6">
                        <h3 className="text-xl font-orbitron mb-4 text-accent-green">Ship Services</h3>
                        <div className="space-y-4">
                            <p className="text-space-text-secondary">Repair your ship's durability. (Cost: 10 Credits / point)</p>
                             <div>
                                <label htmlFor="repair-amount" className="block text-sm font-medium text-space-text-secondary">Repair Amount</label>
                                <input
                                    id="repair-amount"
                                    type="number"
                                    value={repairAmount}
                                    onChange={(e) => setRepairAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="mt-1 block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm"
                                />
                            </div>
                            <button 
                                onClick={handleRepair}
                                className="w-full bg-accent-green/20 text-accent-green px-4 py-2 rounded-md hover:bg-accent-green/40 transition-colors flex items-center justify-center gap-2"
                            >
                                Repair Ship
                            </button>
                        </div>
                    </div>
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