
import React, { useState } from 'react';
import { useGame } from './contexts/GameContext';
import { Header } from './components/Header';
import { CurrentPlanetView } from './components/CurrentPlanetView';
import { GalaxyMap } from './components/GalaxyMap';
import { Notification } from './components/Notification';
import { GalaxyPricesModal } from './components/GalaxyPricesModal';

const App: React.FC = () => {
  const { gameState, isLoading, notifications } = useGame();
  const [isGalaxyMapView, setGalaxyMapView] = useState<boolean>(true);
  const [isPricesModalOpen, setPricesModalOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-space-dark">
        <div className="text-center">
          <h1 className="text-4xl font-orbitron text-accent-blue mb-4 animate-pulse">GALAXY TRADER</h1>
          <p className="text-space-text-secondary">Loading your galactic journey...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
     return (
      <div className="flex items-center justify-center h-screen bg-space-dark">
        <div className="text-center p-8 border border-accent-red rounded-lg">
          <h2 className="text-2xl font-orbitron text-accent-red mb-4">Error</h2>
          <p className="text-space-text-secondary">Could not load game data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
  
  const currentPlanet = gameState.galaxy.planets.find(p => p.id === gameState.player.currentPlanetId);

  return (
    <div className="min-h-screen bg-space-dark text-space-text">
      <Header 
        player={gameState.player} 
        currentPlanetName={currentPlanet?.name || "In Transit"}
        onToggleMapView={() => setGalaxyMapView(!isGalaxyMapView)}
        onOpenPrices={() => setPricesModalOpen(true)}
      />
      <main className="p-4 md:p-8 max-w-7xl mx-auto">
        {isGalaxyMapView ? (
          <GalaxyMap galaxy={gameState.galaxy} player={gameState.player} onPlanetSelect={() => setGalaxyMapView(false)} />
        ) : (
          currentPlanet && <CurrentPlanetView planet={currentPlanet} />
        )}
      </main>
      <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-2 z-50">
        {notifications.map((notif) => (
          <Notification key={notif.id} message={notif.message} type={notif.type} />
        ))}
      </div>
      {isPricesModalOpen && <GalaxyPricesModal onClose={() => setPricesModalOpen(false)} />}
    </div>
  );
};

export default App;
