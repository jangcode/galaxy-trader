
import type { GameState, Galaxy, Good, Planet, PlayerState } from './types';

const GOODS: Good[] = [
  { id: 'water', name: 'Aqua Pura', basePrice: 20 },
  { id: 'food', name: 'Nutri-Paste', basePrice: 50 },
  { id: 'minerals', name: 'Xenon Crystals', basePrice: 150 },
  { id: 'tech', name: 'Quantum Chips', basePrice: 500 },
];

const PLANETS: Planet[] = [
  {
    id: 'terra',
    name: 'Terra Prime',
    position: { x: 100, y: 100 },
    taxRate: 0.05,
    description: "The bustling capital of the 'MakeMoney' galaxy, with a balanced economy and stable markets.",
    market: [
      { goodId: 'water', buyPrice: 22, sellPrice: 18 },
      { goodId: 'food', buyPrice: 55, sellPrice: 45 },
      { goodId: 'minerals', buyPrice: 160, sellPrice: 140 },
      { goodId: 'tech', buyPrice: 480, sellPrice: 450 },
    ],
  },
  {
    id: 'aqua',
    name: 'Aqua Ventus',
    position: { x: 300, y: 400 },
    taxRate: 0.02,
    description: "An ocean world, rich in water resources but desperate for advanced technology and minerals.",
    market: [
      { goodId: 'water', buyPrice: 15, sellPrice: 10 },
      { goodId: 'food', buyPrice: 60, sellPrice: 50 },
      { goodId: 'minerals', buyPrice: 180, sellPrice: 160 },
      { goodId: 'tech', buyPrice: 550, sellPrice: 520 },
    ],
  },
  {
    id: 'volcanis',
    name: 'Volcanis',
    position: { x: 600, y: 200 },
    taxRate: 0.1,
    description: 'A mineral-rich volcanic planet. The harsh environment makes food and water scarce and valuable.',
    market: [
      { goodId: 'water', buyPrice: 35, sellPrice: 30 },
      { goodId: 'food', buyPrice: 70, sellPrice: 60 },
      { goodId: 'minerals', buyPrice: 120, sellPrice: 100 },
      { goodId: 'tech', buyPrice: 520, sellPrice: 490 },
    ],
  },
];

const GALAXY: Galaxy = {
  name: 'MakeMoney',
  planets: PLANETS,
  goods: GOODS,
};

const INITIAL_PLAYER_STATE: PlayerState = {
  credits: 1000,
  currentPlanetId: 'terra',
  ship: {
    name: 'Stardust Cruiser',
    durability: 100,
    cargo: {
      capacity: 20,
      items: [],
    },
  },
};

export const INITIAL_GAME_STATE: GameState = {
  player: INITIAL_PLAYER_STATE,
  galaxy: GALAXY,
  lastUpdated: new Date().toISOString(),
  checksum: '',
};

export const MARKET_UPDATE_INTERVAL = 10000; // 10 seconds
export const SAVE_GAME_KEY = 'galaxyTraderState';
