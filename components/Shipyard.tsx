
import React, { useState } from 'react';
import type { Planet } from '../types';
import { useGame } from '../contexts/GameContext';
import { Icon } from './icons';
import { UPGRADE_CONSTANTS } from '../constants';

interface ShipyardProps {
  planet: Planet;
}

export const Shipyard: React.FC<ShipyardProps> = ({ planet }) => {
    const { gameState, actions } = useGame();
    const [repairAmount, setRepairAmount] = useState(10);

    if (!gameState) return null;
    
    const { player } = gameState;

    const handleRepair = () => {
        const amountToRepair = Math.min(repairAmount, player.ship.maxDurability - player.ship.durability);
        if (amountToRepair > 0) {
            actions.repairShip(amountToRepair);
        } else if (player.ship.durability >= player.ship.maxDurability) {
            actions.repairShip(0); // This will trigger the "already full" message from gameLogic
        }
    }

    const maxRepair = player.ship.maxDurability - player.ship.durability;
    const durabilityPercentage = player.ship.maxDurability > 0 ? (player.ship.durability / player.ship.maxDurability) * 100 : 0;

    return (
        <div className="bg-space-panel border border-space-border rounded-lg p-6">
            <h3 className="text-xl font-orbitron mb-4 text-white">Planetary Shipyard</h3>
            <div className="space-y-6">
                <div>
                    <h4 className="text-lg font-bold text-accent-green mb-2">Ship Repair</h4>
                    <p className="text-space-text-secondary mb-4">Repair your ship's durability. (Cost: 10 Credits / point)</p>
                    <p className="mb-2">Current Durability: <span className="font-bold">{player.ship.durability} / {player.ship.maxDurability} ({durabilityPercentage.toFixed(0)}%)</span></p>
                    
                    <div>
                        <label htmlFor="repair-amount" className="block text-sm font-medium text-space-text-secondary">Repair Amount (Max: {maxRepair})</label>
                        <div className="mt-1 flex gap-2">
                            <input
                                id="repair-amount"
                                type="number"
                                value={repairAmount}
                                onChange={(e) => setRepairAmount(Math.max(1, Math.min(maxRepair, parseInt(e.target.value, 10) || 1)))}
                                disabled={maxRepair <= 0}
                                className="block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm disabled:opacity-50"
                            />
                            <button 
                                onClick={handleRepair}
                                disabled={maxRepair <= 0}
                                className="bg-accent-green/20 text-accent-green px-4 py-2 rounded-md hover:bg-accent-green/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Repair Ship
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="border-t border-space-border pt-6">
                    <h4 className="text-lg font-bold text-accent-yellow mb-4">Ship Upgrades</h4>
                    <div className="space-y-4">
                        <UpgradeCard
                            name="Cargo Hold"
                            level={player.ship.upgrades.cargo}
                            currentValue={`${player.ship.cargo.capacity} units`}
                            upgradeType="cargo"
                            playerCredits={player.credits}
                        />
                        <UpgradeCard
                            name="Hull Durability"
                            level={player.ship.upgrades.durability}
                            currentValue={`${player.ship.maxDurability} HP`}
                            upgradeType="durability"
                            playerCredits={player.credits}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};


interface UpgradeCardProps {
    name: string;
    level: number;
    currentValue: string;
    upgradeType: 'cargo' | 'durability';
    playerCredits: number;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({ name, level, currentValue, upgradeType, playerCredits }) => {
    const { actions } = useGame();
    
    const constants = upgradeType === 'cargo' ? UPGRADE_CONSTANTS.CARGO : UPGRADE_CONSTANTS.DURABILITY;
    
    const isMaxLevel = level >= constants.MAX_LEVEL;
    const upgradeCost = isMaxLevel ? 0 : Math.floor(constants.BASE_COST * Math.pow(constants.COST_MULTIPLIER, level - 1));
    const canAfford = playerCredits >= upgradeCost;
    
    const nextValue = `+${constants.PER_LEVEL}`;

    return (
        <div className="bg-space-dark/50 p-4 rounded-lg border border-space-border">
            <div className="flex justify-between items-center">
                <div>
                    <h5 className="font-bold text-white">{name}</h5>
                    <p className="text-sm text-space-text-secondary">Level {level} &bull; Current: {currentValue}</p>
                </div>
                {isMaxLevel ? (
                    <span className="px-4 py-2 text-sm font-semibold text-accent-green bg-accent-green/10 rounded-md">Max Level</span>
                ) : (
                    <button
                        onClick={() => actions.upgradeShip(upgradeType)}
                        disabled={!canAfford}
                        className="bg-accent-blue/20 text-accent-blue px-4 py-2 rounded-md hover:bg-accent-blue/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Upgrade ({upgradeCost}cr)
                    </button>
                )}
            </div>
             {!isMaxLevel && (
                <div className="mt-2 text-sm text-accent-green">
                    Next Level: {nextValue}
                </div>
            )}
        </div>
    );
}
