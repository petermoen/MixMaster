import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Songs } from './pages/Songs';
import { Setlists } from './pages/Setlists';
import { useStoreHydration } from './store/useStore';

export default function App() {
  const hydrated = useStoreHydration();

  if (!hydrated) {
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
