import { StyleSheet, Text, View } from 'react-native';

import { Colors, StatusAccentColors, StatusColors } from '@/constants';
import type { Activity } from '@/types';
import { ActivityStatus } from '@/types';

import { ActivityCheckbox } from './ActivityCheckbox';

type ActivityCardProps = {
  activity: Activity;
  status?: ActivityStatus;
  disabled?: boolean;
  onComplete?: () => void;
};

export function ActivityCard({
  activity,
  status = ActivityStatus.Pending,
  disabled = false,
  onComplete,
}: ActivityCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: StatusColors[status],
          borderLeftColor: StatusAccentColors[status],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.caption}>{activity.caption}</Text>
        <Text style={styles.dueTime}>{activity.dueTime}</Text>
      </View>
      <ActivityCheckbox disabled={disabled} onPress={onComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
    borderRadius: 10,
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
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
