
import React, { useState, useEffect } from 'react';
import { useGame } from './contexts/GameContext';
import { Header } from './components/Header';
import { CurrentPlanetView } from './components/CurrentPlanetView';
import { GalaxyMap } from './components/GalaxyMap';
import { Notification } from './components/Notification';
import { GalaxyPricesView } from './components/GalaxyPricesView';

type View = 'map' | 'planet' | 'prices';

const App: React.FC = () => {
  const { gameState, isLoading, notifications } = useGame();
  const [activeView, setActiveView] = useState<View>('map');

  useEffect(() => {
    if (gameState?.player.isTraveling) {
      setActiveView('map');
    }
  }, [gameState?.player.isTraveling]);

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
    <div className="h-screen bg-space-dark text-space-text flex flex-col overflow-hidden">
      <Header 
        player={gameState.player} 
        currentPlanetName={currentPlanet?.name || "In Transit"}
        onSetView={setActiveView}
      />
      <main className="flex-grow overflow-y-auto">
        {activeView === 'map' && (
          <GalaxyMap galaxy={gameState.galaxy} player={gameState.player} onPlanetSelect={() => setActiveView('planet')} />
        )}
        {activeView === 'planet' && currentPlanet && (
          <CurrentPlanetView planet={currentPlanet} />
        )}
        {activeView === 'prices' && <GalaxyPricesView />}
      </main>
      <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-2 z-50">
        {notifications.map((notif) => (
          <Notification key={notif.id} message={notif.message} type={notif.type} />
        ))}
      </div>
    </div>
  );
};

export default App;