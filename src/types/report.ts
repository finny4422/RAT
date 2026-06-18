import type { ReportType } from './enums';

export interface Report {
  id: string;
  activityId: string;
  reportType: ReportType;
  startDate: string;
  endDate: string;
  onTime: number;
  late: number;
  missed: number;
  score: number;
}
