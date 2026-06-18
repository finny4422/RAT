import type { Activity } from '@/types';

export interface WidgetService {
  getTopActivities(limit: number): Promise<Activity[]>;
  refreshWidget(): Promise<void>;
}

export const widgetService: WidgetService = {
  async getTopActivities() {
    throw new Error('Not implemented');
  },
  async refreshWidget() {
    throw new Error('Not implemented');
  },
};
