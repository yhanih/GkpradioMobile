import { ActionSheetIOS, Alert, Platform } from 'react-native';

/** iOS ActionSheet + Android Alert for post card / post header moderation. */
export function openPostOverflowMenu(
  isOwn: boolean,
  onChoice: (choice: 'report' | 'block' | 'delete') => void
): void {
  if (isOwn) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Delete post', 'Cancel'],
          cancelButtonIndex: 1,
          destructiveButtonIndex: 0,
        },
        (idx) => {
          if (idx === 0) onChoice('delete');
        }
      );
      return;
    }
    Alert.alert('Post options', undefined, [
      { text: 'Delete post', style: 'destructive', onPress: () => onChoice('delete') },
      { text: 'Cancel', style: 'cancel' },
    ]);
    return;
  }

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Report post', 'Block', 'Cancel'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
      },
      (idx) => {
        if (idx === 0) onChoice('report');
        else if (idx === 1) onChoice('block');
      }
    );
    return;
  }

  Alert.alert('Post options', undefined, [
    { text: 'Report post', onPress: () => onChoice('report') },
    { text: 'Block', style: 'destructive', onPress: () => onChoice('block') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

/** Comment row: own = delete only; other = report + block. */
export function openCommentOverflowMenu(
  isOwn: boolean,
  onChoice: (choice: 'report' | 'block' | 'delete') => void
): void {
  if (isOwn) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Delete comment', 'Cancel'],
          cancelButtonIndex: 1,
          destructiveButtonIndex: 0,
        },
        (idx) => {
          if (idx === 0) onChoice('delete');
        }
      );
      return;
    }
    Alert.alert('Comment options', undefined, [
      { text: 'Delete comment', style: 'destructive', onPress: () => onChoice('delete') },
      { text: 'Cancel', style: 'cancel' },
    ]);
    return;
  }

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Report comment', 'Block', 'Cancel'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
      },
      (idx) => {
        if (idx === 0) onChoice('report');
        else if (idx === 1) onChoice('block');
      }
    );
    return;
  }

  Alert.alert('Comment options', undefined, [
    { text: 'Report comment', onPress: () => onChoice('report') },
    { text: 'Block', style: 'destructive', onPress: () => onChoice('block') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

/** User profile header: report + block (other user only). When hideBlock, only "Report user" is shown. */
export function openUserProfileOverflowMenu(
  onChoice: (choice: 'report' | 'block') => void,
  options?: { hideBlock?: boolean }
): void {
  if (options?.hideBlock) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Report user', 'Cancel'],
          cancelButtonIndex: 1,
        },
        (idx) => {
          if (idx === 0) onChoice('report');
        }
      );
      return;
    }
    Alert.alert('Profile options', undefined, [
      { text: 'Report user', onPress: () => onChoice('report') },
      { text: 'Cancel', style: 'cancel' },
    ]);
    return;
  }

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Report user', 'Block', 'Cancel'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
      },
      (idx) => {
        if (idx === 0) onChoice('report');
        else if (idx === 1) onChoice('block');
      }
    );
    return;
  }

  Alert.alert('Profile options', undefined, [
    { text: 'Report user', onPress: () => onChoice('report') },
    { text: 'Block', style: 'destructive', onPress: () => onChoice('block') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

/** Live radio chat row: report message; block author when authorId is known. */
export function openLiveChatMessageMenu(
  opts: { isOwn: boolean; authorId: string | null },
  onChoice: (choice: 'report' | 'block') => void
): void {
  if (opts.isOwn) {
    return;
  }
  const canBlock = Boolean(opts.authorId?.trim());

  if (!canBlock) {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Report chat message', 'Cancel'], cancelButtonIndex: 1 },
        (idx) => {
          if (idx === 0) onChoice('report');
        }
      );
      return;
    }
    Alert.alert('Chat message', undefined, [
      { text: 'Report chat message', onPress: () => onChoice('report') },
      { text: 'Cancel', style: 'cancel' },
    ]);
    return;
  }

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Report chat message', 'Block', 'Cancel'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
      },
      (idx) => {
        if (idx === 0) onChoice('report');
        else if (idx === 1) onChoice('block');
      }
    );
    return;
  }

  Alert.alert('Chat message', undefined, [
    { text: 'Report chat message', onPress: () => onChoice('report') },
    { text: 'Block', style: 'destructive', onPress: () => onChoice('block') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
