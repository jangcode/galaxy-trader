
import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../contexts/GameContext';
import { Icon } from './icons';

export const AutoBotView: React.FC = () => {
  const { gameState, actions } = useGame();
  
  if (!gameState) return null;

  const { autoBotState } = gameState;

  if (autoBotState?.isActive) {
    return <AutoBotStatus />;
  }
  
  return <AutoBotConfiguration />;
};

const AutoBotConfiguration: React.FC = () => {
    const { gameState, actions } = useGame();
    const [selectedGoodId, setSelectedGoodId] = useState('');
    const [quantity, setQuantity] = useState(10);
    const [destinationPlanetId, setDestinationPlanetId] = useState('');
    const [durationInMinutes, setDurationInMinutes] = useState(5);
    
    if (!gameState || !gameState.player.currentPlanetId) {
        return (
            <div className="animate-slide-in p-4 md:p-8 text-center">
                <h2 className="text-3xl font-orbitron text-accent-yellow mb-6">AutoBot Control</h2>
                <p className="text-space-text-secondary">You must be docked at a planet to configure the AutoBot.</p>
            </div>
        )
    }

    const currentPlanet = gameState.galaxy.planets.find(p => p.id === gameState.player.currentPlanetId);
    if (!currentPlanet) return null; // Should not happen if currentPlanetId is set

    const availableGoods = currentPlanet.market.map(mg => gameState.galaxy.goods.find(g => g.id === mg.goodId)).filter(Boolean);
    const destinationPlanets = gameState.galaxy.planets.filter(p => p.id !== currentPlanet.id);
    
    useEffect(() => {
        if(availableGoods.length > 0 && !selectedGoodId) {
            setSelectedGoodId(availableGoods[0]!.id);
        }
        if(destinationPlanets.length > 0 && !destinationPlanetId) {
            setDestinationPlanetId(destinationPlanets[0].id);
        }
    }, [availableGoods, destinationPlanets, selectedGoodId, destinationPlanetId]);

    const handleStart = () => {
        if (!selectedGoodId || !destinationPlanetId || quantity <= 0 || durationInMinutes <= 0) {
            alert('Please configure all options correctly.');
            return;
        }
        actions.startAutoBot({
            goodId: selectedGoodId,
            tradeQuantity: quantity,
            destinationPlanetId,
            durationInMinutes,
        });
    };
    
    const isValid = selectedGoodId && destinationPlanetId && quantity > 0 && durationInMinutes > 0;

    return (
         <div className="animate-slide-in p-4 md:p-8">
            <h2 className="text-3xl font-orbitron text-accent-blue mb-6">AutoBot Configuration</h2>
            <div className="max-w-4xl mx-auto bg-space-panel border border-space-border rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Panel: Buy Configuration */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-orbitron text-accent-yellow">Step 1: Buy Settings</h3>
                        <div>
                            <label className="block text-sm font-medium text-space-text-secondary">Buy From (Current Planet)</label>
                            <div className="mt-1 p-2 bg-space-dark border border-space-border rounded-md text-white">{currentPlanet.name}</div>
                        </div>
                        <div>
                            <label htmlFor="good" className="block text-sm font-medium text-space-text-secondary">Good to Purchase</label>
                            <select id="good" value={selectedGoodId} onChange={e => setSelectedGoodId(e.target.value)} className="mt-1 block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm">
                                {availableGoods.map(good => good && <option key={good.id} value={good.id}>{good.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-space-text-secondary">Buy Quantity Per Trip</label>
                            <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="mt-1 block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm" />
                            <p className="text-xs text-space-text-secondary mt-1">Bot will attempt to buy up to this amount, limited by cargo space and credits.</p>
                        </div>
                    </div>
                    {/* Right Panel: Sell & Duration */}
                    <div className="space-y-4">
                         <h3 className="text-xl font-orbitron text-accent-yellow">Step 2: Sell & Duration</h3>
                         <div>
                            <label htmlFor="destination" className="block text-sm font-medium text-space-text-secondary">Sell To Planet</label>
                            <select id="destination" value={destinationPlanetId} onChange={e => setDestinationPlanetId(e.target.value)} className="mt-1 block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm">
                                {destinationPlanets.map(planet => <option key={planet.id} value={planet.id}>{planet.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-space-text-secondary">Mission Duration (minutes)</label>
                            <input type="number" id="duration" value={durationInMinutes} onChange={e => setDurationInMinutes(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="mt-1 block w-full bg-space-dark border border-space-border rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-accent-blue focus:border-accent-blue sm:text-sm" />
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-space-border text-center">
                    <button onClick={handleStart} disabled={!isValid} className="bg-accent-blue/20 text-accent-blue px-8 py-3 rounded-md hover:bg-accent-blue/40 transition-colors text-lg font-orbitron disabled:opacity-50 disabled:cursor-not-allowed">
                        Start AutoBot
                    </button>
                </div>
            </div>
        </div>
    );
};

const AutoBotStatus: React.FC = () => {
    const { gameState, actions } = useGame();
    const [timeLeft, setTimeLeft] = useState('');
    const logContainerRef = useRef<HTMLDivElement>(null);
    
    const autoBotState = gameState?.autoBotState;

    useEffect(() => {
        if (!autoBotState) return;
        const interval = setInterval(() => {
            const endTime = new Date(autoBotState.endTime).getTime();
            const now = new Date().getTime();
            const distance = endTime - now;
            if(distance < 0) {
                setTimeLeft("Mission Complete");
                clearInterval(interval);
                return;
            }
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
        }, 1000);
        return () => clearInterval(interval);
    }, [autoBotState]);
    
     useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [autoBotState?.logs]);

    if (!autoBotState) return null;

    const getStatusText = (task: typeof autoBotState.currentTask) => {
        switch(task) {
            case 'BUYING': return `Purchasing goods at ${autoBotState.originPlanetId}...`;
            case 'SELLING': return `Selling goods at ${autoBotState.destinationPlanetId}...`;
            case 'TRAVELING_TO_BUY': return `Returning to ${autoBotState.originPlanetId} to buy...`;
            case 'TRAVELING_TO_SELL': return `Traveling to ${autoBotState.destinationPlanetId} to sell...`;
            default: return "Idle...";
        }
    }

    return (
        <div className="animate-slide-in p-4 md:p-8">
            <h2 className="text-3xl font-orbitron text-accent-green mb-6">AutoBot Active</h2>
            <div className="max-w-4xl mx-auto bg-space-panel border border-space-border rounded-lg p-6">
                <div className="grid md:grid-cols-3 gap-4 mb-4 text-center">
                    <div className="bg-space-dark p-3 rounded">
                        <p className="text-sm text-space-text-secondary">Time Remaining</p>
                        <p className="text-xl font-orbitron">{timeLeft}</p>
                    </div>
                    <div className="bg-space-dark p-3 rounded md:col-span-2">
                        <p className="text-sm text-space-text-secondary">Current Status</p>
                        <p className="text-xl font-orbitron">{getStatusText(autoBotState.currentTask)}</p>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-orbitron text-accent-yellow mb-2">Activity Log</h3>
                    <div ref={logContainerRef} className="h-64 bg-space-dark border border-space-border rounded p-2 overflow-y-auto font-mono text-sm text-space-text-secondary">
                        {autoBotState.logs.map((log, index) => (
                            <p key={index}>{log}</p>
                        ))}
                    </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-space-border text-center">
                    <button onClick={() => actions.stopAutoBot()} className="bg-accent-red/20 text-accent-red px-8 py-3 rounded-md hover:bg-accent-red/40 transition-colors text-lg font-orbitron">
                        Stop AutoBot
                    </button>
                </div>
            </div>
        </div>
    );
}
