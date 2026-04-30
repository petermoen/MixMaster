import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Songs } from './pages/Songs';
import { Setlists } from './pages/Setlists';
import { useStore } from './store/useStore';

export default function App() {
  const loaded = useStore((s) => s.loaded);
  const loadError = useStore((s) => s.loadError);

  useEffect(() => {
    void useStore.getState().loadAll();
  }, []);

  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-text-primary mb-2">
            Geen verbinding met de lokale server
          </h1>
          <p className="text-text-secondary mb-4">
            Draait <code className="bg-bg-secondary px-1 rounded">npm run dev</code>?
            Controleer of de backend (poort 3000) is gestart.
          </p>
          <p className="text-xs text-text-secondary opacity-60">{loadError}</p>
          <button
            type="button"
            className="mt-4 px-4 py-2 bg-bg-secondary rounded hover:bg-bg-tertiary"
            onClick={() => void useStore.getState().loadAll()}
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-bg-primary overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/songs" element={<Songs />} />
            <Route path="/setlists" element={<Setlists />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
