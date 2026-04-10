import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

type ContentType = 'episode' | 'video' | 'thread';

interface Bookmark {
  id: string;
  userid: string;
  content_type: ContentType;
  content_id: string;
  createdat: string;
}

interface BookmarksContextType {
  bookmarks: Bookmark[];
  loading: boolean;
  isBookmarked: (contentType: ContentType, contentId: string) => boolean;
  toggleBookmark: (contentType: ContentType, contentId: string) => Promise<boolean>;
  refreshBookmarks: () => Promise<void>;
}

const BookmarksContext = createContext<BookmarksContextType | undefined>(undefined);

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookmarks')
        .select('id,user_id,content_type,content_id,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        userid: row.user_id,
        content_type: row.content_type,
        content_id: row.content_id,
        createdat: row.created_at,
      })) as Bookmark[];
      setBookmarks(mapped);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const isBookmarked = useCallback(
    (contentType: ContentType, contentId: string): boolean => {
      return bookmarks.some(
        (b) => b.content_type === contentType && b.content_id === contentId
      );
    },
    [bookmarks]
  );

  const toggleBookmark = useCallback(
    async (contentType: ContentType, contentId: string): Promise<boolean> => {
      if (!user) return false;

      const currentlyBookmarked = isBookmarked(contentType, contentId);

      try {
        if (currentlyBookmarked) {
          const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('content_type', contentType)
            .eq('content_id', contentId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('bookmarks').insert({
            user_id: user.id,
            content_type: contentType,
            content_id: contentId,
          });
          if (error) throw error;
        }
        await fetchBookmarks();

        return !currentlyBookmarked;
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        return currentlyBookmarked;
      }
    },
    [user, isBookmarked, fetchBookmarks]
  );

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        loading,
        isBookmarked,
        toggleBookmark,
        refreshBookmarks: fetchBookmarks,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarksContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return context;
}
