import { StyleSheet, Text, View } from 'react-native';

import { Colors, StatusAccentColors, StatusColors } from '@/constants';
import type { Activity } from '@/types';
import { ActivityStatus } from '@/types';
import {
  normalizeActivity,
  normalizeActivityStatus,
} from '@/services/activity/normalizeActivity';

import { ActivityCheckbox } from './ActivityCheckbox';

type ActivityCardProps = {
  activity: Activity | null | undefined;
  status?: ActivityStatus | null;
  disabled?: boolean;
  onComplete?: () => void;
};

export function ActivityCard({
  activity,
  status,
  disabled = false,
  onComplete,
}: ActivityCardProps) {
  const safeActivity = normalizeActivity(activity);
  const safeStatus = normalizeActivityStatus(status);
  const backgroundColor = StatusColors[safeStatus] ?? Colors.card;
  const borderLeftColor = StatusAccentColors[safeStatus] ?? Colors.border;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderLeftColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>{safeActivity.title}</Text>
        {safeActivity.caption.length > 0 ? (
          <Text style={styles.caption}>{safeActivity.caption}</Text>
        ) : null}
        {safeActivity.dueTime.length > 0 ? (
          <Text style={styles.dueTime}>{safeActivity.dueTime}</Text>
        ) : null}
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
