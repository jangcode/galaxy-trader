
import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { Icon } from './icons';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  goodId: string;
  goodName: string;
  price: number;
  maxQuantity: number;
}

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, type, goodId, goodName, price, maxQuantity }) => {
  const [quantity, setQuantity] = useState(1);
  const { actions } = useGame();

  useEffect(() => {
    if (isOpen) {
      setQuantity(maxQuantity > 0 ? 1 : 0);
    }
  }, [isOpen, maxQuantity]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (quantity > 0) {
      if (type === 'buy') {
        actions.buyGood(goodId, quantity);
      } else {
        actions.sellGood(goodId, quantity);
      }
    }
    onClose();
  };

  const totalCost = quantity * price;
  const isBuy = type === 'buy';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-space-panel rounded-lg shadow-xl w-full max-w-md m-4 border border-space-border">
        <div className="p-6 border-b border-space-border flex justify-between items-center">
          <h2 className="text-2xl font-orbitron capitalize text-white">{type} {goodName}</h2>
          <button onClick={onClose} className="text-space-text-secondary hover:text-white">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center text-lg">
            <span className="text-space-text-secondary">Price per unit:</span>
            <span className="font-mono text-white">{price}cr</span>
          </div>
          <div className="flex justify-between items-center text-lg">
            <span className="text-space-text-secondary">Max quantity:</span>
            <span className="font-mono text-white">{maxQuantity}</span>
          </div>
          
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-space-text-secondary">Quantity</label>
            <input
              id="quantity"
              type="range"
              min="0"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-space-dark rounded-lg appearance-none cursor-pointer mt-2"
              disabled={maxQuantity === 0}
            />
            <div className="flex justify-between text-xs text-space-text-secondary mt-1">
                <span>0</span>
                <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, Math.min(maxQuantity, parseInt(e.target.value, 10) || 0)))}
                    className="w-20 text-center bg-space-dark border border-space-border rounded text-white"
                    disabled={maxQuantity === 0}
                />
                <span>{maxQuantity}</span>
            </div>
          </div>

          <div className={`p-4 rounded-md text-xl font-orbitron text-center ${isBuy ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-green/10 text-accent-green'}`}>
            Total: {totalCost.toLocaleString()} Credits
          </div>
        </div>

        <div className="p-6 bg-space-dark/50 rounded-b-lg flex justify-end">
          <button
            onClick={handleConfirm}
            disabled={quantity === 0 || maxQuantity === 0}
            className={`px-6 py-2 rounded-md font-bold text-white transition-colors capitalize ${isBuy ? 'bg-accent-blue hover:bg-accent-blue/80' : 'bg-accent-green hover:bg-accent-green/80'} disabled:bg-space-border disabled:cursor-not-allowed`}
          >
            Confirm {type}
          </button>
        </div>
      </div>
    </div>
  );
};
