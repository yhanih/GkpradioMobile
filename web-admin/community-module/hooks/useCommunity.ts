import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    communityService,
    statsService
} from '../lib/community-service';
import { useToast } from '@/hooks/use-toast';

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

export function useCommunityStats() {
    return useQuery({
        queryKey: ['community', 'stats'],
        queryFn: statsService.getCommunityStats,
        refetchInterval: 60000 // Refresh every minute
    });
}
