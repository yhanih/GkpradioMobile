import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      const [storedBookmarks, storedThreads] = await Promise.all([
        AsyncStorage.getItem(`bookmarks_${user.id}`),
        AsyncStorage.getItem(`threads_${user.id}`)
      ]);

      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      } else {
        setBookmarks([]);
      }

      if (storedThreads) {
        setSavedThreads(JSON.parse(storedThreads));
      } else {
        setSavedThreads([]);
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
          let newThreads: string[];
          if (currentlyBookmarked) {
            newThreads = savedThreads.filter((id) => id !== contentId);
          } else {
            newThreads = [...savedThreads, contentId];
          }
          await AsyncStorage.setItem(`threads_${user.id}`, JSON.stringify(newThreads));
          setSavedThreads(newThreads);
        } else {
          let newBookmarks: Bookmark[];
          if (currentlyBookmarked) {
            newBookmarks = bookmarks.filter(
              (b) => !(b.content_type === contentType && b.content_id === contentId)
            );
          } else {
            const newBookmark: Bookmark = {
              id: Math.random().toString(36).substring(7),
              userid: user.id,
              content_type: contentType,
              content_id: contentId,
              createdat: new Date().toISOString(),
            };
            newBookmarks = [...bookmarks, newBookmark];
          }
          await AsyncStorage.setItem(`bookmarks_${user.id}`, JSON.stringify(newBookmarks));
          setBookmarks(newBookmarks);
        }

        return !currentlyBookmarked;
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        return currentlyBookmarked;
      }
    },
    [user, isBookmarked, savedThreads, bookmarks]
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
