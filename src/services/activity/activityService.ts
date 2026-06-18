import type { Activity, CreateActivityInput, UpdateActivityInput } from '@/types';

export interface ActivityService {
  getActivitiesForToday(): Promise<Activity[]>;
  getActivityById(id: string): Promise<Activity | null>;
  createActivity(input: CreateActivityInput): Promise<Activity>;
  updateActivity(id: string, input: UpdateActivityInput): Promise<Activity>;
  deactivateActivity(id: string): Promise<void>;
}

export const activityService: ActivityService = {
  async getActivitiesForToday() {
    throw new Error('Not implemented');
  },
  async getActivityById() {
    throw new Error('Not implemented');
  },
  async createActivity() {
    throw new Error('Not implemented');
  },
  async updateActivity() {
    throw new Error('Not implemented');
  },
  async deactivateActivity() {
    throw new Error('Not implemented');
  },
};
