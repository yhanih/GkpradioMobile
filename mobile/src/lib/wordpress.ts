import AsyncStorage from '@react-native-async-storage/async-storage';

const WP_API_URL = 'https://godkingdomprinciplesradio.com/apis/wp-json';
const JWT_AUTH_NAMESPACE = 'jwt-auth/v1';
const CUSTOM_AUTH_NAMESPACE = 'custom-auth/v1';
const CUSTOM_API_NAMESPACE = 'custom-api/v1';

export interface WPUser {
  id: number;
  username: string;
  nicename: string;
  email: string;
  url: string;
  displayname: string;
  firstname: string;
  lastname: string;
  nickname: string;
  name?: string;
  description?: string;
  avatar_urls?: {
    [key: string]: string;
  };
}

export interface AuthResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

export interface WPPodcast {
  id: number;
  title: { rendered: string };
  content: { rendered: string; raw?: string };
  featured_media: number;
  date: string;
  thumbnail_url?: string;
  audio_url?: string;
}

export interface WPVideo {
  id: number;
  title: { rendered: string };
  content: { rendered: string; raw?: string };
  featured_media: number;
  date: string;
  thumbnail_url?: string;
  video_url?: string;
}

export interface WPRadioStatus {
  is_live: boolean;
  current_show?: string;
  stream_url: string;
  now_playing?: {
    title: string;
    artist: string;
    art?: string;
  };
}

export interface WPComment {
  id: number;
  post: number;
  parent: number;
  author_name: string;
  content: { rendered: string };
  date: string;
  author_avatar_urls?: { [key: string]: string };
}

export interface WPTestimony {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  author: number;
  comment_count: number;
  like_count?: number;
  user_has_liked?: boolean;
}

export interface WPSchedule {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  date: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: string;
  image_url?: string;
}

class WordPressClient {
  private token: string | null = null;

  constructor() {
    console.log('[wpClient] Initializing...');
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('wp_jwt_token');
      console.log('[wpClient] Token loaded:', this.token ? 'Yes (starts with ' + this.token.substring(0, 10) + '...)' : 'No');
    } catch (error: any) {
      console.error('[wpClient] Error loading token:', error);
      if (error && error.stack) console.error(error.stack);
    }
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('wp_jwt_token', token);
    } else {
      await AsyncStorage.removeItem('wp_jwt_token');
    }
  }

  async getToken() {
    if (!this.token) {
      await this.loadToken();
    }
    return this.token;
  }

  async login(username: string, password: string): Promise<{ data?: AuthResponse; error?: string }> {
    try {
      const response = await fetch(`${WP_API_URL}/${JWT_AUTH_NAMESPACE}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Login failed' };
      }

      await this.setToken(data.token);
      return { data };
    } catch (error: any) {
      return { error: error.message || 'An error occurred during login' };
    }
  }

  async register(email: string, password: string, fullName?: string): Promise<{ data?: any; error?: string }> {
    try {
      const response = await fetch(`${WP_API_URL}/${CUSTOM_AUTH_NAMESPACE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          display_name: fullName,
          username: email.split('@')[0] // Fallback username
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Registration failed' };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'An error occurred during registration' };
    }
  }

  async getMe(): Promise<{ data?: WPUser; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) return { error: 'No token found' };

      const response = await fetch(`${WP_API_URL}/wp/v2/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Failed to fetch user data' };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || 'An error occurred while fetching user data' };
    }
  }

  async getUserById(id: number | string): Promise<{ data?: WPUser; error?: string }> {
    try {
      const response = await fetch(`${WP_API_URL}/wp/v2/users/${id}`);
      const data = await response.json();
      if (!response.ok) return { error: data.message || 'User not found' };
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async updateMe(userData: { fullname?: string; bio?: string }): Promise<{ data?: WPUser; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) return { error: 'Authentication required' };

      const response = await fetch(`${WP_API_URL}/wp/v2/users/me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userData.fullname,
          description: userData.bio
        })
      });
      const data = await response.json();
      if (!response.ok) return { error: data.message || 'Failed to update profile' };
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async logout() {
    await this.setToken(null);
  }

  // --- Data Fetching ---

  async getRadioStatus(): Promise<{ data?: WPRadioStatus; error?: string }> {
    try {
      const url = `${WP_API_URL}/${CUSTOM_API_NAMESPACE}/radio-status`;
      console.log('[wpClient] GET radio-status:', url);
      const response = await fetch(url);
      console.log('[wpClient] Radio status response:', response.status);
      const data = await response.json();
      
      if (!response.ok) return { error: 'Failed to fetch radio status' };

      // Map AzuraCast format to WPRadioStatus
      const formatted: WPRadioStatus = {
        is_live: data.live?.is_live || false,
        current_show: data.now_playing?.song?.title || 'Faith & Worship',
        stream_url: data.station?.listen_url || 'https://74.208.102.89:8443/listen/gkp_radio/radio.mp3',
        now_playing: data.now_playing?.song ? {
          title: data.now_playing.song.title,
          artist: data.now_playing.song.artist,
          art: data.now_playing.song.art
        } : undefined
      };

      console.log('[wpClient] Formatted radio status:', JSON.stringify(formatted));
      return { data: formatted };
    } catch (error: any) {
      console.error('[wpClient] Radio status error:', error.message);
      return { error: error.message };
    }
  }

  async getRadioSchedule(): Promise<{ data?: any; error?: string }> {
    try {
      const url = `${WP_API_URL}/wp/v2/radio?per_page=1&_embed=1`;
      console.log('[wpClient] GET radio-schedule:', url);
      const response = await fetch(url);
      console.log('[wpClient] Radio schedule response:', response.status);
      const data = await response.json();
      if (!response.ok) return { error: 'Failed to fetch radio schedule' };
      console.log(`[wpClient] Fetched ${data.length} schedule items`);
      return { data: data[0] };
    } catch (error: any) {
      console.error('[wpClient] Radio schedule error:', error.message);
      return { error: error.message };
    }
  }

  async getPodcasts(perPage: number = 10, ids?: string[]): Promise<{ data?: WPPodcast[]; error?: string }> {
    try {
      let url = `${WP_API_URL}/wp/v2/podcasts?per_page=${perPage}&_embed=1`;
      if (ids && ids.length > 0) {
        url += `&include=${ids.join(',')}`;
      }
      
      console.log('[wpClient] GET podcasts:', url);
      const response = await fetch(url);
      console.log('[wpClient] Podcasts response status:', response.status);
      const podcasts = await response.json();
      
      console.log(`[wpClient] Fetched ${podcasts.length} podcasts`);
      console.log('[wpClient] Raw podcast[0]:', JSON.stringify(podcasts[0]).substring(0, 200) + '...');

      const formatted = podcasts.map((p: any) => {
        try {
          return {
            id: p.id,
            title: p.title,
            content: p.content,
            date: p.date,
            thumbnail_url: p._embedded?.['wp:featuredmedia']?.[0]?.source_url,
            audio_url: this.extractMediaUrl(p.content?.rendered || '', 'audio')
          };
        } catch (e: any) {
          console.error('[wpClient] error mapping podcast:', e.message);
          return null;
        }
      }).filter(Boolean);

      return { data: formatted };
    } catch (error: any) {
      console.error('[wpClient] Podcasts error:', error.message);
      return { error: error.message };
    }
  }

  async getVideos(perPage: number = 10, ids?: string[]): Promise<{ data?: WPVideo[]; error?: string }> {
    try {
      let url = `${WP_API_URL}/wp/v2/videos?per_page=${perPage}&_embed=1`;
      if (ids && ids.length > 0) {
        url += `&include=${ids.join(',')}`;
      }

      console.log('[wpClient] GET videos:', url);
      const response = await fetch(url);
      console.log('[wpClient] Videos response status:', response.status);
      const videos = await response.json();
      
      if (!response.ok) return { error: 'Failed to fetch videos' };
      console.log(`[wpClient] Fetched ${videos.length} videos`);
      console.log('[wpClient] Raw video[0]:', JSON.stringify(videos[0]).substring(0, 200) + '...');
 
      const formatted = videos.map((v: any) => {
        try {
          return {
            id: v.id,
            title: v.title,
            content: v.content,
            date: v.date,
            thumbnail_url: v._embedded?.['wp:featuredmedia']?.[0]?.source_url,
            video_url: this.extractMediaUrl(v.content?.rendered || '', 'video')
          };
        } catch (e: any) {
          console.error('[wpClient] error mapping video:', e.message);
          return null;
        }
      }).filter(Boolean);

      return { data: formatted };
    } catch (error: any) {
      console.error('[wpClient] Videos error:', error.message);
      return { error: error.message };
    }
  }

  private extractMediaUrl(html: string, type: 'audio' | 'video'): string | undefined {
    if (!html) return undefined;
    
    // Simple regex to find src in audio/video tags
    const regex = type === 'audio' 
      ? /<audio[^>]+src="([^">]+)"/ 
      : /<video[^>]+src="([^">]+)"/;
    
    const match = html.match(regex);
    return match ? match[1] : undefined;
  }

  // --- Community / Testimonies ---

  async getTestimonies(perPage: number = 20, page: number = 1, author?: number | string): Promise<{ data?: WPTestimony[]; error?: string }> {
    try {
      let url = `${WP_API_URL}/wp/v2/testimonies?per_page=${perPage}&page=${page}&_embed=1`;
      if (author) {
        url += `&author=${author}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) return { error: data.message || 'Failed to fetch testimonies' };
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async createTestimony(title: string, content: string, categoryId?: string): Promise<{ data?: any; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) return { error: 'Authentication required' };

      const body: any = { title, content, status: 'publish' };
      if (categoryId) {
        // Assuming standard categories for now, or match custom taxonomy if known
        body.categories = [categoryId]; 
      }

      const response = await fetch(`${WP_API_URL}/wp/v2/testimonies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) return { error: data.message || 'Failed to create testimony' };
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async getComments(postId: number): Promise<{ data?: WPComment[]; error?: string }> {
    try {
      const response = await fetch(`${WP_API_URL}/wp/v2/comments?post=${postId}&_embed=1`);
      const data = await response.json();
      if (!response.ok) return { error: data.message || 'Failed to fetch comments' };
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async createComment(postId: number, content: string, parentId: number = 0): Promise<{ data?: any; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) return { error: 'Authentication required' };

      const response = await fetch(`${WP_API_URL}/wp/v2/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ post: postId, content, parent: parentId })
      });
      const data = await response.json();
      if (!response.ok) return { error: data.message || 'Failed to create comment' };
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }

  async toggleLike(postId: number): Promise<{ data?: any; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) return { error: 'Authentication required' };

      const response = await fetch(`${WP_API_URL}/custom-api/v1/testimony/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) return { error: 'Failed to toggle like' };
      return { data };
    } catch (error: any) {
      return { error: error.message };
    }
  }
}

export const wpClient = new WordPressClient();
