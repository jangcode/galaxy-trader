
import React, { useState } from 'react';
import type { Planet } from '../types';
import { useGame } from '../contexts/GameContext';
import { TradeModal } from './TradeModal';

interface MarketProps {
  planet: Planet;
}

type TradeDetails = {
  type: 'buy' | 'sell';
  goodId: string;
  goodName: string;
  price: number;
  maxQuantity: number;
}

export const Market: React.FC<MarketProps> = ({ planet }) => {
  const { gameState } = useGame();
  const [tradeDetails, setTradeDetails] = useState<TradeDetails | null>(null);

  if (!gameState) return null;

  const getCargoQuantity = (goodId: string) => {
    return gameState.player.ship.cargo.items.find(item => item.goodId === goodId)?.quantity || 0;
  };
  
  const currentCargoLoad = gameState.player.ship.cargo.items.reduce((sum, item) => sum + item.quantity, 0);
  const freeCargoSpace = gameState.player.ship.cargo.capacity - currentCargoLoad;

  const handleOpenTradeModal = (type: 'buy' | 'sell', goodId: string, goodName: string, price: number) => {
    if (type === 'buy') {
        const maxAffordable = Math.floor(gameState.player.credits / price);
        setTradeDetails({ type, goodId, goodName, price, maxQuantity: Math.min(maxAffordable, freeCargoSpace) });
    } else {
        setTradeDetails({ type, goodId, goodName, price, maxQuantity: getCargoQuantity(goodId) });
    }
  };

  return (
    <div className="bg-space-panel border border-space-border rounded-lg">
      <h3 className="text-xl font-orbitron p-4 border-b border-space-border text-white">Planetary Market</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-space-dark/50 text-sm text-space-text-secondary">
            <tr>
              <th className="p-4 font-semibold">Good</th>
              <th className="p-4 font-semibold text-center">In Cargo</th>
              <th className="p-4 font-semibold text-right">Buy Price</th>
              <th className="p-4 font-semibold text-right">Sell Price</th>
              <th className="p-4 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-space-border">
            {planet.market.map(marketGood => {
              const good = gameState.galaxy.goods.find(g => g.id === marketGood.goodId);
              if (!good) return null;

              const cargoQty = getCargoQuantity(good.id);
              
              return (
                <tr key={good.id} className="hover:bg-space-dark/50">
                  <td className="p-4 font-medium">{good.name}</td>
                  <td className="p-4 text-center text-space-text-secondary">{cargoQty}</td>
                  <td className="p-4 text-right text-accent-yellow font-mono">{marketGood.buyPrice}cr</td>
                  <td className="p-4 text-right text-accent-green font-mono">{marketGood.sellPrice}cr</td>
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => handleOpenTradeModal('buy', good.id, good.name, marketGood.buyPrice)}
                        className="px-3 py-1 text-sm bg-accent-blue/20 text-accent-blue rounded hover:bg-accent-blue/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={marketGood.buyPrice > gameState.player.credits || freeCargoSpace <= 0}
                      >
                        Buy
                      </button>
                      <button 
                        onClick={() => handleOpenTradeModal('sell', good.id, good.name, marketGood.sellPrice)}
                        className="px-3 py-1 text-sm bg-accent-green/20 text-accent-green rounded hover:bg-accent-green/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={cargoQty <= 0}
                      >
                        Sell
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tradeDetails && (
        <TradeModal 
          isOpen={!!tradeDetails}
          onClose={() => setTradeDetails(null)}
          {...tradeDetails}
        />
      )}
    </div>
  );
};
