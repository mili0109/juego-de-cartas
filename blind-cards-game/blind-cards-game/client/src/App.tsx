import React from 'react';
import { GameProvider, useGameContext } from './context/GameContext';
import { Lobby } from './components/Lobby/Lobby';
import { GameTable } from './components/Table/GameTable';

const AppContent: React.FC = () => {
  const { room, errorMessage, clearError } = useGameContext();

  return (
    <div className="min-h-screen px-4 pb-12">
      {errorMessage && (
        <div className="max-w-2xl mx-auto mt-4 bg-rose-900/60 border border-rose-500 rounded-lg px-4 py-2 flex items-center justify-between text-sm">
          <span>{errorMessage}</span>
          <button onClick={clearError} className="text-rose-300 hover:text-white">
            ✕
          </button>
        </div>
      )}
      {room ? <GameTable /> : <Lobby />}
    </div>
  );
};

const App: React.FC = () => (
  <GameProvider>
    <AppContent />
  </GameProvider>
);

export default App;
