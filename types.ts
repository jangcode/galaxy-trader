
export interface GameState {
  player: PlayerState;
  galaxy: Galaxy;
  lastUpdated: string;
  checksum: string;
}

export interface TravelInfo {
  originPlanetId: string;
  destinationPlanetId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
}

export interface PlayerState {
  credits: number;
  currentPlanetId: string | null;
  ship: Ship;
  isTraveling: boolean;
  travelInfo: TravelInfo | null;
}

export interface Ship {
  name: string;
  durability: number; // current durability
  maxDurability: number;
  cargo: {
    capacity: number;
    items: CargoItem[];
  };
  upgrades: {
    cargo: number; // level
    durability: number; // level
  };
}

export interface CargoItem {
  goodId: string;
  quantity: number;
}

export interface Galaxy {
  name: string;
  planets: Planet[];
  goods: Good[];
}

export interface Planet {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  taxRate: number; // e.g., 0.01 = 1%
  market: MarketGood[];
  description: string;
  color: string;
}

export interface MarketGood {
  goodId: string;
  buyPrice: number;
  sellPrice: number;
}

export interface Good {
  id: string;
  name: string;
  basePrice: number;
}

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationMessage {
  id: number;
  message: string;
  type: NotificationType;
}