import axios from 'axios';

const AZURACAST_BASE_URL = 'http://74.208.102.89:8080';

export const azuracastAPI = axios.create({
    baseURL: AZURACAST_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface NowPlayingData {
    station: {
        id: number;
        name: string;
        shortcode: string;
        description: string;
        listen_url: string;
    };
    listeners: {
        current: number;
        unique: number;
        total: number;
    };
    now_playing: {
        elapsed: number;
        remaining: number;
        played_at: number;
        duration: number;
        playlist: string;
        song: {
            id: string;
            text: string;
            artist: string;
            title: string;
            album: string;
            art: string;
        };
    };
    song_history: Array<{
        song: {
            id: string;
            text: string;
            artist: string;
            title: string;
            album: string;
            art: string;
        };
        played_at: number;
    }>;
}

export const fetchNowPlaying = async (stationId: number | string = 1): Promise<NowPlayingData> => {
    try {
        const response = await azuracastAPI.get(`/api/nowplaying/${stationId}`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching now playing data:', error);
        throw error;
    }
};

export const fetchStations = async () => {
    try {
        const response = await azuracastAPI.get('/api/stations');
        return response.data;
    } catch (error: any) {
        console.error('Error fetching stations:', error);
        throw error;
    }
};
