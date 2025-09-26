import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { GameState, NotificationMessage, NotificationType, PlayerState } from '../types';
import * as gameLogic from '../services/gameLogic';
import { MARKET_UPDATE_INTERVAL } from '../constants';

interface GameContextType {
  gameState: GameState | null;
  isLoading: boolean;
  notifications: NotificationMessage[];
  addNotification: (message: string, type?: NotificationType) => void;
  actions: {
    travelTo: (planetId: string) => void;
    buyGood: (goodId: string, quantity: number) => void;
    sellGood: (goodId: string, quantity: number) => void;
    repairShip: (amount: number) => void;
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const newNotification = { id: Date.now(), message, type };
    setNotifications(prev => [newNotification, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  useEffect(() => {
    const { state, isNewGame } = gameLogic.loadGame();
    setGameState(state);
    setIsLoading(false);
    if (isNewGame) {
      // Use a small timeout to allow the main UI to render first.
      setTimeout(() => {
        addNotification('Welcome to Galaxy Trader! A new journey begins.', 'info');
      }, 500);
    }
  }, [addNotification]);

  useEffect(() => {
    if (gameState) {
      gameLogic.saveGame(gameState);
    }
  }, [gameState]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prevState => {
        if (!prevState) return null;
        return gameLogic.updateMarketPrices(prevState);
      });
    }, MARKET_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);
  
  const handleAction = useCallback(<T,>(
    actionFn: (state: GameState, ...args: T[]) => { newState?: GameState; message: string; success: boolean },
    ...args: T[]
  ) => {
    setGameState(prevState => {
      if (!prevState) return null;
      const result = actionFn(prevState, ...args);
      if (result.success && result.newState) {
        addNotification(result.message, 'success');
        return result.newState;
      } else {
        addNotification(result.message, 'error');
        return prevState;
      }
    });
  }, [addNotification]);
  
  const actions = {
    travelTo: useCallback((planetId: string) => handleAction(gameLogic.travelTo, planetId), [handleAction]),
    buyGood: useCallback((goodId: string, quantity: number) => handleAction(gameLogic.buyGood, goodId, quantity), [handleAction]),
    sellGood: useCallback((goodId: string, quantity: number) => handleAction(gameLogic.sellGood, goodId, quantity), [handleAction]),
    repairShip: useCallback((amount: number) => handleAction(gameLogic.repairShip, amount), [handleAction]),
  };

  return (
    <GameContext.Provider value={{ gameState, isLoading, notifications, addNotification, actions }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};