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
        options: ['Report…', 'Block', 'Cancel'],
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
    { text: 'Report…', onPress: () => onChoice('report') },
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
        options: ['Report…', 'Block', 'Cancel'],
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
    { text: 'Report…', onPress: () => onChoice('report') },
    { text: 'Block', style: 'destructive', onPress: () => onChoice('block') },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
