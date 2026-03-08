
export type RootStackParamList = {
  MainTabs: undefined;
  PostDetail: {
    threadId: string | number;
    testimony?: any;
    thread?: any;
  };
  UserProfile: {
    userId: string | number;
    user?: any;
  };
  Profile: undefined;
  VideoPlayer: {
    video?: any;
    liveEvent?: any;
  };
  EpisodePlayer: {
    episode: any;
    allEpisodes?: any[];
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
