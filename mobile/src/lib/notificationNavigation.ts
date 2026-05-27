import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

let navigationRef: NavigationContainerRefWithCurrent<RootStackParamList> | null = null;
let pendingPostId: string | null = null;
let postsNavigationEnabled = false;

export function bindNotificationNavigationRef(
  ref: NavigationContainerRefWithCurrent<RootStackParamList>
): void {
  navigationRef = ref;
}

export function setPostsNavigationEnabled(enabled: boolean): void {
  postsNavigationEnabled = enabled;
  if (enabled) {
    flushPendingNotificationNavigation();
  }
}

export function extractPostIdFromNotificationData(
  data: Record<string, unknown> | null | undefined
): string | null {
  if (!data) return null;

  const raw = data.post_id ?? data.postId ?? data.thread_id ?? data.threadId;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return null;
}

export function openPostFromNotification(data: Record<string, unknown> | null | undefined): boolean {
  const postId = extractPostIdFromNotificationData(data);
  if (!postId) return false;

  if (postsNavigationEnabled && navigationRef?.isReady()) {
    navigationRef.navigate('PostDetail', { threadId: postId });
    pendingPostId = null;
    return true;
  }

  pendingPostId = postId;
  return false;
}

export function flushPendingNotificationNavigation(): void {
  if (!pendingPostId || !postsNavigationEnabled || !navigationRef?.isReady()) return;
  navigationRef.navigate('PostDetail', { threadId: pendingPostId });
  pendingPostId = null;
}

export function clearPendingNotificationNavigation(): void {
  pendingPostId = null;
}
