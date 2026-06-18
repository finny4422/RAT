import type { ActivityLog } from '@/types';

export interface ActivityLogService {
  getLogsByActivityId(activityId: string): Promise<ActivityLog[]>;
  createLog(log: Omit<ActivityLog, 'id'>): Promise<ActivityLog>;
}

export const activityLogService: ActivityLogService = {
  async getLogsByActivityId() {
    throw new Error('Not implemented');
  },
  async createLog() {
    throw new Error('Not implemented');
  },
};
