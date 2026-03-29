import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Songs } from './pages/Songs';
import { Setlists } from './pages/Setlists';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg-primary">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
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
