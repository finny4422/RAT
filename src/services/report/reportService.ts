import type { Report } from '@/types';

export interface ReportService {
  getAllReports(): Promise<Report[]>;
  getReportsByActivityId(activityId: string): Promise<Report[]>;
}

export const reportService: ReportService = {
  async getAllReports() {
    throw new Error('Not implemented');
  },
  async getReportsByActivityId() {
    throw new Error('Not implemented');
  },
};
