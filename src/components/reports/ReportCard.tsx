import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants';
import type { Report } from '@/types';

type ReportCardProps = {
  report: Report;
};

export function ReportCard({ report }: ReportCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Report: {report.reportType}</Text>
      <Text style={styles.detail}>
        {report.startDate} - {report.endDate}
      </Text>
      <Text style={styles.detail}>Score: {report.score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  detail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
