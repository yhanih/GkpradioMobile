
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
  Login: { redirectBack?: boolean } | undefined;
  Signup: undefined;
  /** Enter signup email + 6-digit code (optional email pre-filled from Login/Signup). */
  ConfirmEmail: { email?: string } | undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
  VideoPlayer: {
    video?: any;
    liveEvent?: any;
  };
  EpisodePlayer: {
    episode: any;
    allEpisodes?: any[];
  };
  LikedPosts: undefined;
  Notifications: undefined;
  TermsOfService: undefined;
  MerchStore: undefined;
  ProductDetail: { product: any };
  Donate: { amount?: number } | undefined;
  Games: undefined;
  Media: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Community: {
    categoryId?: string;
    mode?: 'prayers' | 'discussions';
  } | undefined;
  Games: undefined;
  Live: undefined;
  More: undefined;
};
