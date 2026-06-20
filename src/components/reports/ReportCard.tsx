import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants';
import type { Report } from '@/types';
import { ActivityFrequency, ReportType } from '@/types';

type ReportCardProps = {
  report: Report;
};

function formatFrequencyLabel(frequency: ActivityFrequency): string {
  switch (frequency) {
    case ActivityFrequency.Daily:
      return 'Daily';
    case ActivityFrequency.Weekly:
      return 'Weekly';
    case ActivityFrequency.Monthly:
      return 'Monthly';
    case ActivityFrequency.OneTime:
      return 'One-Time';
    default:
      return frequency;
  }
}

function formatReportTypeLabel(reportType: ReportType): string {
  switch (reportType) {
    case ReportType.Weekly:
      return 'Weekly';
    case ReportType.Monthly:
      return 'Monthly';
    case ReportType.Yearly:
      return 'Yearly';
    default:
      return reportType;
  }
}

function formatScore(score: number): string {
  return `${score.toFixed(2)}%`;
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{report.activityTitle}</Text>

      <Text style={styles.detail}>
        Frequency: {formatFrequencyLabel(report.activityFrequency)}
      </Text>
      <Text style={styles.detail}>Report Type: {formatReportTypeLabel(report.reportType)}</Text>
      <Text style={styles.detail}>
        Period: {report.startDate} to {report.endDate}
      </Text>

      <View style={styles.countsRow}>
        <Text style={styles.count}>On Time: {report.onTime}</Text>
        <Text style={styles.count}>Late: {report.late}</Text>
        <Text style={styles.count}>Missed: {report.missed}</Text>
      </View>

      <Text style={styles.score}>Score: {formatScore(report.score)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  countsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  count: {
    fontSize: 14,
    color: Colors.text,
  },
  score: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 12,
  },
});
