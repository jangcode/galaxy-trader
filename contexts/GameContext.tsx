
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { GameState, NotificationMessage, NotificationType, PlayerState, AutoBotState, Planet } from '../types';
import * as gameLogic from '../services/gameLogic';
import { MARKET_UPDATE_INTERVAL, SAVE_GAME_KEY, AUTOSAVE_INTERVAL } from '../constants';

interface GameContextType {
  gameState: GameState | null;
  isLoading: boolean;
  isProcessing: boolean;
  notifications: NotificationMessage[];
  addNotification: (message: string, type?: NotificationType) => void;
  actions: {
    travelTo: (planetId: string) => void;
    buyGood: (goodId: string, quantity: number) => void;
    sellGood: (goodId: string, quantity: number) => void;
    repairShip: (amount: number) => void;
    upgradeShip: (upgradeType: 'cargo' | 'durability') => void;
    saveGame: () => void;
    loadGame: () => void;
    newGame: () => void;
    startAutoBot: (config: Omit<AutoBotState, 'isActive' | 'startTime' | 'endTime' | 'currentTask' | 'logs' | 'originPlanetId'> & {durationInMinutes: number}) => void;
    stopAutoBot: () => void;
    addPlanet: (planetData: Omit<Planet, 'id' | 'position' | 'market'>) => Promise<void>;
    updatePlanet: (planetData: Omit<Planet, 'position' | 'market'>) => Promise<void>;
    deletePlanet: (planetId: string) => void;
  };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
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
    const autoSaveNotifyInterval = setInterval(() => {
      // The game is saved on every state change; this is a periodic notification for user feedback.
      addNotification('Game auto-saved!', 'info');
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(autoSaveNotifyInterval);
  }, [addNotification]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prevState => {
        if (!prevState || prevState.autoBotState?.isActive) return prevState; // Pause market updates while bot is active
        return gameLogic.updateMarketPrices(prevState);
      });
    }, MARKET_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    // This effect handles travel completion
    const travelInterval = setInterval(() => {
      if (gameState?.player.isTraveling) {
        const newState = gameLogic.completeTravel(gameState);
        if (newState) {
          const destinationPlanet = newState.galaxy.planets.find(p => p.id === newState.player.currentPlanetId);
          addNotification(`Arrived at ${destinationPlanet?.name || 'destination'}.`, 'success');
          setGameState(newState);
        }
      }
    }, 250);

    return () => clearInterval(travelInterval);
  }, [gameState, addNotification]);
  
  // AutoBot Logic
  const runAutoBotLogic = useCallback(() => {
    setGameState(prevState => {
      if (!prevState?.autoBotState?.isActive || prevState.player.isTraveling) {
        return prevState;
      }

      let newState: GameState = JSON.parse(JSON.stringify(prevState));
      const { autoBotState } = newState;

      // Check end time
      if (new Date().getTime() > new Date(autoBotState.endTime).getTime()) {
        addNotification('AutoBot finished its mission.', 'info');
        newState.autoBotState = null;
        return newState;
      }

      const log = (message: string) => {
        const logMessage = `[${new Date().toLocaleTimeString()}] ${message}`;
        if (newState.autoBotState) {
          newState.autoBotState.logs.push(logMessage);
          if (newState.autoBotState.logs.length > 50) {
            newState.autoBotState.logs.shift();
          }
        }
      };

      // Task transition logic (on arrival)
      if (autoBotState.currentTask === 'TRAVELING_TO_SELL' && newState.player.currentPlanetId === autoBotState.destinationPlanetId) {
          log(`Arrived at ${autoBotState.destinationPlanetId} to sell.`);
          autoBotState.currentTask = 'SELLING';
          return newState; // Return early to process action on next tick
      } else if (autoBotState.currentTask === 'TRAVELING_TO_BUY' && newState.player.currentPlanetId === autoBotState.originPlanetId) {
          log(`Arrived at ${autoBotState.originPlanetId} to buy.`);
          autoBotState.currentTask = 'BUYING';
          return newState; // Return early to process action on next tick
      }
      
      // Action logic
      switch (autoBotState.currentTask) {
          case 'BUYING': {
              const goodToBuy = newState.galaxy.goods.find(g => g.id === autoBotState.goodId);
              const marketGood = newState.galaxy.planets.find(p => p.id === newState.player.currentPlanetId)?.market.find(m => m.goodId === autoBotState.goodId);

              if (!goodToBuy || !marketGood) {
                  log(`Error: Cannot buy ${autoBotState.goodId}. Stopping.`);
                  addNotification(`AutoBot stopped: good not available for purchase.`, 'error');
                  newState.autoBotState = null;
                  return newState;
              }
              
              const currentCargoLoad = newState.player.ship.cargo.items.reduce((sum, item) => sum + item.quantity, 0);
              const freeCargoSpace = newState.player.ship.cargo.capacity - currentCargoLoad;
              const maxAffordable = Math.floor(newState.player.credits / marketGood.buyPrice);
              const quantityToBuy = Math.min(autoBotState.tradeQuantity, freeCargoSpace, maxAffordable);
              
              if (quantityToBuy > 0) {
                   const result = gameLogic.buyGood(newState, autoBotState.goodId, quantityToBuy);
                   if (result.success && result.newState) {
                       log(`Bought ${quantityToBuy} ${goodToBuy.name}.`);
                       newState = result.newState;
                   }
              }

              log(`Traveling to ${autoBotState.destinationPlanetId} to sell.`);
              const travelResult = gameLogic.travelTo(newState, autoBotState.destinationPlanetId);
              if(travelResult.success && travelResult.newState) {
                  const finalState = travelResult.newState;
                  if (finalState.autoBotState) finalState.autoBotState.currentTask = 'TRAVELING_TO_SELL';
                  return finalState;
              } else {
                  log(`Failed to travel: ${travelResult.message}. Stopping Bot.`);
                  addNotification(`AutoBot stopped: ${travelResult.message}`, 'error');
                  newState.autoBotState = null;
                  return newState;
              }
          }

          case 'SELLING': {
              const cargoItem = newState.player.ship.cargo.items.find(item => item.goodId === autoBotState.goodId);
              if (cargoItem && cargoItem.quantity > 0) {
                  const result = gameLogic.sellGood(newState, autoBotState.goodId, cargoItem.quantity);
                  if (result.success && result.newState) {
                      const goodSold = newState.galaxy.goods.find(g => g.id === autoBotState.goodId);
                      log(`Sold ${cargoItem.quantity} ${goodSold?.name}.`);
                      newState = result.newState;
                  }
              }
              
              log(`Traveling to ${autoBotState.originPlanetId} to buy.`);
              const travelResult = gameLogic.travelTo(newState, autoBotState.originPlanetId);
              if(travelResult.success && travelResult.newState) {
                  const finalState = travelResult.newState;
                  if(finalState.autoBotState) finalState.autoBotState.currentTask = 'TRAVELING_TO_BUY';
                  return finalState;
              } else {
                  log(`Failed to travel: ${travelResult.message}. Stopping Bot.`);
                  addNotification(`AutoBot stopped: ${travelResult.message}`, 'error');
                  newState.autoBotState = null;
                  return newState;
              }
          }
      }

      return prevState; // No change
    });
  }, [addNotification]);

  useEffect(() => {
    const botInterval = setInterval(() => {
        if (gameState?.autoBotState?.isActive) {
            runAutoBotLogic();
        }
    }, 2000); // Run every 2 seconds
    return () => clearInterval(botInterval);
  }, [gameState?.autoBotState?.isActive, runAutoBotLogic]);


  const handleAction = useCallback(<T,>(
    actionFn: (state: GameState, ...args: T[]) => { newState?: GameState; message: string; success: boolean },
    ...args: T[]
  ) => {
    setGameState(prevState => {
      if (!prevState) return null;
      if (prevState.autoBotState?.isActive) {
        addNotification('Cannot perform manual actions while AutoBot is active.', 'error');
        return prevState;
      }
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

  const saveGameAction = useCallback(() => {
    if (gameState) {
      gameLogic.saveGame(gameState);
      addNotification('Game Saved!', 'success');
    }
  }, [gameState, addNotification]);

  const loadGameAction = useCallback(() => {
      const savedData = localStorage.getItem(SAVE_GAME_KEY);
      if (!savedData) {
          addNotification('No saved game found.', 'info');
          return;
      }
      // loadGame handles corrupt data by creating a new game and alerting.
      const { state } = gameLogic.loadGame();
      setGameState(state);
      addNotification('Game loaded successfully!', 'success');
  }, [addNotification]);
  
  const newGameAction = useCallback(() => {
      if (window.confirm('Are you sure you want to start a new game? This will overwrite your current save file.')) {
          const newGameState = gameLogic.startNewGame();
          setGameState(newGameState);
          addNotification('A new journey begins!', 'info');
      }
  }, [addNotification]);

  const startAutoBotAction = useCallback((config: Omit<AutoBotState, 'isActive' | 'startTime' | 'endTime' | 'currentTask' | 'logs' | 'originPlanetId'> & {durationInMinutes: number}) => {
    setGameState(prevState => {
        if (!prevState || !prevState.player.currentPlanetId) return prevState;

        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + config.durationInMinutes * 60 * 1000);

        const newAutoBotState: AutoBotState = {
            isActive: true,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            originPlanetId: prevState.player.currentPlanetId,
            destinationPlanetId: config.destinationPlanetId,
            goodId: config.goodId,
            tradeQuantity: config.tradeQuantity,
            currentTask: 'BUYING',
            logs: [`[${startTime.toLocaleTimeString()}] AutoBot initialized. Mission: Trade ${config.goodId} between ${prevState.player.currentPlanetId} and ${config.destinationPlanetId}.`],
        };

        addNotification(`AutoBot started for ${config.durationInMinutes} minutes!`, 'success');
        return { ...prevState, autoBotState: newAutoBotState };
    });
  }, [addNotification]);

  const stopAutoBotAction = useCallback(() => {
    setGameState(prevState => {
        if (!prevState || !prevState.autoBotState?.isActive) return prevState;
        addNotification('AutoBot manually stopped.', 'info');
        return { ...prevState, autoBotState: null };
    });
  }, [addNotification]);

  const addPlanetAction = async (planetData: Omit<Planet, 'id' | 'position' | 'market'>) => {
      if (!gameState) return;
      setIsProcessing(true);
      try {
        const result = await gameLogic.addPlanet(gameState, planetData);
        if (result.success && result.newState) {
            setGameState(result.newState);
            addNotification(result.message, 'success');
        } else {
            addNotification(result.message, 'error');
        }
      } finally {
          setIsProcessing(false);
      }
  };

  const updatePlanetAction = async (planetData: Omit<Planet, 'position' | 'market'>) => {
      if (!gameState) return;
      setIsProcessing(true);
      try {
        const result = await gameLogic.updatePlanet(gameState, planetData);
        if (result.success && result.newState) {
            setGameState(result.newState);
            addNotification(result.message, 'success');
        } else {
            addNotification(result.message, 'error');
        }
      } finally {
          setIsProcessing(false);
      }
  };

  const deletePlanetAction = (planetId: string) => {
      setGameState(prevState => {
          if (!prevState) return null;
          const result = gameLogic.deletePlanet(prevState, planetId);
          if (result.success && result.newState) {
              addNotification(result.message, 'success');
              return result.newState;
          } else {
              addNotification(result.message, 'error');
              return prevState;
          }
      });
  };
  
  const actions = {
    travelTo: useCallback((planetId: string) => handleAction(gameLogic.travelTo, planetId), [handleAction]),
    buyGood: useCallback((goodId: string, quantity: number) => handleAction(gameLogic.buyGood, goodId, quantity), [handleAction]),
    sellGood: useCallback((goodId: string, quantity: number) => handleAction(gameLogic.sellGood, goodId, quantity), [handleAction]),
    repairShip: useCallback((amount: number) => handleAction(gameLogic.repairShip, amount), [handleAction]),
    upgradeShip: useCallback((upgradeType: 'cargo' | 'durability') => handleAction(gameLogic.upgradeShip, upgradeType), [handleAction]),
    saveGame: saveGameAction,
    loadGame: loadGameAction,
    newGame: newGameAction,
    startAutoBot: startAutoBotAction,
    stopAutoBot: stopAutoBotAction,
    addPlanet: useCallback(addPlanetAction, [gameState, addNotification]),
    updatePlanet: useCallback(updatePlanetAction, [gameState, addNotification]),
    deletePlanet: useCallback(deletePlanetAction, [addNotification]),
  };

  return (
    <GameContext.Provider value={{ gameState, isLoading, isProcessing, notifications, addNotification, actions }}>
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
