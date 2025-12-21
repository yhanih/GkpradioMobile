import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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
  const [savedThreads, setSavedThreads] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      setSavedThreads([]);
      return;
    }

    try {
      setLoading(true);
      const [bookmarksResult, threadsResult] = await Promise.all([
        supabase
          .from('bookmarks')
          .select('*')
          .eq('userid', user.id),
        supabase
          .from('savedthreads')
          .select('threadid')
          .eq('userid', user.id),
      ]);

      if (bookmarksResult.data) {
        setBookmarks(bookmarksResult.data);
      }

      if (threadsResult.data) {
        setSavedThreads(threadsResult.data.map((t) => t.threadid));
      }
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
      if (contentType === 'thread') {
        return savedThreads.includes(contentId);
      }
      return bookmarks.some(
        (b) => b.content_type === contentType && b.content_id === contentId
      );
    },
    [bookmarks, savedThreads]
  );

  const toggleBookmark = useCallback(
    async (contentType: ContentType, contentId: string): Promise<boolean> => {
      if (!user) return false;

      const currentlyBookmarked = isBookmarked(contentType, contentId);

      try {
        if (contentType === 'thread') {
          if (currentlyBookmarked) {
            const { error } = await supabase
              .from('savedthreads')
              .delete()
              .eq('userid', user.id)
              .eq('threadid', contentId);

            if (error) throw error;
            setSavedThreads((prev) => prev.filter((id) => id !== contentId));
          } else {
            const { error } = await supabase.from('savedthreads').insert({
              userid: user.id,
              threadid: contentId,
            });

            if (error) throw error;
            setSavedThreads((prev) => [...prev, contentId]);
          }
        } else {
          if (currentlyBookmarked) {
            const { error } = await supabase
              .from('bookmarks')
              .delete()
              .eq('userid', user.id)
              .eq('content_type', contentType)
              .eq('content_id', contentId);

            if (error) throw error;
            setBookmarks((prev) =>
              prev.filter(
                (b) =>
                  !(b.content_type === contentType && b.content_id === contentId)
              )
            );
          } else {
            const { data, error } = await supabase
              .from('bookmarks')
              .insert({
                userid: user.id,
                content_type: contentType,
                content_id: contentId,
              })
              .select()
              .single();

            if (error) throw error;
            if (data) {
              setBookmarks((prev) => [...prev, data]);
            }
          }
        }

        return !currentlyBookmarked;
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        return currentlyBookmarked;
      }
    },
    [user, isBookmarked]
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
