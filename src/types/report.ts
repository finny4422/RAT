import type { ActivityFrequency, ReportType } from './enums';

export interface Report {
  id: string;
  activityId: string;
  activityTitle: string;
  activityFrequency: ActivityFrequency;
  reportType: ReportType;
  startDate: string;
  endDate: string;
  onTime: number;
  late: number;
  missed: number;
  score: number;
  createdAt: string;
}
