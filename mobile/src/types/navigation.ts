
export type RootStackParamList = {
  MainTabs: { screen: keyof MainTabParamList } | undefined;
  PostDetail: {
    threadId: string | number;
    testimony?: any;
    thread?: any;
    focusReply?: boolean;
  };
  UserProfile: {
    userId: string | number;
    user?: any;
  };
  Profile: undefined;
  Login: { redirectBack?: boolean } | undefined;
  Signup: undefined;
  /** Enter signup email + 6-digit code (optional email pre-filled from Login/Signup). */
  ConfirmEmail: { email?: string; fromSignup?: boolean } | undefined;
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
  GameWebView: {
    url: string;
    title?: string;
    /** Main tab to open when user taps the primary return action (default Live). */
    returnTab?: 'Live' | 'Home';
  };
  Media: undefined;
  DailySchedule: undefined;
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
