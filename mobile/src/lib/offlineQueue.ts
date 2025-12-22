import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedAction {
  id: string;
  type: 'like' | 'comment' | 'post' | 'bookmark';
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_STORAGE_KEY = '@gkp_offline_queue';
const MAX_RETRIES = 3;

export class OfflineQueue {
  static async addAction(type: QueuedAction['type'], payload: any): Promise<void> {
    try {
      const queue = await this.getQueue();
      const action: QueuedAction = {
        id: `${Date.now()}-${Math.random()}`,
        type,
        payload,
        timestamp: Date.now(),
        retries: 0,
      };
      queue.push(action);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding action to offline queue:', error);
    }
  }

  static async getQueue(): Promise<QueuedAction[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading offline queue:', error);
      return [];
    }
  }

  static async processQueue(syncFunction: (action: QueuedAction) => Promise<boolean>): Promise<void> {
    const queue = await this.getQueue();
    const processed: string[] = [];
    const failed: QueuedAction[] = [];

    for (const action of queue) {
      try {
        const success = await syncFunction(action);
        if (success) {
          processed.push(action.id);
        } else if (action.retries < MAX_RETRIES) {
          action.retries++;
          failed.push(action);
        }
      } catch (error) {
        console.error(`Error syncing action ${action.id}:`, error);
        if (action.retries < MAX_RETRIES) {
          action.retries++;
          failed.push(action);
        }
      }
    }

    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(failed));
  }

  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  }
}
