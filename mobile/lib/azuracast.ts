import Constants from 'expo-constants';

const AZURACAST_BASE_URL = Constants.expoConfig?.extra?.azuracastBaseUrl ?? Constants.manifest?.extra?.azuracastBaseUrl ?? 'http://74.208.102.89:8080';
const STATION_ID = Constants.expoConfig?.extra?.azuracastStationId ?? Constants.manifest?.extra?.azuracastStationId ?? '1';

export interface NowPlayingData {
  station: {
    id: number;
    name: string;
    description: string;
    listen_url: string;
  };
  listeners: {
    current: number;
    unique: number;
    total: number;
  };
  now_playing: {
    song: {
      title: string;
      artist: string;
      album: string;
      art?: string;
    };
    duration: number;
    elapsed: number;
    playlist: string;
  };
  song_history: Array<{
    song: {
      title: string;
      artist: string;
      album: string;
      art?: string;
    };
    played_at: number;
  }>;
}

export const fetchNowPlaying = async (stationId: string | number = STATION_ID): Promise<NowPlayingData> => {
  try {
    const response = await fetch(`${AZURACAST_BASE_URL}/api/nowplaying/${stationId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch now playing data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching now playing:', error);
    throw error;
  }
};

export const getStreamUrl = (stationId: string | number = STATION_ID): string => {
  return `${AZURACAST_BASE_URL}/listen/${stationId}/radio.mp3`;
};
