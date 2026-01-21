import { supabase } from './supabase';

// Type definitions
export interface User {
    id: string | number;
    username: string;
    email: string;
    fullname?: string | null;
    displayName?: string | null;
    bio?: string | null;
    avatarurl?: string | null;
    avatar?: string | null;
    city?: string | null;
    country?: string | null;
    emailVerified?: boolean;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface CommunityThread {
    id: string;
    title: string;
    content: string;
    category: string;
    userId: string | number;
    tags?: string[] | null;
    viewCount: number;
    replyCount: number;
    lastActivityAt: string | Date;
    isPinned: boolean;
    isLocked: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    author?: User;
    taggedSpouseId?: string | number | null;
    taggedSpouse?: User;
    likeCount?: number;
    isLiked?: boolean;
}

export interface CommunityComment {
    id: string;
    threadId: string;
    userId: string | number;
    content: string;
    parentId?: string | null;
    isEdited: boolean;
    createdAt: string | Date;
    updatedAt: string | Date;
    author?: User;
}

// Generic error handler
const handleError = (error: any, operation: string) => {
    console.error(`Supabase ${operation} error:`, error);
    throw new Error(error.message || `Failed to ${operation}`);
};

// Helper function to transform snake_case to camelCase
function toCamelCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCase);

    const result: any = {};
    for (const key in obj) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        const value = obj[key];
        result[camelKey] = typeof value === 'object' && value !== null && !Array.isArray(value) ? toCamelCase(value) : value;
    }
    return result;
}

// Helper function to get integer user ID from public.users table
async function getUserIntId(authUser: any): Promise<number | null> {
    if (!authUser?.email) return null;

    const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', authUser.email)
        .maybeSingle();

    if (fetchError) {
        console.error('Error fetching user int ID:', fetchError);
        return null;
    }

    if (existingUser) return existingUser.id;

    const baseUsername = authUser.user_metadata?.username || authUser.email.split('@')[0];
    let username = baseUsername;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                email: authUser.email,
                username: username,
                fullname: authUser.user_metadata?.fullname || username
            })
            .select('id')
            .single();

        if (!createError && newUser) return newUser.id;

        if (createError?.code === '23505' && createError?.message?.includes('username')) {
            attempts++;
            username = `${baseUsername}_${Math.random().toString(36).substring(2, 8)}`;
            continue;
        }

        if (createError?.code === '23505' && createError?.message?.includes('email')) {
            const { data: raceUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', authUser.email)
                .maybeSingle();
            if (raceUser) return raceUser.id;
        }

        console.error('Error auto-provisioning user:', createError);
        return null;
    }

    return null;
}

export const communityService = {
    async getThreads(category?: string) {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user ? await getUserIntId(user) : null;

        let query = supabase
            .from('communitythreads')
            .select('*')
            .order('createdat', { ascending: false });

        if (category && category !== 'All') {
            query = query.eq('category', category);
        }

        const { data: threads, error } = await query;
        if (error) handleError(error, 'fetch community threads');
        if (!threads) return [];

        const authorIds = threads.map(t => t.userid).filter(Boolean);
        const spouseIds = threads.map(t => t.taggedspouseid).filter(Boolean);
        const allUserIds = Array.from(new Set([...authorIds, ...spouseIds]));

        let usersMap: Record<number, any> = {};
        if (allUserIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id, username, fullname, avatarurl, bio')
                .in('id', allUserIds);

            if (users) {
                usersMap = users.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {} as Record<number, any>);
            }
        }

        const threadsWithExtras = await Promise.all(
            threads.map(async (thread) => {
                const { count: likeCount } = await supabase
                    .from('threadlikes')
                    .select('*', { count: 'exact', head: true })
                    .eq('threadid', thread.id);

                const { count: replyCount } = await supabase
                    .from('communitycomments')
                    .select('*', { count: 'exact', head: true })
                    .eq('threadid', thread.id);

                let isLiked = false;
                if (userId) {
                    const { data: likeData } = await supabase
                        .from('threadlikes')
                        .select('id')
                        .eq('threadid', thread.id)
                        .eq('userid', userId)
                        .maybeSingle();
                    isLiked = !!likeData;
                }

                const now = new Date().toISOString();
                const parseDate = (value: any) => {
                    if (!value) return now;
                    const parsed = new Date(value);
                    return isNaN(parsed.getTime()) ? now : parsed.toISOString();
                };

                const createdAt = parseDate(thread.createdat || thread.created_at);
                const updatedAt = parseDate(thread.updatedat || thread.updated_at);

                const transformed = toCamelCase({
                    ...thread,
                    author: usersMap[thread.userid] || null,
                    taggedspouse: thread.taggedspouseid ? usersMap[thread.taggedspouseid] : null,
                    likecount: likeCount || 0,
                    replycount: replyCount || 0,
                    viewcount: 0,
                    isliked: isLiked
                });

                transformed.createdAt = createdAt;
                transformed.updatedAt = updatedAt;

                return transformed;
            })
        );

        return threadsWithExtras;
    },

    async getThreadById(id: string) {
        const { data: thread, error } = await supabase
            .from('communitythreads')
            .select('*')
            .eq('id', id)
            .single();

        if (error) handleError(error, 'fetch thread');
        if (!thread) return null;

        const userIds = [thread.userid, thread.taggedspouseid].filter(Boolean);
        let usersMap: Record<number, any> = {};

        if (userIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id, username, fullname, avatarurl, bio')
                .in('id', userIds);

            if (users) {
                usersMap = users.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {} as Record<number, any>);
            }
        }

        return toCamelCase({
            ...thread,
            author: usersMap[thread.userid] || null,
            taggedspouse: thread.taggedspouseid ? usersMap[thread.taggedspouseid] : null
        });
    },

    async createThread(thread: {
        title: string;
        content: string;
        category: string;
        tags?: string[];
        taggedSpouseId?: string | number | null;
        renderAt?: number;
        hp?: string;
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Must be logged in to create thread');

        // Note: This expects an API endpoint. Ensure the destination project has this or adapt to direct Supabase insert if preferred.
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch('/api/discussions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
            body: JSON.stringify(thread),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to create thread: ${response.statusText}`);
        }

        return await response.json();
    },

    async getComments(threadId: string) {
        const { data: comments, error } = await supabase
            .from('communitycomments')
            .select('*')
            .eq('threadid', threadId)
            .order('createdat', { ascending: true });

        if (error) handleError(error, 'fetch comments');
        if (!comments || comments.length === 0) return [];

        const authorIds = Array.from(new Set(comments.map(c => c.userid).filter(Boolean)));
        let usersMap: Record<number, any> = {};

        if (authorIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id, username, fullname, avatarurl, bio')
                .in('id', authorIds);

            if (users) {
                usersMap = users.reduce((acc, user) => {
                    acc[user.id] = user;
                    return acc;
                }, {} as Record<number, any>);
            }
        }

        return comments.map(comment => toCamelCase({
            ...comment,
            author: usersMap[comment.userid] || null
        }));
    },

    async createComment(threadId: string, content: string, parentId?: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Must be logged in to comment');

        const userId = await getUserIntId(user);
        if (!userId) throw new Error('Unable to create comment. Please try logging out and back in.');

        const { data, error } = await supabase
            .from('communitycomments')
            .insert({
                threadid: threadId,
                content,
                parentid: parentId || null,
                userid: userId
            })
            .select()
            .single();

        if (error) handleError(error, 'create comment');
        return toCamelCase(data);
    },

    async toggleThreadLike(threadId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Must be logged in to like threads');

        const userId = await getUserIntId(user);
        if (!userId) throw new Error('Unable to like thread. Please try logging out and back in.');

        const { data: existingLike } = await supabase
            .from('threadlikes')
            .select('id')
            .eq('threadid', threadId)
            .eq('userid', userId)
            .maybeSingle();

        if (existingLike) {
            const { error } = await supabase.from('threadlikes').delete().eq('id', existingLike.id);
            if (error) handleError(error, 'unlike thread');
            return { isLiked: false };
        } else {
            const { error } = await supabase.from('threadlikes').insert({ threadid: threadId, userid: userId });
            if (error) handleError(error, 'like thread');
            return { isLiked: true };
        }
    },

    async deleteThread(threadId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Must be logged in to delete threads');

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch(`/api/discussions/${threadId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to delete thread: ${response.statusText}`);
        }

        return await response.json();
    },

    async deleteComment(commentId: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Must be logged in to delete comments');

        const userId = await getUserIntId(user);
        if (!userId) throw new Error('Unable to delete comment. Please try logging out and back in.');

        const { data: comment } = await supabase
            .from('communitycomments')
            .select('userid')
            .eq('id', commentId)
            .single();

        if (!comment) throw new Error('Comment not found');
        if (comment.userid !== userId) throw new Error('You can only delete your own comments');

        const { error } = await supabase.from('communitycomments').delete().eq('id', commentId);
        if (error) handleError(error, 'delete comment');
        return { success: true };
    }
};

export const statsService = {
    async getCommunityStats() {
        const { count: threadsCount } = await supabase.from('communitythreads').select('*', { count: 'exact', head: true });
        const { count: commentsCount } = await supabase.from('communitycomments').select('*', { count: 'exact', head: true });
        const { count: membersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

        return {
            totalDiscussions: threadsCount || 0,
            totalComments: commentsCount || 0,
            activeMembers: membersCount || 0,
            onlineNow: Math.floor(Math.random() * 50) + 10 // Mock online count if not tracked
        };
    }
};

export const spouseService = {
    async searchUsers(query: string, excludeUserId?: string | number) {
        let supabaseQuery = supabase
            .from('users')
            .select('id, username, fullname, avatarurl')
            .or(`username.ilike.%${query}%,fullname.ilike.%${query}%`)
            .limit(10);

        if (excludeUserId) {
            supabaseQuery = supabaseQuery.neq('id', excludeUserId);
        }

        const { data, error } = await supabaseQuery;
        if (error) handleError(error, 'search users');

        return (data || []).map(u => ({
            id: u.id,
            username: u.username,
            displayName: u.fullname || u.username,
            avatar: u.avatarurl
        }));
    }
};
