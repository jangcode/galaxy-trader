
import { INITIAL_GAME_STATE, SAVE_GAME_KEY, UPGRADE_CONSTANTS, SHIP_SPEED } from '../constants';
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
    
    // Migration for saves without travel state
    if (savedState.player.isTraveling === undefined) {
      savedState.player.isTraveling = false;
    }
    if (savedState.player.travelInfo === undefined) {
      savedState.player.travelInfo = null;
    }
    if (savedState.player.currentPlanetId === undefined) {
      savedState.player.currentPlanetId = 'terra';
    }

    savedState.autoBotState = null; // Ensure autobot is not running on load

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
    const stateToSave = { ...state, checksum: createChecksum(state), autoBotState: null };
    localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Failed to save game state to localStorage:', error);
  }
};

export const startNewGame = (): GameState => {
  const newGameState = createNewGameState();
  saveGame(newGameState);
  return newGameState;
};

export const updateMarketPrices = (currentState: GameState): GameState => {
  const newState = JSON.parse(JSON.stringify(currentState));
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
    if (currentState.player.isTraveling) {
        return { message: 'Already in transit.', success: false };
    }
    if (currentState.player.ship.durability <= 0) {
        return { message: 'Your ship is too damaged to travel. Repair it first.', success: false };
    }

    const originPlanetId = currentState.player.currentPlanetId;
    if (!originPlanetId) {
        return { message: 'Cannot travel while in deep space.', success: false };
    }
    if (originPlanetId === destinationPlanetId) {
        return { message: 'You are already on this planet.', success: false };
    }

    const originPlanet = currentState.galaxy.planets.find(p => p.id === originPlanetId);
    const destinationPlanet = currentState.galaxy.planets.find(p => p.id === destinationPlanetId);

    if (!originPlanet || !destinationPlanet) {
        return { message: 'Invalid planet coordinates.', success: false };
    }
    
    const distance = calculateDistance(originPlanet.position, destinationPlanet.position);
    const fuelCost = Math.round(distance / 10);
    const travelDurationMs = (distance / SHIP_SPEED) * 1000;

    if (currentState.player.credits < fuelCost) {
        return { message: `Not enough credits for travel. Fuel Cost: ${fuelCost}`, success: false };
    }

    const newState = JSON.parse(JSON.stringify(currentState));
    newState.player.credits -= fuelCost;
    newState.player.isTraveling = true;
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + travelDurationMs);
    
    newState.player.travelInfo = {
        originPlanetId: originPlanetId,
        destinationPlanetId: destinationPlanetId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
    };
    newState.player.currentPlanetId = null;

    let travelMessage = `Traveling to ${destinationPlanet.name}. Paid ${fuelCost} for fuel. ETA: ${Math.round(travelDurationMs/1000)}s`;

    return { newState, message: travelMessage, success: true };
};

export const completeTravel = (currentState: GameState): GameState | null => {
    if (!currentState.player.isTraveling || !currentState.player.travelInfo) {
        return null;
    }

    const endTime = new Date(currentState.player.travelInfo.endTime);
    if (new Date() < endTime) {
        return null; // Not yet arrived
    }

    const newState = JSON.parse(JSON.stringify(currentState));
    const { destinationPlanetId } = newState.player.travelInfo;
    const destinationPlanet = newState.galaxy.planets.find((p: Planet) => p.id === destinationPlanetId);

    if (!destinationPlanet) {
        console.error("Destination planet not found on arrival!");
        newState.player.isTraveling = false;
        newState.player.travelInfo = null;
        newState.player.currentPlanetId = newState.player.travelInfo.originPlanetId;
        return newState;
    }
    
    const tax = Math.round(newState.player.credits * destinationPlanet.taxRate);
    newState.player.credits -= tax;
    
    const durabilityLoss = Math.random() < 0.2 ? Math.floor(Math.random() * 5) + 1 : 0;
    newState.player.ship.durability = Math.max(0, newState.player.ship.durability - durabilityLoss);
    
    newState.player.currentPlanetId = destinationPlanetId;
    newState.player.isTraveling = false;
    newState.player.travelInfo = null;

    return newState;
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
    const { ship } = currentState.player;

    if (currentState.player.credits < totalCost) {
        return { success: false, message: `Not enough credits for repair. Cost: ${totalCost}` };
    }
    if (ship.durability >= ship.maxDurability) {
        return { success: false, message: 'Ship is already at full durability.' };
    }
    
    const newState = JSON.parse(JSON.stringify(currentState));
    newState.player.credits -= totalCost;
    newState.player.ship.durability = Math.min(ship.maxDurability, ship.durability + amount);

    return { newState, success: true, message: `Repaired ship for ${totalCost} credits.` };
};

export const upgradeShip = (currentState: GameState, upgradeType: 'cargo' | 'durability'): { newState?: GameState; message: string; success: boolean } => {
    const { ship, credits } = currentState.player;
    const newState = JSON.parse(JSON.stringify(currentState));

    if (upgradeType === 'cargo') {
        const { CARGO } = UPGRADE_CONSTANTS;
        const currentLevel = ship.upgrades.cargo;

        if (currentLevel >= CARGO.MAX_LEVEL) {
            return { success: false, message: 'Cargo capacity is already at max level.' };
        }

        const cost = Math.floor(CARGO.BASE_COST * Math.pow(CARGO.COST_MULTIPLIER, currentLevel - 1));

        if (credits < cost) {
            return { success: false, message: `Not enough credits. Required: ${cost}` };
        }

        newState.player.credits -= cost;
        newState.player.ship.upgrades.cargo += 1;
        newState.player.ship.cargo.capacity += CARGO.PER_LEVEL;

        return { newState, success: true, message: `Cargo capacity upgraded to ${newState.player.ship.cargo.capacity} for ${cost} credits.` };
    }

    if (upgradeType === 'durability') {
        const { DURABILITY } = UPGRADE_CONSTANTS;
        const currentLevel = ship.upgrades.durability;

        if (currentLevel >= DURABILITY.MAX_LEVEL) {
            return { success: false, message: 'Ship durability is already at max level.' };
        }

        const cost = Math.floor(DURABILITY.BASE_COST * Math.pow(DURABILITY.COST_MULTIPLIER, currentLevel - 1));

        if (credits < cost) {
            return { success: false, message: `Not enough credits. Required: ${cost}` };
        }

        newState.player.credits -= cost;
        newState.player.ship.upgrades.durability += 1;
        newState.player.ship.maxDurability += DURABILITY.PER_LEVEL;
        // Also heal the ship by the upgraded amount
        newState.player.ship.durability = Math.min(newState.player.ship.maxDurability, newState.player.ship.durability + DURABILITY.PER_LEVEL);


        return { newState, success: true, message: `Maximum durability increased to ${newState.player.ship.maxDurability} for ${cost} credits.` };
    }

    return { success: false, message: 'Invalid upgrade type.' };
};

export const addPlanet = async (
    currentState: GameState,
    planetData: Omit<Planet, 'id' | 'position' | 'market'>
): Promise<{ newState?: GameState; message: string; success: boolean }> => {
    try {
        const { generateMarketForPlanet } = await import('./geminiService');
        const marketData = await generateMarketForPlanet(planetData, currentState.galaxy.goods);

        const newState = JSON.parse(JSON.stringify(currentState));

        const newPlanet: Planet = {
            ...planetData,
            id: planetData.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            position: { x: 0, y: 0, z: 0 }, // Will be randomized next
            market: marketData.market
        };

        // Find a non-overlapping position
        const MAP_WIDTH = 800;
        const MAP_HEIGHT = 600;
        const PADDING = 50;
        const MIN_DISTANCE = 150;

        const placedPositions = newState.galaxy.planets.map((p: Planet) => p.position);
        let newPosition;
        let positionOk = false;
        let attempts = 0;

        while (!positionOk && attempts < 100) {
            newPosition = {
                x: Math.floor(Math.random() * (MAP_WIDTH - PADDING * 2)) + PADDING,
                y: Math.floor(Math.random() * (MAP_HEIGHT - PADDING * 2)) + PADDING,
                z: Math.floor(Math.random() * 101) - 50,
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
        
        if (!newPosition) {
             newPosition = {
                x: Math.floor(Math.random() * (MAP_WIDTH - PADDING * 2)) + PADDING,
                y: Math.floor(Math.random() * (MAP_HEIGHT - PADDING * 2)) + PADDING,
                z: Math.floor(Math.random() * 101) - 50,
            };
        }

        newPlanet.position = newPosition;
        
        newState.galaxy.planets.push(newPlanet);

        return { newState, success: true, message: `Planet ${newPlanet.name} created successfully.` };

    } catch (error: any) {
        return { success: false, message: error.message || "Failed to create planet." };
    }
};

export const updatePlanet = async (
    currentState: GameState,
    planetData: Omit<Planet, 'position' | 'market'>
): Promise<{ newState?: GameState; message: string; success: boolean }> => {
    try {
        const { generateMarketForPlanet } = await import('./geminiService');
        const planetIndex = currentState.galaxy.planets.findIndex(p => p.id === planetData.id);
        if (planetIndex === -1) {
            return { success: false, message: "Planet not found." };
        }

        const marketData = await generateMarketForPlanet(planetData, currentState.galaxy.goods);

        const newState = JSON.parse(JSON.stringify(currentState));

        newState.galaxy.planets[planetIndex] = {
            ...newState.galaxy.planets[planetIndex],
            ...planetData,
            market: marketData.market,
        };

        return { newState, success: true, message: `Planet ${planetData.name} updated successfully.` };

    } catch (error: any) {
        return { success: false, message: error.message || "Failed to update planet." };
    }
};

export const deletePlanet = (
    currentState: GameState,
    planetId: string
): { newState?: GameState; message: string; success: boolean } => {
    
    if (currentState.galaxy.planets.length <= 1) {
        return { success: false, message: "Cannot delete the last planet in the galaxy." };
    }
    if (currentState.player.currentPlanetId === planetId) {
        return { success: false, message: "Cannot delete the planet you are currently on." };
    }
    if (currentState.autoBotState?.isActive && (currentState.autoBotState.originPlanetId === planetId || currentState.autoBotState.destinationPlanetId === planetId)) {
        return { success: false, message: "Cannot delete a planet involved in an active AutoBot mission." };
    }

    const newState = JSON.parse(JSON.stringify(currentState));
    const planetName = newState.galaxy.planets.find((p: Planet) => p.id === planetId)?.name || 'Unknown';
    newState.galaxy.planets = newState.galaxy.planets.filter((p: Planet) => p.id !== planetId);

    return { newState, success: true, message: `Planet ${planetName} has been deleted.` };
};
