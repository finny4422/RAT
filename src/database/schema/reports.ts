import { ReportType } from '@/types';

export const REPORTS_TABLE = 'reports';

export const REPORTS_COLUMNS = {
  id: 'id',
  activityId: 'activity_id',
  reportType: 'report_type',
  startDate: 'start_date',
  endDate: 'end_date',
  onTime: 'on_time',
  late: 'late',
  missed: 'missed',
  score: 'score',
} as const;

export const REPORT_TYPE_VALUES = Object.values(ReportType);
