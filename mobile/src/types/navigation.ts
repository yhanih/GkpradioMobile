import { CommunityThread, User, Episode, Video, LiveEvent } from './database.types';

export type RootStackParamList = {
  MainTabs: undefined;
  PostDetail: {
    threadId: string;
    thread?: CommunityThread & { users?: User | null };
  };
  UserProfile: {
    userId: string;
    user?: User;
  };
  Profile: undefined;
  VideoPlayer: {
    video?: Video;
    liveEvent?: LiveEvent;
  };
  EpisodePlayer: {
    episode: Episode;
    allEpisodes?: Episode[];
  };
  PastBroadcasts: undefined;
  LikedPosts: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Community: undefined;
  Live: undefined;
  Media: undefined;
  Hub: undefined;
};
