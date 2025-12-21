import { Ionicons } from '@expo/vector-icons';

export interface Category {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  description: string;
  placeholder: {
    title: string;
    content: string;
  };
}

export const COMMUNITY_CATEGORIES: Category[] = [
  {
    id: 'all',
    label: 'All',
    icon: 'grid-outline',
    iconActive: 'grid',
    description: 'View all community posts',
    placeholder: {
      title: 'Share with the community',
      content: 'What would you like to share today?',
    },
  },
  {
    id: 'Prayer Requests',
    label: 'Prayers',
    icon: 'hand-right-outline',
    iconActive: 'hand-right',
    description: 'Share your prayer requests',
    placeholder: {
      title: 'What can we pray for?',
      content: 'Share your prayer request with the community...',
    },
  },
  {
    id: 'Pray for Others',
    label: 'Pray for Others',
    icon: 'people-outline',
    iconActive: 'people',
    description: 'Pray for others in the community',
    placeholder: {
      title: 'Pray for someone',
      content: 'Share a prayer for someone in need...',
    },
  },
  {
    id: 'Testimonies',
    label: 'Testimonies',
    icon: 'star-outline',
    iconActive: 'star',
    description: 'Share how God has worked',
    placeholder: {
      title: 'Share your testimony',
      content: 'Tell us how God has worked in your life...',
    },
  },
  {
    id: 'Praise & Worship',
    label: 'Praise',
    icon: 'musical-notes-outline',
    iconActive: 'musical-notes',
    description: 'Share praise and worship moments',
    placeholder: {
      title: 'Share your praise',
      content: 'What are you praising God for today?',
    },
  },
  {
    id: 'Words of Encouragement',
    label: 'Encourage',
    icon: 'heart-outline',
    iconActive: 'heart',
    description: 'Encourage one another',
    placeholder: {
      title: 'Share encouragement',
      content: 'Share words of encouragement for the community...',
    },
  },
  {
    id: 'Born Again',
    label: 'Born Again',
    icon: 'sparkles-outline',
    iconActive: 'sparkles',
    description: 'New faith journeys',
    placeholder: {
      title: 'Share your new beginning',
      content: 'Share your story of being born again...',
    },
  },
  {
    id: 'Youth Voices',
    label: 'Youth',
    icon: 'school-outline',
    iconActive: 'school',
    description: 'For our young community members',
    placeholder: {
      title: 'Share your voice',
      content: 'What would you like to share with the community?',
    },
  },
  {
    id: 'Sharing Hobbies',
    label: 'Hobbies',
    icon: 'color-palette-outline',
    iconActive: 'color-palette',
    description: 'Share your hobbies and interests',
    placeholder: {
      title: 'Share your hobby',
      content: 'Tell us about your hobbies and interests...',
    },
  },
  {
    id: 'Physical & Mental Health',
    label: 'Health',
    icon: 'fitness-outline',
    iconActive: 'fitness',
    description: 'Physical and mental wellness',
    placeholder: {
      title: 'Share about health',
      content: 'Share your health journey or tips...',
    },
  },
  {
    id: 'Money & Finances',
    label: 'Finances',
    icon: 'wallet-outline',
    iconActive: 'wallet',
    description: 'Financial wisdom and stewardship',
    placeholder: {
      title: 'Share financial wisdom',
      content: 'Share tips or testimonies about finances...',
    },
  },
  {
    id: 'To My Wife',
    label: 'To My Wife',
    icon: 'heart-circle-outline',
    iconActive: 'heart-circle',
    description: 'Messages for your wife',
    placeholder: {
      title: 'Message to your wife',
      content: 'Share a loving message for your wife...',
    },
  },
  {
    id: 'To My Husband',
    label: 'To My Husband',
    icon: 'heart-circle-outline',
    iconActive: 'heart-circle',
    description: 'Messages for your husband',
    placeholder: {
      title: 'Message to your husband',
      content: 'Share a loving message for your husband...',
    },
  },
  {
    id: 'Bragging on My Child (ren)',
    label: 'My Children',
    icon: 'happy-outline',
    iconActive: 'happy',
    description: 'Celebrate your children',
    placeholder: {
      title: 'Brag on your children',
      content: 'Share something special about your child(ren)...',
    },
  },
];

export const getPostableCategories = () => 
  COMMUNITY_CATEGORIES.filter(cat => cat.id !== 'all');

export const getCategoryById = (id: string) => 
  COMMUNITY_CATEGORIES.find(cat => cat.id === id);

export const getCategoryLabel = (id: string) => {
  const category = getCategoryById(id);
  return category?.label || id;
};

export const getCategoryIcon = (id: string, active = false): keyof typeof Ionicons.glyphMap => {
  const category = getCategoryById(id);
  if (!category) return 'chatbubble-outline';
  return active ? category.iconActive : category.icon;
};
