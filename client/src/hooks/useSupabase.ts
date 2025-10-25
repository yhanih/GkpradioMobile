import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  sponsorsService,
  episodesService,
  videosService,
  communityService,
  notificationsService,
  calendarService,
  teamService,
  profileService,
  statsService
} from '@/lib/supabase-data';
import { useToast } from '@/hooks/use-toast';

// ============================================
// SPONSORS HOOKS
// ============================================

export function useSponsors() {
  return useQuery({
    queryKey: ['sponsors'],
    queryFn: sponsorsService.getAll
  });
}

export function useSponsor(id: number) {
  return useQuery({
    queryKey: ['sponsor', id],
    queryFn: () => sponsorsService.getById(id),
    enabled: !!id
  });
}

export function useCreateSponsor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: sponsorsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast({
        title: "Sponsor added",
        description: "The sponsor has been added successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add sponsor",
        variant: "destructive"
      });
    }
  });
}

export function useUpdateSponsor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      sponsorsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast({
        title: "Sponsor updated",
        description: "The sponsor has been updated successfully"
      });
    }
  });
}

export function useDeleteSponsor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: sponsorsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast({
        title: "Sponsor deleted",
        description: "The sponsor has been removed"
      });
    }
  });
}

// ============================================
// EPISODES HOOKS
// ============================================

export function useEpisodes() {
  return useQuery({
    queryKey: ['episodes'],
    queryFn: episodesService.getAll
  });
}

export function useEpisode(id?: number, slug?: string) {
  return useQuery({
    queryKey: ['episode', id || slug],
    queryFn: () => {
      if (slug) return episodesService.getBySlug(slug);
      if (id) return episodesService.getById(id);
      throw new Error('Either id or slug must be provided');
    },
    enabled: !!(id || slug)
  });
}

export function useFeaturedEpisodes() {
  return useQuery({
    queryKey: ['episodes', 'featured'],
    queryFn: episodesService.getFeatured
  });
}

export function useSearchEpisodes(query: string) {
  return useQuery({
    queryKey: ['episodes', 'search', query],
    queryFn: () => episodesService.search(query),
    enabled: !!query
  });
}

// ============================================
// VIDEOS HOOKS
// ============================================

export function useVideos() {
  return useQuery({
    queryKey: ['videos'],
    queryFn: videosService.getAll
  });
}

export function useVideosByCategory(category: string) {
  return useQuery({
    queryKey: ['videos', 'category', category],
    queryFn: () => videosService.getByCategory(category),
    enabled: !!category
  });
}

export function useFeaturedVideos() {
  return useQuery({
    queryKey: ['videos', 'featured'],
    queryFn: videosService.getFeatured
  });
}

// ============================================
// COMMUNITY HOOKS
// ============================================

export function useCommunityThreads(category?: string) {
  return useQuery({
    queryKey: ['community', 'threads', category],
    queryFn: () => communityService.getThreads(category)
  });
}

export function useCommunityThread(id: string) {
  return useQuery({
    queryKey: ['community', 'thread', id],
    queryFn: () => communityService.getThreadById(id),
    enabled: !!id
  });
}

export function useCreateThread() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: communityService.createThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'threads'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'stats'] });
      toast({
        title: "Thread created",
        description: "Your discussion has been posted"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create thread",
        variant: "destructive"
      });
    }
  });
}

export function useCommunityComments(threadId: string) {
  return useQuery({
    queryKey: ['community', 'comments', threadId],
    queryFn: () => communityService.getComments(threadId),
    enabled: !!threadId
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ threadId, content, parentId }: {
      threadId: string;
      content: string;
      parentId?: string;
    }) => communityService.createComment(threadId, content, parentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'threads'] });
      toast({
        title: "Comment posted",
        description: "Your reply has been added"
      });
    }
  });
}

export function useToggleThreadLike() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (threadId: string) => communityService.toggleThreadLike(threadId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'threads'] });
      toast({
        title: result.isLiked ? "Thread liked" : "Thread unliked",
        description: result.isLiked ? "You liked this discussion" : "You removed your like"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle like",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (threadId: string) => communityService.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'threads'] });
      toast({
        title: "Discussion deleted successfully",
        description: "The discussion and all its comments have been removed"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete discussion",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ commentId, threadId }: { commentId: string; threadId: string }) => 
      communityService.deleteComment(commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'threads'] });
      toast({
        title: "Reply deleted",
        description: "Your reply has been removed"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reply",
        variant: "destructive"
      });
    }
  });
}

// ============================================
// NOTIFICATIONS HOOKS
// ============================================

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsService.getUserNotifications,
    refetchInterval: 30000 // Refresh every 30 seconds
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsService.getUnreadCount,
    refetchInterval: 30000
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    }
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    }
  });
}

// ============================================
// CALENDAR HOOKS
// ============================================

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: calendarService.getUpcomingEvents
  });
}

export function useMonthlyEvents(year: number, month: number) {
  return useQuery({
    queryKey: ['events', year, month],
    queryFn: () => calendarService.getEventsByMonth(year, month),
    enabled: !!(year && month)
  });
}

// ============================================
// TEAM HOOKS
// ============================================

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team'],
    queryFn: teamService.getAll
  });
}

export function useTeamMembersByRole(role: string) {
  return useQuery({
    queryKey: ['team', 'role', role],
    queryFn: () => teamService.getByRole(role),
    enabled: !!role
  });
}

// ============================================
// USER PROFILE HOOKS
// ============================================

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => profileService.getProfile(userId),
    enabled: !!userId
  });
}

export function useUserThreads(userId: string | number) {
  return useQuery({
    queryKey: ['profile', 'threads', userId],
    queryFn: () => profileService.getUserThreads(userId),
    enabled: !!userId
  });
}

export function useUserComments(userId: string | number) {
  return useQuery({
    queryKey: ['profile', 'comments', userId],
    queryFn: () => profileService.getUserComments(userId),
    enabled: !!userId
  });
}

export function useUserPrayerActivity(userId: string | number) {
  return useQuery({
    queryKey: ['profile', 'prayers', userId],
    queryFn: () => profileService.getUserPrayerActivity(userId),
    enabled: !!userId
  });
}

export function useUserStats(userId: string | number) {
  return useQuery({
    queryKey: ['profile', 'stats', userId],
    queryFn: () => profileService.getUserStats(userId),
    enabled: !!userId
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ userId, updates }: {
      userId: string;
      updates: any;
    }) => profileService.updateProfile(userId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
      toast({
        title: "Profile updated",
        description: "Your changes have been saved"
      });
    }
  });
}

// ============================================
// STATS HOOKS
// ============================================

export function useCommunityStats() {
  return useQuery({
    queryKey: ['community', 'stats'],
    queryFn: statsService.getCommunityStats,
    refetchInterval: 60000 // Refresh every minute
  });
}