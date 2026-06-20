import { StyleSheet, Text, View } from 'react-native';

import { Colors, getStatusCardColors } from '@/constants/colors';
import type { Activity } from '@/types';
import { ActivityStatus } from '@/types';
import {
  normalizeActivity,
  normalizeActivityStatus,
} from '@/services/activity/normalizeActivity';

import { ActivityCheckbox } from './ActivityCheckbox';

const loggedFallbackActivityIds = new Set<string>();

type ActivityCardProps = {
  activity: Activity | null | undefined;
  status?: ActivityStatus | string | null;
  disabled?: boolean;
  onComplete?: () => void;
};

function logNormalizationFallback(activityId: string, reason: string): void {
  if (!__DEV__ || loggedFallbackActivityIds.has(activityId)) {
    return;
  }

  loggedFallbackActivityIds.add(activityId);
  console.warn('[ActivityCard] normalization fallback applied', { activityId, reason });
}

export function ActivityCard({
  activity,
  status,
  disabled = false,
  onComplete,
}: ActivityCardProps) {
  const safeActivity = normalizeActivity(activity);
  const safeStatus = normalizeActivityStatus(status);

  if (__DEV__) {
    if (!activity || typeof activity !== 'object') {
      logNormalizationFallback(safeActivity.id || 'unknown', 'missing activity object');
    } else if (!('title' in activity) || activity.title == null) {
      logNormalizationFallback(safeActivity.id || 'unknown', 'missing title');
    }
  }

  const { background: backgroundColor, accent: borderLeftColor } = getStatusCardColors(safeStatus);
  const title = safeActivity.title;
  const caption = safeActivity.caption ?? '';
  const dueTime = safeActivity.dueTime ?? '';

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
        <Text style={styles.title}>{title}</Text>
        {caption.length > 0 ? <Text style={styles.caption}>{caption}</Text> : null}
        {dueTime.length > 0 ? <Text style={styles.dueTime}>{dueTime}</Text> : null}
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
