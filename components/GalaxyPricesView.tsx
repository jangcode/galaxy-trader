
import React from 'react';
import { useGame } from '../contexts/GameContext';

export const GalaxyPricesView: React.FC = () => {
  const { gameState } = useGame();

  if (!gameState) return null;
  
  const { galaxy } = gameState;

  return (
    <div className="animate-slide-in p-4 md:p-8" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
        <h2 className="text-3xl font-orbitron text-accent-blue mb-6">Galaxy Market Prices</h2>
        <div className="bg-space-panel border border-space-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-space-dark/50">
                    <tr className="border-b border-space-border">
                        <th className="p-3 font-semibold text-white w-1/4">Good</th>
                        {galaxy.planets.map(planet => (
                        <th key={planet.id} className="p-3 font-semibold text-white text-center" colSpan={2}>{planet.name}</th>
                        ))}
                    </tr>
                    <tr className="bg-space-dark text-sm text-space-text-secondary uppercase">
                        <th className="p-2 font-normal"></th>
                        {galaxy.planets.map(planet => (
                            <React.Fragment key={`${planet.id}-sub`}>
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
                            {galaxy.planets.map((planet) => {
                                const marketGood = planet.market.find(mg => mg.goodId === good.id);
                                return (
                                    <React.Fragment key={planet.id}>
                                        <td className={`p-3 text-right font-mono ${marketGood?.buyPrice === minBuyPrice ? 'text-accent-green font-bold' : 'text-accent-yellow'}`}>
                                            {marketGood?.buyPrice || '–'}
                                        </td>
                                        <td className={`p-3 text-right font-mono ${marketGood?.sellPrice === maxSellPrice ? 'text-accent-green font-bold' : 'text-space-text'}`}>
                                            {marketGood?.sellPrice || '–'}
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
