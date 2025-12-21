import { CommunityThread, User } from './database.types';

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
};

export type MainTabParamList = {
  Home: undefined;
  Community: undefined;
  Live: undefined;
  Media: undefined;
  Profile: undefined;
};
