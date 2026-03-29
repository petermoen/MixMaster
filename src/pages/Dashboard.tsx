import { Music, ListMusic, Link, TrendingUp, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export function Dashboard() {
  const { songs, setlists, connections } = useStore();

  const recentSongs = [...songs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentConnections = [...connections].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const metrics = [
    { label: 'Songs', value: songs.length, icon: Music, color: 'from-accent to-cyan-400' },
    { label: 'Setlists', value: setlists.length, icon: ListMusic, color: 'from-accent-purple to-purple-400' },
    { label: 'Connections', value: connections.length, icon: Link, color: 'from-accent-pink to-pink-400' },
  ];

  return (
    <div className="p-8 overflow-y-auto h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-text-secondary text-sm">Overview of your music collection</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                <Icon size={18} className="text-bg-primary" />
              </div>
              <TrendingUp size={14} className="text-text-muted" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Music size={14} className="text-accent" /> Recent Songs
          </h2>
          {recentSongs.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">No songs added yet</p>
          ) : (
            <div className="space-y-3">
              {recentSongs.map((song) => (
                <div key={song.id} className="flex items-center gap-3">
                  {song.thumbnail ? (
                    <img src={song.thumbnail} alt="" className="w-9 h-9 rounded object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded bg-bg-secondary flex items-center justify-center">
                      <Music size={14} className="text-text-muted" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{song.title}</p>
                    <p className="text-xs text-text-secondary">{song.artist}</p>
                  </div>
                  <span className="text-xs text-text-muted font-mono">{song.bpm ? `${song.bpm}` : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Link size={14} className="text-accent-pink" /> Recent Connections
          </h2>
          {recentConnections.length === 0 ? (
            <p className="text-text-muted text-sm py-4 text-center">No connections yet</p>
          ) : (
            <div className="space-y-3">
              {recentConnections.map((conn) => {
                const fromSong = songs.find((s) => s.id === conn.fromSongId);
                const toSong = songs.find((s) => s.id === conn.toSongId);
                if (!fromSong || !toSong) return null;
                return (
                  <div key={conn.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent-pink/10 flex items-center justify-center">
                      <Link size={14} className="text-accent-pink" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{fromSong.title}</p>
                      <ArrowRight size={12} className="text-text-muted shrink-0" />
                      <p className="text-sm font-medium truncate">{toSong.title}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
