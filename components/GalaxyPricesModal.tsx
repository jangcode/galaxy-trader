
import React from 'react';
import { useGame } from '../contexts/GameContext';
import { Icon } from './icons';

interface GalaxyPricesModalProps {
  onClose: () => void;
}

export const GalaxyPricesModal: React.FC<GalaxyPricesModalProps> = ({ onClose }) => {
  const { gameState } = useGame();

  if (!gameState) return null;
  
  const { galaxy } = gameState;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-space-panel rounded-lg shadow-xl w-full max-w-4xl m-4 border border-space-border flex flex-col h-[90vh]">
        <div className="p-4 border-b border-space-border flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-orbitron text-accent-blue">Galaxy Market Prices</h2>
          <button onClick={onClose} className="text-space-text-secondary hover:text-white">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 overflow-auto">
          <table className="w-full text-left table-fixed">
            <thead className="sticky top-0 bg-space-panel">
              <tr className="border-b border-space-border">
                <th className="p-3 font-semibold text-white w-1/4">Good</th>
                {galaxy.planets.map(planet => (
                  <th key={planet.id} className="p-3 font-semibold text-white text-center w-1/4" colSpan={2}>{planet.name}</th>
                ))}
              </tr>
              <tr className="bg-space-dark text-sm text-space-text-secondary">
                  <th className="p-2"></th>
                  {galaxy.planets.map(planet => (
                      <React.Fragment key={planet.id}>
                        <th className="p-2 text-right font-normal">Buy</th>
                        <th className="p-2 text-right font-normal">Sell</th>
                      </React.Fragment>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-space-border">
              {galaxy.goods.map(good => {
                 const prices = galaxy.planets.map(planet => {
                    const marketGood = planet.market.find(mg => mg.goodId === good.id);
                    return {
                        buy: marketGood?.buyPrice,
                        sell: marketGood?.sellPrice
                    };
                 });
                 const minBuyPrice = Math.min(...prices.map(p => p.buy || Infinity));
                 const maxSellPrice = Math.max(...prices.map(p => p.sell || -Infinity));

                return (
                  <tr key={good.id} className="hover:bg-space-dark/50">
                    <td className="p-3 font-medium">{good.name}</td>
                     {galaxy.planets.map((planet, index) => {
                         const marketGood = planet.market.find(mg => mg.goodId === good.id);
                         return (
                            <React.Fragment key={planet.id}>
                                <td className={`p-3 text-right font-mono ${marketGood?.buyPrice === minBuyPrice ? 'text-accent-green' : 'text-accent-yellow'}`}>
                                    {marketGood?.buyPrice || 'N/A'}
                                </td>
                                <td className={`p-3 text-right font-mono ${marketGood?.sellPrice === maxSellPrice ? 'text-accent-green' : 'text-space-text-secondary'}`}>
                                    {marketGood?.sellPrice || 'N/A'}
                                </td>
                            </React.Fragment>
                         )
                     })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
