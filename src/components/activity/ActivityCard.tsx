import { StyleSheet, Text, View } from 'react-native';

import { Colors, StatusColors } from '@/constants';
import type { Activity } from '@/types';
import { ActivityStatus } from '@/types';

import { ActivityCheckbox } from './ActivityCheckbox';

type ActivityCardProps = {
  activity: Activity;
  status?: ActivityStatus;
  onComplete?: () => void;
};

export function ActivityCard({
  activity,
  status = ActivityStatus.Pending,
  onComplete,
}: ActivityCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: StatusColors[status] }]}>
      <View style={styles.content}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.caption}>{activity.caption}</Text>
        <Text style={styles.dueTime}>{activity.dueTime}</Text>
      </View>
      <ActivityCheckbox onPress={onComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  caption: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  dueTime: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 8,
  },
});
