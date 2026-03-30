export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number | null;
  key: string;
  duration: string;
  releaseDate: string;
  energyLevel: number;
  genre: string;
  recordLabel: string;
  notes: string;
  youtubeUrl: string | null;
  thumbnail: string | null;
  createdAt: string;
}

export interface SetlistSong {
  songId: string;
  position: number;
  cueIn: string;
  cueOut: string;
  notes: string;
}

export interface Setlist {
  id: string;
  title: string;
  date: string;
  notes: string;
  songs: SetlistSong[];
  createdAt: string;
}

export interface Connection {
  id: string;
  fromSongId: string;
  toSongId: string;
  notes: string;
  createdAt: string;
}
