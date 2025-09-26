
import { INITIAL_GAME_STATE, SAVE_GAME_KEY } from '../constants';
import type { GameState, CargoItem, Planet } from '../types';

// Simple checksum to detect tampering.
const createChecksum = (state: GameState): string => {
  const data = `${state.player.credits}-${state.player.ship.cargo.capacity}-${JSON.stringify(state.player.ship.cargo.items)}`;
  // A simple hashing algorithm
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};

const createNewGameState = (): GameState => {
  const MAP_WIDTH = 800;
  const MAP_HEIGHT = 600;
  const PADDING = 50;
  const MIN_DISTANCE = 150;

  // Deep copy to avoid mutating the constant
  const newGameState: GameState = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
  
  const placedPositions: {x: number, y: number, z: number}[] = [];

  newGameState.galaxy.planets.forEach((planet: Planet) => {
    let newPosition;
    let positionOk = false;
    let attempts = 0;

    while (!positionOk && attempts < 100) { // Limit attempts to prevent infinite loop
      newPosition = {
        x: Math.floor(Math.random() * (MAP_WIDTH - PADDING * 2)) + PADDING,
        y: Math.floor(Math.random() * (MAP_HEIGHT - PADDING * 2)) + PADDING,
        z: Math.floor(Math.random() * 101) - 50, // -50 to 50
      };

      positionOk = true;
      for (const pos of placedPositions) {
        const distance = Math.sqrt(
          Math.pow(newPosition.x - pos.x, 2) +
          Math.pow(newPosition.y - pos.y, 2)
        );
        if (distance < MIN_DISTANCE) {
          positionOk = false;
          break;
        }
      }
      attempts++;
    }

    // Fallback if we can't find a good position
    if (!newPosition) {
        newPosition = {
            x: Math.floor(Math.random() * (MAP_WIDTH - PADDING * 2)) + PADDING,
            y: Math.floor(Math.random() * (MAP_HEIGHT - PADDING * 2)) + PADDING,
            z: Math.floor(Math.random() * 101) - 50,
        };
    }

    planet.position = newPosition;
    placedPositions.push(newPosition);
  });
  
  newGameState.lastUpdated = new Date().toISOString();
  newGameState.checksum = createChecksum(newGameState);
  
  return newGameState;
};

export const loadGame = (): { state: GameState; isNewGame: boolean } => {
  try {
    const savedStateJSON = localStorage.getItem(SAVE_GAME_KEY);
    if (!savedStateJSON) {
      console.log('No saved game found, creating a new one.');
      const newGameState = createNewGameState();
      saveGame(newGameState);
      return { state: newGameState, isNewGame: true };
    }

    const savedState: GameState = JSON.parse(savedStateJSON);
    if (createChecksum(savedState) !== savedState.checksum) {
      console.warn('Game data checksum mismatch! Data may be corrupted. Starting a new game.');
      alert('Your saved data seems to be corrupted. A new game will be started.');
      const newGameState = createNewGameState();
      saveGame(newGameState);
      return { state: newGameState, isNewGame: true };
    }
    console.log('Game loaded successfully.');
    return { state: savedState, isNewGame: false };
  } catch (error) {
    console.error('Failed to load game state from localStorage:', error);
    const newGameState = createNewGameState();
    saveGame(newGameState);
    return { state: newGameState, isNewGame: true };
  }
};

export const saveGame = (state: GameState): void => {
  try {
    const stateToSave = { ...state, checksum: createChecksum(state) };
    localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save game state to localStorage:', error);
  }
};

export const updateMarketPrices = (currentState: GameState): GameState => {
  const newState = { ...currentState };
  newState.galaxy.planets.forEach(planet => {
    planet.market.forEach(marketGood => {
      const good = newState.galaxy.goods.find(g => g.id === marketGood.goodId);
      if (good) {
        const fluctuation = (Math.random() - 0.5) * 0.1; // ±5%
        const newPrice = Math.max(1, Math.round(marketGood.buyPrice * (1 + fluctuation)));
        marketGood.buyPrice = newPrice;
        marketGood.sellPrice = Math.max(1, Math.round(newPrice * (Math.random() * 0.2 + 0.8))); // Sell price is 80-100% of buy price
      }
    });
  });
  newState.lastUpdated = new Date().toISOString();
  return newState;
};

export const calculateDistance = (p1: { x: number; y: number; z: number }, p2: { x: number; y: number; z: number }): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2));
};

export const travelTo = (currentState: GameState, destinationPlanetId: string): { newState?: GameState; message: string; success: boolean } => {
    if (currentState.player.currentPlanetId === destinationPlanetId) {
        return { message: 'You are already on this planet.', success: false };
    }

    const currentPlanet = currentState.galaxy.planets.find(p => p.id === currentState.player.currentPlanetId);
    const destinationPlanet = currentState.galaxy.planets.find(p => p.id === destinationPlanetId);

    if (!currentPlanet || !destinationPlanet) {
        return { message: 'Invalid planet coordinates.', success: false };
    }
    
    const distance = calculateDistance(currentPlanet.position, destinationPlanet.position);
    const fuelCost = Math.round(distance / 10);
    const tax = Math.round(currentState.player.credits * destinationPlanet.taxRate);

    if (currentState.player.credits < fuelCost + tax) {
        return { message: `Not enough credits for travel. Cost: ${fuelCost} (fuel) + ${tax} (tax) = ${fuelCost + tax}`, success: false };
    }

    const newState = JSON.parse(JSON.stringify(currentState));
    newState.player.credits -= (fuelCost + tax);
    newState.player.currentPlanetId = destinationPlanetId;
    
    // Chance to lose durability
    const durabilityLoss = Math.random() < 0.2 ? Math.floor(Math.random() * 5) + 1 : 0;
    newState.player.ship.durability = Math.max(0, newState.player.ship.durability - durabilityLoss);

    if (newState.player.ship.durability === 0) {
        return { message: 'Your ship was destroyed during travel! Game Over.', success: false }; // a more robust game over needs to be handled
    }

    let travelMessage = `Traveled to ${destinationPlanet.name}. Paid ${fuelCost} for fuel and ${tax} in taxes.`;
    if (durabilityLoss > 0) {
        travelMessage += ` Ship durability decreased by ${durabilityLoss}.`;
    }

    return { newState, message: travelMessage, success: true };
};

export const buyGood = (currentState: GameState, goodId: string, quantity: number): { newState?: GameState; message: string; success: boolean } => {
  const currentPlanet = currentState.galaxy.planets.find(p => p.id === currentState.player.currentPlanetId);
  const marketGood = currentPlanet?.market.find(g => g.goodId === goodId);
  if (!marketGood) return { success: false, message: "Good not available here." };

  const totalCost = marketGood.buyPrice * quantity;
  if (currentState.player.credits < totalCost) return { success: false, message: `Not enough credits. Required: ${totalCost}` };

  const currentCargoLoad = currentState.player.ship.cargo.items.reduce((sum, item) => sum + item.quantity, 0);
  if (currentCargoLoad + quantity > currentState.player.ship.cargo.capacity) return { success: false, message: "Not enough cargo space." };

  const newState = JSON.parse(JSON.stringify(currentState));
  newState.player.credits -= totalCost;
  
  const existingCargo = newState.player.ship.cargo.items.find((item: CargoItem) => item.goodId === goodId);
  if (existingCargo) {
    existingCargo.quantity += quantity;
  } else {
    newState.player.ship.cargo.items.push({ goodId, quantity });
  }

  return { newState, success: true, message: `Bought ${quantity} units for ${totalCost} credits.` };
};

export const sellGood = (currentState: GameState, goodId: string, quantity: number): { newState?: GameState; message: string; success: boolean } => {
  const cargoItem = currentState.player.ship.cargo.items.find(item => item.goodId === goodId);
  if (!cargoItem || cargoItem.quantity < quantity) return { success: false, message: "Not enough goods to sell." };

  const currentPlanet = currentState.galaxy.planets.find(p => p.id === currentState.player.currentPlanetId);
  const marketGood = currentPlanet?.market.find(g => g.goodId === goodId);
  if (!marketGood) return { success: false, message: "This planet doesn't buy this good." };

  const totalGain = marketGood.sellPrice * quantity;
  
  const newState = JSON.parse(JSON.stringify(currentState));
  newState.player.credits += totalGain;

  const newCargoItem = newState.player.ship.cargo.items.find((item: CargoItem) => item.goodId === goodId);
  if(newCargoItem) {
    newCargoItem.quantity -= quantity;
    if (newCargoItem.quantity <= 0) {
      newState.player.ship.cargo.items = newState.player.ship.cargo.items.filter((item: CargoItem) => item.goodId !== goodId);
    }
  }

  return { newState, success: true, message: `Sold ${quantity} units for ${totalGain} credits.` };
};

export const repairShip = (currentState: GameState, amount: number): { newState?: GameState; message: string; success: boolean } => {
    const costPerPoint = 10;
    const totalCost = amount * costPerPoint;

    if (currentState.player.credits < totalCost) {
        return { success: false, message: `Not enough credits for repair. Cost: ${totalCost}` };
    }
    if (currentState.player.ship.durability >= 100) {
        return { success: false, message: 'Ship is already at full durability.' };
    }
    
    const newState = JSON.parse(JSON.stringify(currentState));
    newState.player.credits -= totalCost;
    newState.player.ship.durability = Math.min(100, newState.player.ship.durability + amount);

    return { newState, success: true, message: `Repaired ship for ${totalCost} credits.` };
};
